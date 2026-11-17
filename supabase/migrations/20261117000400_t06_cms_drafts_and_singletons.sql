-- ============================================================================
-- T06: CMS "Save draft" must not unpublish the live site  (+ BUG-18 singletons)
--
-- Before: Save in the Homepage / Company Info editors set the single live row's
-- status to 'draft'. Public RLS only shows status = 'published', so the public
-- site lost that content until someone clicked Publish.
-- After: drafts live in a new draft_data JSONB column. Save writes only
-- draft_data; Publish copies the content to the live columns and clears it.
--
-- APPLY THIS AFTER DEPLOYING THE NEW FRONTEND. Step 3 below removes anon's
-- table-wide SELECT on these two tables. The current production frontend reads
-- them with select('*'), which would then fail, and the public site would show
-- its hard-coded fallback text until the new frontend (explicit column list)
-- is live. See docs/SECURITY-CHECKS.md.
--
-- Existing data: no rows change. Step 2 fails (and the whole migration rolls
-- back) if either table has more than one row. Run the PRE-CHECK first.
--
-- PRE-CHECK (read-only). Each count must be exactly 1:
--   SELECT 'website_homepage' AS t, count(*) FROM public.website_homepage
--   UNION ALL
--   SELECT 'website_settings', count(*) FROM public.website_settings;
-- ============================================================================

-- 1. Draft storage --------------------------------------------------------------
ALTER TABLE public.website_homepage ADD COLUMN IF NOT EXISTS draft_data JSONB;
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS draft_data JSONB;

COMMENT ON COLUMN public.website_homepage.draft_data IS
    'Unpublished edits from the admin editor ({column: value}). NULL = no pending draft. Never exposed to anon.';
COMMENT ON COLUMN public.website_settings.draft_data IS
    'Unpublished edits from the admin editor ({column: value}). NULL = no pending draft. Never exposed to anon.';

-- 2. BUG-18: enforce a single row (the old CHECK (id IS NOT NULL) enforced nothing)
CREATE UNIQUE INDEX IF NOT EXISTS website_homepage_singleton ON public.website_homepage ((true));
CREATE UNIQUE INDEX IF NOT EXISTS website_settings_singleton ON public.website_settings ((true));

-- 3. Keep drafts away from the public --------------------------------------------
-- The public RLS policy lets anon read the published row, and RLS cannot hide a
-- column. So anon gets SELECT on every column except draft_data.
-- NOTE: a column added to either table later must also be granted to anon
-- explicitly (GRANT SELECT (new_col) ON ... TO anon) if the public site needs it.
DO $$
DECLARE
    t TEXT;
    cols TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['website_homepage', 'website_settings'] LOOP
        SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
          INTO cols
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = t
           AND column_name <> 'draft_data';

        EXECUTE format('REVOKE SELECT ON TABLE public.%I FROM anon', t);
        EXECUTE format('GRANT SELECT (%s) ON TABLE public.%I TO anon', cols, t);
    END LOOP;
END $$;
