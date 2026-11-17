-- Add CMS storage for the existing public Travel page visa reference.
-- The seed is copied from the prior hardcoded Travel page content.
CREATE TABLE IF NOT EXISTS public.website_visa_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country TEXT NOT NULL UNIQUE CHECK (LENGTH(country) <= 120 AND LENGTH(country) > 0),
    visa_types TEXT NOT NULL CHECK (LENGTH(visa_types) <= 500),
    processing_time TEXT NOT NULL CHECK (LENGTH(processing_time) <= 120),
    notes TEXT NOT NULL CHECK (LENGTH(notes) <= 1000),
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_website_visa_destinations_status_order
    ON public.website_visa_destinations(status, display_order);

ALTER TABLE public.website_visa_destinations ENABLE ROW LEVEL SECURITY;

-- Table grants permit Supabase REST access; row-level policies below still
-- restrict public reads to published rows and writes to registered admins.
GRANT SELECT ON TABLE public.website_visa_destinations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.website_visa_destinations TO authenticated;

DROP POLICY IF EXISTS "Public read published visa destinations" ON public.website_visa_destinations;
CREATE POLICY "Public read published visa destinations"
    ON public.website_visa_destinations FOR SELECT TO public
    USING (status = 'published');

DROP POLICY IF EXISTS "Admin full access to visa destinations" ON public.website_visa_destinations;
CREATE POLICY "Admin full access to visa destinations"
    ON public.website_visa_destinations FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP TRIGGER IF EXISTS update_website_visa_destinations_timestamp ON public.website_visa_destinations;
CREATE TRIGGER update_website_visa_destinations_timestamp
    BEFORE UPDATE ON public.website_visa_destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS audit_website_visa_destinations_trigger ON public.website_visa_destinations;
CREATE TRIGGER audit_website_visa_destinations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.website_visa_destinations
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

INSERT INTO public.website_visa_destinations (country, visa_types, processing_time, notes, display_order, status, published_at) VALUES
('Saudi Arabia', 'Umrah, Hajj, Tourism, Business', 'Variable by season', 'Vaccination certificate mandatory. Pilgrimage visas through licensed agents.', 1, 'published', NOW()),
('Qatar', 'Tourism, Business, Work, Transit', '3-5 working days', 'Sponsor or hotel booking required. Fast processing available.', 2, 'published', NOW()),
('China', 'Tourism, Business, Study, Work', '4-7 working days', 'Invitation letter often required. Apply at Chinese Visa Application Center.', 3, 'published', NOW()),
('Turkey', 'Tourism, Business, Work, Transit', '3-7 working days', 'E-visa available online. Hotel confirmation and travel insurance recommended.', 4, 'published', NOW()),
('Dubai (UAE)', 'Tourism, Business, Work, Transit', '3-5 working days', 'Sponsor or hotel booking required. Fast-track options available for urgent cases.', 5, 'published', NOW()),
('Egypt', 'Tourism, Business', '5-7 working days', 'Hotel booking and return ticket confirmation required. E-visa available for some nationalities.', 6, 'published', NOW()),
('Cyprus', 'Tourism, Business', '5-10 working days', 'Travel insurance and hotel confirmation required.', 7, 'published', NOW()),
('Schengen Countries', 'Tourism, Business, Study, Work', '15 working days', 'Travel insurance mandatory. Biometrics required. Multiple entry options available.', 8, 'published', NOW())
ON CONFLICT (country) DO NOTHING;
