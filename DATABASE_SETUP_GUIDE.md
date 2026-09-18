# Database Setup Guide - Apply Quotes Schema

Since you can't access Supabase directly right now, here are **3 easy ways** to apply the quotes schema:

---

## ✅ OPTION 1: Via Supabase Dashboard (EASIEST)

1. Open your browser and go to: **https://supabase.com/dashboard**
2. Sign in to your account
3. Select your project
4. Click **"SQL Editor"** in the left sidebar
5. Click **"New Query"** button
6. Open the file: `database/quotes-schema.sql` in a text editor
7. **Copy all the SQL code** (Ctrl+A, then Ctrl+C)
8. **Paste it** into the Supabase SQL Editor
9. Click **"Run"** button (or press Ctrl+Enter)
10. ✅ Done! Your quotes table is now created

---

## ✅ OPTION 2: Using Supabase API (Command Line)

If you have PowerShell or curl installed:

### Using PowerShell:

```powershell
# Navigate to database folder
cd database

# Read the SQL file
$sql = Get-Content quotes-schema.sql -Raw

# Get your Supabase credentials from .env
$url = "YOUR_SUPABASE_URL"  # From .env file
$key = "YOUR_ANON_KEY"       # From .env file

# This method requires Supabase to have a direct SQL execution endpoint
# Note: Standard Supabase doesn't expose this for security reasons
```

**Note:** This method is limited because Supabase doesn't expose direct SQL execution via API for security reasons.

---

## ✅ OPTION 3: Quick Copy-Paste Instructions

### The Quotes Schema SQL:

The file is located at: `database/quotes-schema.sql`

You can open it in:
- **Notepad**: Right-click → Open With → Notepad
- **VS Code**: Double-click the file
- **Any text editor**

Then:
1. Select all text (Ctrl+A)
2. Copy (Ctrl+C)
3. Go to Supabase Dashboard → SQL Editor
4. Paste (Ctrl+V)
5. Run the query

---

## What This Schema Creates:

### 📊 **quotes** table:
- Quote number generation (QT-2026-001 format)
- Client linking
- Line items (stored as JSON)
- Tax calculations
- Status workflow (draft → pending → accepted/rejected/expired)
- Automatic timestamps
- Full security policies (RLS)

### 🔧 **Helper functions**:
- `generate_quote_number()` - Auto-generates sequential quote numbers
- `update_quotes_updated_at()` - Auto-updates timestamps

### 🔒 **Security**:
- Row Level Security (RLS) enabled
- Only admin users can access quotes
- Proper constraints and validations

---

## Verification

After running the SQL, verify it worked:

1. Go to **Supabase Dashboard** → **Table Editor**
2. You should see a new table called **"quotes"**
3. Click on it to see the structure
4. You should see columns: id, quote_number, client_id, title, items, total_amount, status, etc.

---

## Already Have Quotes Table?

If you already have a quotes table and want to update it:

1. **Option A**: Drop the old table first:
   ```sql
   DROP TABLE IF EXISTS quotes CASCADE;
   ```
   Then run the new schema.

2. **Option B**: Skip creation if errors occur (it's safe - the schema uses `IF NOT EXISTS`)

---

## Need Help?

If you're stuck:
1. Make sure you're logged into Supabase
2. Make sure you're in the correct project
3. Check that you have admin/owner permissions
4. The SQL should run without errors

If you see errors about existing tables, that's okay - it means the table already exists!

---

## After Setup is Complete:

Once the quotes table is created, the Quotes Management module will work automatically:
- ✅ Create quotes
- ✅ Edit quotes  
- ✅ Track status
- ✅ Generate quote numbers
- ✅ Link to clients
- ✅ Export data

Ready to go! 🚀
