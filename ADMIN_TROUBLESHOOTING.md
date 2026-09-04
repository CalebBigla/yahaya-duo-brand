# Admin Login Troubleshooting Guide

## Issue: "Invalid credentials" error when credentials are correct

### Diagnosis Steps:

#### 1. Verify User Exists in Supabase Auth

Go to your Supabase Dashboard:
1. Navigate to: https://cyewsomhrdfqhlzjfeka.supabase.co
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. Look for your user with ID: `ee40eb1a-9378-4158-b8cf-b1ba1b9534db`

**If the user DOES NOT exist:**
- You need to create a new user first (see "Create Admin User" section below)

**If the user EXISTS:**
- Check the email address
- Check if "Email Confirmed" column shows `true`
- If not confirmed, click the user and click "Confirm email"

#### 2. Check Admin Users Table

In Supabase Dashboard:
1. Click **Table Editor** in the left sidebar
2. Select the `admin_users` table
3. Verify there's a row with `user_id = ee40eb1a-9378-4158-b8cf-b1ba1b9534db`

**Expected result:**
```
user_id: ee40eb1a-9378-4158-b8cf-b1ba1b9534db
role: owner
added_at: <timestamp>
added_by: null
```

If missing, run this in SQL Editor:
```sql
INSERT INTO admin_users (user_id, role) 
VALUES ('ee40eb1a-9378-4158-b8cf-b1ba1b9534db', 'owner');
```

---

## Create Admin User (If Doesn't Exist)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to: https://cyewsomhrdfqhlzjfeka.supabase.co
2. Click **Authentication** → **Users**
3. Click **Add user** button
4. Fill in:
   - **Email:** your-email@example.com
   - **Password:** your-secure-password
   - **Auto Confirm User:** ✅ Check this box (important!)
5. Click **Create user**
6. Copy the generated User UID (e.g., `ee40eb1a-9378-4158-b8cf-b1ba1b9534db`)

7. Go to **SQL Editor**
8. Run:
```sql
INSERT INTO admin_users (user_id, role) 
VALUES ('paste-the-user-uid-here', 'owner');
```

### Option B: Via SQL (Create user directly)

⚠️ **Warning:** This bypasses Supabase's built-in auth security. Only use for testing locally.

1. Go to **SQL Editor**
2. Run:
```sql
-- This creates a user directly in auth.users
-- Replace with your desired email and password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'ee40eb1a-9378-4158-b8cf-b1ba1b9534db',
  'authenticated',
  'authenticated',
  'admin@yahayatraveltrade.com',
  crypt('YourSecurePassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

-- Then add to admin_users table
INSERT INTO admin_users (user_id, role) 
VALUES ('ee40eb1a-9378-4158-b8cf-b1ba1b9534db', 'owner');
```

⚠️ **Note:** Direct insertion into `auth.users` is not recommended for production. Use the Dashboard method instead.

---

## Reset User Password

If you forgot the password:

### Option 1: Via Dashboard
1. Go to **Authentication** → **Users**
2. Click on the user
3. Scroll to **User Management** section
4. Click **Send password recovery email**
5. Check your email and follow the reset link

### Option 2: Via SQL (Development Only)
```sql
-- WARNING: Only for development/testing
-- This sets a new password directly
UPDATE auth.users 
SET encrypted_password = crypt('NewPassword123', gen_salt('bf'))
WHERE id = 'ee40eb1a-9378-4158-b8cf-b1ba1b9534db';
```

---

## Check Browser Console for Errors

1. Open the login page: http://localhost:5173/admin/login
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Try logging in again
5. Look for error messages

Common errors:
- `JWT expired` → Session expired, refresh the page
- `Invalid login credentials` → Wrong email/password or user doesn't exist
- `Email not confirmed` → Need to confirm email in Supabase Dashboard
- `Network error` → Check if Supabase URL is correct in .env

---

## Enable Better Error Messages (Development Only)

Temporarily modify `src/lib/auth.ts` to see the actual error:

Find this line (around line 62):
```typescript
return {
  success: false,
  error: 'Invalid credentials. Please try again.',
};
```

Change to:
```typescript
return {
  success: false,
  error: `DEBUG: ${error.message}`, // Shows actual error
};
```

⚠️ **Remember to change it back after debugging!** Never show detailed errors in production.

---

## Verify Environment Variables Are Loaded

In your browser console (F12), type:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Expected output:
```
https://cyewsomhrdfqhlzjfeka.supabase.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If you see `undefined`:
1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh the page (Ctrl+Shift+R)

---

## Test Authentication Directly

Create a test file to check if Supabase auth works:

Create: `src/test-auth.html` (temporary file)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Supabase Auth</title>
</head>
<body>
  <h1>Test Supabase Authentication</h1>
  <input id="email" type="email" placeholder="Email" />
  <input id="password" type="password" placeholder="Password" />
  <button onclick="testLogin()">Test Login</button>
  <pre id="result"></pre>

  <script type="module">
    import { createClient } from '@supabase/supabase-js';

    const supabase = createClient(
      'https://cyewsomhrdfqhlzjfeka.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXdzb21ocmRmcWhsempmZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDY4NDEsImV4cCI6MjEwMzY4Mjg0MX0.NGoRi-5bVFmfUq1er_RCEmJw2bnAB4mRo_s_mtwTBrk'
    );

    window.testLogin = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const result = document.getElementById('result');

      result.textContent = 'Testing...';

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          result.textContent = `ERROR: ${error.message}`;
        } else {
          result.textContent = `SUCCESS!\n\nUser ID: ${data.user.id}\nEmail: ${data.user.email}`;
        }
      } catch (err) {
        result.textContent = `EXCEPTION: ${err.message}`;
      }
    };
  </script>
</body>
</html>
```

Access via: `http://localhost:5173/test-auth.html`

---

## Quick Fix Checklist

- [ ] User exists in Supabase Auth (Authentication → Users)
- [ ] Email is confirmed (check "Email Confirmed" column)
- [ ] User exists in `admin_users` table with role 'owner'
- [ ] `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Dev server was restarted after .env changes
- [ ] Browser console shows no CORS or network errors
- [ ] Password meets Supabase's minimum requirements (usually 6+ characters)

---

## Still Not Working?

Check Supabase project settings:
1. Go to **Settings** → **Authentication**
2. Check **User Signups** section:
   - If "Enable email signups" is disabled, you can't create users
   - If "Enable email confirmations" is enabled, users must confirm email
3. Check **Email Auth** section:
   - Confirm email confirmation is not blocking login

---

**Need more help?** Check the browser console errors or Supabase logs for specific error messages.
