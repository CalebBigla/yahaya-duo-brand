import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import type { 
  ExpenseTransaction, 
  FinancialCategory,
  ExpenseTransactionFormData 
} from '@/lib/types/finance';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  TrendingDown, 
  DollarSign,
  Building2,
  Plane,
  ShoppingCart,
  Calendar,
  Receipt,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

export const Route = createFileRoute('/admin/expenses')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <ExpensesPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function ExpensesPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ExpenseTransaction | null>(null);
  const [deletingExpense, setDeletingExpense] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState<'all' | 'travel' | 'trade' | 'company'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Stats
  const [stats, setStats] = useState({
    totalExpenses: 0,
    travelExpenses: 0,
    tradeExpenses: 0,
    companyExpenses: 0,
    expenseCount: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      
      setLoading(true);
      await Promise.all([
        loadExpenses(),
        loadCategories(),
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    if (filterDivision !== 'all') {
      filtered = filtered.filter((e) => e.division === filterDivision);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((e) => e.category_id === filterCategory);
    }

    if (filterMonth !== 'all') {
      filtered = filtered.filter((e) => 
        e.expense_date.startsWith(filterMonth)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.expense_ref.toLowerCase().includes(query) ||
          e.vendor_name.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.external_ref?.toLowerCase().includes(query)
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchQuery, filterDivision, filterCategory, filterMonth]);

  const loadExpenses = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('expense_transactions')
          .select('*')
          .order('expense_date', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setExpenses(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setLoadError(true);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('financial_categories')
          .select('*')
          .eq('type', 'expense')
          .eq('is_active', true)
          .order('division')
          .order('display_order');

        if (error) {
          console.error('❌ Categories query error:', error);
          throw error;
        }
        console.log('✅ Expense categories loaded:', data?.length || 0, 'items');
        return data || [];
      });

      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoadError(true);
    }
  };

  const calculateStats = (expenseData: ExpenseTransaction[]) => {
    const total = expenseData.reduce((sum, e) => sum + Number(e.amount), 0);
    const travel = expenseData
      .filter((e) => e.division === 'travel')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const trade = expenseData
      .filter((e) => e.division === 'trade')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const company = expenseData
      .filter((e) => e.division === 'company')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    setStats({
      totalExpenses: total,
      travelExpenses: travel,
      tradeExpenses: trade,
      companyExpenses: company,
      expenseCount: expenseData.length,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDivisionIcon = (division: string) => {
    switch (division) {
      case 'travel': return <Plane className="w-4 h-4" />;
      case 'trade': return <ShoppingCart className="w-4 h-4" />;
      case 'company': return <Building2 className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getDivisionBadge = (division: string) => {
    const colors = {
      travel: 'bg-blue-100 text-blue-700',
      trade: 'bg-green-100 text-green-700',
      company: 'bg-purple-100 text-purple-700',
    };
    return colors[division as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const handleViewDetails = (expense: ExpenseTransaction) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  const handleEdit = (expense: ExpenseTransaction) => {
    setSelectedExpense(expense);
    setShowRecordModal(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete || adminUser?.role !== 'owner' || deletingExpense) return;
    setDeletingExpense(true);
    try {
      const { data, error } = await supabase
        .from('expense_transactions')
        .delete()
        .eq('id', pendingDelete.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data?.id) throw new Error('No expense row was deleted');

      const remaining = expenses.filter((expense) => expense.id !== pendingDelete.id);
      setExpenses(remaining);
      calculateStats(remaining);
      setPendingDelete(null);
      toast.success('Expense deleted successfully.');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Unable to delete this expense. Please try again.');
    } finally {
      setDeletingExpense(false);
    }
  };

  const getUniqueMonths = () => {
    const months = expenses.map((e) => e.expense_date.substring(0, 7));
    return Array.from(new Set(months)).sort().reverse();
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <TablePageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">Unable to load expense data. Please try again.</div>}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-red-600" />
              Expenses Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track and manage business expenses across all divisions
            </p>
          </div>
          <Button onClick={() => {
            setSelectedExpense(null);
            setShowRecordModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Record Expense
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Expenses"
            value={formatCurrency(stats.totalExpenses)}
            icon={<TrendingDown className="w-6 h-6" />}
            color="bg-red-500"
            subtitle={`${stats.expenseCount} transactions`}
          />
          <StatCard
            title="Travel Expenses"
            value={formatCurrency(stats.travelExpenses)}
            icon={<Plane className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Trade Expenses"
            value={formatCurrency(stats.tradeExpenses)}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Company Expenses"
            value={formatCurrency(stats.companyExpenses)}
            icon={<Building2 className="w-6 h-6" />}
            color="bg-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Division Filter */}
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Divisions</option>
              <option value="travel">Travel</option>
              <option value="trade">Trade</option>
              <option value="company">Company</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => filterDivision === 'all' || c.division === filterDivision)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.division}: {category.name}
                  </option>
                ))}
            </select>

            {/* Month Filter */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Months</option>
              {getUniqueMonths().map((month) => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-NG', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || filterDivision !== 'all' || filterCategory !== 'all' || filterMonth !== 'all') && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterDivision('all');
                  setFilterCategory('all');
                  setFilterMonth('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No expenses found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchQuery || filterDivision !== 'all' || filterCategory !== 'all' || filterMonth !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Record your first expense to get started'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => {
                    const category = categories.find((c) => c.id === expense.category_id);
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {expense.expense_ref}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(expense.expense_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getDivisionBadge(expense.division)}`}>
                            {getDivisionIcon(expense.division)}
                            {expense.division}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.vendor_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(expense)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {adminUser?.role === 'owner' && (
                              <button
                                onClick={() => setPendingDelete(expense)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                                aria-label={`Delete expense ${expense.expense_ref}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record/Edit Expense Modal */}
      {showRecordModal && (
        <RecordExpenseModal
          expense={selectedExpense}
          categories={categories}
          onClose={() => {
            setShowRecordModal(false);
            setSelectedExpense(null);
          }}
          onSuccess={() => {
            setShowRecordModal(false);
            setSelectedExpense(null);
            loadExpenses();
            toast.success(selectedExpense ? 'Expense updated successfully.' : 'Expense recorded successfully.');
          }}
        />
      )}

      {/* Expense Details Modal */}
      {showDetailsModal && selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          category={categories.find((c) => c.id === selectedExpense.category_id) ?? null}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExpense(null);
          }}
        />
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => {
        if (!open && !deletingExpense) setPendingDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDelete && (
            <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-white">{pendingDelete.description}</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {categories.find((category) => category.id === pendingDelete.category_id)?.name || 'Expense'}
                {' · '}{formatCurrency(Number(pendingDelete.amount))}
                {' · '}{formatDate(pendingDelete.expense_date)}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingExpense}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); void handleDelete(); }}
              disabled={deletingExpense || adminUser?.role !== 'owner'}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deletingExpense ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string; 
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Record Expense Modal Component
function RecordExpenseModal({
  expense,
  categories,
  onClose,
  onSuccess,
}: {
  expense: ExpenseTransaction | null;
  categories: FinancialCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExpenseTransactionFormData>({
    amount: expense?.amount || 0,
    division: expense?.division || 'travel',
    category_id: expense?.category_id || '',
    vendor_name: expense?.vendor_name || '',
    payment_method: expense?.payment_method || 'bank_transfer',
    external_ref: expense?.external_ref || '',
    description: expense?.description || '',
    notes: expense?.notes || '',
    expense_date: expense?.expense_date || new Date().toISOString().slice(0, 10),
  });

  const filteredCategories = categories.filter(
    (c) => c.division === formData.division
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Unable to save changes. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        created_by: user.id,
        external_ref: formData.external_ref || null,
        notes: formData.notes || null,
      };

      if (expense) {
        // Update existing expense
        const { error } = await supabase
          .from('expense_transactions')
          .update(payload)
          .eq('id', expense.id);

        if (error) throw error;
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expense_transactions')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Unable to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? 'Edit Expense' : 'Record New Expense'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Division & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Division *
              </label>
              <select
                required
                value={formData.division}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    division: e.target.value as any,
                    category_id: '' // Reset category when division changes
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="travel">Travel</option>
                <option value="trade">Trade</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (NGN) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor/Supplier Name *
            </label>
            <input
              type="text"
              required
              value={formData.vendor_name}
              onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              placeholder="e.g., ABC Suppliers Ltd"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Payment Method & External Ref */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="online">Online Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External Reference
              </label>
              <input
                type="text"
                value={formData.external_ref}
                onChange={(e) => setFormData({ ...formData, external_ref: e.target.value })}
                placeholder="e.g., INV-2024-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the expense"
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional additional details..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : expense ? 'Update Expense' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Expense Details Modal Component
function ExpenseDetailsModal({
  expense,
  category,
  onClose,
}: {
  expense: ExpenseTransaction;
  category?: FinancialCategory | null;
  onClose: () => void;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Expense Details</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{expense.expense_ref}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(expense.expense_date)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(Number(expense.amount))}
              </p>
              <p className="text-sm text-gray-600 uppercase">{expense.payment_method.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <DetailItem label="Division" value={expense.division} />
            <DetailItem label="Category" value={category?.name || 'Unknown'} />
            <DetailItem label="Vendor" value={expense.vendor_name} />
            {expense.external_ref && (
              <DetailItem label="External Reference" value={expense.external_ref} />
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-900">{expense.description}</p>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h4>
              <p className="text-gray-900 whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Created: {new Date(expense.created_at).toLocaleString('en-NG')}</p>
            {expense.updated_at !== expense.created_at && (
              <p>Last Updated: {new Date(expense.updated_at).toLocaleString('en-NG')}</p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-sm text-gray-900 mt-1 capitalize">{value}</p>
    </div>
  );
}
