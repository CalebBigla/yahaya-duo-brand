-- ============================================================================
-- OIL TRADE MODULE
-- ============================================================================
-- Products, purchases, sales, operating expenses, stock adjustments, a derived
-- stock ledger (moving weighted-average cost) and reporting functions.
--
-- Design
-- * Owner-only, like Finance: owners can read; nobody writes tables directly.
--   Every write goes through a SECURITY DEFINER function below that checks the
--   caller is an owner, locks the product, writes, then rebuilds that product's
--   stock ledger. Any rule violation raises, so the whole call rolls back.
-- * Inventory is never stored as a running number that edits could corrupt. The
--   ledger is rebuilt from the active purchases, adjustments and sales in date
--   order (purchases, then adjustments, then sales on the same day). The rebuild
--   assigns COGS at the moving average cost and refuses any sequence that would
--   take stock below zero on any date. Editing or voiding a past transaction
--   therefore re-prices every later sale correctly.
-- * Each product has a base unit. Other units need an explicit, per-product
--   conversion factor entered by the owner. Nothing is converted with built-in
--   assumptions. Each transaction stores its base quantity at the time it was
--   posted, so changing a factor later does not rewrite history.
-- * Duplicate submissions: create calls carry an idempotency key (unique); a
--   retry returns the original record instead of creating a second one.
-- * Oil trade records live in their own tables and do not feed the existing
--   Finance / Expenses modules or their totals.
--
-- Safe to apply before or after the frontend deploy (it only adds objects).
-- Read-only checks to run afterwards are at the end of this file.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.oil_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.oil_assert_owner()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.oil_is_owner() THEN
    RAISE EXCEPTION 'Only owners can manage oil trade records' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- "Today" in Nigeria, so a transaction dated today is never rejected as future
-- just because the database clock runs on UTC.
CREATE OR REPLACE FUNCTION public.oil_today()
RETURNS date
LANGUAGE sql
STABLE
AS $$ SELECT (now() AT TIME ZONE 'Africa/Lagos')::date; $$;

CREATE OR REPLACE FUNCTION public.oil_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Units the module understands. Conversions between them are per product.
--   litre, barrel, metric_tonne, kilogram, cubic_metre, us_gallon

CREATE TABLE IF NOT EXISTS public.oil_products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  code         text NOT NULL CHECK (code ~ '^[A-Z0-9-]{1,12}$'),
  base_unit    text NOT NULL CHECK (base_unit IN ('litre', 'barrel', 'metric_tonne', 'kilogram', 'cubic_metre', 'us_gallon')),
  description  text CHECK (description IS NULL OR length(description) <= 500),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id),
  updated_by   uuid REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS oil_products_name_key ON public.oil_products (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS oil_products_code_key ON public.oil_products (code);

-- How many base units one of `unit` is, for this product (e.g. 1 barrel = 158.987 litres).
CREATE TABLE IF NOT EXISTS public.oil_product_units (
  product_id      uuid NOT NULL REFERENCES public.oil_products(id) ON DELETE CASCADE,
  unit            text NOT NULL CHECK (unit IN ('litre', 'barrel', 'metric_tonne', 'kilogram', 'cubic_metre', 'us_gallon')),
  factor_to_base  numeric(24, 10) NOT NULL CHECK (factor_to_base > 0),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, unit)
);

CREATE SEQUENCE IF NOT EXISTS public.oil_purchase_ref_seq;
CREATE SEQUENCE IF NOT EXISTS public.oil_sale_ref_seq;
CREATE SEQUENCE IF NOT EXISTS public.oil_expense_ref_seq;
CREATE SEQUENCE IF NOT EXISTS public.oil_adjustment_ref_seq;

CREATE TABLE IF NOT EXISTS public.oil_purchases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE DEFAULT ('OP-' || lpad(nextval('public.oil_purchase_ref_seq')::text, 5, '0')),
  product_id       uuid NOT NULL REFERENCES public.oil_products(id) ON DELETE RESTRICT,
  supplier         text NOT NULL CHECK (length(btrim(supplier)) BETWEEN 1 AND 200),
  quantity         numeric(20, 4) NOT NULL CHECK (quantity > 0),
  unit             text NOT NULL,
  base_quantity    numeric(24, 6) NOT NULL CHECK (base_quantity > 0),
  unit_price       numeric(20, 4) NOT NULL CHECK (unit_price >= 0),
  total_cost       numeric(20, 2) NOT NULL CHECK (total_cost >= 0),
  amount_paid      numeric(20, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  payment_status   text GENERATED ALWAYS AS (
                     CASE WHEN amount_paid >= total_cost THEN 'paid'
                          WHEN amount_paid > 0 THEN 'partial'
                          ELSE 'unpaid' END) STORED,
  transaction_date date NOT NULL,
  external_ref     text CHECK (external_ref IS NULL OR length(external_ref) <= 100),
  notes            text CHECK (notes IS NULL OR length(notes) <= 2000),
  attachments      jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  void_reason      text,
  voided_at        timestamptz,
  voided_by        uuid REFERENCES auth.users(id),
  idempotency_key  uuid UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES auth.users(id),
  updated_by       uuid REFERENCES auth.users(id),
  CONSTRAINT oil_purchases_paid_le_total CHECK (amount_paid <= total_cost)
);
CREATE INDEX IF NOT EXISTS oil_purchases_product_date_idx ON public.oil_purchases (product_id, transaction_date);
CREATE INDEX IF NOT EXISTS oil_purchases_date_idx ON public.oil_purchases (transaction_date);

CREATE TABLE IF NOT EXISTS public.oil_sales (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE DEFAULT ('OS-' || lpad(nextval('public.oil_sale_ref_seq')::text, 5, '0')),
  product_id       uuid NOT NULL REFERENCES public.oil_products(id) ON DELETE RESTRICT,
  customer         text NOT NULL CHECK (length(btrim(customer)) BETWEEN 1 AND 200),
  quantity         numeric(20, 4) NOT NULL CHECK (quantity > 0),
  unit             text NOT NULL,
  base_quantity    numeric(24, 6) NOT NULL CHECK (base_quantity > 0),
  unit_price       numeric(20, 4) NOT NULL CHECK (unit_price >= 0),
  total_amount     numeric(20, 2) NOT NULL CHECK (total_amount >= 0),
  amount_paid      numeric(20, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  outstanding      numeric(20, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_status   text GENERATED ALWAYS AS (
                     CASE WHEN amount_paid >= total_amount THEN 'paid'
                          WHEN amount_paid > 0 THEN 'partial'
                          ELSE 'unpaid' END) STORED,
  transaction_date date NOT NULL,
  external_ref     text CHECK (external_ref IS NULL OR length(external_ref) <= 100),
  notes            text CHECK (notes IS NULL OR length(notes) <= 2000),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  void_reason      text,
  voided_at        timestamptz,
  voided_by        uuid REFERENCES auth.users(id),
  idempotency_key  uuid UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES auth.users(id),
  updated_by       uuid REFERENCES auth.users(id),
  CONSTRAINT oil_sales_paid_le_total CHECK (amount_paid <= total_amount)
);
CREATE INDEX IF NOT EXISTS oil_sales_product_date_idx ON public.oil_sales (product_id, transaction_date);
CREATE INDEX IF NOT EXISTS oil_sales_date_idx ON public.oil_sales (transaction_date);

CREATE TABLE IF NOT EXISTS public.oil_stock_adjustments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE DEFAULT ('OA-' || lpad(nextval('public.oil_adjustment_ref_seq')::text, 5, '0')),
  product_id       uuid NOT NULL REFERENCES public.oil_products(id) ON DELETE RESTRICT,
  quantity         numeric(20, 4) NOT NULL CHECK (quantity <> 0),      -- signed, in `unit`
  unit             text NOT NULL,
  base_quantity    numeric(24, 6) NOT NULL CHECK (base_quantity <> 0), -- signed, base unit
  unit_cost_base   numeric(24, 8) CHECK (unit_cost_base IS NULL OR unit_cost_base >= 0), -- increases only; NULL = current average
  adjustment_date  date NOT NULL,
  reason           text NOT NULL CHECK (length(btrim(reason)) BETWEEN 3 AND 500),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  void_reason      text,
  voided_at        timestamptz,
  voided_by        uuid REFERENCES auth.users(id),
  idempotency_key  uuid UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES auth.users(id),
  updated_by       uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS oil_adjustments_product_date_idx ON public.oil_stock_adjustments (product_id, adjustment_date);

CREATE TABLE IF NOT EXISTS public.oil_expenses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE DEFAULT ('OE-' || lpad(nextval('public.oil_expense_ref_seq')::text, 5, '0')),
  category         text NOT NULL CHECK (category IN ('transportation', 'logistics', 'storage', 'loading_offloading', 'handling', 'taxes_levies', 'other')),
  description      text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 300),
  amount           numeric(20, 2) NOT NULL CHECK (amount > 0),
  expense_date     date NOT NULL,
  payee            text CHECK (payee IS NULL OR length(payee) <= 200),
  product_id       uuid REFERENCES public.oil_products(id) ON DELETE RESTRICT,
  purchase_id      uuid REFERENCES public.oil_purchases(id) ON DELETE RESTRICT,
  sale_id          uuid REFERENCES public.oil_sales(id) ON DELETE RESTRICT,
  external_ref     text CHECK (external_ref IS NULL OR length(external_ref) <= 100),
  notes            text CHECK (notes IS NULL OR length(notes) <= 2000),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
  void_reason      text,
  voided_at        timestamptz,
  voided_by        uuid REFERENCES auth.users(id),
  idempotency_key  uuid UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES auth.users(id),
  updated_by       uuid REFERENCES auth.users(id),
  CONSTRAINT oil_expenses_one_link CHECK (purchase_id IS NULL OR sale_id IS NULL)
);
CREATE INDEX IF NOT EXISTS oil_expenses_date_idx ON public.oil_expenses (expense_date);

-- Derived: rebuilt by oil_recalculate_product(). Never edited by hand.
CREATE TABLE IF NOT EXISTS public.oil_stock_ledger (
  product_id        uuid NOT NULL REFERENCES public.oil_products(id) ON DELETE CASCADE,
  position          integer NOT NULL,
  movement_type     text NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment')),
  source_id         uuid NOT NULL,
  reference         text NOT NULL,
  movement_date     date NOT NULL,
  quantity_change   numeric(24, 6) NOT NULL,  -- base units, signed
  unit_cost         numeric(24, 8) NOT NULL,  -- per base unit
  value_change      numeric(20, 2) NOT NULL,  -- signed; for a sale this is -COGS
  balance_quantity  numeric(24, 6) NOT NULL,
  balance_value     numeric(20, 2) NOT NULL,
  average_cost      numeric(24, 8) NOT NULL,
  PRIMARY KEY (product_id, position)
);
CREATE INDEX IF NOT EXISTS oil_stock_ledger_source_idx ON public.oil_stock_ledger (source_id);
CREATE INDEX IF NOT EXISTS oil_stock_ledger_date_idx ON public.oil_stock_ledger (product_id, movement_date);

DROP TRIGGER IF EXISTS oil_products_touch ON public.oil_products;
CREATE TRIGGER oil_products_touch BEFORE UPDATE ON public.oil_products FOR EACH ROW EXECUTE FUNCTION public.oil_touch_updated_at();
DROP TRIGGER IF EXISTS oil_purchases_touch ON public.oil_purchases;
CREATE TRIGGER oil_purchases_touch BEFORE UPDATE ON public.oil_purchases FOR EACH ROW EXECUTE FUNCTION public.oil_touch_updated_at();
DROP TRIGGER IF EXISTS oil_sales_touch ON public.oil_sales;
CREATE TRIGGER oil_sales_touch BEFORE UPDATE ON public.oil_sales FOR EACH ROW EXECUTE FUNCTION public.oil_touch_updated_at();
DROP TRIGGER IF EXISTS oil_adjustments_touch ON public.oil_stock_adjustments;
CREATE TRIGGER oil_adjustments_touch BEFORE UPDATE ON public.oil_stock_adjustments FOR EACH ROW EXECUTE FUNCTION public.oil_touch_updated_at();
DROP TRIGGER IF EXISTS oil_expenses_touch ON public.oil_expenses;
CREATE TRIGGER oil_expenses_touch BEFORE UPDATE ON public.oil_expenses FOR EACH ROW EXECUTE FUNCTION public.oil_touch_updated_at();


-- ----------------------------------------------------------------------------
-- Access control: owners read; all writes go through the functions below.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['oil_products', 'oil_product_units', 'oil_purchases', 'oil_sales',
                           'oil_stock_adjustments', 'oil_expenses', 'oil_stock_ledger'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owners can read %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Owners can read %s" ON public.%I FOR SELECT TO authenticated USING (public.oil_is_owner())', t, t);
  END LOOP;
END $$;

REVOKE ALL ON SEQUENCE public.oil_purchase_ref_seq, public.oil_sale_ref_seq,
                       public.oil_expense_ref_seq, public.oil_adjustment_ref_seq FROM anon, authenticated;

-- Current stock per product (last ledger row). security_invoker so RLS applies.
CREATE OR REPLACE VIEW public.oil_inventory_status
WITH (security_invoker = on) AS
SELECT p.id AS product_id,
       p.name,
       p.code,
       p.base_unit,
       p.is_active,
       COALESCE(l.balance_quantity, 0) AS on_hand_quantity,
       COALESCE(l.balance_value, 0)    AS inventory_value,
       COALESCE(l.average_cost, 0)     AS average_cost,
       l.movement_date                 AS last_movement_date
FROM public.oil_products p
LEFT JOIN LATERAL (
  SELECT balance_quantity, balance_value, average_cost, movement_date
  FROM public.oil_stock_ledger
  WHERE product_id = p.id
  ORDER BY position DESC
  LIMIT 1
) l ON true;

REVOKE ALL ON public.oil_inventory_status FROM anon;
GRANT SELECT ON public.oil_inventory_status TO authenticated;


-- ----------------------------------------------------------------------------
-- Audit: reuse the app's audit trigger when it exists.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  IF to_regprocedure('public.audit_content_changes()') IS NULL THEN
    RAISE NOTICE 'audit_content_changes() not found: oil trade tables will not be audited';
    RETURN;
  END IF;
  FOREACH t IN ARRAY ARRAY['oil_products', 'oil_purchases', 'oil_sales', 'oil_stock_adjustments', 'oil_expenses'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s_trigger ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER audit_%s_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_content_changes()', t, t);
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- Inventory engine
-- ----------------------------------------------------------------------------

-- Base units in one `p_unit` of the product. Raises if no conversion is set up.
CREATE OR REPLACE FUNCTION public.oil_unit_factor(p_product_id uuid, p_unit text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base text;
  v_name text;
  v_factor numeric;
BEGIN
  SELECT base_unit, name INTO v_base, v_name FROM oil_products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  IF p_unit = v_base THEN
    RETURN 1;
  END IF;
  SELECT factor_to_base INTO v_factor FROM oil_product_units WHERE product_id = p_product_id AND unit = p_unit;
  IF v_factor IS NULL THEN
    RAISE EXCEPTION 'No conversion from % to % is set up for %. Add it under Products first.',
      replace(p_unit, '_', ' '), replace(v_base, '_', ' '), v_name;
  END IF;
  RETURN v_factor;
END;
$$;

-- Rebuilds one product's ledger from its active movements. Raises if stock would
-- go negative at any point. Callers must hold a lock on the product row.
CREATE OR REPLACE FUNCTION public.oil_recalculate_product(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m        record;
  v_qty    numeric := 0;
  v_value  numeric := 0;
  v_avg    numeric := 0;
  v_cost   numeric;
  v_change numeric;
  v_pos    integer := 0;
  v_name   text;
  v_unit   text;
  c_eps    constant numeric := 0.000001;
BEGIN
  SELECT name, base_unit INTO v_name, v_unit FROM oil_products WHERE id = p_product_id;
  DELETE FROM oil_stock_ledger WHERE product_id = p_product_id;

  FOR m IN
    SELECT * FROM (
      SELECT 'purchase'::text AS kind, 1 AS sort_order, p.id, p.reference, p.transaction_date AS movement_date,
             p.created_at, p.base_quantity AS qty, p.total_cost AS amount
      FROM oil_purchases p WHERE p.product_id = p_product_id AND p.status = 'active'
      UNION ALL
      SELECT 'adjustment', 2, a.id, a.reference, a.adjustment_date, a.created_at, a.base_quantity, a.unit_cost_base
      FROM oil_stock_adjustments a WHERE a.product_id = p_product_id AND a.status = 'active'
      UNION ALL
      SELECT 'sale', 3, s.id, s.reference, s.transaction_date, s.created_at, s.base_quantity, s.total_amount
      FROM oil_sales s WHERE s.product_id = p_product_id AND s.status = 'active'
    ) movements
    ORDER BY movement_date, sort_order, created_at, id
  LOOP
    v_pos := v_pos + 1;

    IF m.kind = 'purchase' THEN
      v_cost := m.amount / m.qty;
      v_change := m.amount;
      v_qty := v_qty + m.qty;

    ELSIF m.kind = 'adjustment' AND m.qty > 0 THEN
      v_cost := COALESCE(m.amount, v_avg);
      v_change := round(m.qty * v_cost, 2);
      v_qty := v_qty + m.qty;

    ELSE
      -- Stock leaving: a sale or a negative adjustment, valued at the moving average.
      IF abs(m.qty) > v_qty + c_eps THEN
        RAISE EXCEPTION 'Not enough % in stock on %: % % available, but % needs % %.',
          v_name, to_char(m.movement_date, 'DD Mon YYYY'),
          trim_scale(round(v_qty, 4))::text, replace(v_unit, '_', ' '),
          m.reference, trim_scale(round(abs(m.qty), 4))::text, replace(v_unit, '_', ' ')
          USING ERRCODE = 'P0001', HINT = 'Record the purchase first, or correct the quantity or date.';
      END IF;
      v_cost := v_avg;
      IF abs(v_qty - abs(m.qty)) <= c_eps THEN
        v_change := -v_value;               -- last units out take the remaining value exactly
      ELSE
        v_change := -round(abs(m.qty) * v_avg, 2);
      END IF;
      v_qty := v_qty - abs(m.qty);
    END IF;

    v_value := v_value + v_change;
    IF abs(v_qty) <= c_eps THEN
      v_qty := 0;
    END IF;
    v_avg := CASE WHEN v_qty > 0 THEN v_value / v_qty ELSE 0 END;

    INSERT INTO oil_stock_ledger (product_id, position, movement_type, source_id, reference, movement_date,
                                  quantity_change, unit_cost, value_change, balance_quantity, balance_value, average_cost)
    VALUES (p_product_id, v_pos, m.kind, m.id, m.reference, m.movement_date,
            CASE WHEN m.kind = 'sale' THEN -m.qty ELSE m.qty END,
            round(v_cost, 8), v_change, v_qty, v_value, round(v_avg, 8));
  END LOOP;
END;
$$;

-- Locks product rows in a stable order (prevents deadlocks between concurrent calls).
CREATE OR REPLACE FUNCTION public.oil_lock_products(p_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM oil_products WHERE id = ANY (p_ids) ORDER BY id FOR UPDATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.oil_assert_product_usable(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM oil_products WHERE id = p_product_id AND is_active) THEN
    RAISE EXCEPTION 'This product is inactive or does not exist. Activate it under Products to record new transactions.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.oil_assert_date(p_date date)
RETURNS void
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_date IS NULL THEN
    RAISE EXCEPTION 'A transaction date is required';
  END IF;
  IF p_date > public.oil_today() THEN
    RAISE EXCEPTION 'The date cannot be in the future';
  END IF;
  IF p_date < DATE '2000-01-01' THEN
    RAISE EXCEPTION 'The date looks wrong (before 2000)';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.oil_clean(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT NULLIF(btrim(p_text), ''); $$;


-- ----------------------------------------------------------------------------
-- Products
-- ----------------------------------------------------------------------------

-- p: { id?, name, code, base_unit, description?, is_active?, conversions: [{unit, factor_to_base}] }
CREATE OR REPLACE FUNCTION public.oil_save_product(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id    uuid := NULLIF(p->>'id', '')::uuid;
  v_base  text := p->>'base_unit';
  v_old_base text;
  c       jsonb;
  v_units text[] := ARRAY[]::text[];
BEGIN
  PERFORM oil_assert_owner();

  IF oil_clean(p->>'name') IS NULL OR length(oil_clean(p->>'name')) > 100 THEN
    RAISE EXCEPTION 'Enter a product name (up to 100 characters)';
  END IF;
  IF upper(COALESCE(oil_clean(p->>'code'), '')) !~ '^[A-Z0-9-]{1,12}$' THEN
    RAISE EXCEPTION 'The code must be 1 to 12 letters, digits or dashes (e.g. AGO)';
  END IF;
  IF v_base IS NULL OR v_base NOT IN ('litre', 'barrel', 'metric_tonne', 'kilogram', 'cubic_metre', 'us_gallon') THEN
    RAISE EXCEPTION 'Choose a base unit';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO oil_products (name, code, base_unit, description, is_active, created_by, updated_by)
    VALUES (oil_clean(p->>'name'), upper(oil_clean(p->>'code')), v_base, oil_clean(p->>'description'),
            COALESCE((p->>'is_active')::boolean, true), auth.uid(), auth.uid())
    RETURNING id INTO v_id;
  ELSE
    PERFORM oil_lock_products(ARRAY[v_id]);
    SELECT base_unit INTO v_old_base FROM oil_products WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
    IF v_old_base <> v_base AND (
         EXISTS (SELECT 1 FROM oil_purchases WHERE product_id = v_id)
      OR EXISTS (SELECT 1 FROM oil_sales WHERE product_id = v_id)
      OR EXISTS (SELECT 1 FROM oil_stock_adjustments WHERE product_id = v_id)) THEN
      RAISE EXCEPTION 'The base unit cannot change once this product has transactions';
    END IF;
    UPDATE oil_products
       SET name = oil_clean(p->>'name'),
           code = upper(oil_clean(p->>'code')),
           base_unit = v_base,
           description = oil_clean(p->>'description'),
           is_active = COALESCE((p->>'is_active')::boolean, is_active),
           updated_by = auth.uid()
     WHERE id = v_id;
  END IF;

  -- Replace the conversion list (the base unit is implicit: factor 1).
  FOR c IN SELECT * FROM jsonb_array_elements(COALESCE(p->'conversions', '[]'::jsonb)) LOOP
    IF c->>'unit' = v_base THEN
      CONTINUE;
    END IF;
    IF NULLIF(c->>'factor_to_base', '')::numeric IS NULL OR (c->>'factor_to_base')::numeric <= 0 THEN
      RAISE EXCEPTION 'Each conversion needs a factor greater than zero';
    END IF;
    INSERT INTO oil_product_units (product_id, unit, factor_to_base)
    VALUES (v_id, c->>'unit', (c->>'factor_to_base')::numeric)
    ON CONFLICT (product_id, unit) DO UPDATE SET factor_to_base = EXCLUDED.factor_to_base, updated_at = now();
    v_units := v_units || (c->>'unit');
  END LOOP;
  DELETE FROM oil_product_units WHERE product_id = v_id AND NOT (unit = ANY (v_units));

  RETURN jsonb_build_object('id', v_id);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Another product already uses that name or code';
END;
$$;

CREATE OR REPLACE FUNCTION public.oil_set_product_active(p_id uuid, p_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM oil_assert_owner();
  UPDATE oil_products SET is_active = p_active, updated_by = auth.uid() WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- Purchases
-- ----------------------------------------------------------------------------

-- p: { id?, idempotency_key?, product_id, supplier, quantity, unit, unit_price, amount_paid?,
--      transaction_date, external_ref?, notes?, attachments? [{path, name, size, type}] }
CREATE OR REPLACE FUNCTION public.oil_save_purchase(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id       uuid := NULLIF(p->>'id', '')::uuid;
  v_key      uuid := NULLIF(p->>'idempotency_key', '')::uuid;
  v_product  uuid := NULLIF(p->>'product_id', '')::uuid;
  v_qty      numeric := NULLIF(p->>'quantity', '')::numeric;
  v_price    numeric := NULLIF(p->>'unit_price', '')::numeric;
  v_paid     numeric := COALESCE(NULLIF(p->>'amount_paid', '')::numeric, 0);
  v_date     date := NULLIF(p->>'transaction_date', '')::date;
  v_files    jsonb := COALESCE(p->'attachments', '[]'::jsonb);
  v_total    numeric;
  v_factor   numeric;
  v_old      oil_purchases%ROWTYPE;
  v_ref      text;
  f          jsonb;
BEGIN
  PERFORM oil_assert_owner();

  IF v_id IS NULL AND v_key IS NOT NULL THEN
    SELECT id, reference INTO v_id, v_ref FROM oil_purchases WHERE idempotency_key = v_key;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
    END IF;
  END IF;

  IF v_product IS NULL THEN RAISE EXCEPTION 'Choose a product'; END IF;
  IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF v_price IS NULL OR v_price < 0 THEN RAISE EXCEPTION 'Enter a unit price of zero or more'; END IF;
  IF oil_clean(p->>'supplier') IS NULL THEN RAISE EXCEPTION 'Enter the supplier'; END IF;
  PERFORM oil_assert_date(v_date);

  IF jsonb_typeof(v_files) <> 'array' OR jsonb_array_length(v_files) > 10 THEN
    RAISE EXCEPTION 'Up to 10 attachments are allowed';
  END IF;
  FOR f IN SELECT * FROM jsonb_array_elements(v_files) LOOP
    IF COALESCE(f->>'path', '') NOT LIKE 'purchases/%' OR f->>'path' LIKE '%..%' THEN
      RAISE EXCEPTION 'Invalid attachment';
    END IF;
  END LOOP;

  v_total := round(v_qty * v_price, 2);
  IF v_paid < 0 OR v_paid > v_total THEN
    RAISE EXCEPTION 'Amount paid must be between 0 and the total cost';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_old FROM oil_purchases WHERE id = v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found'; END IF;
    IF v_old.status <> 'active' THEN RAISE EXCEPTION 'A voided purchase cannot be edited'; END IF;
  END IF;

  PERFORM oil_lock_products(ARRAY[v_product, v_old.product_id]);
  IF v_id IS NULL OR v_old.product_id <> v_product THEN
    PERFORM oil_assert_product_usable(v_product);
  END IF;

  -- Editing without changing product or unit keeps the conversion used at posting.
  IF v_id IS NOT NULL AND v_old.product_id = v_product AND v_old.unit = p->>'unit' THEN
    v_factor := v_old.base_quantity / v_old.quantity;
  ELSE
    v_factor := oil_unit_factor(v_product, p->>'unit');
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO oil_purchases (product_id, supplier, quantity, unit, base_quantity, unit_price, total_cost, amount_paid,
                               transaction_date, external_ref, notes, attachments, idempotency_key, created_by, updated_by)
    VALUES (v_product, oil_clean(p->>'supplier'), v_qty, p->>'unit', v_qty * v_factor, v_price, v_total, v_paid,
            v_date, oil_clean(p->>'external_ref'), oil_clean(p->>'notes'), v_files, v_key, auth.uid(), auth.uid())
    RETURNING id, reference INTO v_id, v_ref;
  ELSE
    UPDATE oil_purchases
       SET product_id = v_product, supplier = oil_clean(p->>'supplier'), quantity = v_qty, unit = p->>'unit',
           base_quantity = v_qty * v_factor, unit_price = v_price, total_cost = v_total, amount_paid = v_paid,
           transaction_date = v_date, external_ref = oil_clean(p->>'external_ref'), notes = oil_clean(p->>'notes'),
           attachments = v_files, updated_by = auth.uid()
     WHERE id = v_id
     RETURNING reference INTO v_ref;
  END IF;

  PERFORM oil_recalculate_product(v_product);
  IF v_old.product_id IS NOT NULL AND v_old.product_id <> v_product THEN
    PERFORM oil_recalculate_product(v_old.product_id);
  END IF;

  RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', false);
EXCEPTION
  WHEN unique_violation THEN
    IF v_key IS NOT NULL THEN
      SELECT id, reference INTO v_id, v_ref FROM oil_purchases WHERE idempotency_key = v_key;
      IF FOUND THEN
        RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
      END IF;
    END IF;
    RAISE;
END;
$$;


-- ----------------------------------------------------------------------------
-- Sales
-- ----------------------------------------------------------------------------

-- p: { id?, idempotency_key?, product_id, customer, quantity, unit, unit_price, amount_paid?,
--      transaction_date, external_ref?, notes? }
CREATE OR REPLACE FUNCTION public.oil_save_sale(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id       uuid := NULLIF(p->>'id', '')::uuid;
  v_key      uuid := NULLIF(p->>'idempotency_key', '')::uuid;
  v_product  uuid := NULLIF(p->>'product_id', '')::uuid;
  v_qty      numeric := NULLIF(p->>'quantity', '')::numeric;
  v_price    numeric := NULLIF(p->>'unit_price', '')::numeric;
  v_paid     numeric := COALESCE(NULLIF(p->>'amount_paid', '')::numeric, 0);
  v_date     date := NULLIF(p->>'transaction_date', '')::date;
  v_total    numeric;
  v_factor   numeric;
  v_old      oil_sales%ROWTYPE;
  v_ref      text;
BEGIN
  PERFORM oil_assert_owner();

  IF v_id IS NULL AND v_key IS NOT NULL THEN
    SELECT id, reference INTO v_id, v_ref FROM oil_sales WHERE idempotency_key = v_key;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
    END IF;
  END IF;

  IF v_product IS NULL THEN RAISE EXCEPTION 'Choose a product'; END IF;
  IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF v_price IS NULL OR v_price < 0 THEN RAISE EXCEPTION 'Enter a unit price of zero or more'; END IF;
  IF oil_clean(p->>'customer') IS NULL THEN RAISE EXCEPTION 'Enter the customer'; END IF;
  PERFORM oil_assert_date(v_date);

  v_total := round(v_qty * v_price, 2);
  IF v_paid < 0 OR v_paid > v_total THEN
    RAISE EXCEPTION 'Amount paid must be between 0 and the total amount';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_old FROM oil_sales WHERE id = v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found'; END IF;
    IF v_old.status <> 'active' THEN RAISE EXCEPTION 'A voided sale cannot be edited'; END IF;
  END IF;

  PERFORM oil_lock_products(ARRAY[v_product, v_old.product_id]);
  IF v_id IS NULL OR v_old.product_id <> v_product THEN
    PERFORM oil_assert_product_usable(v_product);
  END IF;

  IF v_id IS NOT NULL AND v_old.product_id = v_product AND v_old.unit = p->>'unit' THEN
    v_factor := v_old.base_quantity / v_old.quantity;
  ELSE
    v_factor := oil_unit_factor(v_product, p->>'unit');
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO oil_sales (product_id, customer, quantity, unit, base_quantity, unit_price, total_amount, amount_paid,
                           transaction_date, external_ref, notes, idempotency_key, created_by, updated_by)
    VALUES (v_product, oil_clean(p->>'customer'), v_qty, p->>'unit', v_qty * v_factor, v_price, v_total, v_paid,
            v_date, oil_clean(p->>'external_ref'), oil_clean(p->>'notes'), v_key, auth.uid(), auth.uid())
    RETURNING id, reference INTO v_id, v_ref;
  ELSE
    UPDATE oil_sales
       SET product_id = v_product, customer = oil_clean(p->>'customer'), quantity = v_qty, unit = p->>'unit',
           base_quantity = v_qty * v_factor, unit_price = v_price, total_amount = v_total, amount_paid = v_paid,
           transaction_date = v_date, external_ref = oil_clean(p->>'external_ref'), notes = oil_clean(p->>'notes'),
           updated_by = auth.uid()
     WHERE id = v_id
     RETURNING reference INTO v_ref;
  END IF;

  -- Validates stock on every date and re-prices COGS for this and later sales.
  PERFORM oil_recalculate_product(v_product);
  IF v_old.product_id IS NOT NULL AND v_old.product_id <> v_product THEN
    PERFORM oil_recalculate_product(v_old.product_id);
  END IF;

  RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', false);
EXCEPTION
  WHEN unique_violation THEN
    IF v_key IS NOT NULL THEN
      SELECT id, reference INTO v_id, v_ref FROM oil_sales WHERE idempotency_key = v_key;
      IF FOUND THEN
        RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
      END IF;
    END IF;
    RAISE;
END;
$$;


-- ----------------------------------------------------------------------------
-- Payments (purchases and sales): add a payment without touching stock.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.oil_record_payment(p_kind text, p_id uuid, p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_paid  numeric;
  v_status text;
BEGIN
  PERFORM oil_assert_owner();
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment must be greater than zero';
  END IF;

  IF p_kind = 'sale' THEN
    SELECT total_amount, amount_paid, status INTO v_total, v_paid, v_status FROM oil_sales WHERE id = p_id FOR UPDATE;
  ELSIF p_kind = 'purchase' THEN
    SELECT total_cost, amount_paid, status INTO v_total, v_paid, v_status FROM oil_purchases WHERE id = p_id FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'Unknown record type';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'Payments cannot be added to a voided record'; END IF;
  IF v_paid + p_amount > v_total THEN
    RAISE EXCEPTION 'That is more than the outstanding balance (%)', to_char(v_total - v_paid, 'FM999G999G999G990D00');
  END IF;

  IF p_kind = 'sale' THEN
    UPDATE oil_sales SET amount_paid = amount_paid + p_amount, updated_by = auth.uid() WHERE id = p_id;
  ELSE
    UPDATE oil_purchases SET amount_paid = amount_paid + p_amount, updated_by = auth.uid() WHERE id = p_id;
  END IF;
  RETURN jsonb_build_object('amount_paid', v_paid + p_amount, 'outstanding', v_total - v_paid - p_amount);
END;
$$;


-- ----------------------------------------------------------------------------
-- Stock adjustments (create + void; a correction is voided and re-entered)
-- ----------------------------------------------------------------------------

-- p: { idempotency_key?, product_id, direction: 'increase'|'decrease', quantity (positive), unit,
--      unit_cost? (per `unit`, increases only), adjustment_date, reason }
CREATE OR REPLACE FUNCTION public.oil_save_adjustment(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key     uuid := NULLIF(p->>'idempotency_key', '')::uuid;
  v_product uuid := NULLIF(p->>'product_id', '')::uuid;
  v_qty     numeric := NULLIF(p->>'quantity', '')::numeric;
  v_cost    numeric := NULLIF(p->>'unit_cost', '')::numeric;
  v_date    date := NULLIF(p->>'adjustment_date', '')::date;
  v_sign    integer;
  v_factor  numeric;
  v_id      uuid;
  v_ref     text;
BEGIN
  PERFORM oil_assert_owner();

  IF v_key IS NOT NULL THEN
    SELECT id, reference INTO v_id, v_ref FROM oil_stock_adjustments WHERE idempotency_key = v_key;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
    END IF;
  END IF;

  v_sign := CASE p->>'direction' WHEN 'increase' THEN 1 WHEN 'decrease' THEN -1 END;
  IF v_sign IS NULL THEN RAISE EXCEPTION 'Choose increase or decrease'; END IF;
  IF v_product IS NULL THEN RAISE EXCEPTION 'Choose a product'; END IF;
  IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF v_cost IS NOT NULL AND v_cost < 0 THEN RAISE EXCEPTION 'Unit cost cannot be negative'; END IF;
  IF oil_clean(p->>'reason') IS NULL OR length(oil_clean(p->>'reason')) < 3 THEN
    RAISE EXCEPTION 'Explain the reason for the adjustment';
  END IF;
  PERFORM oil_assert_date(v_date);

  PERFORM oil_lock_products(ARRAY[v_product]);
  PERFORM oil_assert_product_usable(v_product);
  v_factor := oil_unit_factor(v_product, p->>'unit');

  INSERT INTO oil_stock_adjustments (product_id, quantity, unit, base_quantity, unit_cost_base, adjustment_date,
                                     reason, idempotency_key, created_by, updated_by)
  VALUES (v_product, v_sign * v_qty, p->>'unit', v_sign * v_qty * v_factor,
          CASE WHEN v_sign > 0 AND v_cost IS NOT NULL THEN v_cost / v_factor END,
          v_date, oil_clean(p->>'reason'), v_key, auth.uid(), auth.uid())
  RETURNING id, reference INTO v_id, v_ref;

  PERFORM oil_recalculate_product(v_product);
  RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', false);
EXCEPTION
  WHEN unique_violation THEN
    IF v_key IS NOT NULL THEN
      SELECT id, reference INTO v_id, v_ref FROM oil_stock_adjustments WHERE idempotency_key = v_key;
      IF FOUND THEN
        RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
      END IF;
    END IF;
    RAISE;
END;
$$;


-- ----------------------------------------------------------------------------
-- Operating expenses
-- ----------------------------------------------------------------------------

-- p: { id?, idempotency_key?, category, description, amount, expense_date, payee?,
--      product_id?, purchase_id?, sale_id?, external_ref?, notes? }
CREATE OR REPLACE FUNCTION public.oil_save_expense(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id       uuid := NULLIF(p->>'id', '')::uuid;
  v_key      uuid := NULLIF(p->>'idempotency_key', '')::uuid;
  v_amount   numeric := NULLIF(p->>'amount', '')::numeric;
  v_date     date := NULLIF(p->>'expense_date', '')::date;
  v_product  uuid := NULLIF(p->>'product_id', '')::uuid;
  v_purchase uuid := NULLIF(p->>'purchase_id', '')::uuid;
  v_sale     uuid := NULLIF(p->>'sale_id', '')::uuid;
  v_status   text;
  v_ref      text;
BEGIN
  PERFORM oil_assert_owner();

  IF v_id IS NULL AND v_key IS NOT NULL THEN
    SELECT id, reference INTO v_id, v_ref FROM oil_expenses WHERE idempotency_key = v_key;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
    END IF;
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF oil_clean(p->>'description') IS NULL THEN RAISE EXCEPTION 'Describe the expense'; END IF;
  PERFORM oil_assert_date(v_date);
  IF v_purchase IS NOT NULL AND v_sale IS NOT NULL THEN
    RAISE EXCEPTION 'Link the expense to a purchase or a sale, not both';
  END IF;

  -- A linked transaction decides the product.
  IF v_purchase IS NOT NULL THEN
    SELECT product_id INTO v_product FROM oil_purchases WHERE id = v_purchase AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'The linked purchase does not exist or is voided'; END IF;
  ELSIF v_sale IS NOT NULL THEN
    SELECT product_id INTO v_product FROM oil_sales WHERE id = v_sale AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'The linked sale does not exist or is voided'; END IF;
  ELSIF v_product IS NOT NULL AND NOT EXISTS (SELECT 1 FROM oil_products WHERE id = v_product) THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO oil_expenses (category, description, amount, expense_date, payee, product_id, purchase_id, sale_id,
                              external_ref, notes, idempotency_key, created_by, updated_by)
    VALUES (p->>'category', oil_clean(p->>'description'), round(v_amount, 2), v_date, oil_clean(p->>'payee'),
            v_product, v_purchase, v_sale, oil_clean(p->>'external_ref'), oil_clean(p->>'notes'), v_key,
            auth.uid(), auth.uid())
    RETURNING id, reference INTO v_id, v_ref;
  ELSE
    SELECT status INTO v_status FROM oil_expenses WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Expense not found'; END IF;
    IF v_status <> 'active' THEN RAISE EXCEPTION 'A voided expense cannot be edited'; END IF;
    UPDATE oil_expenses
       SET category = p->>'category', description = oil_clean(p->>'description'), amount = round(v_amount, 2),
           expense_date = v_date, payee = oil_clean(p->>'payee'), product_id = v_product,
           purchase_id = v_purchase, sale_id = v_sale, external_ref = oil_clean(p->>'external_ref'),
           notes = oil_clean(p->>'notes'), updated_by = auth.uid()
     WHERE id = v_id
     RETURNING reference INTO v_ref;
  END IF;

  RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', false);
EXCEPTION
  WHEN unique_violation THEN
    IF v_key IS NOT NULL THEN
      SELECT id, reference INTO v_id, v_ref FROM oil_expenses WHERE idempotency_key = v_key;
      IF FOUND THEN
        RETURN jsonb_build_object('id', v_id, 'reference', v_ref, 'duplicate', true);
      END IF;
    END IF;
    RAISE;
END;
$$;


-- ----------------------------------------------------------------------------
-- Void (cancel) any transaction. Stock-moving voids re-run the ledger, so voiding
-- a purchase that later sales depend on is refused with a clear message.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.oil_void_transaction(p_kind text, p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product uuid;
  v_status  text;
BEGIN
  PERFORM oil_assert_owner();
  IF oil_clean(p_reason) IS NULL OR length(oil_clean(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Give a reason for voiding';
  END IF;

  IF p_kind = 'expense' THEN
    UPDATE oil_expenses
       SET status = 'voided', void_reason = oil_clean(p_reason), voided_at = now(), voided_by = auth.uid(), updated_by = auth.uid()
     WHERE id = p_id AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Expense not found or already voided'; END IF;
    RETURN;
  END IF;

  IF p_kind = 'purchase' THEN
    SELECT product_id, status INTO v_product, v_status FROM oil_purchases WHERE id = p_id;
  ELSIF p_kind = 'sale' THEN
    SELECT product_id, status INTO v_product, v_status FROM oil_sales WHERE id = p_id;
  ELSIF p_kind = 'adjustment' THEN
    SELECT product_id, status INTO v_product, v_status FROM oil_stock_adjustments WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Unknown record type';
  END IF;
  IF v_product IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'Already voided'; END IF;

  PERFORM oil_lock_products(ARRAY[v_product]);

  IF p_kind = 'purchase' THEN
    UPDATE oil_purchases SET status = 'voided', void_reason = oil_clean(p_reason), voided_at = now(),
           voided_by = auth.uid(), updated_by = auth.uid() WHERE id = p_id;
  ELSIF p_kind = 'sale' THEN
    UPDATE oil_sales SET status = 'voided', void_reason = oil_clean(p_reason), voided_at = now(),
           voided_by = auth.uid(), updated_by = auth.uid() WHERE id = p_id;
  ELSE
    UPDATE oil_stock_adjustments SET status = 'voided', void_reason = oil_clean(p_reason), voided_at = now(),
           voided_by = auth.uid(), updated_by = auth.uid() WHERE id = p_id;
  END IF;

  PERFORM oil_recalculate_product(v_product);
END;
$$;


-- ----------------------------------------------------------------------------
-- Reporting: all figures computed here, from the ledger and active records.
-- ----------------------------------------------------------------------------

-- Period summary. NULL p_from = from the beginning; NULL p_to = today.
CREATE OR REPLACE FUNCTION public.oil_trade_summary(p_from date, p_to date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from date := COALESCE(p_from, DATE '0001-01-01');
  v_to   date := COALESCE(p_to, oil_today());
  v_products jsonb;
  v_categories jsonb;
  v_totals jsonb;
BEGIN
  PERFORM oil_assert_owner();
  IF v_to < v_from THEN
    RAISE EXCEPTION 'The end date is before the start date';
  END IF;

  WITH prod AS (
    SELECT id, name, code, base_unit, is_active FROM oil_products
  ),
  opening AS (
    SELECT DISTINCT ON (product_id) product_id, balance_quantity AS qty, balance_value AS value
    FROM oil_stock_ledger WHERE movement_date < v_from
    ORDER BY product_id, position DESC
  ),
  closing AS (
    SELECT DISTINCT ON (product_id) product_id, balance_quantity AS qty, balance_value AS value, average_cost
    FROM oil_stock_ledger WHERE movement_date <= v_to
    ORDER BY product_id, position DESC
  ),
  current_stock AS (
    SELECT DISTINCT ON (product_id) product_id, balance_quantity AS qty, balance_value AS value, average_cost
    FROM oil_stock_ledger
    ORDER BY product_id, position DESC
  ),
  purch AS (
    SELECT product_id, count(*) AS n, sum(base_quantity) AS qty, sum(total_cost) AS cost,
           sum(total_cost - amount_paid) AS payable
    FROM oil_purchases WHERE status = 'active' AND transaction_date BETWEEN v_from AND v_to
    GROUP BY product_id
  ),
  sold AS (
    SELECT s.product_id, count(*) AS n, sum(s.base_quantity) AS qty, sum(s.total_amount) AS revenue,
           sum(s.outstanding) AS receivable, sum(-l.value_change) AS cogs
    FROM oil_sales s
    JOIN oil_stock_ledger l ON l.source_id = s.id AND l.movement_type = 'sale'
    WHERE s.status = 'active' AND s.transaction_date BETWEEN v_from AND v_to
    GROUP BY s.product_id
  ),
  adj AS (
    SELECT product_id, sum(quantity_change) AS qty, sum(value_change) AS value
    FROM oil_stock_ledger
    WHERE movement_type = 'adjustment' AND movement_date BETWEEN v_from AND v_to
    GROUP BY product_id
  ),
  exp AS (
    SELECT product_id, sum(amount) AS amount
    FROM oil_expenses WHERE status = 'active' AND expense_date BETWEEN v_from AND v_to AND product_id IS NOT NULL
    GROUP BY product_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'product_id', prod.id,
           'name', prod.name,
           'code', prod.code,
           'base_unit', prod.base_unit,
           'is_active', prod.is_active,
           'opening_quantity', COALESCE(opening.qty, 0),
           'opening_value', COALESCE(opening.value, 0),
           'purchase_count', COALESCE(purch.n, 0),
           'quantity_purchased', COALESCE(purch.qty, 0),
           'purchase_cost', COALESCE(purch.cost, 0),
           'payable', COALESCE(purch.payable, 0),
           'sale_count', COALESCE(sold.n, 0),
           'quantity_sold', COALESCE(sold.qty, 0),
           'revenue', COALESCE(sold.revenue, 0),
           'receivable', COALESCE(sold.receivable, 0),
           'cogs', COALESCE(sold.cogs, 0),
           'gross_profit', COALESCE(sold.revenue, 0) - COALESCE(sold.cogs, 0),
           'adjustment_quantity', COALESCE(adj.qty, 0),
           'adjustment_value', COALESCE(adj.value, 0),
           'direct_expenses', COALESCE(exp.amount, 0),
           'net_profit', COALESCE(sold.revenue, 0) - COALESCE(sold.cogs, 0) - COALESCE(exp.amount, 0) + COALESCE(adj.value, 0),
           'closing_quantity', COALESCE(closing.qty, 0),
           'closing_value', COALESCE(closing.value, 0),
           'available_quantity', COALESCE(current_stock.qty, 0),
           'inventory_value', COALESCE(current_stock.value, 0),
           'average_cost', COALESCE(current_stock.average_cost, 0)
         ) ORDER BY prod.name), '[]'::jsonb)
    INTO v_products
  FROM prod
  LEFT JOIN opening ON opening.product_id = prod.id
  LEFT JOIN closing ON closing.product_id = prod.id
  LEFT JOIN current_stock ON current_stock.product_id = prod.id
  LEFT JOIN purch ON purch.product_id = prod.id
  LEFT JOIN sold ON sold.product_id = prod.id
  LEFT JOIN adj ON adj.product_id = prod.id
  LEFT JOIN exp ON exp.product_id = prod.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('category', category, 'amount', amount, 'count', n) ORDER BY amount DESC), '[]'::jsonb)
    INTO v_categories
  FROM (
    SELECT category, sum(amount) AS amount, count(*) AS n
    FROM oil_expenses WHERE status = 'active' AND expense_date BETWEEN v_from AND v_to
    GROUP BY category
  ) c;

  SELECT jsonb_build_object(
           'revenue', COALESCE(sum((x->>'revenue')::numeric), 0),
           'purchase_cost', COALESCE(sum((x->>'purchase_cost')::numeric), 0),
           'cogs', COALESCE(sum((x->>'cogs')::numeric), 0),
           'gross_profit', COALESCE(sum((x->>'gross_profit')::numeric), 0),
           'adjustments', COALESCE(sum((x->>'adjustment_value')::numeric), 0),
           'receivable', COALESCE(sum((x->>'receivable')::numeric), 0),
           'payable', COALESCE(sum((x->>'payable')::numeric), 0),
           'inventory_value', COALESCE(sum((x->>'inventory_value')::numeric), 0)
         )
    INTO v_totals
  FROM jsonb_array_elements(v_products) x;

  v_totals := v_totals || jsonb_build_object(
    'operating_expenses',
    (SELECT COALESCE(sum(amount), 0) FROM oil_expenses WHERE status = 'active' AND expense_date BETWEEN v_from AND v_to)
  );
  v_totals := v_totals || jsonb_build_object(
    'net_profit',
    (v_totals->>'gross_profit')::numeric - (v_totals->>'operating_expenses')::numeric + (v_totals->>'adjustments')::numeric
  );

  RETURN jsonb_build_object(
    'from', CASE WHEN p_from IS NULL THEN NULL ELSE v_from END,
    'to', v_to,
    'totals', v_totals,
    'products', v_products,
    'expenses_by_category', v_categories
  );
END;
$$;


-- ----------------------------------------------------------------------------
-- Function privileges: authenticated only (each function also checks owner).
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'oil_is_owner()', 'oil_assert_owner()', 'oil_unit_factor(uuid, text)', 'oil_recalculate_product(uuid)',
    'oil_lock_products(uuid[])', 'oil_assert_product_usable(uuid)', 'oil_assert_date(date)',
    'oil_save_product(jsonb)', 'oil_set_product_active(uuid, boolean)', 'oil_save_purchase(jsonb)',
    'oil_save_sale(jsonb)', 'oil_record_payment(text, uuid, numeric)', 'oil_save_adjustment(jsonb)',
    'oil_save_expense(jsonb)', 'oil_void_transaction(text, uuid, text)', 'oil_trade_summary(date, date)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
  END LOOP;

  -- Called by the app:
  FOREACH f IN ARRAY ARRAY[
    'oil_is_owner()', 'oil_save_product(jsonb)', 'oil_set_product_active(uuid, boolean)',
    'oil_save_purchase(jsonb)', 'oil_save_sale(jsonb)', 'oil_record_payment(text, uuid, numeric)',
    'oil_save_adjustment(jsonb)', 'oil_save_expense(jsonb)', 'oil_void_transaction(text, uuid, text)',
    'oil_trade_summary(date, date)'
  ] LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;

  -- Internal helpers (recalculate, lock, factor, asserts) are not callable by app users.
  FOREACH f IN ARRAY ARRAY[
    'oil_assert_owner()', 'oil_unit_factor(uuid, text)', 'oil_recalculate_product(uuid)',
    'oil_lock_products(uuid[])', 'oil_assert_product_usable(uuid)', 'oil_assert_date(date)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM authenticated', f);
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- Attachments: private Storage bucket, owners only.
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('oil-trade-attachments', 'oil-trade-attachments', false, 10485760,
        ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owners read oil trade attachments" ON storage.objects;
CREATE POLICY "Owners read oil trade attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'oil-trade-attachments' AND public.oil_is_owner());

DROP POLICY IF EXISTS "Owners upload oil trade attachments" ON storage.objects;
CREATE POLICY "Owners upload oil trade attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'oil-trade-attachments' AND public.oil_is_owner());

DROP POLICY IF EXISTS "Owners delete oil trade attachments" ON storage.objects;
CREATE POLICY "Owners delete oil trade attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'oil-trade-attachments' AND public.oil_is_owner());


-- ----------------------------------------------------------------------------
-- Initial products (base units only; add conversions in the app)
-- ----------------------------------------------------------------------------

INSERT INTO public.oil_products (name, code, base_unit, description) VALUES
  ('Crude Oil',            'CRUDE', 'barrel',       NULL),
  ('Diesel (AGO)',         'AGO',   'litre',        'Automotive gas oil'),
  ('Petrol (PMS)',         'PMS',   'litre',        'Premium motor spirit'),
  ('Kerosene (DPK)',       'DPK',   'litre',        'Dual purpose kerosene'),
  ('Aviation Fuel (ATK)',  'ATK',   'litre',        'Aviation turbine kerosene'),
  ('LPG',                  'LPG',   'metric_tonne', 'Liquefied petroleum gas')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- VERIFY (read-only)
-- ============================================================================
--   -- 6 products
--   SELECT code, name, base_unit, is_active FROM public.oil_products ORDER BY name;
--
--   -- RLS on all 7 tables
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname LIKE 'oil\_%' AND relkind = 'r' ORDER BY relname;
--
--   -- anon has no access; authenticated has SELECT only
--   SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type)
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name LIKE 'oil\_%' AND grantee IN ('anon', 'authenticated')
--   GROUP BY 1, 2 ORDER BY 1, 2;
--
--   -- anon cannot execute any oil_* function (expect all false)
--   SELECT p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname LIKE 'oil\_%' ORDER BY 1;
