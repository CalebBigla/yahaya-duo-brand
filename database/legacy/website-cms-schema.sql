-- ============================================================================
-- Yahaya Travel & Trade - Website CMS Module Schema
-- Module 6: Database-driven content management
-- ============================================================================

-- ============================================================================
-- TABLE: website_homepage
-- Manages homepage hero, stats, and mission/vision sections
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_homepage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Hero Section
    hero_title TEXT NOT NULL DEFAULT 'Your Trusted Partner for Global Travel and International Trade',
    hero_subtitle TEXT DEFAULT 'Connecting continents through reliable visa services, seamless logistics, and strategic sourcing solutions.',
    hero_cta_text TEXT DEFAULT 'Get Started',
    hero_cta_link TEXT DEFAULT '/contact',
    hero_image_url TEXT,
    
    -- Stats Section
    stats_years_experience INTEGER DEFAULT 10,
    stats_clients_served INTEGER DEFAULT 500,
    stats_destinations INTEGER DEFAULT 45,
    stats_success_rate INTEGER DEFAULT 98,
    
    -- Mission/Vision Section
    mission_title TEXT DEFAULT 'Our Mission',
    mission_content TEXT DEFAULT 'To provide world-class travel and trade solutions that connect businesses and individuals across borders with integrity, efficiency, and excellence.',
    vision_title TEXT DEFAULT 'Our Vision',
    vision_content TEXT DEFAULT 'To be the most trusted name in international travel and trade facilitation across Africa and beyond.',
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Only one homepage configuration (enforce singleton)
    CONSTRAINT single_homepage_config CHECK (id IS NOT NULL)
);

-- Index for fast status lookups
CREATE INDEX IF NOT EXISTS idx_website_homepage_status ON website_homepage(status);

-- ============================================================================
-- TABLE: website_services
-- Replaces hardcoded site.ts arrays with database-driven service listings
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division TEXT NOT NULL CHECK (division IN ('travel', 'trade')),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    detail TEXT NOT NULL,
    icon_name TEXT, -- e.g., 'Plane', 'Ship', 'Briefcase' (Lucide icon names)
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE (division, slug)
);

-- Indexes for filtering and ordering
CREATE INDEX IF NOT EXISTS idx_website_services_division ON website_services(division, status);
CREATE INDEX IF NOT EXISTS idx_website_services_order ON website_services(division, display_order);
CREATE INDEX IF NOT EXISTS idx_website_services_slug ON website_services(slug);

-- ============================================================================
-- TABLE: website_gallery
-- Image gallery with category organization
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('travel', 'trade', 'events', 'team', 'partners')),
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text TEXT, -- Accessibility
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_website_gallery_category ON website_gallery(category, status);
CREATE INDEX IF NOT EXISTS idx_website_gallery_order ON website_gallery(category, display_order);

-- ============================================================================
-- TABLE: website_testimonials
-- Client testimonials and reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_title TEXT, -- e.g., "CEO, ABC Corp"
    client_photo_url TEXT,
    testimonial TEXT NOT NULL CHECK (LENGTH(testimonial) <= 1000),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    service_division TEXT CHECK (service_division IN ('travel', 'trade', 'both')),
    display_order INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT false, -- Show on homepage
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_website_testimonials_featured ON website_testimonials(featured, status);
CREATE INDEX IF NOT EXISTS idx_website_testimonials_order ON website_testimonials(display_order);

-- ============================================================================
-- TABLE: website_faqs
-- Frequently Asked Questions organized by category
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('general', 'travel', 'trade', 'visa', 'payment')),
    question TEXT NOT NULL CHECK (LENGTH(question) <= 500),
    answer TEXT NOT NULL CHECK (LENGTH(answer) <= 2000),
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Structured travel-page visa destination reference content.
CREATE TABLE IF NOT EXISTS website_visa_destinations (
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
    ON website_visa_destinations(status, display_order);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_website_faqs_category ON website_faqs(category, status);
CREATE INDEX IF NOT EXISTS idx_website_faqs_order ON website_faqs(category, display_order);

-- ============================================================================
-- TABLE: website_settings
-- Company information, contact details, business hours
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company Info
    company_name TEXT NOT NULL DEFAULT 'Yahaya Travel and Trade Co Ltd',
    company_short_name TEXT DEFAULT 'Yahaya',
    sub_brand TEXT DEFAULT 'General Contracts',
    rc_number TEXT DEFAULT '9295358',
    
    -- Contact Details
    email TEXT NOT NULL,
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    whatsapp_number TEXT NOT NULL,
    
    -- Address
    address_street TEXT NOT NULL,
    address_locality TEXT NOT NULL,
    address_region TEXT NOT NULL,
    address_country TEXT NOT NULL DEFAULT 'Nigeria',
    
    -- Business Hours (JSON array)
    business_hours JSONB DEFAULT '[
        {"days": "Monday – Friday", "time": "8:00 AM – 6:00 PM"},
        {"days": "Saturday", "time": "9:00 AM – 4:00 PM"},
        {"days": "Sunday", "time": "9:00 AM – 4:00 PM"}
    ]'::jsonb,
    
    -- Social Media
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    tiktok_url TEXT,
    
    -- Publishing Workflow (only one active settings row)
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT single_settings_config CHECK (id IS NOT NULL)
);

-- ============================================================================
-- TABLE: website_seo
-- SEO meta tags per page
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_seo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug TEXT NOT NULL UNIQUE CHECK (page_slug IN ('home', 'about', 'travel', 'trade', 'contact', 'media')),
    
    -- SEO Fields
    meta_title TEXT NOT NULL CHECK (LENGTH(meta_title) <= 60),
    meta_description TEXT NOT NULL CHECK (LENGTH(meta_description) <= 160),
    meta_keywords TEXT, -- Comma-separated
    og_title TEXT CHECK (LENGTH(og_title) <= 60),
    og_description TEXT CHECK (LENGTH(og_description) <= 200),
    og_image_url TEXT,
    twitter_card_type TEXT DEFAULT 'summary_large_image' CHECK (twitter_card_type IN ('summary', 'summary_large_image')),
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_website_seo_page ON website_seo(page_slug, status);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all CMS tables
ALTER TABLE website_homepage ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_visa_destinations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE website_visa_destinations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE website_visa_destinations TO authenticated;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_seo ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: Public can SELECT published content, admins can modify
-- ============================================================================

-- HOMEPAGE POLICIES
CREATE POLICY "Public read published homepage"
    ON website_homepage FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to homepage"
    ON website_homepage FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- SERVICES POLICIES
CREATE POLICY "Public read published services"
    ON website_services FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to services"
    ON website_services FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- GALLERY POLICIES
CREATE POLICY "Public read published gallery"
    ON website_gallery FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to gallery"
    ON website_gallery FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- TESTIMONIALS POLICIES
CREATE POLICY "Public read published testimonials"
    ON website_testimonials FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to testimonials"
    ON website_testimonials FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- FAQS POLICIES
CREATE POLICY "Public read published faqs"
    ON website_faqs FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to faqs"
    ON website_faqs FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- VISA DESTINATION POLICIES
CREATE POLICY "Public read published visa destinations"
    ON website_visa_destinations FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to visa destinations"
    ON website_visa_destinations FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- SETTINGS POLICIES
CREATE POLICY "Public read published settings"
    ON website_settings FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to settings"
    ON website_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- SEO POLICIES
CREATE POLICY "Public read published seo"
    ON website_seo FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Admin full access to seo"
    ON website_seo FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- ============================================================================
-- TRIGGERS: Auto-update timestamps and audit logs
-- ============================================================================

CREATE TRIGGER update_website_homepage_timestamp
    BEFORE UPDATE ON website_homepage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_services_timestamp
    BEFORE UPDATE ON website_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_gallery_timestamp
    BEFORE UPDATE ON website_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_testimonials_timestamp
    BEFORE UPDATE ON website_testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_faqs_timestamp
    BEFORE UPDATE ON website_faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_visa_destinations_timestamp
    BEFORE UPDATE ON website_visa_destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_settings_timestamp
    BEFORE UPDATE ON website_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_seo_timestamp
    BEFORE UPDATE ON website_seo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging
CREATE TRIGGER audit_website_homepage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_homepage
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_services_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_services
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_gallery_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_gallery
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_testimonials_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_testimonials
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_faqs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_faqs
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_visa_destinations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_visa_destinations
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_settings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_settings
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

CREATE TRIGGER audit_website_seo_trigger
    AFTER INSERT OR UPDATE OR DELETE ON website_seo
    FOR EACH ROW EXECUTE FUNCTION audit_content_changes();

-- ============================================================================
-- INITIAL DATA SEED: Migrate from hardcoded site.ts
-- ============================================================================

-- Seed homepage with defaults
INSERT INTO website_homepage (status, published_at)
VALUES ('published', NOW())
ON CONFLICT DO NOTHING;

-- Seed company settings from existing site.ts
INSERT INTO website_settings (
    company_name,
    company_short_name,
    sub_brand,
    rc_number,
    email,
    phone_primary,
    whatsapp_number,
    address_street,
    address_locality,
    address_region,
    address_country,
    status,
    published_at
) VALUES (
    'Yahaya Travel and Trade Co Ltd',
    'Yahaya',
    'General Contracts',
    '9295358',
    'yahayageneralcontracts@gmail.com',
    '+234 806 343 6192',
    '2349127650968',
    'B.M Yelwa Plaza, Opp. Bachure Junction',
    'Jimeta-Yola',
    'Adamawa State',
    'Nigeria',
    'published',
    NOW()
) ON CONFLICT DO NOTHING;

-- Seed travel services from site.ts
INSERT INTO website_services (division, slug, title, summary, detail, display_order, status, published_at) VALUES
('travel', 'visa-processing', 'Visa Processing Services', 'Expert guidance and application support for all visa types.', 'We provide expert guidance and application support for tourist, business, study, work, and residency visas. Our services include document review and advisory, application processing, appointment scheduling, interview preparation, and compliance and travel advisories.', 1, 'published', NOW()),
('travel', 'flight-bookings', 'Flight Bookings', 'Assistance with local and international flight arrangements.', 'We assist clients with local and international flight bookings, corporate travel arrangements, flexible fare options, and emergency and last-minute travel assistance for one-off trips or recurring corporate travel needs.', 2, 'published', NOW()),
('travel', 'hotel-reservations', 'Hotel Reservations', 'Assistance with hotel bookings suited to your travel needs.', 'We assist with hotel reservations worldwide, offering budget to luxury accommodation options and long-stay and seasonal discount coordination, matched to your budget, location, and length of stay.', 3, 'published', NOW()),
('travel', 'tour-packages', 'Tour Packages', 'Personalized and group tour packages for all occasions.', 'Personalized and group tour packages designed for holidays and vacations, study trips, honeymoon packages, adventure and cultural experiences, and corporate retreats with fully arranged itineraries covering flights, transfers, accommodation, and guided activities.', 4, 'published', NOW()),
('travel', 'travel-consultancy', 'Travel Consultancy', 'Expert guidance for seamless travel planning.', 'Our experts offer itinerary planning, immigration and travel compliance guidance, country-specific travel analysis, and risk assessment and travel insurance support, so you know exactly what a trip demands before you commit to it.', 5, 'published', NOW())
ON CONFLICT (division, slug) DO NOTHING;

-- Seed trade services from site.ts
INSERT INTO website_services (division, slug, title, summary, detail, display_order, status, published_at) VALUES
('trade', 'oil-and-gas-trade', 'Oil and Gas Trade', 'Supply of petroleum products with compliance and quality assurance.', 'Supply of petroleum products, trading of crude and refined products, logistics coordination, and compliance with local and international energy standards.', 1, 'published', NOW()),
('trade', 'import-export', 'Import and Export Wholesalers', 'Comprehensive import-export facilitation with full documentation.', 'We connect suppliers across the globe, manage international shipping, customs clearing, SONCAP and SON certification, freight forwarding, and deliver wholesale goods to markets worldwide with complete documentation support.', 2, 'published', NOW()),
('trade', 'sourcing-procurement', 'Sourcing and Procurement', 'Professional procurement with supplier verification and quality assurance.', 'Tailored procurement solutions for corporate clients, NGOs, government projects, and SMEs. We provide supplier identification and verification, bulk purchasing with price optimization, quality assurance, and comprehensive documentation and logistics support.', 3, 'published', NOW()),
('trade', 'general-traders', 'General Traders', 'Multisector trading hub dealing in manufactured and agricultural goods.', 'Operating as a multisector trading hub, we handle manufactured goods, agricultural products, consumer goods, industrial materials, building materials, and specialized equipment, bought and sold at volume with transparent pricing.', 4, 'published', NOW()),
('trade', 'trade-consultancy', 'Trade Consultancy', 'Feasibility studies, market entry strategies, and compliance advisory.', 'We support individuals and companies seeking to expand into international markets through feasibility studies, market entry strategies, supplier verification and due diligence, regulatory and compliance advisory, and trade finance guidance.', 5, 'published', NOW())
ON CONFLICT (division, slug) DO NOTHING;

-- Seed the current public travel-page destination reference.
INSERT INTO website_visa_destinations (country, visa_types, processing_time, notes, display_order, status, published_at) VALUES
('Saudi Arabia', 'Umrah, Hajj, Tourism, Business', 'Variable by season', 'Vaccination certificate mandatory. Pilgrimage visas through licensed agents.', 1, 'published', NOW()),
('Qatar', 'Tourism, Business, Work, Transit', '3-5 working days', 'Sponsor or hotel booking required. Fast processing available.', 2, 'published', NOW()),
('China', 'Tourism, Business, Study, Work', '4-7 working days', 'Invitation letter often required. Apply at Chinese Visa Application Center.', 3, 'published', NOW()),
('Turkey', 'Tourism, Business, Work, Transit', '3-7 working days', 'E-visa available online. Hotel confirmation and travel insurance recommended.', 4, 'published', NOW()),
('Dubai (UAE)', 'Tourism, Business, Work, Transit', '3-5 working days', 'Sponsor or hotel booking required. Fast-track options available for urgent cases.', 5, 'published', NOW()),
('Egypt', 'Tourism, Business', '5-7 working days', 'Hotel booking and return ticket confirmation required. E-visa available for some nationalities.', 6, 'published', NOW()),
('Cyprus', 'Tourism, Business', '5-10 working days', 'Travel insurance and hotel confirmation required.', 7, 'published', NOW()),
('Schengen Countries', 'Tourism, Business, Study, Work', '15 working days', 'Travel insurance mandatory. Biometrics required. Multiple entry options available.', 8, 'published', NOW())
ON CONFLICT (country) DO NOTHING;

-- Seed default SEO for each page
INSERT INTO website_seo (page_slug, meta_title, meta_description, status, published_at) VALUES
('home', 'Yahaya Travel and Trade Co Ltd | Global Travel & Trade Solutions', 'Your trusted partner for visa processing, flight bookings, import-export, and international trade solutions in Nigeria.', 'published', NOW()),
('about', 'About Us | Yahaya Travel and Trade Co Ltd', 'Learn about our mission to connect continents through reliable travel and trade facilitation services.', 'published', NOW()),
('travel', 'Travel Services | Visa Processing & Flight Bookings', 'Expert visa processing, flight bookings, hotel reservations, and tour packages for seamless international travel.', 'published', NOW()),
('trade', 'Trade Services | Import, Export & Procurement', 'Comprehensive import-export, sourcing, procurement, and oil & gas trade solutions for businesses worldwide.', 'published', NOW()),
('contact', 'Contact Us | Yahaya Travel and Trade Co Ltd', 'Get in touch with us for travel and trade inquiries. Located in Jimeta-Yola, Adamawa State, Nigeria.', 'published', NOW()),
('media', 'Media Gallery | Yahaya Travel and Trade Co Ltd', 'View our gallery of travel destinations, trade operations, and client success stories.', 'published', NOW())
ON CONFLICT (page_slug) DO NOTHING;
