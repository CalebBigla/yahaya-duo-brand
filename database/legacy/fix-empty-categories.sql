-- ============================================================================
-- FIX EMPTY CATEGORIES DROPDOWN - DIAGNOSTIC AND REPAIR
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose and fix the issue

-- STEP 1: Check if categories exist
-- ============================================================================
SELECT 'STEP 1: Checking if categories exist...' as status;
SELECT COUNT(*) as total_categories FROM financial_categories;

-- STEP 2: Check your user role
-- ============================================================================
SELECT 'STEP 2: Checking your admin user role...' as status;
SELECT 
    user_id, 
    role,
    created_at 
FROM admin_users 
WHERE user_id = auth.uid();

-- If the above returns nothing, you're not registered as an admin user!

-- STEP 3: Check RLS policies
-- ============================================================================
SELECT 'STEP 3: Checking RLS policies...' as status;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'financial_categories';

-- ============================================================================
-- FIXES
-- ============================================================================

-- FIX A: If no categories exist, seed them
-- ============================================================================
-- Only run this if STEP 1 showed 0 categories

INSERT INTO financial_categories (type, division, name, description, display_order) VALUES
-- Travel Division Income
('income', 'Travel', 'Hotel Booking', 'Revenue from hotel bookings and reservations', 1),
('income', 'Travel', 'Flight Booking', 'Revenue from flight ticket bookings', 2),
('income', 'Travel', 'Visa Processing', 'Revenue from visa application and processing services', 3),
('income', 'Travel', 'Travel Insurance', 'Revenue from travel insurance sales', 4),
('income', 'Travel', 'Tour Package', 'Revenue from tour and vacation packages', 5),
('income', 'Travel', 'Airport Transfer', 'Revenue from airport pickup and transfer services', 6),
('income', 'Travel', 'Travel Consultation', 'Revenue from travel planning and consultation fees', 7),

-- Trade Division Income
('income', 'Trade', 'Product Sales', 'Revenue from merchandise and product sales', 1),
('income', 'Trade', 'Import Commission', 'Commission earned from import transactions', 2),
('income', 'Trade', 'Export Commission', 'Commission earned from export transactions', 3),
('income', 'Trade', 'Sourcing Fee', 'Fees for product sourcing services', 4),
('income', 'Trade', 'Logistics Fee', 'Fees for trade logistics coordination', 5),
('income', 'Trade', 'Consultation Fee', 'Revenue from trade advisory services', 6),

-- Travel Division Expenses
('expense', 'Travel', 'Supplier Payment', 'Payments to hotels, airlines, and travel suppliers', 1),
('expense', 'Travel', 'Commission Payment', 'Commission paid to agents and partners', 2),
('expense', 'Travel', 'Insurance Premium', 'Insurance premium payments', 3),
('expense', 'Travel', 'Marketing', 'Marketing and advertising expenses for travel services', 4),
('expense', 'Travel', 'Visa Fees', 'Official visa processing fees paid to embassies', 5),
('expense', 'Travel', 'Customer Refund', 'Refunds issued to customers', 6),

-- Trade Division Expenses
('expense', 'Trade', 'Purchase Cost', 'Cost of goods and products purchased', 1),
('expense', 'Trade', 'Shipping Cost', 'International and domestic shipping expenses', 2),
('expense', 'Trade', 'Customs Duty', 'Import/export duties and customs fees', 3),
('expense', 'Trade', 'Supplier Payment', 'Payments to suppliers and vendors', 4),
('expense', 'Trade', 'Marketing', 'Marketing and advertising expenses for trade services', 5),

-- Company Expenses (shared across both divisions)
('expense', 'Company', 'Salary', 'Employee salaries and wages', 1),
('expense', 'Company', 'Office Rent', 'Monthly office rental expenses', 2),
('expense', 'Company', 'Utilities', 'Electricity, water, internet, and utilities', 3),
('expense', 'Company', 'Office Supplies', 'Stationery and office supply expenses', 4),
('expense', 'Company', 'Software Subscription', 'Software licenses and SaaS subscriptions', 5),
('expense', 'Company', 'Professional Fees', 'Legal, accounting, and consulting fees', 6),
('expense', 'Company', 'Bank Charges', 'Bank fees and transaction charges', 7),
('expense', 'Company', 'Equipment', 'Office equipment and furniture purchases', 8),
('expense', 'Company', 'Training', 'Employee training and development expenses', 9),
('expense', 'Company', 'Miscellaneous', 'Other general business expenses', 10)
ON CONFLICT DO NOTHING;

SELECT 'Categories seeded! Count: ' || COUNT(*) as result FROM financial_categories;

-- FIX B: If your user is not an admin, register as owner
-- ============================================================================
-- WARNING: Only run this if STEP 2 showed no results!
-- Replace 'your-email@example.com' with your actual login email

-- First, find your user ID:
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- REPLACE THIS!

-- Then insert as owner (use the user_id from above):
-- INSERT INTO admin_users (user_id, role)
-- VALUES ('USER_ID_FROM_ABOVE', 'owner')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- FIX C: Temporarily allow all authenticated users to read categories
-- ============================================================================
-- This is a temporary fix for testing. Use only if you can't resolve the issue above.

-- DROP POLICY IF EXISTS "Owners can read financial_categories" ON financial_categories;
-- CREATE POLICY "Owners can read financial_categories" 
--   ON financial_categories FOR SELECT 
--   TO authenticated 
--   USING (true);  -- Allows all authenticated users temporarily

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'VERIFICATION: Testing category read access...' as status;
SELECT 
    id,
    type,
    division,
    name
FROM financial_categories
WHERE type = 'income'
ORDER BY division, display_order
LIMIT 5;

-- If you see results above, the fix worked! 
-- Test the dropdown in your Finance admin page.
