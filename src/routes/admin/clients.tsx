import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import {
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  MapPin,
  User,
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronDown,
  Download,
  RefreshCw,
  Calendar,
  Briefcase,
  Plane,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { toast } from 'sonner';
import { DeleteConfirmation } from '@/components/admin/DeleteConfirmation';

export const Route = createFileRoute('/admin/clients')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <ClientsPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  client_type: 'individual' | 'corporate';
  service_interest: string | null;
  status: 'active' | 'inactive' | 'prospect';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'prospect';
type FilterType = 'all' | 'individual' | 'corporate';

function ClientsPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    client_type: 'individual' as 'individual' | 'corporate',
    service_interest: '',
    status: 'prospect' as 'active' | 'inactive' | 'prospect',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      try { await loadClients(); } finally { setInitialLoading(false); }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = clients;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((client) => client.status === filterStatus);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((client) => client.client_type === filterType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.includes(query) ||
          client.company?.toLowerCase().includes(query) ||
          client.city?.toLowerCase().includes(query)
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, filterStatus, filterType]);

  const loadClients = async () => {
    try {
      const data = await queueQuery(async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      setLoadError(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadClients();
    setIsRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      client_type: 'individual',
      service_interest: '',
      status: 'prospect',
      notes: '',
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country,
      client_type: client.client_type,
      service_interest: client.service_interest || '',
      status: client.status,
      notes: client.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wasEditing = showEditModal && Boolean(selectedClient);
    setIsSubmitting(true);

    try {
      if (showEditModal && selectedClient) {
        // Update existing client
        await queueQuery(async () => {
          const { error } = await supabase
            .from('clients')
            .update(formData)
            .eq('id', selectedClient.id);

          if (error) throw error;
        });
      } else {
        // Add new client
        await queueQuery(async () => {
          const { error } = await supabase
            .from('clients')
            .insert([formData]);

          if (error) throw error;
        });
      }

      await loadClients();
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      setSelectedClient(null);
      toast.success(wasEditing ? 'Client updated successfully.' : 'Client created successfully.');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Unable to save the client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    await queueQuery(async () => {
      const { data, error } = await supabase.from('clients').delete().eq('id', client.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error('No client row was deleted');
    });
    setClients((current) => current.filter((row) => row.id !== client.id));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Company', 'Email', 'Phone', 'City', 'State', 'Status', 'Service Interest', 'Created'];
    const csvData = filteredClients.map(client => [
      client.name,
      client.client_type,
      client.company || '',
      client.email || '',
      client.phone || '',
      client.city || '',
      client.state || '',
      client.status,
      client.service_interest || '',
      format(new Date(client.created_at), 'yyyy-MM-dd')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Active', class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
      inactive: { label: 'Inactive', class: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: Circle },
      prospect: { label: 'Prospect', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: AlertCircle },
    };
    
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.class}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'individual' ? (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
        <User className="h-3 w-3" />
        Individual
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
        <Building2 className="h-3 w-3" />
        Corporate
      </span>
    );
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospect: clients.filter(c => c.status === 'prospect').length,
    corporate: clients.filter(c => c.client_type === 'corporate').length,
  };

  if (initialLoading) return <AdminLayout adminUser={adminUser}><TablePageSkeleton /></AdminLayout>;

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load clients. Please try again.</div>}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your client database and relationships
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
              Add Client
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="mt-2 text-3xl font-bold text-green-900 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prospects</p>
                <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-400">{stats.prospect}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Corporate</p>
                <p className="mt-2 text-3xl font-bold text-orange-900 dark:text-orange-400">{stats.corporate}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                placeholder="Search by name, email, phone, company, city..."
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
            <div className="mt-4 grid gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'prospect', 'inactive'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as FilterStatus)}
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'individual', 'corporate'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type as FilterType)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        filterType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(searchQuery || filterStatus !== 'all' || filterType !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Showing {filteredClients.length} of {clients.length} clients</span>
              {(filterStatus !== 'all' || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterType('all');
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

        {/* Clients Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : clients.length === 0 ? 'Get started by adding your first client' : 'Loading clients...'}
              </p>
              {clients.length === 0 && (
                <button
                  onClick={handleAdd}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Client
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service Interest
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                          {client.company && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {client.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(client.client_type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.city || client.state ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {[client.city, client.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="px-6 py-4">
                        {client.service_interest ? (
                          <div className="flex items-center gap-1.5">
                            {client.service_interest.includes('travel') && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400">
                                <Plane className="h-3 w-3" />
                                Travel
                              </span>
                            )}
                            {client.service_interest.includes('trade') && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-400">
                                <Briefcase className="h-3 w-3" />
                                Trade
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit client"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <DeleteConfirmation
                            trigger={<button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete client" aria-label={`Delete ${client.name}`}><Trash2 className="h-4 w-4" /></button>}
                            title="Delete client?"
                            description="Are you sure you want to delete this client? This action cannot be undone."
                            detail={client.name}
                            successMessage="Client deleted successfully."
                            errorMessage="Unable to delete this client. Please try again."
                            onConfirm={() => handleDelete(client)}
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {showEditModal ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setSelectedClient(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="client_type"
                        value="individual"
                        checked={formData.client_type === 'individual'}
                        onChange={(e) => setFormData({ ...formData, client_type: e.target.value as 'individual' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Individual</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="client_type"
                        value="corporate"
                        checked={formData.client_type === 'corporate'}
                        onChange={(e) => setFormData({ ...formData, client_type: e.target.value as 'corporate' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Corporate</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Full name"
                  />
                </div>

                {formData.client_type === 'corporate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Company name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="+234..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Yola, Jimeta, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Adamawa, Lagos, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Interest
                  </label>
                  <select
                    value={formData.service_interest}
                    onChange={(e) => setFormData({ ...formData, service_interest: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select service</option>
                    <option value="travel">Travel & Tours</option>
                    <option value="trade">Trade & Commerce</option>
                    <option value="both">Both Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'prospect' })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Additional notes about this client..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedClient(null);
                  }}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : showEditModal ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
