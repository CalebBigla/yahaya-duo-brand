-- ============================================================================
-- Fix: Grant permissions for public quote response submissions
-- ============================================================================
-- This migration fixes the "failed to submit response" error that clients 
-- encounter when trying to accept/decline/review quotes from the public page.
--
-- Root Cause:
-- - Anonymous users couldn't call validate_quote_token() RPC function
-- - Anonymous users couldn't insert into quote_responses table
-- - RLS policy exists but GRANT permissions were missing
--
-- Applied: [DATE]
-- ============================================================================

-- Grant EXECUTE permission on validate_quote_token to anonymous users
GRANT EXECUTE ON FUNCTION validate_quote_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_quote_token(TEXT) TO authenticated;

-- Grant INSERT permission on quote_responses to anonymous users
-- (RLS policy will enforce response_method = 'online' constraint)
GRANT INSERT ON TABLE quote_responses TO anon;
GRANT INSERT ON TABLE quote_responses TO authenticated;

-- Grant SELECT on quotes table to anonymous users (needed for validation)
-- Only through the get_public_quote_by_token function, but this helps with references
GRANT SELECT ON TABLE quotes TO anon;
GRANT SELECT ON TABLE quotes TO authenticated;

-- Ensure the RLS policy is active
ALTER TABLE quote_responses ENABLE ROW LEVEL SECURITY;

-- Verify the public insert policy exists
-- This policy allows anonymous users to insert responses only when response_method = 'online'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quote_responses' 
        AND policyname = 'Public insert access to quote_responses'
    ) THEN
        CREATE POLICY "Public insert access to quote_responses"
            ON quote_responses FOR INSERT
            TO public
            WITH CHECK (response_method = 'online');
    END IF;
END $$;

-- Note: We do NOT grant direct UPDATE on quotes to anonymous users
-- Instead, we'll create a secure function to handle the complete response submission
-- This prevents anonymous users from arbitrarily updating quote data

-- Create a secure function for public response submission
CREATE OR REPLACE FUNCTION submit_public_quote_response(
    p_quote_id UUID,
    p_token TEXT,
    p_response_type TEXT,
    p_response_notes TEXT DEFAULT NULL,
    p_requested_changes TEXT DEFAULT NULL,
    p_decline_reason TEXT DEFAULT NULL,
    p_client_ip_hash TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_token_valid BOOLEAN;
    v_quote_exists BOOLEAN;
    v_already_responded BOOLEAN;
    v_response_id UUID;
    v_new_status TEXT;
BEGIN
    -- Validate token
    SELECT is_valid INTO v_token_valid
    FROM validate_quote_token(p_token)
    WHERE quote_id = p_quote_id;
    
    IF NOT COALESCE(v_token_valid, FALSE) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid or expired token'
        );
    END IF;
    
    -- Check if quote exists
    SELECT EXISTS(SELECT 1 FROM quotes WHERE id = p_quote_id) INTO v_quote_exists;
    
    IF NOT v_quote_exists THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Quote not found'
        );
    END IF;
    
    -- Check if already responded
    SELECT EXISTS(
        SELECT 1 FROM quote_responses WHERE quote_id = p_quote_id
    ) INTO v_already_responded;
    
    IF v_already_responded THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'This quotation has already been responded to'
        );
    END IF;
    
    -- Validate response type
    IF p_response_type NOT IN ('accepted', 'declined', 'revision_requested') THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid response type'
        );
    END IF;
    
    -- Insert response
    INSERT INTO quote_responses (
        quote_id,
        response_type,
        response_method,
        response_notes,
        requested_changes,
        decline_reason,
        client_ip_hash,
        recorded_by
    ) VALUES (
        p_quote_id,
        p_response_type::response_type,
        'online',
        p_response_notes,
        p_requested_changes,
        p_decline_reason,
        p_client_ip_hash,
        NULL
    ) RETURNING id INTO v_response_id;
    
    -- Update quote status
    v_new_status := CASE p_response_type
        WHEN 'accepted' THEN 'accepted'
        WHEN 'declined' THEN 'rejected'
        WHEN 'revision_requested' THEN 'revision_requested'
        ELSE 'pending'
    END;
    
    UPDATE quotes
    SET status = v_new_status
    WHERE id = p_quote_id;
    
    RETURN json_build_object(
        'success', TRUE,
        'response_id', v_response_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'error', SQLERRM
    );
END;
$$;

-- Grant EXECUTE on the new function to anonymous users
GRANT EXECUTE ON FUNCTION submit_public_quote_response(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION submit_public_quote_response(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION submit_public_quote_response IS 
    'Securely handles public quote response submissions with token validation, duplicate prevention, and status updates';
