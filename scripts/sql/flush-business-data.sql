-- ============================================================================
-- FLUSH BUSINESS DATA: enquiries, clients, quotes, finance
-- ============================================================================
--
-- PERMANENT. There is no undo except restoring a backup.
-- This is a one-off script, NOT a migration: it lives outside supabase/migrations
-- so `supabase db push` can never run it by accident. Run it by hand in the
-- Supabase SQL editor, one step at a time.
--
-- EMPTIES
--   submissions             (all website enquiries)
--   clients
--   quotes
--   quote_responses         (client accept/decline/revision records)
--   quote_access_tokens     (public quote links: all existing links stop working)
--   financial_transactions  (income)
--   expense_transactions
--
-- KEEPS
--   financial_categories, admin_users / logins, all website CMS content,
--   rate_limit_log, audit_log (see STEP 4 for the audit log's copies of old data)
--
-- After the flush, numbering restarts by itself: QT-<year>-001, INC-0001, EXP-0001
-- (each is calculated from the highest existing number).
--
-- Why TRUNCATE and not DELETE: these tables have audit triggers that copy every
-- deleted row, including names, emails and phone numbers, into audit_log. A DELETE
-- would wipe the tables and then keep a full copy of the data in the audit log.
-- TRUNCATE skips those row triggers.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 0: BACK UP FIRST
-- ----------------------------------------------------------------------------
-- Either:
--   * Dashboard -> Database -> Backups: confirm there is a backup from today
--     (Pro plan has daily backups; Free plan has none, so use the CLI option), or
--   * CLI, from the project folder (the file contains customer data: keep it
--     out of git and somewhere private):
--       supabase db dump --linked --data-only -f ../yahaya-backup-before-flush.sql


-- ----------------------------------------------------------------------------
-- STEP 1: PREVIEW (read-only). What will be removed?
-- ----------------------------------------------------------------------------
SELECT 'submissions' AS table_name, count(*) AS rows FROM public.submissions
UNION ALL SELECT 'clients', count(*) FROM public.clients
UNION ALL SELECT 'quotes', count(*) FROM public.quotes
UNION ALL SELECT 'quote_responses', count(*) FROM public.quote_responses
UNION ALL SELECT 'quote_access_tokens', count(*) FROM public.quote_access_tokens
UNION ALL SELECT 'financial_transactions', count(*) FROM public.financial_transactions
UNION ALL SELECT 'expense_transactions', count(*) FROM public.expense_transactions;


-- ----------------------------------------------------------------------------
-- STEP 2: SAFETY CHECK (read-only). Does any OTHER table point at these?
-- ----------------------------------------------------------------------------
-- Expect 0 rows. If any rows appear, stop and send them to me: that table holds
-- links to the data being removed, and STEP 3 will refuse to run (by design).
SELECT conrelid::regclass AS referencing_table,
       confrelid::regclass AS referenced_table,
       conname
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid IN (
    'public.submissions'::regclass, 'public.clients'::regclass, 'public.quotes'::regclass,
    'public.quote_responses'::regclass, 'public.quote_access_tokens'::regclass,
    'public.financial_transactions'::regclass, 'public.expense_transactions'::regclass
  )
  AND conrelid NOT IN (
    'public.submissions'::regclass, 'public.clients'::regclass, 'public.quotes'::regclass,
    'public.quote_responses'::regclass, 'public.quote_access_tokens'::regclass,
    'public.financial_transactions'::regclass, 'public.expense_transactions'::regclass
  );


-- ----------------------------------------------------------------------------
-- STEP 3: FLUSH. Select and run this block on its own.
-- ----------------------------------------------------------------------------
-- RESTRICT (not CASCADE): if some table not listed here references these tables,
-- the whole statement fails and nothing is removed.
BEGIN;

TRUNCATE TABLE
  public.quote_responses,
  public.quote_access_tokens,
  public.quotes,
  public.financial_transactions,
  public.expense_transactions,
  public.submissions,
  public.clients
RESTRICT;

-- Every count must be 0. If not, run ROLLBACK; instead of COMMIT;
SELECT 'submissions' AS table_name, count(*) AS rows FROM public.submissions
UNION ALL SELECT 'clients', count(*) FROM public.clients
UNION ALL SELECT 'quotes', count(*) FROM public.quotes
UNION ALL SELECT 'quote_responses', count(*) FROM public.quote_responses
UNION ALL SELECT 'quote_access_tokens', count(*) FROM public.quote_access_tokens
UNION ALL SELECT 'financial_transactions', count(*) FROM public.financial_transactions
UNION ALL SELECT 'expense_transactions', count(*) FROM public.expense_transactions;

COMMIT;


-- ----------------------------------------------------------------------------
-- STEP 4 (OPTIONAL, decide first): the audit log's copies of the old data
-- ----------------------------------------------------------------------------
-- audit_log still holds old_value/new_value snapshots of past client, quote and
-- finance edits, which include customer details. Leave it if you want the history.
-- If the flushed data was only test data and you want it gone everywhere,
-- preview, then remove those entries:
--
--   SELECT target_table, count(*) FROM public.audit_log
--   WHERE target_table IN ('submissions', 'clients', 'quotes', 'quote_responses',
--                          'quote_access_tokens', 'financial_transactions', 'expense_transactions')
--   GROUP BY target_table;
--
--   DELETE FROM public.audit_log
--   WHERE target_table IN ('submissions', 'clients', 'quotes', 'quote_responses',
--                          'quote_access_tokens', 'financial_transactions', 'expense_transactions');
