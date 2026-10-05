# Phase 5: Send Workflow - Testing Guide

## What Was Built

Phase 5 adds the **Send Quote** workflow:
- Generate secure access tokens for quotes
- Copy shareable quote link
- WhatsApp share button (wa.me link)
- Mark quote as "sent"
- Track when and who sent the quote

## Files Modified

### 1. **src/routes/admin/quotes.tsx**
- Added `SendQuoteModal` import
- Added `showSendModal` state
- Added `handleSendQuote()` and `handleQuoteSent()` handlers
- Added "Send Quote" button in View Quote modal (green button)
- Disabled button shows "Already Sent" for sent quotes

### 2. **src/components/quotes/SendQuoteModal.tsx** (Phase 5 - created earlier)
- Modal for sending quotes
- Token generation
- Copy link button
- WhatsApp share button
- Mark as sent confirmation

## Testing Steps (5 minutes)

### Test 1: Open Send Modal
1. Navigate to `/admin/quotes`
2. Click "View" (eye icon) on any quote
3. Click the green **"Send Quote"** button
4. ✅ Verify: SendQuoteModal opens

### Test 2: Generate Token and Copy Link
1. In the Send Modal, click **"Generate Link"**
2. ✅ Verify: A secure token is generated (shows in URL preview)
3. Click **"Copy Link"** button
4. ✅ Verify: "Link copied!" confirmation appears
5. Paste the link somewhere (notepad/browser) to verify format:
   ```
   http://localhost:3000/quote/view/<long-token-string>
   ```

### Test 3: WhatsApp Share
1. In the Send Modal, enter a client phone number (format: 2348012345678)
2. Click **"Share via WhatsApp"**
3. ✅ Verify: WhatsApp Web opens in new tab with pre-filled message:
   ```
   Hi [Client Name], your quote [QUOTE-XXX] is ready for review: [link]
   ```

### Test 4: Mark Quote as Sent
1. In the Send Modal, click **"Mark as Sent"**
2. ✅ Verify: Success message appears
3. ✅ Verify: Modal closes automatically
4. ✅ Verify: Quote status badge changes to "Sent" (blue badge)
5. ✅ Verify: Quote row shows updated status in table

### Test 5: Already Sent Quote
1. Click "View" on the same quote again
2. ✅ Verify: "Send Quote" button is disabled and shows "Already Sent"

### Test 6: View Public Quote (Token Access)
1. Copy the quote link from Test 2
2. Open the link in an **incognito/private browser window** (to simulate client)
3. ✅ Verify: Public quote page loads at `/quote/view/<token>`
4. ✅ Verify: Quote details display correctly
5. ✅ Verify: Client can see Accept/Request Changes/Decline buttons

## Expected Behavior

### Status Flow
```
draft → sent (Phase 5 - manual send)
sent → pending (client responds via public page)
pending → accepted/rejected/revision_requested (client choice)
```

### Token Security
- Token is SHA-256 hash (64 characters)
- Token stored in `quote_access_tokens` table
- Token validates via `validate_quote_token()` function
- Invalid token = 404 error page

### WhatsApp Link Format
```
https://wa.me/[phone]?text=[encoded message]
```
No API needed - uses web link only

## Common Issues

### Issue 1: "Generate Link" does nothing
**Solution:** Check browser console for errors. Verify `supabase.rpc('generate_quote_access_token')` function exists in database.

### Issue 2: WhatsApp share opens empty
**Solution:** Verify phone number format (no spaces, no +, just digits: 2348012345678)

### Issue 3: Public quote page 404
**Solution:** Verify token was generated. Check `quote_access_tokens` table has entry. Run database migration if needed.

### Issue 4: Import error - SendQuoteModal not found
**Solution:** Verify file exists at `src/components/quotes/SendQuoteModal.tsx` (created in Phase 5 earlier)

## Database Check

To verify token generation worked:

```sql
-- Check latest tokens
SELECT 
  id,
  quote_id,
  created_at,
  used_at,
  LEFT(token, 10) || '...' as token_preview
FROM quote_access_tokens
ORDER BY created_at DESC
LIMIT 5;
```

## Next Phase Preview

**Phase 6: Manual Response Recording + Versioning**
- Admin can manually record client responses (for offline/phone responses)
- Create quote revisions when changes requested
- Version history display
- Link revisions to original quotes

## Success Criteria

✅ SendQuoteModal opens from View Quote modal  
✅ Token generates successfully  
✅ Link copies to clipboard  
✅ WhatsApp share opens with pre-filled message  
✅ Quote status updates to "sent"  
✅ Public quote page loads with token  
✅ Sent quotes show disabled "Already Sent" button

---

**Phase 5 Status:** ✅ COMPLETE  
**Integration:** quotes.tsx updated, ready for testing  
**Next:** User testing, then proceed to Phase 6
