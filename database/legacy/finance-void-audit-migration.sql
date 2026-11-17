-- Finance-only migration: preserve income records while allowing owners to void them.
-- Audit events are written by the existing audit_content_changes() trigger function.

ALTER TABLE public.financial_transactions
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- Existing records are active by default; preserve any intentionally voided rows.
UPDATE public.financial_transactions
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE public.financial_transactions
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'financial_transactions_status_check'
          AND conrelid = 'public.financial_transactions'::regclass
    ) THEN
        ALTER TABLE public.financial_transactions
            ADD CONSTRAINT financial_transactions_status_check
            CHECK (status IN ('active', 'voided'));
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'financial_transactions_void_reason_length_check'
          AND conrelid = 'public.financial_transactions'::regclass
    ) THEN
        ALTER TABLE public.financial_transactions
            ADD CONSTRAINT financial_transactions_void_reason_length_check
            CHECK (void_reason IS NULL OR LENGTH(void_reason) <= 1000);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'financial_transactions_void_metadata_check'
          AND conrelid = 'public.financial_transactions'::regclass
    ) THEN
        ALTER TABLE public.financial_transactions
            ADD CONSTRAINT financial_transactions_void_metadata_check
            CHECK (
                (status = 'active' AND voided_at IS NULL AND voided_by IS NULL)
                OR (status = 'voided' AND voided_at IS NOT NULL AND voided_by IS NOT NULL)
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_status_date
    ON public.financial_transactions(status, transaction_date DESC);

-- Finance remains owner-only under the existing RLS policies. DELETE is not
-- permitted; voiding is an UPDATE and is audited by the existing trigger.
REVOKE DELETE ON TABLE public.financial_transactions FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_financial_transactions_trigger
    ON public.financial_transactions;
CREATE TRIGGER audit_financial_transactions_trigger
    AFTER INSERT OR UPDATE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_content_changes();

-- The existing audit_log RLS policy is owner-readable and has no UPDATE/DELETE
-- policy. Keep it that way; no direct client write policy is added here.
REVOKE UPDATE, DELETE ON TABLE public.audit_log FROM PUBLIC, anon, authenticated;

-- Post-migration verification: confirm the status column and row distribution.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'financial_transactions'
  AND column_name = 'status';

SELECT status, COUNT(*) AS record_count
FROM public.financial_transactions
GROUP BY status
ORDER BY status;
