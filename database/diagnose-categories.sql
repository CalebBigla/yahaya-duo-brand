-- Finance Categories Diagnostic
-- Run this in Supabase SQL Editor to check categories

-- 1. Check if categories table exists and has data
SELECT COUNT(*) as category_count FROM financial_categories;

-- 2. Check income categories specifically
SELECT 
    type,
    division,
    name,
    is_active
FROM financial_categories
WHERE type = 'income'
ORDER BY division, display_order;

-- 3. Check RLS policies on financial_categories
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'financial_categories';

-- 4. Test if current user can read categories
SELECT * FROM financial_categories WHERE type = 'income' LIMIT 5;

-- If you see "permission denied" or no results, run this:
-- (This grants read access to authenticated users - temporary for debugging)
-- DROP POLICY IF EXISTS "Owners can read financial_categories" ON financial_categories;
-- CREATE POLICY "Owners can read financial_categories" 
--   ON financial_categories FOR SELECT 
--   TO authenticated 
--   USING (true);  -- Temporarily allow all authenticated users

-- After fixing, revert to owner-only:
-- DROP POLICY IF EXISTS "Owners can read financial_categories" ON financial_categories;
-- CREATE POLICY "Owners can read financial_categories" 
--   ON financial_categories FOR SELECT 
--   TO authenticated 
--   USING (
--     EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'owner')
--   );
