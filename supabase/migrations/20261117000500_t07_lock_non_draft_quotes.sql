-- ============================================================================
-- T07: once a quote leaves draft, its commercial terms are locked
--
-- Before: the admin editor overwrote any quote in place (sent or accepted) and
-- reset it to 'draft'; the client's existing link then showed the new figures.
-- The UI now only edits drafts. This trigger enforces the same rule in the
-- database, for every client (UI, API, SQL), including the old frontend.
--
-- When OLD.status <> 'draft', an UPDATE is rejected if it changes:
--   items, subtotal, tax_rate, tax_amount, total_amount,
--   client_id, client_name, client_email, valid_until, currency (if that column exists)
-- or if it moves the quote back to 'draft' (otherwise "set to draft, then edit"
-- would get round the lock).
-- Still allowed: other status changes (sent -> accepted, expired, ...), notes,
-- and versioning bookkeeping (is_current_version, superseded_by_quote_id, sent_at...).
--
-- Fields are compared as JSONB so the trigger works whether or not an optional
-- column such as currency exists.
--
-- Existing data: no rows change. The trigger only affects future UPDATEs.
-- create_quote_revision (unused by the UI, see BUG-07) only flips
-- is_current_version / superseded_by_quote_id on the old quote, which stays allowed.
--
-- PRE-CHECK (read-only): how many quotes become locked, by status
--   SELECT status, count(*) FROM public.quotes GROUP BY status ORDER BY status;
-- Look at 'revision_requested': those quotes can no longer be edited in place
-- until the revision feature (T09) exists. If you rely on editing them today,
-- tell me before applying.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.quotes_lock_non_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    locked_field TEXT;
    old_row JSONB := to_jsonb(OLD);
    new_row JSONB := to_jsonb(NEW);
BEGIN
    IF OLD.status IS DISTINCT FROM 'draft' THEN
        IF NEW.status = 'draft' THEN
            RAISE EXCEPTION 'Quote % is %, it cannot be moved back to draft', OLD.quote_number, OLD.status
                USING ERRCODE = 'check_violation',
                      HINT = 'Create a revision instead.';
        END IF;

        FOREACH locked_field IN ARRAY ARRAY[
            'items', 'subtotal', 'tax_rate', 'tax_amount', 'total_amount',
            'client_id', 'client_name', 'client_email', 'valid_until', 'currency'
        ] LOOP
            IF (old_row -> locked_field) IS DISTINCT FROM (new_row -> locked_field) THEN
                RAISE EXCEPTION 'Quote % is %, field "%" can no longer be changed', OLD.quote_number, OLD.status, locked_field
                    USING ERRCODE = 'check_violation',
                          HINT = 'Only draft quotes can be edited. Create a revision instead.';
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_lock_non_draft ON public.quotes;
CREATE TRIGGER quotes_lock_non_draft
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.quotes_lock_non_draft();
