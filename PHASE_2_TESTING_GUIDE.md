# Phase 2: Finance Module - Testing Guide

## ✅ What Was Built

**Finance Module (Income Tracking)**
- Complete Finance admin page at `/admin/finance`
- Record income transactions
- Search & filter functionality
- Dynamic categories from database
- Client/quote linking
- Transaction detail view
- Revenue statistics

## 🧪 Testing Steps (10 minutes)

### Test 1: Access Finance Page
1. Start dev server: `npm run dev`
2. Login to admin dashboard
3. **Check sidebar** → Should see "Finance" link after "Quotes"
4. Click **Finance**
5. ✅ Verify: Page loads with empty state

### Test 2: View Seeded Categories
1. Open browser DevTools → Console
2. Run this in console:
```javascript
// Check categories loaded
const checkCategories = async () => {
  const { data } = await supabase.from('financial_categories').select('*');
  console.table(data);
};
checkCategories();
```
3. ✅ Verify: Should see 23 categories (Travel/Trade/Company income)

### Test 3: Record First Income Transaction
1. Click **"Record Income"** button (green, top right)
2. Fill form:
   - **Amount:** 250000
   - **Date:** Today
   - **Division:** Travel
   - **Category:** Visa Processing
   - **Client:** (leave empty or select one)
   - **Payment Method:** Bank Transfer
   - **Description:** "Visa processing service for UK application"
3. Click **"Record Income"**
4. ✅ Verify: Success message appears
5. ✅ Verify: Modal closes
6. ✅ Verify: Transaction appears in list with ref **INC-0001**

### Test 4: Record Multiple Transactions
Record 3 more transactions with different divisions:

**Transaction 2 (Trade):**
- Amount: 500000
- Division: Trade
- Category: Sourcing & Procurement
- Description: "Product sourcing for client ABC"

**Transaction 3 (Travel):**
- Amount: 180000
- Division: Travel
- Category: Flight Booking
- Description: "Lagos to London flight tickets"

**Transaction 4 (Company):**
- Amount: 50000
- Division: Company
- Category: (none will appear - this is expected, company has no income categories)

**Expected:** Transaction 4 should fail or you'll need to add a company income category first.

4. ✅ Verify: References increment (INC-0002, INC-0003, etc.)

### Test 5: Check Revenue Stats
After recording transactions, check the stat cards at top:
- **Total Revenue:** Should show sum of all transactions
- **Travel Revenue:** Should show ₦430,000 (250k + 180k)
- **Trade Revenue:** Should show ₦500,000
- **Transactions:** Should show count (3 or 4)

✅ Verify: Math is correct

### Test 6: Test Search
1. Type "visa" in search box
2. ✅ Verify: Only shows Transaction 1 (Visa processing)
3. Clear search
4. Type "INC-0002"
5. ✅ Verify: Only shows Transaction 2

### Test 7: Test Filters
1. Click **"Filters"** button
2. Select **Division: Travel**
3. ✅ Verify: Only shows Travel transactions (INC-0001, INC-0003)
4. Change to **Division: Trade**
5. ✅ Verify: Only shows Trade transaction (INC-0002)
6. Select **Category filter** → Pick "Flight Booking"
7. ✅ Verify: Only shows INC-0003

### Test 8: View Transaction Detail
1. Click **eye icon** on any transaction
2. ✅ Verify: Modal opens showing full details:
   - Amount (large, green)
   - Division, Category
   - Payment Method
   - Client (if linked)
   - Description
   - Internal Notes (if added)

### Test 9: Link to Client
1. Create a test client first (if you don't have one):
   - Go to `/admin/clients`
   - Add client: "Test Company Ltd"
2. Go back to Finance
3. Click **"Record Income"**
4. Fill form and **select the client** you created
5. Record transaction
6. ✅ Verify: Transaction shows client name in list
7. View detail
8. ✅ Verify: Client name appears in detail view

### Test 10: Link to Quote
1. Create a test quote first (if you don't have one):
   - Go to `/admin/quotes`
   - Create quote: Status "Accepted", Amount ₦300,000
2. Go back to Finance
3. Click **"Record Income"**
4. Amount: **₦150,000** (NOT the full quote amount - intentional)
5. Select the **Related Quote**
6. Record transaction
7. ✅ Verify: Transaction saves with ACTUAL amount (150k, not quote's 300k)
8. **This proves:** Quotes ≠ Revenue (manual entry only)

## 🐛 Common Issues

### Issue 1: "Finance" link not showing
**Solution:** Clear browser cache or hard refresh (Ctrl+Shift+R)

### Issue 2: Categories dropdown empty
**Solution:** Check database - run seed data from finance-schema.sql again

### Issue 3: Transaction ref not auto-generating
**Solution:** Check trigger function - re-run finance-schema.sql

### Issue 4: Permission error when recording income
**Solution:** Check RLS policies - you must be logged in as owner role

### Issue 5: Stats not updating after recording
**Solution:** Click "Refresh" button or reload page

## ✅ Success Criteria

After testing, you should have:
- ✅ Finance page accessible from sidebar
- ✅ Income transactions recorded with auto-generated INC-XXXX refs
- ✅ Revenue stats showing correct totals
- ✅ Search and filters working
- ✅ Transaction detail view working
- ✅ Dynamic categories loading from database
- ✅ Client/quote linking working (optional)
- ✅ **Quote amount ≠ Revenue amount** (manual entry preserved)

## 📊 Database Verification

Check database directly:

```sql
-- View all income transactions
SELECT transaction_ref, amount, division, transaction_date, description
FROM financial_transactions
ORDER BY transaction_date DESC;

-- Check revenue totals
SELECT 
  division,
  COUNT(*) as count,
  SUM(amount) as total
FROM financial_transactions
GROUP BY division;

-- View categories
SELECT type, division, name, is_active
FROM financial_categories
WHERE type = 'income'
ORDER BY division, display_order;
```

## 🎯 Next Steps

After successful testing:

**Phase 3: Expenses Module**
- Similar to Finance page
- Record expenses (vendor, receipt upload later)
- Division: Travel/Trade/Company
- Auto-refs: EXP-0001, EXP-0002...

**Phase 4: Monthly Reports**
- Date range filters
- Revenue vs Expenses
- Breakdown by category

**Phase 5: Dashboard KPIs**
- Update main dashboard
- Add financial stats cards
- Charts (Revenue by Division, etc.)

---

**Phase 2 Status:** ✅ COMPLETE  
**Testing:** In Progress  
**Next:** Phase 3 - Expenses Module
