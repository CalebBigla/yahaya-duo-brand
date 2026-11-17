-- ============================================================================
-- T04: close database security holes around quotes
--
-- 1. Views current_quotes and quotes_with_responses (legacy
--    quotation-workflow-migration.sql) were created without security_invoker.
--    A Postgres view runs with its owner's rights, so if anon/authenticated
--    have SELECT on it (Supabase grants that by default on public objects), it
--    returns every quote and response and bypasses RLS on the underlying tables.
--    Neither view is used by the app (grep of src/ and of every SQL function in
--    the repo), so they are dropped. No CASCADE: if anything in the live DB still
--    depends on them, this fails instead of silently dropping that too.
--
-- 2. "Public insert access to quote_responses" + GRANT INSERT ... TO anon let
--    anyone holding the public anon key insert a response for any quote UUID
--    without a token. The public quote page submits through the
--    submit_public_quote_response RPC (SECURITY DEFINER, validates the token),
--    which does not need either of these.
--    Admins keep their own "Admin insert access to quote_responses" policy and
--    the authenticated grant for manually recorded responses.
--
-- Existing data: no rows change.
-- ============================================================================

DROP VIEW IF EXISTS public.quotes_with_responses;
DROP VIEW IF EXISTS public.current_quotes;

DROP POLICY IF EXISTS "Public insert access to quote_responses" ON public.quote_responses;
REVOKE INSERT ON TABLE public.quote_responses FROM anon;
