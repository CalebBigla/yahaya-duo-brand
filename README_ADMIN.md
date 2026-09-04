# Yahaya Travel and Trade Co Ltd - Admin Dashboard

## 🔒 Security-First Admin System

This admin dashboard is built with **security as the primary requirement**, not an afterthought. Every feature is designed to close specific attack surfaces while maintaining usability.

---

## 📚 Documentation Index

1. **[ADMIN_SETUP_QUICK_START.md](./ADMIN_SETUP_QUICK_START.md)** - Get up and running in 30 minutes
2. **[ADMIN_DASHBOARD_IMPLEMENTATION.md](./ADMIN_DASHBOARD_IMPLEMENTATION.md)** - Complete technical specification
3. **[ADMIN_DASHBOARD_STATUS.md](./ADMIN_DASHBOARD_STATUS.md)** - Current progress and next steps
4. **[database/schema.sql](./database/schema.sql)** - PostgreSQL schema with RLS policies

---

## ✨ Features

### Admin Capabilities
- ✅ **Secure Authentication** - Email/password with 12-char minimum, session management
- ✅ **Content Management** - Edit text and images across all pages (Coming Soon)
- ✅ **Form Submissions** - View and manage contact form submissions (Coming Soon)
- ✅ **User Management** - Owner can add/remove admin access (Coming Soon)
- ✅ **Audit Logging** - All changes tracked automatically
- ✅ **Auto-Logout** - 30-minute inactivity timeout

### Security Features
- ✅ **Row Level Security** - Database-enforced access control
- ✅ **Input Sanitization** - XSS prevention on all user input
- ✅ **Rate Limiting** - Max 5 form submissions per hour per IP
- ✅ **Honeypot Fields** - Bot detection on public forms
- ✅ **Malicious Pattern Detection** - SQL injection, script tags blocked
- ✅ **IP Hashing** - Privacy-preserving abuse tracking
- ✅ **Audit Trail** - Immutable log of all admin actions
- ✅ **HTTPS Only** - Enforced secure connections
- ✅ **Security Headers** - CSP, X-Frame-Options, etc.

---

## 🏗️ Tech Stack

- **Frontend:** React 19 + TypeScript + TanStack Router + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** Render
- **Images:** Cloudinary
- **Security:** DOMPurify, bcrypt, RLS policies

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account
- Cloudinary account (already set up)
- Render account (already set up)

### Setup (30 minutes)

1. **Install dependencies** (already done)
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create project at [supabase.com](https://supabase.com)
   - Run `database/schema.sql` in SQL Editor
   - Get API keys from Settings → API

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Create first admin**
   - Create user in Supabase Auth
   - Add to `admin_users` table (see Quick Start guide)

5. **Start dev server**
   ```bash
   npm run dev
   ```

6. **Access admin**
   - Navigate to `http://localhost:5173/admin/login`
   - Login with your credentials
   - Explore the dashboard

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.ts       # Supabase client (anon key only)
│   ├── auth.ts           # Authentication logic
│   ├── security.ts       # Validation & sanitization
│   └── rateLimit.ts      # Rate limiting
├── components/
│   └── admin/
│       └── AdminGuard.tsx # Route protection
├── routes/
│   ├── admin/
│   │   ├── login.tsx      # ✅ Admin login
│   │   ├── index.tsx      # ✅ Dashboard home
│   │   ├── content.tsx    # ⏳ Content manager
│   │   ├── submissions.tsx # ⏳ Form submissions
│   │   └── users.tsx       # ⏳ User management
│   └── ...                 # Public routes
└── database/
    └── schema.sql          # PostgreSQL schema + RLS
```

---

## 🔐 Security Architecture

### Defense in Depth

1. **Client Layer**
   - Form validation
   - Input sanitization
   - Route guards (UX only)

2. **Network Layer**
   - HTTPS only
   - Security headers
   - Rate limiting

3. **Database Layer** (Primary Security Boundary)
   - Row Level Security (RLS)
   - Parameterized queries
   - Audit logging

### Attack Prevention

| Attack Vector | Prevention | Implementation |
|--------------|------------|----------------|
| XSS | DOMPurify sanitization | `security.ts` |
| SQL Injection | Supabase SDK (parameterized) | All queries |
| CSRF | Supabase session tokens | Built-in |
| Brute Force | Rate limiting | `rateLimit.ts` |
| Session Hijacking | HTTPS + httpOnly cookies | Supabase |
| Privilege Escalation | RLS policies | `schema.sql` |
| Data Leakage | Generic error messages | `auth.ts` |
| Bot Submissions | Honeypot fields | Public forms |

---

## 🧪 Testing

### Security Tests (Critical)

```bash
# 1. Try accessing /admin without login
curl http://localhost:5173/admin
# Expected: Redirect to /admin/login

# 2. Try querying submissions without admin role
# Open browser console on public page:
const { data } = await supabase.from('submissions').select('*');
# Expected: RLS error, no data returned

# 3. Try submitting script tag in form
# Fill form with: <script>alert('XSS')</script>
# Expected: Sanitized or rejected

# 4. Try rapid form submissions
# Submit form 6 times in a row
# Expected: 6th attempt blocked by rate limit
```

### Functionality Tests

- [ ] Admin can login
- [ ] Non-admin cannot access /admin
- [ ] Content edits save and appear on public site
- [ ] Form submissions are received
- [ ] Status changes work
- [ ] Owner can manage admin users
- [ ] Session expires after 30 min idle

---

## 🚨 Critical Security Reminders

### ❌ NEVER DO THIS

1. **Never commit `.env`** - Contains secret keys
2. **Never use service_role key in client** - Only anon key
3. **Never skip input sanitization** - All user input is untrusted
4. **Never expose raw IP addresses** - Hash for privacy
5. **Never log sensitive data** - Passwords, tokens, PII
6. **Never trust client-side validation** - Always validate server-side (RLS)
7. **Never hardcode credentials** - Use environment variables
8. **Never disable HTTPS in production** - Required for security
9. **Never skip audit logging** - Needed for forensics
10. **Never give editor role owner permissions** - Principle of least privilege

### ✅ ALWAYS DO THIS

1. **Always validate input** - Client AND server (RLS)
2. **Always sanitize output** - Prevent XSS
3. **Always use HTTPS** - No exceptions
4. **Always rate limit** - Public endpoints
5. **Always audit log** - Security-critical actions
6. **Always check RLS** - Test policies work
7. **Always rotate keys** - Regular key rotation
8. **Always backup database** - Regular automated backups
9. **Always monitor logs** - Watch for suspicious activity
10. **Always follow least privilege** - Minimum necessary permissions

---

## 📊 Monitoring & Maintenance

### Daily
- Check for new form submissions
- Review any error alerts

### Weekly
- Review audit logs for suspicious activity
- Check rate limit logs for abuse patterns
- Monitor Supabase usage metrics

### Monthly
- Review and update admin user list
- Test all security features
- Update dependencies
- Review and optimize database queries

### Quarterly
- Full security audit
- Penetration testing
- Update documentation
- Review and update RLS policies if needed

---

## 🐛 Troubleshooting

### Common Issues

**"RLS policy violation"**
- Check user is in `admin_users` table
- Verify session hasn't expired
- Try logging out and back in

**Forms not submitting**
- Check rate limiting isn't blocking
- Verify Supabase connection
- Check browser console for errors

**Content not updating**
- Clear React Query cache
- Check network tab for API errors
- Verify content exists in database

**Can't login**
- Verify user exists in Supabase Auth
- Check user is in `admin_users` table
- Try incognito mode (rule out cache)
- Check `.env` has correct Supabase URL/key

---

## 📞 Support

For issues specific to:
- **Supabase:** [Supabase Discord](https://discord.supabase.com)
- **React/Vite:** Stack Overflow
- **Security:** OWASP guidelines
- **This project:** Check documentation files first

---

## 📝 License

Proprietary - Yahaya Travel and Trade Co Ltd

---

## 🙏 Acknowledgments

Built with security-first principles following:
- OWASP Top 10
- Supabase Security Best Practices
- React Security Best Practices
- PostgreSQL Row Level Security Documentation

---

**Last Updated:** January 2027  
**Version:** 1.0.0 (Foundation Complete)  
**Status:** Ready for Content Manager implementation
