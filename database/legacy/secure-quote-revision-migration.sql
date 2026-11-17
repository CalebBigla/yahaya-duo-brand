-- Forward migration for databases that already applied
-- quotation-workflow-migration.sql. This replaces the old two-argument RPC,
-- which trusted a caller-supplied user ID and had no authorization check.
-- Requires the quote versioning columns and admin_users table to exist.

BEGIN;

DROP FUNCTION IF EXISTS public.create_quote_revision(UUID, UUID);

CREATE OR REPLACE FUNCTION public.create_quote_revision(
    p_parent_quote_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_new_quote_id UUID;
    v_parent_quote public.quotes%ROWTYPE;
    v_new_version_number INT;
    v_actor_id UUID := auth.uid();
BEGIN
    -- The current quote model gives admins organization-wide quote access.
    -- Since this SECURITY DEFINER function bypasses RLS, it repeats that
    -- authorization check using the verified JWT identity.
    IF v_actor_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.admin_users AS au
        WHERE au.user_id = v_actor_id
          AND au.role IN ('editor', 'owner')
    ) THEN
        RAISE EXCEPTION 'Not authorized to revise quotes'
            USING ERRCODE = '42501';
    END IF;

    -- Lock and verify the parent in the authorized organization-wide scope.
    SELECT q.* INTO v_parent_quote
    FROM public.quotes AS q
    WHERE q.id = p_parent_quote_id
    FOR UPDATE;

    IF NOT FOUND OR v_parent_quote.is_current_version IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Quote not found or not available for revision'
            USING ERRCODE = 'P0002';
    END IF;

    v_new_version_number := COALESCE(v_parent_quote.version_number, 1) + 1;

    UPDATE public.quotes
    SET is_current_version = FALSE,
        superseded_by_quote_id = NULL
    WHERE id = p_parent_quote_id;

    INSERT INTO public.quotes (
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
        v_parent_quote.quote_number || 'v' || v_new_version_number,
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
        'draft',
        NULL,
        v_parent_quote.notes,
        v_parent_quote.terms,
        v_actor_id,
        v_new_version_number,
        p_parent_quote_id,
        TRUE
    ) RETURNING id INTO v_new_quote_id;

    UPDATE public.quotes
    SET superseded_by_quote_id = v_new_quote_id
    WHERE id = p_parent_quote_id;

    RETURN v_new_quote_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quote_revision(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_quote_revision(UUID) TO authenticated;

COMMIT;
