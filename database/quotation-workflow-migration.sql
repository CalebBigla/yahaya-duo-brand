-- ============================================================================
-- QUOTATION WORKFLOW MIGRATION
-- Adds versioning, response tracking, access tokens, and enquiry linking
-- ============================================================================

-- ============================================================================
-- STEP 1: Extend quotes table with new workflow columns
-- ============================================================================

-- Add enquiry link
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS enquiry_id UUID REFERENCES submissions(id) ON DELETE SET NULL;

-- Add versioning support
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS superseded_by_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT TRUE;

-- Add send tracking
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_quotes_enquiry_id ON quotes(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id ON quotes(parent_quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_is_current_version ON quotes(is_current_version);
CREATE INDEX IF NOT EXISTS idx_quotes_sent_at ON quotes(sent_at DESC);

-- ============================================================================
-- STEP 2: Update quotes status to include new workflow statuses
-- ============================================================================

-- First, remove the old CHECK constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Add the new CHECK constraint with additional statuses
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('draft', 'sent', 'pending', 'accepted', 'rejected', 'expired', 'revision_requested'));

-- ============================================================================
-- STEP 3: Create quote_responses table
-- Stores client responses (both online and manually recorded)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    
    -- Response details
    response_type TEXT NOT NULL CHECK (response_type IN ('accepted', 'declined', 'revision_requested')),
    response_method TEXT NOT NULL CHECK (response_method IN ('online', 'phone', 'whatsapp', 'email', 'in_person', 'other')),
    
    -- Response content
    response_notes TEXT,
    requested_changes TEXT, -- For revision_requested type
    decline_reason TEXT, -- For declined type
    
    -- Tracking
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id), -- NULL if online submission
    client_ip_hash TEXT, -- Only for online responses
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_responses_quote_id ON quote_responses(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_responses_type ON quote_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_quote_responses_responded_at ON quote_responses(responded_at DESC);

-- ============================================================================
-- STEP 4: Create quote_access_tokens table
-- Secure tokens for public quotation access
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    
    -- Token
    token TEXT UNIQUE NOT NULL,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    access_count INT DEFAULT 0,
    
    CONSTRAINT valid_token_format CHECK (LENGTH(token) >= 32)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_quote_id ON quote_access_tokens(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_token ON quote_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_expires_at ON quote_access_tokens(expires_at);

-- ============================================================================
-- STEP 5: Row Level Security Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE quote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_access_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: quote_responses
-- ============================================================================

-- Admin users can read all responses
CREATE POLICY "Admin read access to quote_responses"
    ON quote_responses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Admin users can insert responses (for manual recording)
CREATE POLICY "Admin insert access to quote_responses"
    ON quote_responses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Public can insert responses (for online submissions via valid token)
-- Note: This will be validated in application logic
CREATE POLICY "Public insert access to quote_responses"
    ON quote_responses FOR INSERT
    TO public
    WITH CHECK (response_method = 'online');

-- No update or delete policies - responses are immutable records

-- ============================================================================
-- POLICIES: quote_access_tokens
-- ============================================================================

-- Admin users can manage tokens
CREATE POLICY "Admin full access to quote_access_tokens"
    ON quote_access_tokens
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Public can SELECT tokens (for validation)
-- Only returns non-expired tokens
CREATE POLICY "Public read valid tokens"
    ON quote_access_tokens FOR SELECT
    TO public
    USING (
        expires_at IS NULL OR expires_at > NOW()
    );

-- ============================================================================
-- STEP 6: Functions
-- ============================================================================

-- Function to generate a secure access token
CREATE OR REPLACE FUNCTION generate_quote_access_token(
    p_quote_id UUID,
    p_days_valid INT DEFAULT 30
)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate a secure random token (UUID + random bytes hash)
    v_token := encode(
        digest(
            gen_random_uuid()::text || clock_timestamp()::text || random()::text,
            'sha256'
        ),
        'hex'
    );
    
    -- Calculate expiry
    IF p_days_valid > 0 THEN
        v_expires_at := NOW() + (p_days_valid || ' days')::interval;
    ELSE
        v_expires_at := NULL; -- No expiry
    END IF;
    
    -- Insert token
    INSERT INTO quote_access_tokens (quote_id, token, expires_at)
    VALUES (p_quote_id, v_token, v_expires_at);
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate a token and return quote_id
CREATE OR REPLACE FUNCTION validate_quote_token(p_token TEXT)
RETURNS TABLE (
    quote_id UUID,
    is_valid BOOLEAN,
    is_expired BOOLEAN,
    token_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qat.quote_id,
        CASE 
            WHEN qat.id IS NULL THEN FALSE
            WHEN qat.expires_at IS NOT NULL AND qat.expires_at < NOW() THEN FALSE
            ELSE TRUE
        END AS is_valid,
        CASE 
            WHEN qat.expires_at IS NOT NULL AND qat.expires_at < NOW() THEN TRUE
            ELSE FALSE
        END AS is_expired,
        qat.id AS token_id
    FROM quote_access_tokens qat
    WHERE qat.token = p_token;
    
    -- Update last accessed timestamp if valid
    UPDATE quote_access_tokens
    SET 
        last_accessed_at = NOW(),
        access_count = access_count + 1
    WHERE token = p_token 
      AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a revised version of a quote
CREATE OR REPLACE FUNCTION create_quote_revision(
    p_parent_quote_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_new_quote_id UUID;
    v_parent_quote quotes%ROWTYPE;
    v_new_version_number INT;
BEGIN
    -- Get parent quote
    SELECT * INTO v_parent_quote
    FROM quotes
    WHERE id = p_parent_quote_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parent quote not found';
    END IF;
    
    -- Calculate new version number
    v_new_version_number := COALESCE(v_parent_quote.version_number, 1) + 1;
    
    -- Mark parent as superseded
    UPDATE quotes
    SET 
        is_current_version = FALSE,
        superseded_by_quote_id = NULL -- Will be updated after insert
    WHERE id = p_parent_quote_id;
    
    -- Create new quote (revision)
    INSERT INTO quotes (
        quote_number,
        client_id,
        client_name,
        client_email,
        enquiry_id,
        title,
        description,
        service_type,
        items,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        status,
        valid_until,
        notes,
        terms,
        created_by,
        version_number,
        parent_quote_id,
        is_current_version
    ) VALUES (
        v_parent_quote.quote_number || 'v' || v_new_version_number, -- Append version to number
        v_parent_quote.client_id,
        v_parent_quote.client_name,
        v_parent_quote.client_email,
        v_parent_quote.enquiry_id,
        v_parent_quote.title,
        v_parent_quote.description,
        v_parent_quote.service_type,
        v_parent_quote.items,
        v_parent_quote.subtotal,
        v_parent_quote.tax_rate,
        v_parent_quote.tax_amount,
        v_parent_quote.total_amount,
        'draft', -- New revision starts as draft
        NULL, -- New valid_until date will be set by admin
        v_parent_quote.notes,
        v_parent_quote.terms,
        p_user_id,
        v_new_version_number,
        p_parent_quote_id,
        TRUE
    ) RETURNING id INTO v_new_quote_id;
    
    -- Update parent with superseded_by link
    UPDATE quotes
    SET superseded_by_quote_id = v_new_quote_id
    WHERE id = p_parent_quote_id;
    
    RETURN v_new_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Audit triggers for new tables
-- ============================================================================

-- Audit trigger for quote_responses
CREATE TRIGGER audit_quote_responses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON quote_responses
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

-- Note: quote_access_tokens are not audited (too noisy, access logs exist in table)

-- ============================================================================
-- STEP 8: Data migration for existing quotes
-- ============================================================================

-- Set default values for existing quotes
UPDATE quotes
SET 
    version_number = 1,
    is_current_version = TRUE
WHERE version_number IS NULL;

-- ============================================================================
-- STEP 9: Views for easier querying
-- ============================================================================

-- View: Current quotes only (filters out superseded versions)
CREATE OR REPLACE VIEW current_quotes AS
SELECT * FROM quotes
WHERE is_current_version = TRUE;

-- View: Quote with latest response
CREATE OR REPLACE VIEW quotes_with_responses AS
SELECT 
    q.*,
    qr.response_type AS latest_response_type,
    qr.response_method AS latest_response_method,
    qr.responded_at AS latest_response_date,
    qr.response_notes AS latest_response_notes
FROM quotes q
LEFT JOIN LATERAL (
    SELECT *
    FROM quote_responses
    WHERE quote_id = q.id
    ORDER BY responded_at DESC
    LIMIT 1
) qr ON TRUE;

-- ============================================================================
-- STEP 10: Comments for documentation
-- ============================================================================

COMMENT ON TABLE quote_responses IS 'Stores client responses to quotations, both online submissions and manually recorded offline responses';
COMMENT ON TABLE quote_access_tokens IS 'Secure tokens for public access to quotations without authentication';
COMMENT ON COLUMN quotes.enquiry_id IS 'Links quotation to the original enquiry/submission that triggered it';
COMMENT ON COLUMN quotes.version_number IS 'Version number for revision tracking (1, 2, 3, etc.)';
COMMENT ON COLUMN quotes.parent_quote_id IS 'Reference to the previous version if this is a revision';
COMMENT ON COLUMN quotes.superseded_by_quote_id IS 'Reference to the newer version that replaced this quote';
COMMENT ON COLUMN quotes.is_current_version IS 'TRUE for active version, FALSE for superseded versions';
COMMENT ON COLUMN quote_responses.recorded_by IS 'NULL for online submissions, admin user ID for manually recorded responses';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration success
DO $$
BEGIN
    RAISE NOTICE 'Quotation workflow migration completed successfully';
    RAISE NOTICE 'New tables created: quote_responses, quote_access_tokens';
    RAISE NOTICE 'Quotes table extended with versioning and enquiry linking';
    RAISE NOTICE 'RLS policies applied to all new tables';
    RAISE NOTICE 'Helper functions created for token generation and validation';
END $$;
