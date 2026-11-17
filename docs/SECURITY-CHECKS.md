# Database checks for the P0 migrations

Run these in the Supabase SQL editor (Dashboard → SQL Editor). Every query here is **read-only**.

For each migration, run the **before** checks first, apply the migration (see `docs/MIGRATIONS.md`), then run the **after** checks. Do it on staging first, then production.

Apply the migrations in this order:

| # | File | Task | When |
|---|---|---|---|
| 0 | `20261117000000_baseline_remote_schema.sql` | T08 baseline (placeholder until you run `supabase db pull`) | first |
| 1 | `20261117000100_t01_submissions_details.sql` | T01 | **before** deploying the frontend |
| 2 | `20261117000200_t02_quotes_client_fk_restrict.sql` | T02 | before deploying |
| 3 | `20261117000300_t04_close_quote_security_holes.sql` | T04 | before deploying |
| 4 | `20261117000400_t06_cms_drafts_and_singletons.sql` | T06 | **after** deploying the frontend |
| 5 | `20261117000500_t07_lock_non_draft_quotes.sql` | T07 | after deploying |

### Deploy sequence

1. Run every **before** check below.
2. Apply migrations 1–3 (T01, T02, T04).
3. Deploy the `fix/p0-audit` frontend to Render.
4. Apply migrations 4–5 (T06, T07).
5. Run every **after** check, then click through the manual test checklist in the PR description.

Why this order:
- **T01 first:** the new enquiry forms send a `details` field. Until that column exists, **every** enquiry form fails, not just Trade.
- **T06 after:** it removes anon's table-wide `SELECT` on `website_homepage` and `website_settings`. The *old* frontend reads them with `select('*')`, which would fail. The public site would then fall back to hard-coded text until the new frontend is live.
- **T07 after:** it works with either frontend. The old frontend could still try to edit a sent quote, and the trigger would correctly refuse with "Unable to save the quote". Applying it after the deploy just avoids staff hitting that.

With the CLI you can apply in two steps by moving the T06/T07 files aside for the first `supabase db push`, or apply each file in the SQL editor and then run `supabase migration repair --status applied <version>` (see `docs/MIGRATIONS.md`).

---

## T01: `submissions.details`

### Before
```sql
-- Expect 0 rows (column not there yet)
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'details';

-- Expect: one row "Public insert access to submissions" with with_check = true
SELECT policyname, roles, cmd, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'submissions' AND cmd = 'INSERT';
```

### After
```sql
-- Expect: details | jsonb | YES | '{}'::jsonb
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'details';

-- Expect: 1 row, submissions_details_shape
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.submissions'::regclass AND conname = 'submissions_details_shape';
```
Then submit the Trade form on staging and confirm the row has `form_type = 'trade'`, `name` = contact name, and `details` containing `company` plus the service-specific fields.

## T02: client delete no longer cascades to quotes

### Before
```sql
-- Expect confdeltype = 'c' (CASCADE) today
SELECT conname, confdeltype FROM pg_constraint
WHERE conrelid = 'public.quotes'::regclass AND contype = 'f'
  AND confrelid = 'public.clients'::regclass;

-- Expect a CHECK that lists 'active', 'inactive', 'prospect'
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.clients'::regclass AND contype = 'c';

-- Existing statuses. Every row must be active / inactive / prospect.
-- Note how many are 'inactive': the Clients page will now show them as "Archived"
-- and hide them unless "Show archived" is ticked.
SELECT status, count(*) FROM public.clients GROUP BY status;
```

### After
```sql
-- Expect exactly 1 row: quotes_client_id_fkey | r   ('r' = RESTRICT)
SELECT conname, confdeltype FROM pg_constraint
WHERE conrelid = 'public.quotes'::regclass AND contype = 'f'
  AND confrelid = 'public.clients'::regclass;
```

## T06: CMS drafts and single-row tables

### Before
```sql
-- Each count MUST be exactly 1. If either is 2+, stop and send me the rows (id, status, updated_at):
-- the unique index would fail, and we need to decide which row is the real one.
SELECT 'website_homepage' AS t, count(*) FROM public.website_homepage
UNION ALL
SELECT 'website_settings', count(*) FROM public.website_settings;

-- Current status of each row. 'draft' here means the public site is ALREADY showing fallback text
-- (someone clicked Save before this fix). Re-publish it from the admin after deploying.
SELECT 'website_homepage' AS t, status, published_at, updated_at FROM public.website_homepage
UNION ALL
SELECT 'website_settings', status, published_at, updated_at FROM public.website_settings;
```

### After
```sql
-- Expect 2 rows (draft_data on both tables)
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'draft_data'
  AND table_name IN ('website_homepage', 'website_settings');

-- Expect 2 rows: website_homepage_singleton, website_settings_singleton
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'website_%_singleton';

-- anon must NOT be able to read draft_data, but can read the public columns.
-- Expect: f, t, f, t
SELECT has_column_privilege('anon', 'public.website_homepage', 'draft_data', 'SELECT')  AS home_draft,
       has_column_privilege('anon', 'public.website_homepage', 'hero_title', 'SELECT')  AS home_title,
       has_column_privilege('anon', 'public.website_settings', 'draft_data', 'SELECT')  AS settings_draft,
       has_column_privilege('anon', 'public.website_settings', 'phone_primary', 'SELECT') AS settings_phone;
```
Then open the public home page and contact page in a private window and confirm they show the CMS content, not the hard-coded fallback.

## T07: quote lock trigger

### Before
```sql
-- How many quotes will be locked. 'revision_requested' quotes can no longer be edited in place.
SELECT status, count(*) FROM public.quotes GROUP BY status ORDER BY status;

-- Does the live quotes table have a currency column? (The trigger handles either case.)
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'currency';
```

### After
```sql
-- Expect 1 row: quotes_lock_non_draft | O (enabled)
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgrelid = 'public.quotes'::regclass AND tgname = 'quotes_lock_non_draft';
```
To prove it works **on staging only**, take a quote that is not a draft and try changing its total in the SQL editor. It must fail with `field "total_amount" can no longer be changed`. Don't run this on production.

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
