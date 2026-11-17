-- ============================================================================
-- TABLE: quotes
-- Stores quotes/estimates for clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL, -- Denormalized for quick access
    client_email TEXT,
    title TEXT NOT NULL,
    description TEXT,
    service_type TEXT CHECK (service_type IN ('travel', 'trade', 'both')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of line items {description, quantity, unit_price, amount}
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'accepted', 'rejected', 'expired')),
    valid_until DATE,
    notes TEXT,
    terms TEXT, -- Terms and conditions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_quote_number CHECK (quote_number ~ '^QT-[0-9]{4}-[0-9]{3,}$'), -- Format: QT-2026-001
    CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotes_timestamp
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

-- Function to generate next quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    next_num INTEGER;
    quote_num TEXT;
BEGIN
    year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the last quote number for this year
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(quote_number FROM 'QT-[0-9]{4}-([0-9]+)') AS INTEGER
            )
        ), 0) + 1
    INTO next_num
    FROM quotes
    WHERE quote_number LIKE 'QT-' || year || '-%';
    
    -- Format: QT-YYYY-NNN (with leading zeros)
    quote_num := 'QT-' || year || '-' || LPAD(next_num::TEXT, 3, '0');
    
    RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin full access to quotes"
    ON quotes
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );
