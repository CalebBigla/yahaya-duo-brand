-- Fix for generate_income_ref and generate_expense_ref functions
-- These need to be TRIGGER functions, not TEXT functions

-- Drop the incorrect functions
DROP FUNCTION IF EXISTS generate_income_ref();
DROP FUNCTION IF EXISTS generate_expense_ref();

-- Create correct TRIGGER functions
CREATE OR REPLACE FUNCTION generate_income_ref()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_ref TEXT;
BEGIN
    -- Only generate if ref is not provided
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

CREATE OR REPLACE FUNCTION generate_expense_ref()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_ref TEXT;
BEGIN
    -- Only generate if ref is not provided
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
