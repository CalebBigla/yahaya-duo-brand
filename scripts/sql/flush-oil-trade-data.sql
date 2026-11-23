-- ============================================================================
-- FLUSH OIL TRADE DATA: purchases, sales, adjustments, expenses, stock
-- ============================================================================
--
-- PERMANENT. There is no undo except restoring a backup.
-- This is a one-off script, NOT a migration: it lives outside supabase/migrations
-- so `supabase db push` can never run it by accident. Run it by hand in the
-- Supabase SQL editor, one step at a time.
--
-- EMPTIES
--   oil_purchases           (references restart at OP-00001)
--   oil_sales               (OS-00001)
--   oil_stock_adjustments   (OA-00001)
--   oil_expenses            (OE-00001)
--   oil_stock_ledger        (derived stock history; every product goes to 0 on hand)
--
-- KEEPS (unless you run the optional STEP 4)
--   oil_products and their unit conversions, so you can start recording again
--   straight away.
--
-- NOT TOUCHED
--   Everything outside the Oil Trade tab: enquiries, clients, quotes, Finance,
--   Expenses, website content, logins.
--
-- Why TRUNCATE and not DELETE: these tables have audit triggers that copy every
-- deleted row into audit_log. TRUNCATE skips those row triggers.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 0: BACK UP FIRST
-- ----------------------------------------------------------------------------
-- Either:
--   * Dashboard -> Database -> Backups: confirm there is a backup from today
--     (Pro plan has daily backups; Free plan has none, so use the CLI option), or
--   * CLI, from the project folder (keep the file out of git and somewhere private):
--       supabase db dump --linked --data-only -f ../yahaya-backup-before-oil-flush.sql


-- ----------------------------------------------------------------------------
-- STEP 1: PREVIEW (read-only). What will be removed?
-- ----------------------------------------------------------------------------
SELECT 'oil_purchases' AS table_name, count(*) AS rows FROM public.oil_purchases
UNION ALL SELECT 'oil_sales', count(*) FROM public.oil_sales
UNION ALL SELECT 'oil_stock_adjustments', count(*) FROM public.oil_stock_adjustments
UNION ALL SELECT 'oil_expenses', count(*) FROM public.oil_expenses
UNION ALL SELECT 'oil_stock_ledger', count(*) FROM public.oil_stock_ledger
UNION ALL SELECT 'oil_products (kept)', count(*) FROM public.oil_products
UNION ALL SELECT 'attachment files (kept, see STEP 5)', count(*) FROM storage.objects
  WHERE bucket_id = 'oil-trade-attachments';


-- ----------------------------------------------------------------------------
-- STEP 2: SAFETY CHECK (read-only). Does any OTHER table point at these?
-- ----------------------------------------------------------------------------
-- Expect 0 rows. If any rows appear, stop and send them to me: STEP 3 would
-- refuse to run (by design).
SELECT conrelid::regclass AS referencing_table,
       confrelid::regclass AS referenced_table,
       conname
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid IN (
    'public.oil_purchases'::regclass, 'public.oil_sales'::regclass,
    'public.oil_stock_adjustments'::regclass, 'public.oil_expenses'::regclass,
    'public.oil_stock_ledger'::regclass
  )
  AND conrelid NOT IN (
    'public.oil_purchases'::regclass, 'public.oil_sales'::regclass,
    'public.oil_stock_adjustments'::regclass, 'public.oil_expenses'::regclass,
    'public.oil_stock_ledger'::regclass
  );


-- ----------------------------------------------------------------------------
-- STEP 3: FLUSH. Select and run this block on its own.
-- ----------------------------------------------------------------------------
-- RESTRICT (not CASCADE): if some table not listed here references these tables,
-- the whole statement fails and nothing is removed.
BEGIN;

TRUNCATE TABLE
  public.oil_expenses,
  public.oil_stock_ledger,
  public.oil_stock_adjustments,
  public.oil_sales,
  public.oil_purchases
RESTRICT;

-- Restart the reference numbers (OP-00001, OS-00001, OA-00001, OE-00001).
ALTER SEQUENCE public.oil_purchase_ref_seq RESTART WITH 1;
ALTER SEQUENCE public.oil_sale_ref_seq RESTART WITH 1;
ALTER SEQUENCE public.oil_adjustment_ref_seq RESTART WITH 1;
ALTER SEQUENCE public.oil_expense_ref_seq RESTART WITH 1;

-- Every count must be 0. If not, run ROLLBACK; instead of COMMIT;
SELECT 'oil_purchases' AS table_name, count(*) AS rows FROM public.oil_purchases
UNION ALL SELECT 'oil_sales', count(*) FROM public.oil_sales
UNION ALL SELECT 'oil_stock_adjustments', count(*) FROM public.oil_stock_adjustments
UNION ALL SELECT 'oil_expenses', count(*) FROM public.oil_expenses
UNION ALL SELECT 'oil_stock_ledger', count(*) FROM public.oil_stock_ledger;

COMMIT;


-- ----------------------------------------------------------------------------
-- STEP 4 (OPTIONAL): also remove the products
-- ----------------------------------------------------------------------------
-- Only if you want the Products list empty too. Run after STEP 3.
-- oil_product_units is cleared with it.
--
--   BEGIN;
--   TRUNCATE TABLE public.oil_product_units, public.oil_products RESTRICT;
--   SELECT count(*) AS products_left FROM public.oil_products;  -- must be 0
--   COMMIT;


-- ----------------------------------------------------------------------------
-- STEP 5: purchase attachment files
-- ----------------------------------------------------------------------------
-- Files uploaded to purchases are in Storage, not in these tables. Supabase does
-- not allow deleting them with SQL. Remove them in the dashboard:
--   Storage -> oil-trade-attachments -> open "purchases" -> select all -> Delete.


-- ----------------------------------------------------------------------------
-- STEP 6 (OPTIONAL, decide first): the audit log's copies of the old data
-- ----------------------------------------------------------------------------
-- audit_log still holds snapshots of past oil trade edits (suppliers, customers,
-- amounts). Leave it if you want the history. If it was only test data:
--
--   SELECT target_table, count(*) FROM public.audit_log
--   WHERE target_table IN ('oil_purchases', 'oil_sales', 'oil_stock_adjustments',
--                          'oil_expenses', 'oil_products')
--   GROUP BY target_table;
--
--   DELETE FROM public.audit_log
--   WHERE target_table IN ('oil_purchases', 'oil_sales', 'oil_stock_adjustments',
--                          'oil_expenses', 'oil_products');
--   (Leave 'oil_products' out of both lists if you kept the products.)
