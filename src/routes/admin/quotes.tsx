import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import { generateQuotePDF } from '@/lib/pdfGenerator';
import { QuoteEnquiryLink } from '@/components/quotes/QuoteEnquiryLink';
import { QuoteVersionBadge } from '@/components/quotes/QuoteVersionBadge';
import { SendQuoteModal } from '@/components/quotes/SendQuoteModal';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  X,
  ChevronDown,
  Download,
  RefreshCw,
  DollarSign,
  FileText,
  Calendar,
  User,
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  Building2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { toast } from 'sonner';
import { DeleteConfirmation } from '@/components/admin/DeleteConfirmation';

export const Route = createFileRoute('/admin/quotes')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <QuotesPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface Quote {
  id: string;
  quote_number: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  enquiry_id: string | null;
  title: string;
  description: string | null;
  service_type: 'travel' | 'trade' | 'both';
  items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'pending' | 'accepted' | 'rejected' | 'expired' | 'revision_requested';
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  version_number: number;
  is_current_version: boolean;
  parent_quote_id: string | null;
  superseded_by_quote_id: string | null;
  sent_at: string | null;
  sent_by: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  form_type: 'travel' | 'trade' | 'contact';
  service: string | null;
  destination: string | null;
  division: string | null;
  message: string | null;
  created_at: string;
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'pending' | 'accepted' | 'rejected' | 'expired' | 'revision_requested';

function QuotesPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    enquiry_id: '',
    client_id: '',
    client_name: '',
    client_email: '',
    title: '',
    description: '',
    service_type: 'travel' as 'travel' | 'trade' | 'both',
    valid_until: '',
    notes: '',
    terms: 'Payment terms: Net 30 days\nValidity: As specified above\nPrices quoted are subject to availability',
    tax_rate: 0,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      try { await Promise.all([loadQuotes(), loadClients(), loadEnquiries()]); } finally { setInitialLoading(false); }
      
      // Check if coming from enquiry (quote creation from enquiry)
      checkForPrefilledData();
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = quotes;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((quote) => quote.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quote) =>
          quote.quote_number.toLowerCase().includes(query) ||
          quote.client_name.toLowerCase().includes(query) ||
          quote.title.toLowerCase().includes(query) ||
          quote.client_email?.toLowerCase().includes(query)
      );
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchQuery, filterStatus]);

  const loadQuotes = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      setLoadError(true);
    }
  };

  const loadClients = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, company')
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

  const loadEnquiries = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .in('status', ['new', 'read']) // Only show unprocessed enquiries
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      });

      setEnquiries(data);
    } catch (error) {
      console.error('Error loading enquiries:', error);
    }
  };

  const checkForPrefilledData = () => {
    // Check sessionStorage for pre-filled quote data from enquiry
    const prefilledData = sessionStorage.getItem('quote_from_enquiry');
    if (prefilledData) {
      try {
        const data = JSON.parse(prefilledData);
        setFormData((prev) => ({
          ...prev,
          ...data,
        }));
        sessionStorage.removeItem('quote_from_enquiry');
        setShowAddModal(true); // Auto-open the modal
      } catch (error) {
        console.error('Error parsing prefilled data:', error);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadQuotes();
    setIsRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      enquiry_id: '',
      client_id: '',
      client_name: '',
      client_email: '',
      title: '',
      description: '',
      service_type: 'travel',
      valid_until: '',
      notes: '',
      terms: 'Payment terms: Net 30 days\nValidity: As specified above\nPrices quoted are subject to availability',
      tax_rate: 0,
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setFormData({
      enquiry_id: quote.enquiry_id || '',
      client_id: quote.client_id || '',
      client_name: quote.client_name,
      client_email: quote.client_email || '',
      title: quote.title,
      description: quote.description || '',
      service_type: quote.service_type,
      valid_until: quote.valid_until || '',
      notes: quote.notes || '',
      terms: quote.terms || '',
      tax_rate: quote.tax_rate,
    });
    setLineItems(quote.items.length > 0 ? quote.items : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
    setShowEditModal(true);
  };

  const handleView = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  const handleSendQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowSendModal(true);
  };

  const handleQuoteSent = () => {
    // Reload quotes to reflect the 'sent' status
    loadQuotes();
    setShowSendModal(false);
    setShowViewModal(false);
  };

  const calculateLineItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * formData.tax_rate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value } as LineItem;
    
    if (field === 'quantity' || field === 'unit_price') {
      const qty = updated[index].quantity ?? 0;
      const price = updated[index].unit_price ?? 0;
      updated[index].amount = calculateLineItemAmount(qty, price);
    }
    
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        client_id: clientId,
        client_name: client.name,
        client_email: client.email || '',
      });
    } else {
      setFormData({
        ...formData,
        client_id: '',
        client_name: '',
        client_email: '',
      });
    }
  };

  const handleEnquirySelect = (enquiryId: string) => {
    if (!enquiryId) {
      setFormData((prev) => ({ ...prev, enquiry_id: '' }));
      return;
    }

    const enquiry = enquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      setFormData((prev) => ({
        ...prev,
        enquiry_id: enquiryId,
        client_name: enquiry.name,
        client_email: enquiry.email || '',
        service_type: enquiry.form_type === 'trade' ? 'trade' : 'travel',
        title: prev.title || `${enquiry.service || enquiry.destination || 'Service'} - ${enquiry.name}`,
        description: prev.description || enquiry.message || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wasEditing = showEditModal && Boolean(selectedQuote);
    setIsSubmitting(true);

    try {
      const totals = calculateTotals();

      const quoteData = {
        enquiry_id: formData.enquiry_id || null,
        client_id: formData.client_id || null,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        title: formData.title,
        description: formData.description || null,
        service_type: formData.service_type,
        items: lineItems,
        subtotal: totals.subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        terms: formData.terms || null,
        status: 'draft' as const,
      };

      if (showEditModal && selectedQuote) {
        // Update existing quote
        await queueQuery(async () => {
          const { error } = await supabase
            .from('quotes')
            .update(quoteData)
            .eq('id', selectedQuote.id);

          if (error) throw error;
        });
      } else {
        // Generate quote number and add new quote
        await queueQuery(async () => {
          const { data: quoteNumberData, error: quoteNumberError } = await supabase
            .rpc('generate_quote_number');

          if (quoteNumberError) throw quoteNumberError;

          const { error } = await supabase
            .from('quotes')
            .insert([{ ...quoteData, quote_number: quoteNumberData }]);

          if (error) throw error;
        });
      }

      await loadQuotes();
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      setSelectedQuote(null);
      toast.success(wasEditing ? 'Quote updated successfully.' : 'Quote created successfully.');
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Unable to save the quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (quote: Quote) => {
    await queueQuery(async () => {
      const { data, error } = await supabase.from('quotes').delete().eq('id', quote.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error('No quote row was deleted');
    });
    setQuotes((current) => current.filter((row) => row.id !== quote.id));
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: Quote['status']) => {
    try {
      await queueQuery(async () => {
        const { error } = await supabase
          .from('quotes')
          .update({ status: newStatus })
          .eq('id', quoteId);

        if (error) throw error;
      });

      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
      );

      if (selectedQuote?.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }
      toast.success('Quote status updated successfully.');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Unable to update quote status. Please try again.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Quote #', 'Client', 'Title', 'Service', 'Amount', 'Status', 'Created', 'Valid Until'];
    const csvData = filteredQuotes.map(quote => [
      quote.quote_number,
      quote.client_name,
      quote.title,
      quote.service_type,
      quote.total_amount.toFixed(2),
      quote.status,
      format(new Date(quote.created_at), 'yyyy-MM-dd'),
      quote.valid_until ? format(new Date(quote.valid_until), 'yyyy-MM-dd') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Draft', class: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: Circle },
      sent: { label: 'Sent', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: CheckCircle },
      pending: { label: 'Pending', class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: Clock },
      accepted: { label: 'Accepted', class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
      rejected: { label: 'Rejected', class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: XCircle },
      expired: { label: 'Expired', class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', icon: Calendar },
      revision_requested: { label: 'Changes Requested', class: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', icon: MessageSquare },
    };
    
    const badge = badges[status as keyof typeof badges];
    if (!badge) return null;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.class}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    pending: quotes.filter(q => q.status === 'pending').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    totalValue: quotes.reduce((sum, q) => sum + Number(q.total_amount), 0),
  };

  const totals = calculateTotals();

  if (initialLoading) return <AdminLayout adminUser={adminUser}><TablePageSkeleton /></AdminLayout>;

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load quotes. Please try again.</div>}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotes</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create and manage quotes for clients
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
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Quote
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quotes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draft</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-300">{stats.draft}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <Circle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="mt-2 text-3xl font-bold text-yellow-900 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted</p>
                <p className="mt-2 text-3xl font-bold text-green-900 dark:text-green-400">{stats.accepted}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-400">₦{stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by quote number, client name, or title..."
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
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'draft', 'sent', 'pending', 'accepted', 'rejected', 'expired', 'revision_requested'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(searchQuery || filterStatus !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Showing {filteredQuotes.length} of {quotes.length} quotes</span>
              {filterStatus !== 'all' && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quotes Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {filteredQuotes.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No quotes found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : quotes.length === 0 ? 'Get started by creating your first quote' : 'Loading quotes...'}
              </p>
              {quotes.length === 0 && (
                <button
                  onClick={handleAdd}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  New Quote
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quote #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{quote.quote_number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(quote.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{quote.client_name}</div>
                        {quote.client_email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{quote.client_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{quote.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {quote.service_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₦{Number(quote.total_amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-6 py-4">
                        {quote.valid_until ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(quote)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="View quote"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(quote)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit quote"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <DeleteConfirmation
                            trigger={<button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete quote" aria-label={`Delete quote ${quote.quote_number}`}><Trash2 className="h-4 w-4" /></button>}
                            title="Delete quote?"
                            description="Are you sure you want to delete this quote? This action cannot be undone."
                            detail={`${quote.quote_number} · ${quote.client_name} · ${quote.title}`}
                            successMessage="Quote deleted successfully."
                            errorMessage="Unable to delete this quote. Please try again."
                            onConfirm={() => handleDelete(quote)}
                          />
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

      {/* Add/Edit Quote Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {showEditModal ? 'Edit Quote' : 'New Quote'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setSelectedQuote(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Enquiry Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link to Enquiry (Optional)
                </label>
                <select
                  value={formData.enquiry_id}
                  onChange={(e) => handleEnquirySelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">No linked enquiry</option>
                  {enquiries.map((enquiry) => (
                    <option key={enquiry.id} value={enquiry.id}>
                      {enquiry.name} - {enquiry.service || enquiry.destination || 'Enquiry'} 
                      {' '}({format(new Date(enquiry.created_at), 'MMM d, yyyy')})
                    </option>
                  ))}
                </select>
                {formData.enquiry_id && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                    <MessageSquare className="h-3 w-3" />
                    Client details will be auto-filled from this enquiry
                  </p>
                )}
              </div>

              {/* Client Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select existing client or enter manually</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Quote Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Turkey Visa Processing and Flight Booking"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value as typeof formData.service_type })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="travel">Travel</option>
                    <option value="trade">Trade</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Line Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-12 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                          ₦{item.amount.toLocaleString()}
                        </div>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Tax Rate (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">₦{totals.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 text-base font-bold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">₦{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes (not shown to client)"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="Terms shown on quote"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedQuote(null);
                  }}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : showEditModal ? 'Update Quote' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Quote Modal */}
      {showViewModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 z-10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedQuote.quote_number}</h2>
                  <QuoteVersionBadge 
                    versionNumber={selectedQuote.version_number || 1}
                    isCurrent={selectedQuote.is_current_version !== false}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created {format(new Date(selectedQuote.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedQuote(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Linked Enquiry */}
              {selectedQuote.enquiry_id && (
                <QuoteEnquiryLink enquiryId={selectedQuote.enquiry_id} />
              )}

              {/* Status Actions */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  {getStatusBadge(selectedQuote.status)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'pending')}
                    disabled={selectedQuote.status === 'pending'}
                    className="rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'accepted')}
                    disabled={selectedQuote.status === 'accepted'}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'rejected')}
                    disabled={selectedQuote.status === 'rejected'}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client Information</h3>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{selectedQuote.client_name}</span>
                    </div>
                    {selectedQuote.client_email && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedQuote.client_email}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quote Details</h3>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Service:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedQuote.service_type}</span>
                    </div>
                    {selectedQuote.valid_until && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Valid until:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(selectedQuote.valid_until), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title and Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedQuote.title}</h3>
                {selectedQuote.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{selectedQuote.description}</p>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Line Items</h3>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedQuote.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">₦{item.unit_price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">₦{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium text-gray-700 dark:text-gray-300">Subtotal:</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">₦{Number(selectedQuote.subtotal).toLocaleString()}</td>
                      </tr>
                      {selectedQuote.tax_rate > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium text-gray-700 dark:text-gray-300">
                            Tax ({selectedQuote.tax_rate}%):
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">₦{Number(selectedQuote.tax_amount).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-base text-right font-bold text-gray-900 dark:text-white">Total:</td>
                        <td className="px-4 py-3 text-base text-right font-bold text-blue-600 dark:text-blue-400">₦{Number(selectedQuote.total_amount).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Terms */}
              {selectedQuote.terms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms & Conditions</h3>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedQuote.terms}</p>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              {selectedQuote.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Internal Notes</h3>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedQuote.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => handleSendQuote(selectedQuote)}
                  disabled={selectedQuote.status === 'sent'}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {selectedQuote.status === 'sent' ? 'Already Sent' : 'Send Quote'}
                </button>
                <button
                  onClick={() => generateQuotePDF(selectedQuote)}
                  className="flex items-center gap-2 rounded-lg border border-blue-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedQuote);
                  }}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Edit Quote
                </button>
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

      {/* Send Quote Modal */}
      {showSendModal && selectedQuote && (
        <SendQuoteModal
          quote={selectedQuote}
          onClose={() => setShowSendModal(false)}
          onSent={handleQuoteSent}
        />
      )}
    </AdminLayout>
  );
}
