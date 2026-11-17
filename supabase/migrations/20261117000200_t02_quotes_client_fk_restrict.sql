-- ============================================================================
-- T02: deleting a client must never delete their quotes
--
-- quotes.client_id was created with ON DELETE CASCADE (legacy quotes-schema.sql),
-- so deleting a client silently deleted every quote for that client, and through
-- further cascades their quote_responses and quote_access_tokens.
-- The admin UI now archives clients (status = 'inactive') instead of deleting.
-- This makes the database refuse to delete a client that still has quotes.
--
-- Existing data: no rows change. Re-creating the FK validates existing rows,
-- which already satisfy it (it is the same FK with a different ON DELETE rule).
-- clients.status already allows 'inactive' (legacy clients-schema.sql), so no
-- CHECK change is expected; the last block adds it only if the live DB lacks it.
--
-- PRE-CHECK (run first, read-only):
--   -- 1. The current FK and its delete rule ('c' = CASCADE, 'r' = RESTRICT)
--   SELECT conname, confdeltype FROM pg_constraint
--   WHERE conrelid = 'public.quotes'::regclass AND contype = 'f'
--     AND confrelid = 'public.clients'::regclass;
--   -- 2. The clients.status CHECK; it must list 'inactive'
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'public.clients'::regclass AND contype = 'c';
-- ============================================================================

DO $$
DECLARE
    fk RECORD;
BEGIN
    -- Drop whatever FK(s) currently link quotes.client_id to clients, whatever their name.
    FOR fk IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = 'public.quotes'::regclass
          AND c.confrelid = 'public.clients'::regclass
          AND c.contype = 'f'
          AND a.attname = 'client_id'
    LOOP
        EXECUTE format('ALTER TABLE public.quotes DROP CONSTRAINT %I', fk.conname);
    END LOOP;
END $$;

ALTER TABLE public.quotes
    ADD CONSTRAINT quotes_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;

-- Make sure clients.status allows 'inactive' (= archived). The legacy schema already
-- allows it, in which case this block does nothing. If the live CHECK does not, it is
-- replaced with the legacy definition. Adding the constraint validates every existing
-- row, so any client with a status outside these three values makes this fail
-- loudly instead of changing data.
DO $$
DECLARE
    ck RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.clients'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%inactive%'
    ) THEN
        FOR ck IN
            SELECT conname FROM pg_constraint
            WHERE conrelid = 'public.clients'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%status%'
        LOOP
            EXECUTE format('ALTER TABLE public.clients DROP CONSTRAINT %I', ck.conname);
        END LOOP;
        ALTER TABLE public.clients
            ADD CONSTRAINT clients_status_check CHECK (status IN ('active', 'inactive', 'prospect'));
    END IF;
END $$;
