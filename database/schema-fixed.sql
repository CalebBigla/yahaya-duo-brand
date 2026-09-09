-- Yahaya Travel and Trade Co Ltd - Admin Dashboard Database Schema
-- FIXED VERSION - Removes recursive RLS policies on admin_users

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: content_blocks
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page TEXT NOT NULL CHECK (page IN ('home', 'travel', 'trade', 'about', 'contact')),
    section_key TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE (page, section_key)
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON content_blocks(page);
CREATE INDEX IF NOT EXISTS idx_content_blocks_section_key ON content_blocks(page, section_key);

-- ============================================================================
-- TABLE: submissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type TEXT NOT NULL CHECK (form_type IN ('travel', 'trade', 'contact')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    division TEXT,
    destination TEXT,
    dates TEXT,
    service TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash TEXT,
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR LENGTH(phone) >= 10),
    CONSTRAINT valid_message_length CHECK (LENGTH(message) <= 5000)
);

CREATE INDEX IF NOT EXISTS idx_submissions_form_type ON submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_ip_hash ON submissions(ip_hash);

-- ============================================================================
-- TABLE: admin_users
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'owner')),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ============================================================================
-- TABLE: audit_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_table, target_id);

-- ============================================================================
-- TABLE: rate_limit_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash TEXT NOT NULL,
    form_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup ON rate_limit_log(ip_hash, form_type, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY - FIXED POLICIES
-- ============================================================================

ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: content_blocks
-- ============================================================================

CREATE POLICY "Public read access to content_blocks"
    ON content_blocks FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admin insert access to content_blocks"
    ON content_blocks FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admin_users)
    );

CREATE POLICY "Admin update access to content_blocks"
    ON content_blocks FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (SELECT user_id FROM admin_users)
    )
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admin_users)
    );

CREATE POLICY "Admin delete access to content_blocks"
    ON content_blocks FOR DELETE
    TO authenticated
    USING (
        auth.uid() IN (SELECT user_id FROM admin_users)
    );

-- ============================================================================
-- POLICIES: submissions
-- ============================================================================

CREATE POLICY "Public insert access to submissions"
    ON submissions FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Admin read access to submissions"
    ON submissions FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (SELECT user_id FROM admin_users)
    );

CREATE POLICY "Admin update access to submissions"
    ON submissions FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (SELECT user_id FROM admin_users)
    )
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admin_users)
    );

-- ============================================================================
-- POLICIES: admin_users (SIMPLIFIED - NO RECURSION)
-- ============================================================================

-- Allow authenticated users to read their own record
CREATE POLICY "Users can read own admin_users record"
    ON admin_users FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Only allow SELECT for other operations - manage via direct SQL
-- This prevents recursion while still protecting the table
CREATE POLICY "Prevent unauthorized modifications"
    ON admin_users FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- ============================================================================
-- POLICIES: audit_log
-- ============================================================================

CREATE POLICY "Admins can read audit_log"
    ON audit_log FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (SELECT user_id FROM admin_users WHERE role = 'owner')
    );

-- ============================================================================
-- POLICIES: rate_limit_log
-- ============================================================================

CREATE POLICY "Public insert to rate_limit_log"
    ON rate_limit_log FOR INSERT
    TO public
    WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_content_changes()
RETURNS TRIGGER AS $$
DECLARE
    record_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        IF TG_TABLE_NAME = 'admin_users' THEN
            record_id := OLD.user_id;
        ELSE
            record_id := OLD.id;
        END IF;
        
        INSERT INTO audit_log (
            actor_id,
            action,
            target_table,
            target_id,
            old_value
        ) VALUES (
            auth.uid(),
            'DELETE',
            TG_TABLE_NAME,
            record_id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    ELSE
        IF TG_TABLE_NAME = 'admin_users' THEN
            record_id := NEW.user_id;
        ELSE
            record_id := NEW.id;
        END IF;
        
        IF (TG_OP = 'UPDATE') THEN
            INSERT INTO audit_log (
                actor_id,
                action,
                target_table,
                target_id,
                old_value,
                new_value
            ) VALUES (
                auth.uid(),
                'UPDATE',
                TG_TABLE_NAME,
                record_id,
                to_jsonb(OLD),
                to_jsonb(NEW)
            );
            RETURN NEW;
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO audit_log (
                actor_id,
                action,
                target_table,
                target_id,
                new_value
            ) VALUES (
                auth.uid(),
                'INSERT',
                TG_TABLE_NAME,
                record_id,
                to_jsonb(NEW)
            );
            RETURN NEW;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_content_blocks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON content_blocks
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_submissions_trigger
    AFTER UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_admin_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_blocks_updated_at
    BEFORE UPDATE ON content_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_log
    WHERE created_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Admin dashboard schema deployed successfully with fixed RLS policies' as status;
