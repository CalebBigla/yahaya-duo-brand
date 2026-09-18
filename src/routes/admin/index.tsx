import { createFileRoute, Link } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Inbox,
  DollarSign,
  Clock,
  ArrowUpRight,
  Activity,
  MessageSquare,
} from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface DashboardStats {
  enquiries: {
    total: number;
    new: number;
    change: number;
    trend: 'up' | 'down';
  };
  clients: {
    total: number;
    active: number;
    change: number;
    trend: 'up' | 'down';
  };
  quotes: {
    total: number;
    pending: number;
    change: number;
    trend: 'up' | 'down';
  };
}

function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    enquiries: { total: 0, new: 0, change: 0, trend: 'up' },
    clients: { total: 0, active: 0, change: 0, trend: 'up' },
    quotes: { total: 0, pending: 0, change: 0, trend: 'up' },
  });

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await loadDashboardStats();
    };

    loadAdminData();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load enquiries count
      const enquiriesData = await queueQuery(async () => {
        const { count: total } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true });
        
        const { count: newCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new');

        return { total: total || 0, new: newCount || 0 };
      });

      // Load clients count
      const clientsData = await queueQuery(async () => {
        const { count: total } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });
        
        const { count: active } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        return { total: total || 0, active: active || 0 };
      });

      // Load quotes count (if table exists, otherwise use 0)
      const quotesData = await queueQuery(async () => {
        try {
          const { count: total } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true });
          
          const { count: pending } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          return { total: total || 0, pending: pending || 0 };
        } catch {
          return { total: 0, pending: 0 };
        }
      });

      setStats({
        enquiries: {
          total: enquiriesData.total,
          new: enquiriesData.new,
          change: 0, // We'll calculate this later with historical data
          trend: 'up',
        },
        clients: {
          total: clientsData.total,
          active: clientsData.active,
          change: 0,
          trend: 'up',
        },
        quotes: {
          total: quotesData.total,
          pending: quotesData.pending,
          change: 0,
          trend: 'up',
        },
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {adminUser?.role === 'owner' ? 'Admin' : 'Staff'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening across Yahaya Travel & Trade today.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Enquiries */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Enquiries</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.enquiries.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Inbox className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stats.enquiries.new} new enquiries
              </span>
            </div>
          </div>

          {/* Active Clients */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Clients</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.clients.active}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                of {stats.clients.total} total clients
              </span>
            </div>
          </div>

          {/* Pending Quotes */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Quotes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.quotes.pending}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stats.quotes.total} total quotes
              </span>
            </div>
          </div>

          {/* Total Value Placeholder */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coming Soon</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">—</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Revenue tracking</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/clients"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New Client</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add client record</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/quotes"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-green-500 dark:hover:border-green-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Create Quote</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Generate new quote</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/enquiries"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">View Enquiries</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check submissions</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/website"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Activity className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Edit Website</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Update content</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Welcome Card */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Welcome to Your Dashboard</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Your admin dashboard provides real-time insights into your business operations. 
                Monitor enquiries, manage clients, create quotes, and track your business growth all in one place.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  to="/admin/enquiries"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">View Enquiries</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stats.enquiries.new} new</p>
                  </div>
                </Link>
                <Link
                  to="/admin/clients"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 hover:border-green-500 dark:hover:border-green-400 transition-colors"
                >
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Clients</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stats.clients.total} total</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Overview</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Enquiries</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.enquiries.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Clients</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.clients.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Quotes</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.quotes.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Dashboard Overview</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                You're viewing real-time data from your database. Stats update automatically as your business grows.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <strong>Your role:</strong> {adminUser?.role === 'owner' ? 'Owner (Full Access)' : 'Editor (Operational Access)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
