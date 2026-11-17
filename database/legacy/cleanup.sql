-- Cleanup Script - Run this FIRST to remove any existing admin dashboard schema
-- This is safe to run - it only drops admin dashboard tables, not your existing data

-- Drop all policies first (to avoid dependency issues)
DROP POLICY IF EXISTS "Public read access to content_blocks" ON content_blocks;
DROP POLICY IF EXISTS "Admin insert access to content_blocks" ON content_blocks;
DROP POLICY IF EXISTS "Admin update access to content_blocks" ON content_blocks;
DROP POLICY IF EXISTS "Admin delete access to content_blocks" ON content_blocks;

DROP POLICY IF EXISTS "Public insert access to submissions" ON submissions;
DROP POLICY IF EXISTS "Admin read access to submissions" ON submissions;
DROP POLICY IF EXISTS "Admin update access to submissions" ON submissions;

DROP POLICY IF EXISTS "Users can read own admin_users record" ON admin_users;
DROP POLICY IF EXISTS "Owners can read all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Owners can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Owners can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Owners can delete admin_users" ON admin_users;

DROP POLICY IF EXISTS "Owners can read audit_log" ON audit_log;
DROP POLICY IF EXISTS "Public insert to rate_limit_log" ON rate_limit_log;

-- Drop triggers
DROP TRIGGER IF EXISTS audit_content_blocks_trigger ON content_blocks;
DROP TRIGGER IF EXISTS audit_submissions_trigger ON submissions;
DROP TRIGGER IF EXISTS audit_admin_users_trigger ON admin_users;
DROP TRIGGER IF EXISTS update_content_blocks_updated_at ON content_blocks;

-- Drop functions (with CASCADE to remove dependent triggers)
DROP FUNCTION IF EXISTS audit_content_changes() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_rate_limits() CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS rate_limit_log CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS content_blocks CASCADE;

-- Success message
SELECT 'All admin dashboard tables and policies have been dropped. You can now run schema.sql' as status;
