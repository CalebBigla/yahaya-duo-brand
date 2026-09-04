-- Diagnostic SQL Script
-- Run this to check the current state of your admin dashboard schema

-- 1. Check if tables exist
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename IN ('content_blocks', 'submissions', 'admin_users', 'audit_log', 'rate_limit_log')
ORDER BY tablename;

-- 2. Check admin_users structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- 3. Check if your user exists in admin_users
SELECT * 
FROM admin_users 
WHERE user_id = '50e06d97-0413-4351-b14b-50ddeacdcb70';

-- 4. List all triggers on admin_users
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'admin_users';

-- 5. Check the audit_content_changes function definition
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'audit_content_changes';

-- 6. Check RLS policies on admin_users
SELECT 
    polname as policy_name,
    polcmd as command,
    polpermissive as permissive,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'admin_users'::regclass;

-- 7. Test direct SELECT (this should work if RLS policies are correct)
-- Note: This runs as the database owner, not the authenticated user
SELECT * FROM admin_users;

-- 8. Check if there are any errors in PostgreSQL logs (if you have access)
-- This would need superuser access, typically not available in Supabase

