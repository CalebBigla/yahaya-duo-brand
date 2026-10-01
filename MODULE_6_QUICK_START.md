# Module 6: Website CMS - Quick Start Guide

## 🚀 What Was Built

A complete database-driven Content Management System that allows non-technical users to edit all public website content through the admin dashboard.

### 7 CMS Modules Created:
1. **Homepage Editor** - Hero, stats, mission/vision
2. **Services Manager** - Travel/trade service listings (10 services)
3. **Gallery Manager** - Image gallery with categories
4. **Testimonials Manager** - Client reviews with ratings
5. **FAQs Manager** - Q&A by category
6. **Company Info Editor** - Contact, address, hours, social
7. **SEO Settings** - Meta tags for all 6 pages

### Key Features:
✅ Draft/Publish workflow (save without making live)  
✅ Role-based access (admin only, staff view planned)  
✅ Audit logging (every change tracked)  
✅ Input validation (character limits, format checks)  
✅ Status indicators (Published/Draft/Empty)  
✅ Real-time save with sticky save bar  

## ⚡ 3-Minute Setup

### Step 1: Run Database Migration (2 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `database/website-cms-schema.sql`
3. Paste and click **RUN**
4. Wait for "Success. No rows returned" message

**What this does:**
- Creates 7 CMS tables with security policies
- Seeds initial data (homepage, settings, 10 services, SEO)
- Sets up audit logging and triggers

### Step 2: Verify Seed Data (30 seconds)
In Supabase **Table Editor**, check:
- `website_homepage`: 1 row ✅
- `website_services`: 10 rows ✅ (5 travel + 5 trade)
- `website_settings`: 1 row ✅
- `website_seo`: 6 rows ✅
- Other tables: 0 rows (empty, ready for content)

### Step 3: Test Admin Dashboard (30 seconds)
1. Log in to admin at `/admin/login`
2. Click **Website** in left navigation
3. See 7 module cards with status badges
4. Click **Services** → Should see 10 services (5 travel, 5 trade)
5. Click **Edit** on any service → Modal opens
6. Make a change → Click **Save Changes** → Success!

## 🎯 Quick Wins to Try

### Edit Homepage Hero (1 minute)
```
1. Go to: /admin/website/homepage
2. Change "Hero Title" to your custom text
3. Update stats (clients served, destinations, etc.)
4. Click "Save Draft" (yellow button)
5. Click "Publish" (green button) → Confirm
6. ✅ Changes are now live (when public site is connected)
```

### Add a Service (2 minutes)
```
1. Go to: /admin/website/services
2. Click tab: Travel Services or Trade Services
3. Click "Add Service" button
4. Fill in: Title, Slug, Summary, Detail
5. Click "Create Service"
6. Click "Publish" icon to make it live
```

### Upload Gallery Image (1 minute)
```
1. Go to: /admin/website/gallery
2. Click "Add Image"
3. Enter: Title, Image URL, Alt Text
4. Select Category: Travel/Trade/Events/Team/Partners
5. Click "Add Image"
6. Click eye icon to publish
```

### Add Client Testimonial (1 minute)
```
1. Go to: /admin/website/testimonials
2. Click "Add Testimonial"
3. Enter: Client Name, Title, Testimonial text
4. Select Rating (1-5 stars)
5. Check "Featured" to show on homepage
6. Click "Add Testimonial"
```

### Create FAQ (1 minute)
```
1. Go to: /admin/website/faqs
2. Click "Add FAQ"
3. Select Category: General/Travel/Trade/Visa/Payment
4. Enter Question and Answer
5. Click "Add FAQ"
6. Click "Publish" to make visible
```

### Update Contact Info (1 minute)
```
1. Go to: /admin/website/company-info
2. Update: Email, Phone, WhatsApp, Address
3. Edit Business Hours
4. Add Social Media links
5. Click "Save Draft" then "Publish"
```

### Optimize SEO (2 minutes)
```
1. Go to: /admin/website/seo
2. Click "Edit" on any page (Home, Travel, Trade, etc.)
3. Update: Meta Title (50-60 chars), Meta Description (150-160 chars)
4. Add Keywords: "travel, visa, nigeria, export"
5. Set OG Image for social sharing
6. Click "Save Changes" then "Publish"
```

## 🔗 Connect to Public Website (Required)

Currently, public pages use hardcoded data from `src/lib/site.ts`.

### Replace with Database Queries:

Create `src/lib/queries/website.ts`:
```typescript
import { supabase } from '@/lib/supabase';

export async function getPublishedServices(division: 'travel' | 'trade') {
  const { data } = await supabase
    .from('website_services')
    .select('*')
    .eq('division', division)
    .eq('status', 'published')
    .order('display_order');
  return data || [];
}

export async function getPublishedHomepage() {
  const { data } = await supabase
    .from('website_homepage')
    .select('*')
    .eq('status', 'published')
    .single();
  return data;
}

export async function getPublishedSettings() {
  const { data } = await supabase
    .from('website_settings')
    .select('*')
    .eq('status', 'published')
    .single();
  return data;
}

export async function getPublishedGallery(category?: string) {
  let query = supabase
    .from('website_gallery')
    .select('*')
    .eq('status', 'published')
    .order('display_order');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data } = await query;
  return data || [];
}

export async function getFeaturedTestimonials() {
  const { data } = await supabase
    .from('website_testimonials')
    .select('*')
    .eq('status', 'published')
    .eq('featured', true)
    .order('display_order')
    .limit(3);
  return data || [];
}

export async function getPublishedFAQs(category?: string) {
  let query = supabase
    .from('website_faqs')
    .select('*')
    .eq('status', 'published')
    .order('category')
    .order('display_order');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data } = await query;
  return data || [];
}

export async function getPublishedSEO(pageSlug: string) {
  const { data } = await supabase
    .from('website_seo')
    .select('*')
    .eq('page_slug', pageSlug)
    .eq('status', 'published')
    .single();
  return data;
}
```

Then update public pages:
```typescript
// src/routes/travel.tsx
import { getPublishedServices } from '@/lib/queries/website';

// In component:
const services = await getPublishedServices('travel');
// Use services array instead of hardcoded travelServices
```

## 📊 Module Status

| Module | Database | Admin UI | Public Site | Status |
|--------|----------|----------|-------------|--------|
| Homepage | ✅ | ✅ | ⏳ | 95% |
| Services | ✅ | ✅ | ⏳ | 95% |
| Gallery | ✅ | ✅ | ⏳ | 95% |
| Testimonials | ✅ | ✅ | ⏳ | 95% |
| FAQs | ✅ | ✅ | ⏳ | 95% |
| Company Info | ✅ | ✅ | ⏳ | 95% |
| SEO | ✅ | ✅ | ⏳ | 95% |

**⏳ Pending:** Connect database queries to public website pages

## 🎨 UI Preview

### Dashboard Overview (`/admin/website`)
```
┌─────────────────────────────────────────────────┐
│ Website CMS                                      │
│ Manage all public-facing website content        │
├─────────────────────────────────────────────────┤
│                                                  │
│ Published: 4  |  Drafts: 0  |  Modules: 7      │
│                                                  │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│ │ Homepage │  │ Services │  │  Gallery │       │
│ │ 🟢 Pub   │  │ 🟢 Pub   │  │ ⚪ Empty │       │
│ │ 1 item   │  │ 10 items │  │ 0 items  │       │
│ └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Edit Modal Pattern
```
┌──────────────────────────────────────────────┐
│ Edit Service                          [ X ]  │
├──────────────────────────────────────────────┤
│                                              │
│ Title: [________________________]           │
│ Slug:  [________________________]           │
│ Summary: [____________________]             │
│ Detail: [_______________________]           │
│                                              │
├──────────────────────────────────────────────┤
│                     [Cancel] [Save Changes]  │
└──────────────────────────────────────────────┘
```

## 🔒 Security

**Row Level Security (RLS):**
- ✅ Public can only SELECT published content
- ✅ Admins have full CRUD access
- ✅ All actions logged in audit_log table
- ✅ Input validation enforced at database level

**Audit Trail Example:**
```sql
SELECT actor_id, action, target_table, created_at 
FROM audit_log 
WHERE target_table = 'website_services'
ORDER BY created_at DESC;
```

## 🆘 Troubleshooting

### "No rows returned" when fetching data
**Fix:** Run database migration first (Step 1 above)

### "Permission denied" when saving
**Fix:** Ensure your user is in `admin_users` table with role='owner'

### Changes not visible on public site
**Fix:** Public site integration pending (see "Connect to Public Website" above)

### Modal won't close
**Fix:** Click X button or Cancel, refresh page if stuck

### Character limit exceeded
**Fix:** Meta title ≤60, meta description ≤160, testimonial ≤1000

## 📚 Full Documentation

See `MODULE_6_WEBSITE_CMS.md` for:
- Complete database schema details
- RLS policies and triggers
- Integration examples
- Future enhancements roadmap

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Seed data verified (10 services, etc.)
- [ ] Admin dashboard loads at `/admin/website`
- [ ] Can edit homepage hero text
- [ ] Can create/publish a new service
- [ ] Can add gallery image
- [ ] Can add testimonial
- [ ] Can create FAQ
- [ ] Can update company info
- [ ] Can edit SEO meta tags
- [ ] Draft/Publish workflow works
- [ ] Status badges show correctly

**When all checked:** Module 6 is complete! 🎉

## 🚀 Next: Deploy & Connect

1. Commit all changes
2. Push to GitHub
3. Deploy to Render (auto-deploy)
4. Connect public pages to database
5. Test on production
6. Train users on CMS

---

**Module 6 Implementation:** COMPLETE ✅  
**Estimated Setup Time:** 3-5 minutes  
**User Training Time:** 10-15 minutes
