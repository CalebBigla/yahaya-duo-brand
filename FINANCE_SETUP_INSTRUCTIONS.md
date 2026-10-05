# Finance Module Setup Instructions

## Current Issue
❌ **Error:** `relation "financial_categories" does not exist`

This means the Finance Module database tables haven't been created yet.

---

## Solution: Run the Setup Script

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Complete Setup
1. Open the file: `database/SETUP_FINANCE_MODULE.sql`
2. Copy the **ENTIRE file contents**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Expected Result:**
```
Finance Module Setup Complete!
Total Categories Created: 29
Income Categories: 13
Expense Categories: 16
```

This will create:
- ✅ 3 tables (financial_categories, financial_transactions, expense_transactions)
- ✅ 2 auto-ref generator functions (INC-0001, EXP-0001)
- ✅ All necessary triggers
- ✅ RLS policies for owner-only access
- ✅ 29 pre-defined categories

### Step 3: Register Yourself as Owner

After the tables are created, check if you're registered as an owner:

```sql
SELECT user_id, role FROM admin_users WHERE user_id = auth.uid();
```

**If you see NO results or role = 'editor':**

1. Get your user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
```
*(Replace YOUR_EMAIL_HERE with your actual login email)*

2. Register as owner (replace YOUR_USER_ID with the UUID from above):
```sql
INSERT INTO admin_users (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```

### Step 4: Verify Everything Works

1. **Refresh your Finance admin page** in the browser
2. **Open browser console** (F12)
3. You should see:
   ```
   ✅ Categories loaded: 13 items
   [Table showing categories]
   ```
4. **Click "Record Income"** button
5. **Category dropdown should show:**
   - Travel: Visa Processing
   - Travel: Flight Booking
   - Travel: Hotel Reservation
   - Trade: Sourcing & Procurement
   - Trade: General Trading
   - etc.

---

## If You Still Have Issues

### Issue: Permission Denied Error
**Error:** `permission denied for table financial_categories`

**Cause:** You're not registered as 'owner' in admin_users

**Fix:** Follow Step 3 above to register as owner

---

### Issue: Function update_updated_at_column does not exist
**Cause:** Your main schema hasn't been run

**Fix:** Run `database/schema-fixed.sql` first, then run `SETUP_FINANCE_MODULE.sql`

---

### Issue: Table clients/quotes/submissions does not exist
**Cause:** The finance module references other tables that don't exist

**Fix:** These are optional foreign keys. You can either:
1. Run your main schema files first
2. Or ignore the warnings (won't affect functionality)

---

## Quick Summary

**What to run:**
1. `database/SETUP_FINANCE_MODULE.sql` ← **Run this entire file**
2. Check and register as owner if needed
3. Refresh Finance page

**Expected outcome:**
- Finance page loads without errors
- Category dropdowns are populated
- Can record income transactions
- Stats show ₦0.00 (no transactions yet)

---

## Need Help?

Share these details:
1. Any error messages from Supabase SQL Editor
2. Result of: `SELECT COUNT(*) FROM financial_categories;`
3. Result of: `SELECT user_id, role FROM admin_users WHERE user_id = auth.uid();`
4. Browser console output (F12)
