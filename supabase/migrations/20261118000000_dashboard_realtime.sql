-- Dashboard: live notifications
--
-- Adds public.submissions and public.quote_responses to the supabase_realtime
-- publication so the admin dashboard receives new enquiries and quote responses
-- instantly instead of polling.
--
-- Safety: Realtime (postgres_changes) only delivers a row to a subscriber who can
-- SELECT it under RLS. Both tables must therefore have RLS on and read policies for
-- admins only. This migration refuses to run if either table has RLS off or has a
-- SELECT/ALL policy for anon or public, because publishing it would stream rows
-- (names, emails, phone numbers) to anyone holding the public key.
--
-- PRE-CHECK (read-only), run first:
--
--   -- Expect: relrowsecurity = true for both
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE oid IN ('public.submissions'::regclass, 'public.quote_responses'::regclass);
--
--   -- Expect: only admin read policies, roles = {authenticated}
--   SELECT tablename, policyname, roles, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('submissions', 'quote_responses')
--     AND cmd IN ('SELECT', 'ALL');
--
--   -- Which tables are already published (may be 0 rows)
--   SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
--
-- The app works without this migration (it falls back to checking every minute);
-- applying it just makes notifications instant. It can go in before or after the
-- frontend deploy.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['submissions', 'quote_responses'] LOOP
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = format('public.%I', t)::regclass) THEN
      RAISE EXCEPTION 'RLS is disabled on public.%; refusing to publish it to Realtime', t;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
        AND cmd IN ('SELECT', 'ALL')
        AND roles && ARRAY['anon', 'public']::name[]
    ) THEN
      RAISE EXCEPTION 'public.% has a read policy for anon/public; refusing to publish it to Realtime', t;
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quote_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_responses;
  END IF;
END $$;

-- VERIFY (read-only). Expect 2 rows: quote_responses, submissions
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' AND tablename IN ('submissions', 'quote_responses')
--   ORDER BY tablename;
--
-- ROLLBACK (if ever needed):
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.submissions, public.quote_responses;
