-- ============================================================================
-- T01: keep every enquiry-form field
--
-- Adds submissions.details (JSONB) for form fields that have no column of their
-- own: trade fields (product, volume, goods, origin, delivery, quantity, ...),
-- and company / budget from the quote-request form.
--
-- Safe on existing data: the column is nullable with a default, so existing
-- rows get '{}' and no existing constraint is affected.
-- The public INSERT policy (WITH CHECK (true)) already covers the new column.
-- ============================================================================

ALTER TABLE public.submissions
    ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Anonymous visitors can write this column, so keep it a small flat object.
ALTER TABLE public.submissions
    DROP CONSTRAINT IF EXISTS submissions_details_shape;
ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_details_shape CHECK (
        details IS NULL
        OR (jsonb_typeof(details) = 'object' AND octet_length(details::text) <= 10000)
    );

COMMENT ON COLUMN public.submissions.details IS
    'Form fields without a dedicated column, as {field_name: value}. Written by the public enquiry forms.';
