# Legacy SQL — historical, do not run

These files are how the database was built before the project adopted Supabase CLI migrations. They are kept for reference only.

**Do not run any of them against any database.** Some overlap or contradict each other, and it is unknown which ones, in which order, were applied to production. Known problems:

- `finance-schema.sql` is broken. Its trigger functions are declared `RETURNS TEXT` instead of `RETURNS TRIGGER`, so it fails. `SETUP_FINANCE_MODULE.sql` and `finance-schema-fix.sql` are the versions that were actually used.
- `schema.sql` and `schema-fixed.sql` define the same tables differently.
- `quotes-schema.sql` creates `quotes.client_id ... ON DELETE CASCADE` (changed by a later migration in `supabase/migrations/`).
- `quotation-workflow-migration.sql` and `fix-public-quote-response-permissions.sql` create the anonymous INSERT path on `quote_responses` and two views without `security_invoker` (both removed by a later migration).
- `run-migration.js` and `apply-quotes-schema.bat` are old helper scripts for these files.

The source of truth is now `supabase/migrations/`. See `docs/MIGRATIONS.md`.
