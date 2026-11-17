# Database checks for the P0 migrations

Run these in the Supabase SQL editor (Dashboard → SQL Editor). Every query here is **read-only**.

For each migration, run the **before** checks first, apply the migration (see `docs/MIGRATIONS.md`), then run the **after** checks. Do it on staging first, then production.

Apply the migrations in this order:

| # | File | Task |
|---|---|---|
| 0 | `20261117000000_baseline_remote_schema.sql` | T08 baseline (placeholder until you run `supabase db pull`) |
| 1 | `20261117000100_t01_submissions_details.sql` | T01 |
| 2 | `20261117000200_t02_quotes_client_fk_restrict.sql` | T02 |
| 3 | `20261117000300_t04_close_quote_security_holes.sql` | T04 |

**Deploy order matters.** Apply migration 1 (T01) *before* deploying the new frontend. The new enquiry forms send a `details` field, and until that column exists **every** enquiry form fails, not just Trade.

---

## T04: quote views and anonymous inserts

### Before

```sql
-- A. Do the two views exist, and are they security_invoker?
--    Expect 2 rows. If reloptions does not include security_invoker=on, the view bypasses RLS.
SELECT c.relname, c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
  AND c.relname IN ('current_quotes', 'quotes_with_responses');

-- B. Who can read them? Any row with grantee 'anon' and privilege SELECT means
--    anyone holding the public key could read every quote through the view.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('current_quotes', 'quotes_with_responses')
  AND grantee IN ('anon', 'authenticated');

-- C. Does anything in the database depend on the views? Expect 0 rows.
--    If there are rows, stop: the DROP VIEW in the migration will fail. Send me the output.
SELECT DISTINCT dependent.relname AS dependent_object
FROM pg_depend d
JOIN pg_rewrite r ON r.oid = d.objid
JOIN pg_class dependent ON dependent.oid = r.ev_class
JOIN pg_class source ON source.oid = d.refobjid
WHERE source.relname IN ('current_quotes', 'quotes_with_responses')
  AND dependent.relname NOT IN ('current_quotes', 'quotes_with_responses');

-- D. Anonymous insert path on quote_responses. Expect the public policy to be listed,
--    and an INSERT grant for anon.
SELECT policyname, roles, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'quote_responses';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'quote_responses' AND grantee = 'anon';
```

If **A** returns rows and **B** shows `anon | SELECT`, the views were exposing quotes to the public. Check whether the quotes table has rows (`SELECT count(*) FROM quotes;`). If it does, treat it as a past data exposure.

### After

```sql
-- Expect 0 rows: views gone
SELECT relname FROM pg_class
WHERE relname IN ('current_quotes', 'quotes_with_responses');

-- Expect only "Admin read access to quote_responses" and "Admin insert access to quote_responses"
SELECT policyname, roles, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'quote_responses';

-- Expect no INSERT row for anon
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'quote_responses' AND grantee = 'anon';

-- The public response RPC must still be callable by anon and must be SECURITY DEFINER
-- (prosecdef = true). Expect 1 row with prosecdef = true and anon_can_execute = true.
SELECT p.proname, p.prosecdef,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'submit_public_quote_response';
```

Then click-test on staging: open a quote link in a private window and accept or decline it. That must still work.

### Supabase Security Advisor

After applying, open **Dashboard → Advisors → Security Advisor** and run it. Fix or note anything flagged **ERROR**, especially:

- `security_definer_view` (must not list either view any more)
- `rls_disabled_in_public` (every public table must have RLS on)
- `function_search_path_mutable` on the `SECURITY DEFINER` functions (`submit_public_quote_response`, `get_public_quote_by_token`, `validate_quote_token`, `generate_quote_access_token`, `create_quote_revision`). These should set `search_path`. That is a follow-up task, not part of T04.

Also check **Advisors → Performance Advisor** once. It is not a blocker.
