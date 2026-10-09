import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import type { FinancialTransaction, FinancialCategory } from '@/lib/types/finance';
import {
  Search,
  Filter,
  Plus,
  Eye,
  X,
  ChevronDown,
  Download,
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  FileText,
  Building2,
  Pencil,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const Route = createFileRoute('/admin/finance')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <FinancePage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

type FilterDivision = 'all' | 'travel' | 'trade' | 'company';
type TransactionStatusFilter = 'all' | 'active' | 'voided';

function FinancePage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [acceptedQuoteCount, setAcceptedQuoteCount] = useState(0);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState<FilterDivision>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<TransactionStatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [pendingVoid, setPendingVoid] = useState<FinancialTransaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    division: 'travel' as 'travel' | 'trade' | 'company',
    category_id: '',
    client_id: '',
    quote_id: '',
    payment_method: 'bank_transfer' as 'bank_transfer' | 'cash' | 'pos' | 'online' | 'other',
    external_ref: '',
    description: '',
    notes: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      if (user?.role !== 'owner') {
        setInitialLoading(false);
        return;
      }
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadClients(),
        loadQuotes(),
        loadAcceptedQuoteCount(),
      ]);
      setInitialLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (filterDivision !== 'all') {
      filtered = filtered.filter((t) => t.division === filterDivision);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((t) => t.category_id === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => (t.status ?? 'active') === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transaction_ref.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.external_ref?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filterDivision, filterCategory, filterStatus]);

  const loadTransactions = async () => {
    setLoadError(false);
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('financial_transactions')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoadError(true);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('financial_categories')
          .select('*')
          .eq('type', 'income')
          .eq('is_active', true)
          .order('division')
          .order('display_order');

        if (error) {
          console.error('❌ Categories query error:', error);
          throw error;
        }
        console.log('✅ Categories loaded:', data?.length || 0, 'items');
        console.table(data);
        return data || [];
      });

      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        return data || [];
      });

      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadQuotes = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('quotes')
          .select('id, quote_number, client_name, total_amount')
          .in('status', ['accepted', 'pending'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      });

      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const loadAcceptedQuoteCount = async () => {
    try {
      const { count, error } = await queueQuery(async () => await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted'));
      if (error) throw error;
      setAcceptedQuoteCount(count ?? 0);
    } catch (error) {
      console.error('Error loading accepted quote count:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      division: 'travel',
      category_id: '',
      client_id: '',
      quote_id: '',
      payment_method: 'bank_transfer',
      external_ref: '',
      description: '',
      notes: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingTransaction(null);
    setShowAddModal(true);
  };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: String(transaction.amount),
      division: transaction.division,
      category_id: transaction.category_id,
      client_id: transaction.client_id ?? '',
      quote_id: transaction.quote_id ?? '',
      payment_method: transaction.payment_method,
      external_ref: transaction.external_ref ?? '',
      description: transaction.description,
      notes: transaction.notes ?? '',
      transaction_date: transaction.transaction_date,
    });
    setShowAddModal(true);
  };

  const handleView = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const transactionData = {
        amount: parseFloat(formData.amount),
        division: formData.division,
        category_id: formData.category_id,
        client_id: formData.client_id || null,
        quote_id: formData.quote_id || null,
        payment_method: formData.payment_method,
        external_ref: formData.external_ref || null,
        description: formData.description,
        notes: formData.notes || null,
        transaction_date: formData.transaction_date,
      };

      if (!editingTransaction && !user?.id) throw new Error('No authenticated user for financial record creation');

      await queueQuery(async () => {
        const result = editingTransaction
          ? await supabase
              .from('financial_transactions')
              .update(transactionData)
              .eq('id', editingTransaction.id)
              .eq('status', 'active')
              .select('*')
              .single()
          : await supabase
              .from('financial_transactions')
              .insert([{ ...transactionData, created_by: user!.id }])
              .select('*')
              .single();

        if (result.error) throw result.error;
        const saved = result.data as FinancialTransaction;
        setTransactions((current) => editingTransaction
          ? current.map((transaction) => transaction.id === saved.id ? saved : transaction)
          : [saved, ...current]);
      });

      setShowAddModal(false);
      setEditingTransaction(null);
      resetForm();
      toast.success(editingTransaction ? 'Income record updated successfully.' : 'Income recorded successfully.');
    } catch (error) {
      console.error('Error saving financial record:', error);
      toast.error(editingTransaction ? 'Unable to update this financial record. Please try again.' : 'Unable to record income. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmVoid = async () => {
    if (!pendingVoid || !voidReason.trim() || isVoiding) return;
    setIsVoiding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('No authenticated user for void action');
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({
          status: 'voided',
          voided_at: new Date().toISOString(),
          voided_by: user.id,
          void_reason: voidReason.trim(),
        })
        .eq('id', pendingVoid.id)
        .eq('status', 'active')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Financial record was not voided');
      setTransactions((current) => current.map((transaction) => transaction.id === pendingVoid.id ? data as FinancialTransaction : transaction));
      setPendingVoid(null);
      setVoidReason('');
      toast.success('Financial record voided. Revenue totals have been updated.');
    } catch (error) {
      console.error('Unable to void financial record:', error);
      toast.error('Unable to void this financial record. Please try again.');
    } finally {
      setIsVoiding(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return '-';
    const client = clients.find((c) => c.id === clientId);
    return client?.name || '-';
  };

  const getQuoteNumber = (quoteId: string | null) => {
    if (!quoteId) return '-';
    const quote = quotes.find((q) => q.id === quoteId);
    return quote?.quote_number || '-';
  };

  const getDivisionBadge = (division: string) => {
    const badges = {
      travel: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      trade: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      company: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    };
    return badges[division as keyof typeof badges] || badges.company;
  };

  const activeTransactions = transactions.filter((transaction) => (transaction.status ?? 'active') === 'active');
  const stats = {
    total: activeTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    travel: activeTransactions.filter(t => t.division === 'travel').reduce((sum, t) => sum + Number(t.amount), 0),
    trade: activeTransactions.filter(t => t.division === 'trade').reduce((sum, t) => sum + Number(t.amount), 0),
  };

  const filteredCategories = categories.filter(c => c.division === formData.division);

  if (initialLoading) return <AdminLayout adminUser={adminUser}><TablePageSkeleton /></AdminLayout>;

  if (adminUser?.role !== 'owner') {
    return <AdminLayout adminUser={adminUser}><div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">You do not have permission to view Finance records.</div></AdminLayout>;
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load financial records. Please try again.</div>}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Record and track business income transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Record Income
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Revenue</p>
                <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">₦{stats.total.toLocaleString()}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Travel Revenue</p>
                <p className="mt-3 text-xl font-bold text-blue-900 dark:text-blue-400">₦{stats.travel.toLocaleString()}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trade Revenue</p>
                <p className="mt-3 text-xl font-bold text-purple-900 dark:text-purple-400">₦{stats.trade.toLocaleString()}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed Deals</p>
                <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{acceptedQuoteCount.toLocaleString()}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by reference, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Division</label>
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value as FilterDivision)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Divisions</option>
                  <option value="travel">Travel</option>
                  <option value="trade">Trade</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.division})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Record status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TransactionStatusFilter)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All records</option>
                  <option value="active">Active</option>
                  <option value="voided">Voided</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No income recorded</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || filterDivision !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by recording your first income transaction'}
              </p>
              {transactions.length === 0 && (
                <button
                  onClick={handleAdd}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Record Income
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Division</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.transaction_ref}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getDivisionBadge(transaction.division)}`}>
                          {transaction.division}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {getCategoryName(transaction.category_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ₦{Number(transaction.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${(transaction.status ?? 'active') === 'voided' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                          {(transaction.status ?? 'active') === 'voided' ? 'Voided' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {getClientName(transaction.client_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(transaction)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(transaction.status ?? 'active') === 'active' && <>
                            <button
                              onClick={() => handleEdit(transaction)}
                              aria-label={`Edit ${transaction.transaction_ref}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setPendingVoid(transaction); setVoidReason(''); }}
                              aria-label={`Void ${transaction.transaction_ref}`}
                              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Ban className="h-4 w-4" />Void
                            </button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingTransaction ? 'Edit Income Record' : 'Record Income'}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Division <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value as any, category_id: '' })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="travel">Travel</option>
                    <option value="trade">Trade</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client (Optional)
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Related Quote (Optional)
                  </label>
                  <select
                    value={formData.quote_id}
                    onChange={(e) => setFormData({ ...formData, quote_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No quote</option>
                    {quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {quote.quote_number} - {quote.client_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="pos">POS</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    External Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.external_ref}
                    onChange={(e) => setFormData({ ...formData, external_ref: e.target.value })}
                    placeholder="Bank transaction ID, receipt #"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this income"
                  maxLength={500}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Internal Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes (not shown to client)"
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? (editingTransaction ? 'Saving...' : 'Recording...') : (editingTransaction ? 'Save Changes' : 'Record Income')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTransaction.transaction_ref}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(selectedTransaction.transaction_date), 'MMMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-400">
                  ₦{Number(selectedTransaction.amount).toLocaleString()}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Division</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{selectedTransaction.division}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{getCategoryName(selectedTransaction.category_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Client</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{getClientName(selectedTransaction.client_id)}</p>
                </div>
                {selectedTransaction.quote_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Related Quote</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{getQuoteNumber(selectedTransaction.quote_id)}</p>
                  </div>
                )}
                {selectedTransaction.external_ref && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">External Reference</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTransaction.external_ref}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTransaction.description}</p>
              </div>

              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Internal Notes</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{selectedTransaction.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={Boolean(pendingVoid)} onOpenChange={(open) => {
        if (!open && !isVoiding) {
          setPendingVoid(null);
          setVoidReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void financial record?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingVoid?.transaction_ref} will remain in the records for audit purposes and will stop contributing to revenue totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="block space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason for voiding
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoiding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isVoiding || !voidReason.trim()}
              onClick={(event) => { event.preventDefault(); void confirmVoid(); }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isVoiding ? 'Voiding…' : 'Void Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
