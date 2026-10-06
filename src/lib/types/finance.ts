/**
 * Finance & Expenses Module - TypeScript Types
 * Yahaya Travel & Trade Co. Ltd
 */

export interface FinancialCategory {
  id: string;
  type: 'income' | 'expense';
  division: 'travel' | 'trade' | 'company';
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  transaction_ref: string;
  amount: number;
  division: 'travel' | 'trade' | 'company';
  category_id: string;
  client_id: string | null;
  quote_id: string | null;
  enquiry_id: string | null;
  payment_method: 'bank_transfer' | 'cash' | 'pos' | 'online' | 'other';
  external_ref: string | null;
  description: string;
  notes: string | null;
  transaction_date: string;
  status: 'active' | 'voided';
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseTransaction {
  id: string;
  expense_ref: string;
  amount: number;
  division: 'travel' | 'trade' | 'company';
  category_id: string;
  vendor_name: string;
  payment_method: 'bank_transfer' | 'cash' | 'pos' | 'online' | 'other';
  external_ref: string | null;
  receipt_url: string | null;
  description: string;
  notes: string | null;
  expense_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Extended types with joined data
export interface FinancialTransactionWithDetails extends FinancialTransaction {
  category?: FinancialCategory;
  client?: {
    id: string;
    name: string;
    email: string | null;
  };
  quote?: {
    id: string;
    quote_number: string;
    total_amount: number;
  };
}

export interface ExpenseTransactionWithDetails extends ExpenseTransaction {
  category?: FinancialCategory;
}

// Form data types
export interface FinancialTransactionFormData {
  amount: number;
  division: 'travel' | 'trade' | 'company';
  category_id: string;
  client_id?: string;
  quote_id?: string;
  enquiry_id?: string;
  payment_method: 'bank_transfer' | 'cash' | 'pos' | 'online' | 'other';
  external_ref?: string;
  description: string;
  notes?: string;
  transaction_date: string;
}

export interface ExpenseTransactionFormData {
  amount: number;
  division: 'travel' | 'trade' | 'company';
  category_id: string;
  vendor_name: string;
  payment_method: 'bank_transfer' | 'cash' | 'pos' | 'online' | 'other';
  external_ref?: string;
  receipt_url?: string;
  description: string;
  notes?: string;
  expense_date: string;
}

export interface FinancialCategoryFormData {
  type: 'income' | 'expense';
  division: 'travel' | 'trade' | 'company';
  name: string;
  description?: string;
  display_order?: number;
}

// Filter types
export interface FinancialTransactionFilters {
  division?: 'travel' | 'trade' | 'company' | 'all';
  category_id?: string;
  client_id?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ExpenseTransactionFilters {
  division?: 'travel' | 'trade' | 'company' | 'all';
  category_id?: string;
  vendor?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Stats types
export interface FinancialStats {
  totalRevenue: number;
  travelRevenue: number;
  tradeRevenue: number;
  companyRevenue: number;
  totalExpenses: number;
  travelExpenses: number;
  tradeExpenses: number;
  companyExpenses: number;
  netRevenue: number;
  transactionCount: number;
  expenseCount: number;
}

export interface MonthlyFinancialSummary {
  month: string; // YYYY-MM
  revenue: number;
  expenses: number;
  net: number;
  revenueByDivision: {
    travel: number;
    trade: number;
    company: number;
  };
  expensesByDivision: {
    travel: number;
    trade: number;
    company: number;
  };
}
