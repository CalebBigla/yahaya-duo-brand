# Admin Dashboard - Quick Start Guide

## ✅ What's Been Created

### Files Added:
1. **Database Schema** - `database/schema.sql` (run in Supabase)
2. **Supabase Client** - `src/lib/supabase.ts`
3. **Authentication** - `src/lib/auth.ts`
4. **Security Utils** - `src/lib/security.ts`
5. **Rate Limiting** - `src/lib/rateLimit.ts`
6. **Admin Guard** - `src/components/admin/AdminGuard.tsx`
7. **Login Page** - `src/routes/admin/login.tsx`
8. **Dashboard** - `src/routes/admin/index.tsx`

### Dependencies Installed:
- `@supabase/supabase-js`
- `dompurify` + `@types/dompurify`
- `bcryptjs` + `@types/bcryptjs`

---

## 🚀 Next Steps to Get Running Locally

### 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to finish setting up
3. Go to SQL Editor and paste + run the entire `database/schema.sql` file
4. Go to Settings → API and copy:
   - `Project URL`
   - `anon/public key`

### 2. Create Environment File

Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_IP_SALT=generate-a-random-string-here
```

### 3. Create First Admin User

In Supabase Dashboard:
1. Go to Authentication → Users → Add User
2. Create a user with email/password
3. Copy the User UUID
4. Go to SQL Editor and run:

```sql
INSERT INTO admin_users (user_id, role)
VALUES ('paste-user-uuid-here', 'owner');
```

### 4. Test Locally

```bash
npm run dev
```

Then navigate to:
- `http://localhost:5173/admin/login` - Login page
- `http://localhost:5173/admin` - Dashboard (after login)

---

## 🔨 Still To Build (In Order)

### Phase 1: Core Admin Functionality
1. **Content Manager** (`/admin/content`)
   - Tab navigation for pages
   - Content block editing interface
   - Image upload via Cloudinary
   - Save/discard changes

2. **Submissions Manager** (`/admin/submissions`)
   - Table view with filters
   - Status management (new/read/responded)
   - Detail view for each submission

3. **Admin Users Manager** (`/admin/users`) - Owner only
   - List current admins
   - Invite new admins
   - Remove admin access

### Phase 2: Public Site Integration
1. **Content Hooks**
   - Create `usePageContent` hook
   - Implement in home page
   - Implement in travel page
   - Implement in trade page
   - Implement in about page
   - Implement in contact page

2. **Form Security**
   - Add honeypot fields to all forms
   - Implement rate limiting checks
   - Add validation and sanitization
   - Test malicious input rejection

### Phase 3: Testing & Security Audit
1. Test all RLS policies
2. Test rate limiting
3. Test session timeout
4. Security penetration testing
5. Performance testing

---

## 📁 Project Structure

```
yahaya-duo-brand-main/
├── database/
│   └── schema.sql              # Database schema with RLS
├── src/
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client config
│   │   ├── auth.ts             # Auth utilities
│   │   ├── security.ts         # Security/validation utils
│   │   └── rateLimit.ts        # Rate limiting
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminGuard.tsx  # Route protection
│   │   └── site/               # Existing components
│   └── routes/
│       ├── admin/
│       │   ├── login.tsx       # ✅ Login page
│       │   ├── index.tsx       # ✅ Dashboard home
│       │   ├── content.tsx     # ⏳ To build
│       │   ├── submissions.tsx # ⏳ To build
│       │   └── users.tsx       # ⏳ To build
│       └── ...                 # Existing public routes
├── .env.example                # Template for environment vars
└── .gitignore                  # ✅ Updated to ignore .env
```

---

## 🔒 Security Checklist Before Production

- [ ] All RLS policies tested and working
- [ ] No `.env` file committed to git
- [ ] Service role key never exposed to client
- [ ] All user input sanitized
- [ ] Rate limiting active on all forms
- [ ] Session timeout working
- [ ] Audit logging verified
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Password requirements enforced (min 12 chars)
- [ ] Admin invitation process secure
- [ ] Error messages don't leak information

---

## 🆘 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Supabase connection errors
- Check `.env` file exists and has correct values
- Verify Supabase URL format: `https://xxx.supabase.co`
- Confirm anon key is from Project Settings → API

### RLS Policy errors
- Run entire `database/schema.sql` in Supabase SQL Editor
- Check user exists in `admin_users` table
- Verify session is valid (check browser dev tools → Application → Local Storage)

### Can't login
- Verify user exists in Supabase Auth
- Verify user is in `admin_users` table
- Check browser console for errors
- Try incognito mode to rule out cache issues

---

## 📚 Key Concepts

### Row Level Security (RLS)
- All security is enforced at database level
- Client-side guards are UX only
- Even with anon key, users can only do what RLS allows

### Audit Logging
- Triggered automatically on content changes
- Owner can review in `audit_log` table
- Includes old and new values for tracking changes

### Rate Limiting
- IP addresses are hashed, never stored raw
- 5 submissions per hour per form type
- Automatic cleanup of old logs

### Session Management
- 30-minute inactivity timeout
- Auto-refresh of tokens
- Logout on timeout with redirect

---

## 💡 Development Tips

1. **Test with multiple browser profiles** to simulate different users
2. **Use Supabase Table Editor** to view data during development
3. **Check browser Network tab** to see Supabase API calls
4. **Read Supabase logs** in Dashboard → Logs for debugging
5. **Keep `.env.example` updated** when adding new environment variables

---

Ready to continue building? Start with the Content Manager next!
