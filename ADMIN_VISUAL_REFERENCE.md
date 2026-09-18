# Admin Dashboard - Visual Reference Guide

## What You Should See When Testing

This guide describes exactly what the admin dashboard should look like at each stage.

---

## 1. Login Page (`/admin/login`)

### Layout:
```
┌─────────────────────────────────────────┐
│                                         │
│              [Y Logo]                   │
│          Yahaya Travel                  │
│          Admin Console                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Email                            │ │
│  │  [___________________________]    │ │
│  │                                   │ │
│  │  Password                         │ │
│  │  [___________________________]    │ │
│  │                                   │ │
│  │  [Sign In Button - Primary]      │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Visual Details:**
- Centered card with shadow
- Primary color logo circle with "Y"
- Clean white form on gray background
- Primary button with hover effect

---

## 2. Dashboard Home - Desktop View

### Full Layout:
```
┌──────────┬─────────────────────────────────────────────────────┐
│          │  [≡] [Search box...]          [🔔] [@Profile ▾]     │
│   [Y]    ├─────────────────────────────────────────────────────┤
│ Yahaya   │                                                      │
│ Travel   │  Good morning, Admin                                 │
│          │  Here's what's happening across Yahaya Travel...     │
│          │                                                      │
│ MAIN     │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│ • Dash   │  │New     │ │Create  │ │View    │ │Edit    │      │
│ • Enq 24 │  │Client  │ │Quote   │ │Enquiry │ │Website │      │
│ • Clients│  └────────┘ └────────┘ └────────┘ └────────┘      │
│ • Quotes │                                                      │
│          │  ┌────────────────────────────────────────────┐     │
│ SITE     │  │     Dashboard Overview Coming Soon          │     │
│ • Website│  │     [Chart icon]                            │     │
│ • Media  │  │     Analytics will be in Module 2           │     │
│          │  └────────────────────────────────────────────┘     │
│ GENERAL  │                                                      │
│ • Team   │  ℹ️ Admin Dashboard - Module 1 Complete            │
│ • Setting│     You're viewing the shell...                     │
│          │     Your role: Owner (Full Access)                  │
│          │                                                      │
│ [@User]  │                                                      │
└──────────┴─────────────────────────────────────────────────────┘
```

### Sidebar Details:

**Logo Section:**
- Circle with "Y" letter in white on primary color
- "Yahaya Travel" in bold
- "Admin Console" in gray small text

**Navigation Sections:**

**MAIN Section:**
- Dashboard (active = primary background)
- Enquiries (with badge "24" on right)
- Clients
- Quotes

**SITE Section:**
- Website
- Media

**GENERAL Section:**
- Team (owner only)
- Settings (owner only)

**User Profile (bottom):**
- Small circle with user icon
- "Admin" label
- "Full Access" sublabel
- Dropdown chevron

### Header Details:

**Left Side:**
- Hamburger menu icon (toggles sidebar)
- Search bar with magnifying glass icon

**Right Side:**
- Bell icon with red dot notification
- User profile with avatar and name
- Dropdown chevron

### Main Content Details:

**Welcome Section:**
- Large heading: "Good morning, Admin"
- Subtext explaining daily overview

**Quick Action Cards (4 cards in grid):**
1. **New Client** - Blue icon, "Add client record"
2. **Create Quote** - Green icon, "Generate new quote"
3. **View Enquiries** - Purple icon, "Check submissions"
4. **Edit Website** - Amber icon, "Update content"

Each card:
- Dashed border
- Icon in colored circle
- Title and subtitle
- Hover effect (border changes to primary)

**Module 2 Placeholder:**
- Large card with centered content
- Gray chart icon
- "Coming Soon" message
- Description text

**Info Card:**
- Light primary background
- Primary icon on left
- Bold title
- Body text explaining Module 1 status
- Role information

---

## 3. Mobile View (< 768px)

### Layout:
```
┌─────────────────────────────────┐
│ [≡] Yahaya Travel    [🔔] [@]   │
├─────────────────────────────────┤
│                                 │
│ Good morning, Admin             │
│ Here's what's happening...      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ New Client                  │ │
│ │ Add client record           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Create Quote                │ │
│ │ Generate new quote          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ... (2 more cards)              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Dashboard Overview          │ │
│ │ Coming Soon                 │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Mobile Sidebar (when opened):**
- Overlay covers entire screen
- Sidebar slides in from left
- Dark overlay on right side
- Close [X] button in header

---

## 4. Collapsed Sidebar (Desktop)

### Layout:
```
┌───┬────────────────────────────────────────┐
│   │ [≡] [Search]        [🔔] [@Profile ▾] │
│[Y]├────────────────────────────────────────┤
│   │                                        │
│ 📊│ Good morning, Admin                    │
│   │                                        │
│ 📥│ [Quick Action Cards...]                │
│   │                                        │
│ 👥│ [Dashboard Content...]                 │
│   │                                        │
│ 📝│                                        │
│   │                                        │
│ 🌐│                                        │
│   │                                        │
│ 🖼 │                                        │
│   │                                        │
│ 👥│                                        │
│   │                                        │
│⚙️ │                                        │
│   │                                        │
│[@]│                                        │
└───┴────────────────────────────────────────┘
```

**Collapsed State:**
- Sidebar width: 80px
- Only icons visible (no labels)
- Logo "Y" only
- Tooltips on hover
- Badge numbers still visible

---

## 5. Color Palette

### Primary Colors:
- **Primary:** Your brand primary color (from existing site)
- **Primary Light:** Primary with 10% opacity (badges)
- **Primary Dark:** Darker shade for hover states

### Grays:
- **Gray-50:** `#F9FAFB` - Background
- **Gray-100:** `#F3F4F6` - Hover states
- **Gray-200:** `#E5E7EB` - Borders
- **Gray-400:** `#9CA3AF` - Secondary text
- **Gray-500:** `#6B7280` - Icons
- **Gray-700:** `#374151` - Navigation text
- **Gray-900:** `#111827` - Headings

### Status Colors:
- **Blue-100/600:** New Client action
- **Green-100/600:** Create Quote action
- **Purple-100/600:** View Enquiries action
- **Amber-100/600:** Edit Website action
- **Red-500:** Notification dot

### Accent Colors:
- **White:** `#FFFFFF` - Cards, sidebar
- **Black/50:** `rgba(0,0,0,0.5)` - Mobile overlay

---

## 6. Interactive States

### Navigation Items:

**Default:**
- Gray-700 text
- No background
- Gray-500 icon

**Hover:**
- Gray-100 background
- Rounded corners
- Smooth transition

**Active:**
- Primary background
- White text
- White icon

**With Badge:**
- Small circle on right
- Primary/10 background
- Primary text
- Bold font

### Quick Action Cards:

**Default:**
- White background
- Dashed gray border
- Colored icon circle

**Hover:**
- Primary border
- Primary/5 background
- Slight scale up
- Smooth transition

### Buttons:

**Primary Button (Sign In):**
- Primary background
- White text
- Rounded corners
- Hover: Darker primary

**Icon Buttons:**
- Transparent background
- Gray-500 icon
- Hover: Gray-100 background

**Profile Dropdown:**
- White background
- Shadow
- Appears above profile button
- Red text for "Sign Out"

---

## 7. Typography Scale

### Headings:
- **Page Title:** `text-2xl font-bold` (24px, bold)
- **Card Title:** `text-lg font-semibold` (18px, semibold)
- **Section Header:** `text-xs font-semibold uppercase` (12px, bold, uppercase)

### Body Text:
- **Default:** `text-sm` (14px)
- **Small:** `text-xs` (12px)
- **Medium:** `text-base` (16px)

### Navigation:
- **Nav Items:** `text-sm font-medium` (14px, medium)
- **Nav Sections:** `text-xs font-semibold uppercase` (12px, bold, uppercase)

---

## 8. Spacing & Layout

### Padding:
- **Page:** `p-6` (24px)
- **Cards:** `p-6` or `p-8` (24px-32px)
- **Sidebar:** `p-4` (16px)
- **Nav Items:** `px-3 py-2.5` (12px horizontal, 10px vertical)

### Gaps:
- **Card Grid:** `gap-4` (16px)
- **Nav Sections:** `space-y-6` (24px between sections)
- **Nav Items:** `space-y-1` (4px between items)

### Borders:
- **Width:** 1px or 2px (dashed)
- **Radius:** `rounded-lg` (8px)
- **Color:** Gray-200 or gray-300

### Shadows:
- **Cards:** `shadow-sm` - Subtle
- **Dropdown:** `shadow-lg` - Prominent
- **Sidebar (mobile):** `shadow-xl` - Very prominent

---

## 9. Responsive Breakpoints

### Small (Mobile):
- **Width:** < 640px
- **Changes:**
  - Single column layout
  - Hamburger menu only
  - Stacked quick actions
  - Full width cards
  - Hide search bar

### Medium (Tablet):
- **Width:** 640px - 1023px
- **Changes:**
  - 2-column quick actions
  - Show search bar
  - Hamburger menu
  - Adjusted padding

### Large (Desktop):
- **Width:** 1024px+
- **Changes:**
  - Full sidebar visible
  - 4-column quick actions
  - Collapsible sidebar
  - All features visible
  - Optimal spacing

---

## 10. What NOT to See (Red Flags)

### Visual Issues:
- ❌ Broken images or missing icons
- ❌ Overlapping text
- ❌ Cut-off content
- ❌ Misaligned elements
- ❌ Wrong colors (check brand consistency)
- ❌ Inconsistent spacing

### Functional Issues:
- ❌ Cannot click sidebar items
- ❌ Sidebar doesn't toggle
- ❌ Profile dropdown doesn't open
- ❌ Sign-out doesn't work
- ❌ Mobile menu doesn't open
- ❌ Navigation doesn't change URL

### Console Errors:
- ❌ React errors
- ❌ 404 errors (except for unimplemented pages)
- ❌ Authentication errors
- ❌ Missing component errors
- ❌ TypeScript errors (in browser)

---

## Testing Flow

### Step-by-Step Visual Check:

1. **Login Page:**
   - [ ] Clean centered form
   - [ ] Logo visible and styled
   - [ ] Input fields working
   - [ ] Button hover effect

2. **Dashboard Load:**
   - [ ] Sidebar appears correctly
   - [ ] Header elements present
   - [ ] Welcome message shows
   - [ ] Quick actions displayed
   - [ ] No layout breaks

3. **Navigation:**
   - [ ] Click each sidebar item
   - [ ] Active state highlights
   - [ ] URL changes
   - [ ] Badge visible on Enquiries

4. **Responsive:**
   - [ ] Resize browser to mobile
   - [ ] Hamburger menu appears
   - [ ] Mobile menu opens/closes
   - [ ] Cards stack vertically

5. **Interactive:**
   - [ ] Hover effects work
   - [ ] Profile dropdown opens
   - [ ] Sign-out redirects to login
   - [ ] Search bar visible (desktop)

6. **Colors:**
   - [ ] Primary color matches brand
   - [ ] Gray tones consistent
   - [ ] Status colors distinct
   - [ ] Text readable

---

## Browser Compatibility

### Test On:
- [ ] Chrome (recommended)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

### Device Test:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

**Visual Reference Created:** September 16, 2026  
**For:** Module 1 Testing  
**Project:** Yahaya Travel & Trade Admin Dashboard
