import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  Circle,
  MessageSquare,
  Briefcase,
  Plane,
  X,
  ChevronDown,
  Download,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateQuoteFromEnquiry } from '@/components/quotes/CreateQuoteFromEnquiry';

export const Route = createFileRoute('/admin/enquiries')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <EnquiriesPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface Submission {
  id: string;
  form_type: 'travel' | 'trade' | 'contact';
  name: string;
  email: string | null;
  phone: string | null;
  division: string | null;
  destination: string | null;
  dates: string | null;
  service: string | null;
  message: string | null;
  status: 'new' | 'read' | 'responded';
  created_at: string;
  ip_hash: string | null;
}

type FilterStatus = 'all' | 'new' | 'read' | 'responded';
type FilterType = 'all' | 'travel' | 'trade' | 'contact';

function EnquiriesPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Submission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await loadSubmissions();
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = submissions;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((sub) => sub.status === filterStatus);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((sub) => sub.form_type === filterType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          sub.email?.toLowerCase().includes(query) ||
          sub.phone?.includes(query) ||
          sub.message?.toLowerCase().includes(query) ||
          sub.destination?.toLowerCase().includes(query) ||
          sub.service?.toLowerCase().includes(query)
      );
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, filterStatus, filterType]);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSubmissions();
    setIsRefreshing(false);
  };

  const updateStatus = async (id: string, newStatus: 'new' | 'read' | 'responded') => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
      );

      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewDetails = async (enquiry: Submission) => {
    setSelectedEnquiry(enquiry);
    
    // Mark as read if it's new
    if (enquiry.status === 'new') {
      await updateStatus(enquiry.id, 'read');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      new: { label: 'New', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: Circle },
      read: { label: 'Read', class: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: Eye },
      responded: { label: 'Responded', class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
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
    const badges = {
      travel: { label: 'Travel', icon: Plane, class: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
      trade: { label: 'Trade', icon: Briefcase, class: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
      contact: { label: 'Contact', icon: MessageSquare, class: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
    };
    
    const badge = badges[type as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.class}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Type', 'Service', 'Message', 'Status'];
    const csvData = filteredSubmissions.map(sub => [
      format(new Date(sub.created_at), 'yyyy-MM-dd HH:mm'),
      sub.name,
      sub.email || '',
      sub.phone || '',
      sub.form_type,
      sub.service || sub.destination || '',
      sub.message || '',
      sub.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    read: submissions.filter(s => s.status === 'read').length,
    responded: submissions.filter(s => s.status === 'responded').length,
  };

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enquiries</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage customer enquiries and form submissions
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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Enquiries</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New</p>
                <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-400">{stats.new}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Circle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.read}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <Eye className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Responded</p>
                <p className="mt-2 text-3xl font-bold text-green-900 dark:text-green-400">{stats.responded}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, email, phone, message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 sm:grid-cols-2">
              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'new', 'read', 'responded'].map((status) => (
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

              {/* Type Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'travel', 'trade', 'contact'].map((type) => (
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

          {/* Active filters summary */}
          {(searchQuery || filterStatus !== 'all' || filterType !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Showing {filteredSubmissions.length} of {submissions.length} enquiries</span>
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

        {/* Enquiries List - Table Format */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No enquiries found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : submissions.length === 0 ? 'Loading enquiries...' : 'Enquiries will appear here when customers submit forms'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service/Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.map((enquiry) => (
                    <tr 
                      key={enquiry.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        enquiry.status === 'new' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(new Date(enquiry.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(enquiry.created_at), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{enquiry.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {enquiry.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3" />
                              <span>{enquiry.email}</span>
                            </div>
                          )}
                          {enquiry.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3" />
                              <span>{enquiry.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(enquiry.form_type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {enquiry.service || enquiry.destination || enquiry.division || '—'}
                        </div>
                        {enquiry.dates && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{enquiry.dates}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(enquiry.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleViewDetails(enquiry)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enquiry Details</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Submitted {format(new Date(selectedEnquiry.created_at), 'MMMM dd, yyyy • HH:mm')}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Status and Type */}
                <div className="flex items-center gap-3">
                  {getTypeBadge(selectedEnquiry.form_type)}
                  {getStatusBadge(selectedEnquiry.status)}
                </div>

                {/* Contact Information */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Name:</span>
                      <span className="text-gray-900 dark:text-white">{selectedEnquiry.name}</span>
                    </div>
                    {selectedEnquiry.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Email:</span>
                        <a
                          href={`mailto:${selectedEnquiry.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedEnquiry.email}
                        </a>
                      </div>
                    )}
                    {selectedEnquiry.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Phone:</span>
                        <a
                          href={`tel:${selectedEnquiry.phone}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedEnquiry.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Details */}
                {(selectedEnquiry.service || selectedEnquiry.destination || selectedEnquiry.dates || selectedEnquiry.division) && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Service Details</h3>
                    <div className="space-y-2">
                      {selectedEnquiry.service && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Service:</span>
                          <span className="text-gray-900 dark:text-white">{selectedEnquiry.service}</span>
                        </div>
                      )}
                      {selectedEnquiry.destination && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Destination:</span>
                          <span className="text-gray-900 dark:text-white">{selectedEnquiry.destination}</span>
                        </div>
                      )}
                      {selectedEnquiry.dates && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Dates:</span>
                          <span className="text-gray-900 dark:text-white">{selectedEnquiry.dates}</span>
                        </div>
                      )}
                      {selectedEnquiry.division && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Division:</span>
                          <span className="text-gray-900 dark:text-white">{selectedEnquiry.division}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Message */}
                {selectedEnquiry.message && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Message</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedEnquiry.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {/* Create Quote Button */}
                  <CreateQuoteFromEnquiry 
                    enquiry={selectedEnquiry} 
                    onClose={() => setSelectedEnquiry(null)}
                  />

                  {/* Other Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateStatus(selectedEnquiry.id, 'responded')}
                      disabled={selectedEnquiry.status === 'responded'}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedEnquiry.status === 'responded' ? 'Marked as Responded' : 'Mark as Responded'}
                    </button>
                    {selectedEnquiry.email && (
                      <a
                        href={`mailto:${selectedEnquiry.email}?subject=Re: Your enquiry&body=Dear ${selectedEnquiry.name},%0D%0A%0D%0A`}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Reply via Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
