-- ============================================================================
-- Yahaya Travel & Trade Co. Ltd - Finance & Expenses Module
-- Database Schema
-- ============================================================================
-- Version: 1.0
-- Date: 2026-10-05
-- Description: Financial transaction tracking (income & expenses) with
--              dynamic category management
-- Currency: NGN only
-- ============================================================================

-- ============================================================================
-- TABLE: financial_categories
-- Dynamic income and expense category management
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Category Type
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    
    -- Division
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade', 'company')),
    
    -- Category Details
    name TEXT NOT NULL CHECK (LENGTH(name) <= 100 AND LENGTH(name) > 0),
    description TEXT CHECK (LENGTH(description) <= 500),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one category name per type+division
    UNIQUE(type, division, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type);
CREATE INDEX IF NOT EXISTS idx_financial_categories_division ON financial_categories(division);
CREATE INDEX IF NOT EXISTS idx_financial_categories_active ON financial_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_financial_categories_lookup ON financial_categories(type, division, is_active);

-- ============================================================================
-- TABLE: financial_transactions (Income)
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction Reference (auto-generated: INC-0001, INC-0002, ...)
    transaction_ref TEXT NOT NULL UNIQUE,
    
    -- Amount (NGN only)
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    
    -- Division & Category
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade', 'company')),
    category_id UUID NOT NULL REFERENCES financial_categories(id),
    
    -- Relationships (all optional)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    enquiry_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    
    -- Payment Details
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'pos', 'online', 'other')),
    external_ref TEXT CHECK (LENGTH(external_ref) <= 200),
    
    -- Description & Notes
    description TEXT NOT NULL CHECK (LENGTH(description) <= 500 AND LENGTH(description) > 0),
    notes TEXT CHECK (LENGTH(notes) <= 2000),
    
    -- Transaction Date
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Voiding preserves the record while excluding it from revenue totals.
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES auth.users(id),
    void_reason TEXT CHECK (void_reason IS NULL OR LENGTH(void_reason) <= 1000),
    CONSTRAINT financial_transactions_void_metadata_check CHECK (
        (status = 'active' AND voided_at IS NULL AND voided_by IS NULL)
        OR (status = 'voided' AND voided_at IS NOT NULL AND voided_by IS NOT NULL)
    ),
    
    -- Audit
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_ref ON financial_transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_division ON financial_transactions(division);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client ON financial_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_quote ON financial_transactions(quote_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status_date ON financial_transactions(status, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_description ON financial_transactions USING gin(to_tsvector('english', description));

-- ============================================================================
-- TABLE: expense_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Expense Reference (auto-generated: EXP-0001, EXP-0002, ...)
    expense_ref TEXT NOT NULL UNIQUE,
    
    -- Amount (NGN only)
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    
    -- Division & Category
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade', 'company')),
    category_id UUID NOT NULL REFERENCES financial_categories(id),
    
    -- Vendor
    vendor_name TEXT NOT NULL CHECK (LENGTH(vendor_name) <= 200 AND LENGTH(vendor_name) > 0),
    
    -- Payment Details
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'pos', 'online', 'other')),
    external_ref TEXT CHECK (LENGTH(external_ref) <= 200),
    receipt_url TEXT CHECK (LENGTH(receipt_url) <= 500),
    
    -- Description & Notes
    description TEXT NOT NULL CHECK (LENGTH(description) <= 500 AND LENGTH(description) > 0),
    notes TEXT CHECK (LENGTH(notes) <= 2000),
    
    -- Expense Date
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_transactions_ref ON expense_transactions(expense_ref);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_division ON expense_transactions(division);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_category ON expense_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_vendor ON expense_transactions(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_date ON expense_transactions(expense_date DESC);

-- ============================================================================
-- FUNCTIONS: Auto-generate references
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_income_ref()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_ref FROM 'INC-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_num FROM financial_transactions WHERE transaction_ref LIKE 'INC-%';
    RETURN 'INC-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_expense_ref()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(expense_ref FROM 'EXP-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_num FROM expense_transactions WHERE expense_ref LIKE 'EXP-%';
    RETURN 'EXP-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate refs
CREATE TRIGGER set_income_ref BEFORE INSERT ON financial_transactions
    FOR EACH ROW WHEN (NEW.transaction_ref IS NULL OR NEW.transaction_ref = '')
    EXECUTE FUNCTION generate_income_ref();

CREATE TRIGGER set_expense_ref BEFORE INSERT ON expense_transactions
    FOR EACH ROW WHEN (NEW.expense_ref IS NULL OR NEW.expense_ref = '')
    EXECUTE FUNCTION generate_expense_ref();

-- Auto-update timestamps (reuse existing function)
CREATE TRIGGER update_financial_categories_updated_at BEFORE UPDATE ON financial_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_transactions_updated_at BEFORE UPDATE ON expense_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging (reuse existing function)
CREATE TRIGGER audit_financial_categories_trigger
    AFTER INSERT OR UPDATE OR DELETE ON financial_categories
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_financial_transactions_trigger
    AFTER INSERT OR UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_expense_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expense_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;

-- Categories: Owner read/write
CREATE POLICY "Owners can read financial_categories" ON financial_categories FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can insert financial_categories" ON financial_categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can update financial_categories" ON financial_categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can delete financial_categories" ON financial_categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

-- Income: Owner read/write only
CREATE POLICY "Owners can read financial_transactions" ON financial_transactions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can insert financial_transactions" ON financial_transactions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can update financial_transactions" ON financial_transactions FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

REVOKE DELETE ON TABLE financial_transactions FROM PUBLIC, anon, authenticated;

-- Expenses: Owner read/write only
CREATE POLICY "Owners can read expense_transactions" ON expense_transactions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can insert expense_transactions" ON expense_transactions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can update expense_transactions" ON expense_transactions FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can delete expense_transactions" ON expense_transactions FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner'));

-- ============================================================================
-- SEED DATA: Default categories
-- ============================================================================

-- Travel Income
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('income', 'travel', 'Visa Processing', 'Visa application and processing services', 1),
('income', 'travel', 'Flight Booking', 'Airline ticket booking and reservations', 2),
('income', 'travel', 'Hotel Reservation', 'Hotel and accommodation bookings', 3),
('income', 'travel', 'Tour Packages', 'Complete tour and travel packages', 4),
('income', 'travel', 'Student Travel Services', 'Student visa and travel assistance', 5),
('income', 'travel', 'Event & Group Travel', 'Group bookings and event travel', 6),
('income', 'travel', 'Other Travel Services', 'Other travel-related income', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Trade Income
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('income', 'trade', 'Sourcing & Procurement', 'Product sourcing and procurement services', 1),
('income', 'trade', 'General Trading', 'General merchandise trading', 2),
('income', 'trade', 'Export Services', 'Export facilitation and services', 3),
('income', 'trade', 'Import Services', 'Import facilitation and services', 4),
('income', 'trade', 'Trade Consultancy', 'Trade advisory and consulting', 5),
('income', 'trade', 'Other Trade Services', 'Other trade-related income', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Travel Expenses
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('expense', 'travel', 'Visa Processing Costs', 'Embassy fees, visa processing', 1),
('expense', 'travel', 'Flight & Airline Costs', 'Ticket purchases, airline payments', 2),
('expense', 'travel', 'Hotel & Accommodation', 'Hotel payments, accommodation', 3),
('expense', 'travel', 'Tour Operations', 'Tour guide fees, activity costs', 4),
('expense', 'travel', 'Transportation', 'Local transport, vehicle rentals', 5),
('expense', 'travel', 'Other Travel Expenses', 'Other travel-related expenses', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Trade Expenses
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('expense', 'trade', 'Product Procurement', 'Supplier payments, product purchases', 1),
('expense', 'trade', 'Logistics & Shipping', 'Freight, shipping, delivery', 2),
('expense', 'trade', 'Customs & Duties', 'Import/export duties, customs', 3),
('expense', 'trade', 'Supplier Payments', 'Vendor and supplier payments', 4),
('expense', 'trade', 'Other Trade Expenses', 'Other trade-related expenses', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Company Expenses
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('expense', 'company', 'Salaries & Wages', 'Staff salaries, wages, bonuses', 1),
('expense', 'company', 'Office Rent', 'Office space rental payments', 2),
('expense', 'company', 'Utilities', 'Electricity, water, internet', 3),
('expense', 'company', 'Marketing & Advertising', 'Marketing campaigns, ads', 4),
('expense', 'company', 'Software & Subscriptions', 'SaaS tools, software licenses', 5),
('expense', 'company', 'Office Supplies', 'Stationery, equipment, supplies', 6),
('expense', 'company', 'Professional Services', 'Legal, accounting, consulting', 7),
('expense', 'company', 'Bank Charges & Fees', 'Transaction fees, bank charges', 8),
('expense', 'company', 'Transportation & Fuel', 'Company vehicles, fuel', 9),
('expense', 'company', 'Other Company Expenses', 'Miscellaneous company expenses', 99)
ON CONFLICT (type, division, name) DO NOTHING;

