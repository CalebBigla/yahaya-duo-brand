-- ============================================================================
-- DIAGNOSTIC: Check Quote Response Permissions
-- ============================================================================
-- Run this in your Supabase SQL Editor to diagnose permission issues
-- ============================================================================

-- 1. Check if validate_quote_token function exists and has correct permissions
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END AS volatility,
    p.prosecdef AS is_security_definer,
    array_to_string(p.proacl, ', ') AS permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'validate_quote_token';

-- 2. Check grants on validate_quote_token for anon role
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'validate_quote_token'
  AND grantee IN ('anon', 'authenticated', 'public');

-- 3. Check quote_responses table permissions
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'quote_responses'
  AND grantee IN ('anon', 'authenticated', 'public');

-- 4. Check RLS policies on quote_responses
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quote_responses';

-- 5. Check if RLS is enabled on quote_responses
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'quote_responses';

-- 6. Check quotes table permissions (needed for status update)
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'quotes'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY privilege_type;

-- 7. Check RLS policies on quotes table
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'quotes'
ORDER BY cmd;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 1. validate_quote_token should have is_security_definer = TRUE
-- 2. Should show EXECUTE grant for 'anon' role
-- 3. Should show INSERT grant for 'anon' on quote_responses
-- 4. Should show "Public insert access to quote_responses" policy
-- 5. RLS should be enabled (TRUE)
-- 6. Should show UPDATE grant for 'anon' on quotes
-- 7. Should show policy allowing status updates
-- ============================================================================
