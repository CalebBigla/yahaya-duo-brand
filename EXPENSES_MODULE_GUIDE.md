# Expenses Module - Complete Guide

## Overview
The Expenses Management module allows you to track and manage all business expenses across Travel, Trade, and Company divisions.

---

## Prerequisites

Before using the Expenses module, ensure:

1. ✅ **Finance Module Database** is set up
   - Run `database/SETUP_FINANCE_MODULE.sql` in Supabase SQL Editor
   - This creates the `expense_transactions` table and expense categories

2. ✅ **You're registered as 'owner'** in admin_users table
   - Check with: `SELECT user_id, role FROM admin_users WHERE user_id = auth.uid();`
   - If not, follow the instructions in `FINANCE_SETUP_INSTRUCTIONS.md`

3. ✅ **Expense categories exist**
   - The setup script seeds 16 expense categories
   - 6 Travel expenses
   - 5 Trade expenses
   - 10 Company expenses (shared overhead)

---

## Features

### 🎯 Core Features
- ✅ **Record Expenses** - Add new expense transactions
- ✅ **Edit Expenses** - Modify existing expenses
- ✅ **Delete Expenses** - Remove expense records
- ✅ **View Details** - See full expense information
- ✅ **Search & Filter** - Find expenses by multiple criteria
- ✅ **Stats Dashboard** - Real-time expense analytics

### 💰 Expense Tracking
- **Auto-generated References**: EXP-0001, EXP-0002, etc.
- **NGN Currency Only**: All amounts in Nigerian Naira
- **Division-based**: Travel, Trade, or Company expenses
- **Dynamic Categories**: Categories loaded from database
- **Vendor Tracking**: Record supplier/vendor names
- **Payment Methods**: Bank transfer, Cash, POS, Online, Other
- **External References**: Link to invoices, receipts, POs
- **Notes Support**: Additional details up to 2000 characters

### 📊 Statistics
- **Total Expenses** - All divisions combined
- **Travel Expenses** - Travel-specific costs
- **Trade Expenses** - Trade-related expenses
- **Company Expenses** - Overhead and operational costs
- **Transaction Count** - Number of expense records

### 🔍 Filtering & Search
- **Search**: Find by expense ref, vendor, description, or external ref
- **Division Filter**: Travel, Trade, Company, or All
- **Category Filter**: Filter by expense category
- **Month Filter**: View expenses by month

---

## Navigation

Access the Expenses module:
1. Log in to Admin Dashboard
2. Click **Expenses** in the left sidebar (TrendingDown icon)
3. URL: `/admin/expenses`

---

## How to Use

### Recording a New Expense

1. Click **"Record Expense"** button (top right)
2. Fill in the form:

   **Required Fields:**
   - **Division**: Travel, Trade, or Company
   - **Category**: Expense category (filtered by division)
   - **Amount**: Expense amount in NGN
   - **Expense Date**: Date of the expense
   - **Vendor/Supplier Name**: Who you paid
   - **Payment Method**: How you paid
   - **Description**: Brief description (max 500 chars)

   **Optional Fields:**
   - **External Reference**: Invoice number, PO number, etc.
   - **Additional Notes**: Detailed information (max 2000 chars)

3. Click **"Record Expense"**

**Result:**
- Expense saved with auto-generated ref (e.g., EXP-0001)
- Appears in expense list immediately
- Stats updated in real-time

---

### Editing an Expense

1. Find the expense in the table
2. Click the **Edit icon** (pencil)
3. Modify the fields
4. Click **"Update Expense"**

**Note:** Expense reference cannot be changed (auto-generated)

---

### Viewing Expense Details

1. Find the expense in the table
2. Click the **View icon** (eye)
3. See full details including:
   - Expense reference and date
   - Amount and payment method
   - Division and category
   - Vendor name
   - External reference
   - Description and notes
   - Created/updated timestamps

---

### Deleting an Expense

1. Find the expense in the table
2. Click the **Delete icon** (trash)
3. Confirm deletion

**Warning:** This action cannot be undone!

---

### Using Filters

**Search Bar:**
- Type vendor name, expense ref, description, or external ref
- Updates results instantly

**Division Filter:**
- Select: All Divisions, Travel, Trade, or Company
- Categories filter updates automatically

**Category Filter:**
- Shows categories for selected division
- Select specific category to narrow results

**Month Filter:**
- View expenses for specific month
- Months generated from existing expense dates

**Clear Filters:**
- Click "Clear Filters" button to reset all filters

---

## Expense Categories

### Travel Division Expenses (6 categories)
1. **Visa Processing Costs** - Embassy fees, visa processing
2. **Flight & Airline Costs** - Ticket purchases, airline payments
3. **Hotel & Accommodation** - Hotel payments, accommodation
4. **Tour Operations** - Tour guide fees, activity costs
5. **Transportation** - Local transport, vehicle rentals
6. **Other Travel Expenses** - Other travel-related expenses

### Trade Division Expenses (5 categories)
1. **Product Procurement** - Supplier payments, product purchases
2. **Logistics & Shipping** - Freight, shipping, delivery
3. **Customs & Duties** - Import/export duties, customs
4. **Supplier Payments** - Vendor and supplier payments
5. **Other Trade Expenses** - Other trade-related expenses

### Company Expenses (10 categories)
1. **Salaries & Wages** - Staff salaries, wages, bonuses
2. **Office Rent** - Office space rental payments
3. **Utilities** - Electricity, water, internet
4. **Marketing & Advertising** - Marketing campaigns, ads
5. **Software & Subscriptions** - SaaS tools, software licenses
6. **Office Supplies** - Stationery, equipment, supplies
7. **Professional Services** - Legal, accounting, consulting
8. **Bank Charges & Fees** - Transaction fees, bank charges
9. **Transportation & Fuel** - Company vehicles, fuel
10. **Other Company Expenses** - Miscellaneous company expenses

---

## Example Workflows

### Recording a Travel Expense

**Scenario:** Paid hotel for client's accommodation

1. Click "Record Expense"
2. Select:
   - Division: **Travel**
   - Category: **Hotel & Accommodation**
   - Amount: **150,000.00** NGN
   - Date: **Today**
   - Vendor: **Sheraton Hotel Abuja**
   - Payment: **Bank Transfer**
   - External Ref: **INV-2024-1234**
   - Description: **Client accommodation for 3 nights**
3. Click "Record Expense"
4. Result: **EXP-0001** created

---

### Recording a Trade Expense

**Scenario:** Paid shipping for imported goods

1. Click "Record Expense"
2. Select:
   - Division: **Trade**
   - Category: **Logistics & Shipping**
   - Amount: **85,500.00** NGN
   - Date: **Today**
   - Vendor: **DHL Nigeria**
   - Payment: **Bank Transfer**
   - External Ref: **SHIP-456789**
   - Description: **Shipping costs for electronic goods from China**
   - Notes: **Container #CONT123, Arrived Lagos Port**
3. Click "Record Expense"
4. Result: **EXP-0002** created

---

### Recording Company Overhead

**Scenario:** Paid monthly office rent

1. Click "Record Expense"
2. Select:
   - Division: **Company**
   - Category: **Office Rent**
   - Amount: **500,000.00** NGN
   - Date: **Today**
   - Vendor: **Property Management Ltd**
   - Payment: **Bank Transfer**
   - External Ref: **RENT-OCT-2026**
   - Description: **October 2026 office rent**
3. Click "Record Expense"
4. Result: **EXP-0003** created

---

## Stats Dashboard

The top of the page shows 4 stat cards:

### Total Expenses
- Sum of ALL expenses across all divisions
- Total transaction count

### Travel Expenses
- Sum of expenses in Travel division

### Trade Expenses
- Sum of expenses in Trade division

### Company Expenses
- Sum of expenses in Company division

**Real-time Updates:** Stats refresh automatically when you add/edit/delete expenses.

---

## Database Schema

### expense_transactions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| expense_ref | TEXT | Auto-generated (EXP-0001) |
| amount | NUMERIC(15,2) | Expense amount in NGN |
| division | TEXT | travel, trade, or company |
| category_id | UUID | References financial_categories |
| vendor_name | TEXT | Supplier/vendor name |
| payment_method | TEXT | bank_transfer, cash, pos, online, other |
| external_ref | TEXT | Invoice/PO number (optional) |
| receipt_url | TEXT | Receipt URL (Phase 6 - Cloudinary) |
| description | TEXT | Brief description (max 500) |
| notes | TEXT | Additional details (max 2000) |
| expense_date | DATE | Date of expense |
| created_by | UUID | User who created it |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

## Permissions

### Owner Access
- ✅ View all expenses
- ✅ Create new expenses
- ✅ Edit expenses
- ✅ Delete expenses
- ✅ View full details

### Editor Access
- ❌ **No access** (owner-only module)

**Note:** Phase 3+ will add granular permissions for editors to view/create expenses.

---

## Integration with Finance Module

### Relationship
- **Finance Module** tracks **Income** (financial_transactions table)
- **Expenses Module** tracks **Expenses** (expense_transactions table)
- Both share the same **Categories** (financial_categories table)

### Future Integration
- **Dashboard KPIs** will show:
  - Total Revenue (from Finance)
  - Total Expenses (from Expenses)
  - Net Profit/Loss
  - Revenue vs Expenses chart

---

## Troubleshooting

### Category Dropdown is Empty

**Problem:** No categories show when recording expense

**Solution:**
1. Run: `SELECT COUNT(*) FROM financial_categories WHERE type = 'expense';`
2. Should return 16 categories
3. If 0, run the seed data from `database/SETUP_FINANCE_MODULE.sql`

---

### "Permission Denied" Error

**Problem:** Cannot view or create expenses

**Solution:**
1. Check your role: `SELECT role FROM admin_users WHERE user_id = auth.uid();`
2. Must be 'owner'
3. If not, update: `UPDATE admin_users SET role = 'owner' WHERE user_id = auth.uid();`

---

### Expense Not Saving

**Possible causes:**
1. **Amount is 0 or negative** - Must be > 0
2. **Description too long** - Max 500 characters
3. **Notes too long** - Max 2000 characters
4. **Category doesn't match division** - Check category belongs to selected division

**Check browser console** (F12) for detailed error messages.

---

## What's Next?

### Phase 3: Monthly Reporting
- Generate expense reports by month
- Export to PDF/Excel
- Expense breakdown by category
- Year-over-year comparison

### Phase 4: Dashboard Integration
- Expense KPIs on main dashboard
- Revenue vs Expenses chart
- Profit/Loss visualization
- Cash flow tracking

### Phase 5: Receipt Upload
- Upload receipts to Cloudinary
- Attach receipts to expense records
- View receipts in expense details

### Phase 6: Analytics
- Expense trends over time
- Top vendors by spend
- Category analysis
- Budget vs Actual tracking

---

## Quick Reference

### Access
- **URL:** `/admin/expenses`
- **Nav:** Expenses (TrendingDown icon)
- **Permission:** Owner only

### Actions
- **Record:** Top right button
- **View:** Eye icon in table
- **Edit:** Pencil icon in table
- **Delete:** Trash icon in table

### Filters
- **Search:** Ref, vendor, description
- **Division:** Travel, Trade, Company
- **Category:** By division
- **Month:** View by month

### Expense Ref Format
- **Pattern:** EXP-0001, EXP-0002, EXP-0003...
- **Auto-generated** on creation
- **Cannot be changed** after creation

---

## Support

Need help?
1. Check browser console (F12) for errors
2. Verify database setup is complete
3. Confirm you're registered as owner
4. Check expense categories exist

---

**Module Status:** ✅ Complete and Ready for Testing
**Database:** expense_transactions table + 16 categories
**Frontend:** Full CRUD with search, filter, and stats
**Next Step:** Test the module then move to Phase 3 (Reporting)
