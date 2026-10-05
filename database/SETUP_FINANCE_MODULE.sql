-- ============================================================================
-- YAHAYA TRAVEL & TRADE - FINANCE MODULE SETUP
-- ============================================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- This will create all tables, functions, triggers, and seed data
-- ============================================================================

-- ============================================================================
-- TABLE: financial_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade', 'company')),
    name TEXT NOT NULL CHECK (LENGTH(name) <= 100 AND LENGTH(name) > 0),
    description TEXT CHECK (LENGTH(description) <= 500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(type, division, name)
);

CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type);
CREATE INDEX IF NOT EXISTS idx_financial_categories_division ON financial_categories(division);
CREATE INDEX IF NOT EXISTS idx_financial_categories_active ON financial_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_financial_categories_lookup ON financial_categories(type, division, is_active);

-- ============================================================================
-- TABLE: financial_transactions (Income)
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref TEXT NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade', 'company')),
    category_id UUID NOT NULL REFERENCES financial_categories(id),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    enquiry_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'pos', 'online', 'other')),
    external_ref TEXT CHECK (LENGTH(external_ref) <= 200),
    description TEXT NOT NULL CHECK (LENGTH(description) <= 500 AND LENGTH(description) > 0),
    notes TEXT CHECK (LENGTH(notes) <= 2000),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_ref ON financial_transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_division ON financial_transactions(division);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client ON financial_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_quote ON financial_transactions(quote_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date DESC);

-- ============================================================================
-- TABLE: expense_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_ref TEXT NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade', 'company')),
    category_id UUID NOT NULL REFERENCES financial_categories(id),
    vendor_name TEXT NOT NULL CHECK (LENGTH(vendor_name) <= 200 AND LENGTH(vendor_name) > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'pos', 'online', 'other')),
    external_ref TEXT CHECK (LENGTH(external_ref) <= 200),
    receipt_url TEXT CHECK (LENGTH(receipt_url) <= 500),
    description TEXT NOT NULL CHECK (LENGTH(description) <= 500 AND LENGTH(description) > 0),
    notes TEXT CHECK (LENGTH(notes) <= 2000),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_transactions_ref ON expense_transactions(expense_ref);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_division ON expense_transactions(division);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_category ON expense_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_vendor ON expense_transactions(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_date ON expense_transactions(expense_date DESC);

-- ============================================================================
-- FUNCTIONS: Auto-generate transaction references (TRIGGER FUNCTIONS)
-- ============================================================================

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS generate_income_ref();
DROP FUNCTION IF EXISTS generate_expense_ref();

-- Income reference generator
CREATE OR REPLACE FUNCTION generate_income_ref()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_ref TEXT;
BEGIN
    IF NEW.transaction_ref IS NULL OR NEW.transaction_ref = '' THEN
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(transaction_ref FROM 'INC-([0-9]+)') AS INTEGER)), 
            0
        ) + 1
        INTO next_num 
        FROM financial_transactions 
        WHERE transaction_ref LIKE 'INC-%';
        
        new_ref := 'INC-' || LPAD(next_num::TEXT, 4, '0');
        NEW.transaction_ref := new_ref;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Expense reference generator
CREATE OR REPLACE FUNCTION generate_expense_ref()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_ref TEXT;
BEGIN
    IF NEW.expense_ref IS NULL OR NEW.expense_ref = '' THEN
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(expense_ref FROM 'EXP-([0-9]+)') AS INTEGER)), 
            0
        ) + 1
        INTO next_num 
        FROM expense_transactions 
        WHERE expense_ref LIKE 'EXP-%';
        
        new_ref := 'EXP-' || LPAD(next_num::TEXT, 4, '0');
        NEW.expense_ref := new_ref;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_income_ref ON financial_transactions;
DROP TRIGGER IF EXISTS set_expense_ref ON expense_transactions;
DROP TRIGGER IF EXISTS update_financial_categories_updated_at ON financial_categories;
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
DROP TRIGGER IF EXISTS update_expense_transactions_updated_at ON expense_transactions;
DROP TRIGGER IF EXISTS audit_financial_categories_trigger ON financial_categories;
DROP TRIGGER IF EXISTS audit_financial_transactions_trigger ON financial_transactions;
DROP TRIGGER IF EXISTS audit_expense_transactions_trigger ON expense_transactions;

-- Auto-generate refs
CREATE TRIGGER set_income_ref 
    BEFORE INSERT ON financial_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION generate_income_ref();

CREATE TRIGGER set_expense_ref 
    BEFORE INSERT ON expense_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION generate_expense_ref();

-- Auto-update timestamps (uses existing function from your schema)
CREATE TRIGGER update_financial_categories_updated_at 
    BEFORE UPDATE ON financial_categories
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at 
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_transactions_updated_at 
    BEFORE UPDATE ON expense_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Audit logging (uses existing function from your schema)
CREATE TRIGGER audit_financial_categories_trigger
    AFTER INSERT OR UPDATE OR DELETE ON financial_categories
    FOR EACH ROW 
    EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_financial_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_expense_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expense_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION audit_content_changes();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can read financial_categories" ON financial_categories;
DROP POLICY IF EXISTS "Owners can insert financial_categories" ON financial_categories;
DROP POLICY IF EXISTS "Owners can update financial_categories" ON financial_categories;
DROP POLICY IF EXISTS "Owners can delete financial_categories" ON financial_categories;
DROP POLICY IF EXISTS "Owners can read financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Owners can insert financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Owners can update financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Owners can read expense_transactions" ON expense_transactions;
DROP POLICY IF EXISTS "Owners can insert expense_transactions" ON expense_transactions;
DROP POLICY IF EXISTS "Owners can update expense_transactions" ON expense_transactions;

-- Categories: Owner read/write
CREATE POLICY "Owners can read financial_categories" 
    ON financial_categories FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can insert financial_categories" 
    ON financial_categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can update financial_categories" 
    ON financial_categories FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can delete financial_categories" 
    ON financial_categories FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

-- Income: Owner read/write only
CREATE POLICY "Owners can read financial_transactions" 
    ON financial_transactions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can insert financial_transactions" 
    ON financial_transactions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can update financial_transactions" 
    ON financial_transactions FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

-- Expenses: Owner read/write only
CREATE POLICY "Owners can read expense_transactions" 
    ON expense_transactions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can insert expense_transactions" 
    ON expense_transactions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can update expense_transactions" 
    ON expense_transactions FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

-- ============================================================================
-- SEED DATA: Default Categories
-- ============================================================================

-- Clear existing categories first (optional - only if you want fresh data)
-- DELETE FROM financial_categories;

-- Travel Income Categories
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('income', 'travel', 'Visa Processing', 'Visa application and processing services', 1),
('income', 'travel', 'Flight Booking', 'Airline ticket booking and reservations', 2),
('income', 'travel', 'Hotel Reservation', 'Hotel and accommodation bookings', 3),
('income', 'travel', 'Tour Packages', 'Complete tour and travel packages', 4),
('income', 'travel', 'Student Travel Services', 'Student visa and travel assistance', 5),
('income', 'travel', 'Event & Group Travel', 'Group bookings and event travel', 6),
('income', 'travel', 'Other Travel Services', 'Other travel-related income', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Trade Income Categories
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('income', 'trade', 'Sourcing & Procurement', 'Product sourcing and procurement services', 1),
('income', 'trade', 'General Trading', 'General merchandise trading', 2),
('income', 'trade', 'Export Services', 'Export facilitation and services', 3),
('income', 'trade', 'Import Services', 'Import facilitation and services', 4),
('income', 'trade', 'Trade Consultancy', 'Trade advisory and consulting', 5),
('income', 'trade', 'Other Trade Services', 'Other trade-related income', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Travel Expense Categories
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('expense', 'travel', 'Visa Processing Costs', 'Embassy fees, visa processing', 1),
('expense', 'travel', 'Flight & Airline Costs', 'Ticket purchases, airline payments', 2),
('expense', 'travel', 'Hotel & Accommodation', 'Hotel payments, accommodation', 3),
('expense', 'travel', 'Tour Operations', 'Tour guide fees, activity costs', 4),
('expense', 'travel', 'Transportation', 'Local transport, vehicle rentals', 5),
('expense', 'travel', 'Other Travel Expenses', 'Other travel-related expenses', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Trade Expense Categories
INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
('expense', 'trade', 'Product Procurement', 'Supplier payments, product purchases', 1),
('expense', 'trade', 'Logistics & Shipping', 'Freight, shipping, delivery', 2),
('expense', 'trade', 'Customs & Duties', 'Import/export duties, customs', 3),
('expense', 'trade', 'Supplier Payments', 'Vendor and supplier payments', 4),
('expense', 'trade', 'Other Trade Expenses', 'Other trade-related expenses', 99)
ON CONFLICT (type, division, name) DO NOTHING;

-- Company Expense Categories
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Finance Module Setup Complete!' as status;
SELECT 'Total Categories Created: ' || COUNT(*) as result FROM financial_categories;
SELECT 'Income Categories: ' || COUNT(*) as result FROM financial_categories WHERE type = 'income';
SELECT 'Expense Categories: ' || COUNT(*) as result FROM financial_categories WHERE type = 'expense';

-- ============================================================================
-- NEXT STEP: Ensure you are registered as owner
-- ============================================================================
-- Check your user role (run this separately):
-- SELECT user_id, role FROM admin_users WHERE user_id = auth.uid();

-- If not registered or role is 'editor', register as owner:
-- First get your user_id:
-- SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

-- Then insert/update as owner:
-- INSERT INTO admin_users (user_id, role)
-- VALUES ('YOUR_USER_ID_HERE', 'owner')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
