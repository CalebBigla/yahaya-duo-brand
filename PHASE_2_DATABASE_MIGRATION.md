# Phase 2: Database Migration - Complete

## Overview

Phase 2 adds the database infrastructure required for the complete quotation workflow:
- **Quote versioning** (revision tracking)
- **Response tracking** (client acceptance/decline/changes)
- **Access tokens** (secure public links)
- **Enquiry linking** (quotes → submissions)

---

## Files Created

### Database
- `database/quotation-workflow-migration.sql` - Complete migration script
- `database/apply-quotation-workflow.bat` - Windows batch helper

### TypeScript Libraries
- `src/lib/types/quotes.ts` - TypeScript type definitions
- `src/lib/quoteTokens.ts` - Token generation and validation
- `src/lib/quoteVersioning.ts` - Version history and revisions
- `src/lib/quoteResponses.ts` - Response recording and retrieval

---

## Database Changes

### New Tables

#### 1. `quote_responses`
Stores all client responses (online and manually recorded).

```sql
CREATE TABLE quote_responses (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  response_type TEXT CHECK (response_type IN ('accepted', 'declined', 'revision_requested')),
  response_method TEXT CHECK (response_method IN ('online', 'phone', 'whatsapp', 'email', 'in_person', 'other')),
  response_notes TEXT,
  requested_changes TEXT,
  decline_reason TEXT,
  responded_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES auth.users(id), -- NULL for online
  client_ip_hash TEXT,
  created_at TIMESTAMPTZ
);
```

#### 2. `quote_access_tokens`
Secure tokens for public quotation access.

```sql
CREATE TABLE quote_access_tokens (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INT DEFAULT 0
);
```

### Updated Tables

#### `quotes` table - New columns:
- `enquiry_id` - Links to submissions table
- `version_number` - Version tracking (1, 2, 3, etc.)
- `parent_quote_id` - Reference to previous version
- `superseded_by_quote_id` - Reference to newer version
- `is_current_version` - TRUE for active version
- `sent_at` - When quote was sent
- `sent_by` - Admin user who sent it

#### `quotes` table - Updated status enum:
Added: `'sent'`, `'revision_requested'`

Now supports: `'draft' | 'sent' | 'pending' | 'accepted' | 'rejected' | 'expired' | 'revision_requested'`

---

## Database Functions

### 1. `generate_quote_access_token(quote_id, days_valid)`
Generates a secure SHA-256 token for quote access.

**Usage:**
```sql
SELECT generate_quote_access_token('quote-uuid-here', 30);
-- Returns: 'a1b2c3d4e5f6...' (64 character hex string)
```

### 2. `validate_quote_token(token)`
Validates a token and returns quote_id if valid.

**Usage:**
```sql
SELECT * FROM validate_quote_token('token-string-here');
-- Returns: quote_id, is_valid, is_expired, token_id
```

### 3. `create_quote_revision(parent_quote_id, user_id)`
Creates a new version of an existing quote.

**Usage:**
```sql
SELECT create_quote_revision('parent-quote-uuid', 'user-uuid');
-- Returns: new_quote_id
```

---

## Row Level Security (RLS)

### `quote_responses`
- ✅ **Admin users:** Full read access
- ✅ **Admin users:** Can insert (for manual recording)
- ✅ **Public:** Can insert online responses
- ❌ **No updates or deletes** (immutable records)

### `quote_access_tokens`
- ✅ **Admin users:** Full CRUD access
- ✅ **Public:** Can read valid (non-expired) tokens
- ❌ **Public:** Cannot create/update/delete

---

## Views Created

### 1. `current_quotes`
Filters to show only current versions (not superseded).

```sql
SELECT * FROM current_quotes;
-- Only returns quotes where is_current_version = TRUE
```

### 2. `quotes_with_responses`
Joins quotes with their latest response.

```sql
SELECT * FROM quotes_with_responses;
-- Returns quotes with latest_response_type, latest_response_date, etc.
```

---

## Migration Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project
   - Navigate to **SQL Editor**

2. **Run Migration**
   - Click **New Query**
   - Copy contents of `database/quotation-workflow-migration.sql`
   - Paste and click **Run**

3. **Verify Success**
   - Check for success message in output
   - Go to **Table Editor** and verify new tables exist:
     - `quote_responses`
     - `quote_access_tokens`
   - Check `quotes` table for new columns

### Option 2: psql Command Line

```bash
# Navigate to database folder
cd database

# Run migration
psql "postgresql://[user]:[password]@[host]:[port]/[database]" \
  -f quotation-workflow-migration.sql
```

### Option 3: Node.js Script

```bash
# Create a migration script
node database/run-migration.js
```

---

## Testing the Migration

### 1. Verify Tables Exist

```sql
-- Check new tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('quote_responses', 'quote_access_tokens');
-- Should return 2 rows

-- Check quotes table columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'quotes' 
  AND column_name IN ('enquiry_id', 'version_number', 'parent_quote_id', 'sent_at');
-- Should return 4 rows
```

### 2. Test Token Generation

```sql
-- Generate a token for a test quote
SELECT generate_quote_access_token(
  (SELECT id FROM quotes LIMIT 1), 
  30
);
-- Should return a 64-character hex string

-- Validate the token
SELECT * FROM validate_quote_token('paste-token-here');
-- Should return valid data with is_valid = true
```

### 3. Test Quote Revision

```sql
-- Create a test revision
SELECT create_quote_revision(
  (SELECT id FROM quotes WHERE is_current_version = TRUE LIMIT 1),
  (SELECT user_id FROM admin_users LIMIT 1)
);
-- Should return new quote UUID

-- Verify version numbers
SELECT quote_number, version_number, is_current_version 
FROM quotes 
ORDER BY version_number;
-- Should show v1 with is_current_version = FALSE
-- and v2 with is_current_version = TRUE
```

### 4. Test RLS Policies

```sql
-- As admin user (authenticated)
SET ROLE authenticated;
SELECT * FROM quote_responses; -- Should work

-- As public (unauthenticated)
SET ROLE anon;
SELECT * FROM quote_responses; -- Should return empty (RLS blocks)

-- Reset
RESET ROLE;
```

---

## Rollback Procedure

If you need to undo the migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS quote_responses CASCADE;
DROP TABLE IF EXISTS quote_access_tokens CASCADE;

-- Remove new columns from quotes
ALTER TABLE quotes 
  DROP COLUMN IF EXISTS enquiry_id,
  DROP COLUMN IF EXISTS version_number,
  DROP COLUMN IF EXISTS parent_quote_id,
  DROP COLUMN IF EXISTS superseded_by_quote_id,
  DROP COLUMN IF EXISTS is_current_version,
  DROP COLUMN IF EXISTS sent_at,
  DROP COLUMN IF EXISTS sent_by;

-- Restore original status constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('draft', 'pending', 'accepted', 'rejected', 'expired'));

-- Drop functions
DROP FUNCTION IF EXISTS generate_quote_access_token(UUID, INT);
DROP FUNCTION IF EXISTS validate_quote_token(TEXT);
DROP FUNCTION IF EXISTS create_quote_revision(UUID, UUID);

-- Drop views
DROP VIEW IF EXISTS current_quotes;
DROP VIEW IF EXISTS quotes_with_responses;
```

---

## TypeScript Integration

After running the migration, the TypeScript types are already created in:
- `src/lib/types/quotes.ts`

Import and use:

```typescript
import type { Quote, QuoteResponse, QuoteAccessToken } from '@/lib/types/quotes';
import { generateQuoteToken, validateQuoteToken } from '@/lib/quoteTokens';
import { createQuoteRevision, getQuoteVersionHistory } from '@/lib/quoteVersioning';
import { recordCustomerResponse, submitClientResponse } from '@/lib/quoteResponses';
```

---

## Existing Data Impact

### Safe Operations ✅
- All existing quotes remain intact
- Existing quote numbers unchanged
- Existing RLS policies preserved
- No data loss

### Automatic Updates ✅
- All existing quotes set to `version_number = 1`
- All existing quotes set to `is_current_version = TRUE`
- All existing columns retain their values

---

## Next Steps

After successful migration:

1. ✅ **Phase 2 Complete** - Database ready
2. ⏭️ **Phase 3** - Enhance admin quote creation
3. ⏭️ **Phase 4** - Build public quotation page
4. ⏭️ **Phase 5** - Add send workflow
5. ⏭️ **Phase 6** - Add response recording UI

---

## Troubleshooting

### Error: "relation already exists"
**Cause:** Tables already created  
**Solution:** Either use `IF NOT EXISTS` (already in script) or drop tables first

### Error: "column already exists"
**Cause:** Columns already added  
**Solution:** Use `IF NOT EXISTS` (already in script)

### Error: "constraint does not exist"
**Cause:** First-time migration  
**Solution:** Ignore, this is normal for `DROP CONSTRAINT IF EXISTS`

### Error: "permission denied"
**Cause:** Insufficient database privileges  
**Solution:** Run as database owner or user with CREATE privileges

### Error: "function does not exist"
**Cause:** RPC functions not created  
**Solution:** Re-run the migration, check for previous errors

---

## Support

If you encounter issues:

1. Check Supabase logs (Dashboard → Logs)
2. Verify your Supabase user has admin privileges
3. Ensure no active transactions are blocking DDL changes
4. Try running migration commands one section at a time

---

**Migration Status:** ✅ Ready to Deploy  
**Last Updated:** October 3, 2026  
**Version:** 1.0.0
