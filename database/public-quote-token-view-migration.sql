-- Expose only the quote fields needed by the client-facing quote view, and
-- only when the caller presents the matching, unexpired access token.
-- This keeps quotes protected by their existing admin-only RLS policy.
-- Keep token creation on the existing token system, but let table RLS enforce
-- that only authenticated admins can create a token.
CREATE OR REPLACE FUNCTION public.generate_quote_access_token(
    p_quote_id UUID,
    p_days_valid INT DEFAULT 30
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Two random UUIDs retain the existing opaque-token format without
    -- requiring an extension-specific digest schema.
    v_token := replace(
        pg_catalog.gen_random_uuid()::TEXT || pg_catalog.gen_random_uuid()::TEXT,
        '-',
        ''
    );

    IF p_days_valid > 0 THEN
        v_expires_at := pg_catalog.now() + (p_days_valid || ' days')::INTERVAL;
    ELSE
        v_expires_at := NULL;
    END IF;

    INSERT INTO public.quote_access_tokens (quote_id, token, expires_at)
    VALUES (p_quote_id, v_token, v_expires_at);

    RETURN v_token;
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_quote_access_token(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_quote_access_token(UUID, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_quote_by_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    quote_number TEXT,
    client_name TEXT,
    client_email TEXT,
    title TEXT,
    description TEXT,
    service_type TEXT,
    items JSONB,
    subtotal NUMERIC,
    tax_rate NUMERIC,
    tax_amount NUMERIC,
    total_amount NUMERIC,
    valid_until DATE,
    terms TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
    SELECT
        q.id,
        q.quote_number,
        q.client_name,
        q.client_email,
        q.title,
        q.description,
        q.service_type,
        q.items,
        q.subtotal,
        q.tax_rate,
        q.tax_amount,
        q.total_amount,
        q.valid_until,
        q.terms,
        q.status,
        q.created_at
    FROM public.quote_access_tokens AS qat
    JOIN public.quotes AS q ON q.id = qat.quote_id
    WHERE qat.token = p_token
      AND (qat.expires_at IS NULL OR qat.expires_at > pg_catalog.now())
    LIMIT 1;
$function$;

-- SECURITY DEFINER bypasses the quotes table's admin-only RLS, so expose only
-- this narrowly scoped lookup. The token, rather than a caller-supplied quote
-- ID, determines the single row that can be returned.
REVOKE ALL ON FUNCTION public.get_public_quote_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_quote_by_token(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_quote_by_token(TEXT) IS
    'Returns public display fields for the one quote authorized by a valid, unexpired quote access token.';

-- Validation is performed by validate_quote_token(), so anonymous clients do
-- not need table access to quote_access_tokens. Prevent listing valid tokens
-- (and thereby discovering other quote links) while preserving admin access.
DROP POLICY IF EXISTS "Public read valid tokens" ON public.quote_access_tokens;
REVOKE ALL ON TABLE public.quote_access_tokens FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_access_tokens TO authenticated;
