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
  Wallet,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { differenceInCalendarYears, format, subDays, subMonths, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { DashboardPageSkeleton } from '@/components/admin/SkeletonLoader';

export const Route = createFileRoute('/admin/')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netRevenue: number;
  monthlyGrowth: number | null;
  monthlyGrowthTrend: 'up' | 'down';
}

interface OperationsStats {
  totalEnquiries: number;
  activeClients: number;
  pendingQuotes: number;
  completedTransactions: number;
}

interface ChartDataPoint {
  date: string;
  netMovement: number;
}

type TimePeriod = 'week' | 'month' | 'year' | 'all';

function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netRevenue: 0,
    monthlyGrowth: null,
    monthlyGrowthTrend: 'up',
  });
  const [operationsStats, setOperationsStats] = useState<OperationsStats>({
    totalEnquiries: 0,
    activeClients: 0,
    pendingQuotes: 0,
    completedTransactions: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardLoadError, setDashboardLoadError] = useState(false);
  const [financialStatsError, setFinancialStatsError] = useState(false);
  const [operationsStatsError, setOperationsStatsError] = useState(false);
  const [chartLoadError, setChartLoadError] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const { user } = await checkAdminAccess();
        if (!user) throw new Error('No authorized admin session');
        setAdminUser(user);
        await Promise.all([
          user.role === 'owner' ? loadFinancialStats() : Promise.resolve(),
          loadOperationsStats(),
        ]);
      } catch (error) {
        console.error('Unable to load dashboard access:', error);
        setDashboardLoadError(true);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    void loadAdminData();
  }, [timePeriod]); // Re-load when time period changes

  useEffect(() => {
    if (adminUser?.role !== 'owner') {
      setIsLoadingChart(false);
      return;
    }
    void loadChartData();
  }, [timePeriod, adminUser?.role]);

  const getDateRangeForPeriod = (period: TimePeriod): { startDate: Date | null; endDate: Date } => {
    const endDate = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      case 'all':
        startDate = null; // No start date filter
        break;
    }

    return { startDate, endDate };
  };

  const getChartDateRangeForPeriod = (period: TimePeriod): { startDate: Date | null; endDate: Date } => {
    const endDate = new Date();
    switch (period) {
      case 'week':
        return { startDate: startOfWeek(endDate, { weekStartsOn: 1 }), endDate };
      case 'month':
        return { startDate: subMonths(endDate, 1), endDate };
      case 'year':
        return { startDate: subMonths(endDate, 12), endDate };
      case 'all':
        return { startDate: null, endDate };
    }
    return { startDate: null, endDate };
  };

  const loadFinancialStats = async () => {
    setFinancialStatsError(false);
    try {
      // Get date range based on time period
      const { startDate, endDate } = getDateRangeForPeriod(timePeriod);
      
      const pageSize = 1000;
      const transactions: Array<{ amount: number; transaction_date: string }> = [];
      for (let from = 0; ; from += pageSize) {
        const page = await queueQuery(async () => {
          let query = supabase
            .from('financial_transactions')
            .select('amount, transaction_date')
            .eq('status', 'active')
            .order('transaction_date', { ascending: true })
            .order('id', { ascending: true });
          
          // Apply date filter if not "all time"
          if (startDate) {
            query = query.gte('transaction_date', format(startDate, 'yyyy-MM-dd'));
          }
          if (endDate) {
            query = query.lte('transaction_date', format(endDate, 'yyyy-MM-dd'));
          }
          
          const { data, error } = await query.range(from, from + pageSize - 1);
          if (error) throw error;
          return data ?? [];
        });
        transactions.push(...page);
        if (page.length < pageSize) break;
      }

      const expenses: Array<{ amount: number; expense_date: string }> = [];
      for (let from = 0; ; from += pageSize) {
        const page = await queueQuery(async () => {
          let query = supabase
            .from('expense_transactions')
            .select('amount, expense_date')
            .order('expense_date', { ascending: true })
            .order('id', { ascending: true });
          
          // Apply date filter if not "all time"
          if (startDate) {
            query = query.gte('expense_date', format(startDate, 'yyyy-MM-dd'));
          }
          if (endDate) {
            query = query.lte('expense_date', format(endDate, 'yyyy-MM-dd'));
          }
          
          const { data, error } = await query.range(from, from + pageSize - 1);
          if (error) throw error;
          return data ?? [];
        });
        expenses.push(...page);
        if (page.length < pageSize) break;
      }

      // Calculate totals
      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netRevenue = totalRevenue - totalExpenses;

      // Calculate monthly growth
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthRevenue = transactions
        .filter(t => {
          const date = new Date(t.transaction_date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const previousMonthRevenue = transactions
        .filter(t => {
          const date = new Date(t.transaction_date);
          return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyGrowth = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : currentMonthRevenue > 0 ? null : 0;

      setFinancialStats({
        totalRevenue,
        totalExpenses,
        netRevenue,
        monthlyGrowth,
        monthlyGrowthTrend: monthlyGrowth === null || monthlyGrowth >= 0 ? 'up' : 'down',
      });
    } catch (error) {
      console.error('Error loading financial stats:', error);
      setFinancialStatsError(true);
    }
  };

  const loadOperationsStats = async () => {
    setOperationsStatsError(false);
    try {
      // Get date range based on time period
      const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

      // Load enquiries count with date filter
      const enquiriesResult = await queueQuery(async () => {
        let query = supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true });
        
        // Apply date filter if not "all time"
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
        
        return await query;
      });

      // Load active clients count with date filter
      const clientsResult = await queueQuery(async () => {
        let query = supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        
        // Apply date filter if not "all time"
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
        
        return await query;
      });

      // Load pending quotes count with date filter
      const pendingQuotesResult = await queueQuery(async () => {
        let query = supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        // Apply date filter if not "all time"
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
        
        return await query;
      });

      // Load completed transactions (accepted quotes) with date filter
      const completedQuotesResult = await queueQuery(async () => {
        let query = supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted');
        
        // Apply date filter if not "all time"
        if (startDate) {
          query = query.gte('updated_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('updated_at', endDate.toISOString());
        }
        
        return await query;
      });

      const queryResults = [enquiriesResult, clientsResult, pendingQuotesResult, completedQuotesResult];
      const failedResult = queryResults.find((result) => result.error);
      if (failedResult?.error) throw failedResult.error;

      setOperationsStats({
        totalEnquiries: enquiriesResult.count || 0,
        activeClients: clientsResult.count || 0,
        pendingQuotes: pendingQuotesResult.count || 0,
        completedTransactions: completedQuotesResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading operations stats:', error);
      setOperationsStatsError(true);
    }
  };

  const loadChartData = async () => {
    setIsLoadingChart(true);
    setChartLoadError(false);
    try {
      // Chart ranges stay scoped to the selected period; All Time has no lower bound.
      const { startDate, endDate } = getChartDateRangeForPeriod(timePeriod);

      // Load transactions within date range
      const pageSize = 1000;
      const transactions: Array<{ amount: number; transaction_date: string }> = [];
      for (let from = 0; ; from += pageSize) {
        const page = await queueQuery(async () => {
          let query = supabase
            .from('financial_transactions')
            .select('amount, transaction_date')
            .eq('status', 'active');

          if (startDate) {
            query = query.gte('transaction_date', format(startDate, 'yyyy-MM-dd'));
          }

          const { data, error } = await query
            .lte('transaction_date', format(endDate, 'yyyy-MM-dd'))
            .order('transaction_date', { ascending: true })
            .order('id', { ascending: true })
            .range(from, from + pageSize - 1);
          if (error) throw error;
          return data ?? [];
        });
        transactions.push(...page);
        if (page.length < pageSize) break;
      }

      const expenses: Array<{ amount: number; expense_date: string }> = [];
      for (let from = 0; ; from += pageSize) {
        const page = await queueQuery(async () => {
          let query = supabase
            .from('expense_transactions')
            .select('amount, expense_date');

          if (startDate) {
            query = query.gte('expense_date', format(startDate, 'yyyy-MM-dd'));
          }

          const { data, error } = await query
            .lte('expense_date', format(endDate, 'yyyy-MM-dd'))
            .order('expense_date', { ascending: true })
            .order('id', { ascending: true })
            .range(from, from + pageSize - 1);
          if (error) throw error;
          return data ?? [];
        });
        expenses.push(...page);
        if (page.length < pageSize) break;
      }

      // Aggregate data by period
      const aggregated = aggregateDataByPeriod(transactions, expenses, timePeriod, endDate);
      setChartData(aggregated);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData([]);
      setChartLoadError(true);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const aggregateDataByPeriod = (
    transactions: Array<{ amount: number; transaction_date: string }>,
    expenses: Array<{ amount: number; expense_date: string }>,
    period: TimePeriod,
    endDate: Date
  ): ChartDataPoint[] => {
    const dataMap = new Map<string, { revenue: number; expenses: number }>();
    const dataDates = [
      ...transactions.map((transaction) => new Date(transaction.transaction_date)),
      ...expenses.map((expense) => new Date(expense.expense_date)),
    ].filter((date) => !Number.isNaN(date.getTime()));
    const earliestDate = dataDates.length > 0
      ? dataDates.reduce((earliest, date) => date < earliest ? date : earliest)
      : endDate;
    const allTimeUsesYearlyBuckets = period === 'all' && differenceInCalendarYears(endDate, earliestDate) > 5;

    // Use sortable ISO dates as keys so periods remain chronological across years.
    const getPeriodKey = (date: Date): string => {
      switch (period) {
        case 'week':
        case 'month':
          return format(date, 'yyyy-MM-dd'); // Daily for week and month views
        case 'year':
          return format(startOfMonth(date), 'yyyy-MM-dd'); // Monthly for year view
        case 'all':
          return allTimeUsesYearlyBuckets
            ? format(startOfYear(date), 'yyyy-MM-dd')
            : format(startOfMonth(date), 'yyyy-MM-dd');
        default:
          return format(startOfMonth(date), 'yyyy-MM-dd');
      }
    };

    // Aggregate revenue
    transactions.forEach(t => {
      const key = getPeriodKey(new Date(t.transaction_date));
      const existing = dataMap.get(key) || { revenue: 0, expenses: 0 };
      dataMap.set(key, { ...existing, revenue: existing.revenue + Number(t.amount) });
    });

    // Aggregate expenses
    expenses.forEach(e => {
      const key = getPeriodKey(new Date(e.expense_date));
      const existing = dataMap.get(key) || { revenue: 0, expenses: 0 };
      dataMap.set(key, { ...existing, expenses: existing.expenses + Number(e.amount) });
    });

    // Convert to array and sort
    const labelFormat = period === 'week'
      ? 'EEE'
      : period === 'year' || (period === 'all' && !allTimeUsesYearlyBuckets)
        ? 'MMM yyyy'
        : period === 'all'
          ? 'yyyy'
          : 'MMM d';

    return Array.from(dataMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([periodStart, values]) => ({
        date: format(new Date(`${periodStart}T12:00:00`), labelFormat),
        netMovement: Math.round(values.revenue - values.expenses),
      }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {isLoadingDashboard ? (
          <DashboardPageSkeleton />
        ) : dashboardLoadError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            Unable to load dashboard data. Please try again.
          </div>
        ) : <>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {adminUser?.role === 'owner' ? 'Admin' : 'Staff'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Executive overview of Yahaya Travel & Trade operations and financials.
            </p>
          </div>
          
          {/* Time Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Period:</span>
            <button
              onClick={() => setTimePeriod('week')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'week'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimePeriod('year')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'year'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setTimePeriod('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Financial Summary Section: finance data is owner-only under Finance RLS. */}
        {adminUser?.role === 'owner' && <div>
          {financialStatsError ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              Unable to load financial summary. Confirm the Finance schema migration is applied, then refresh.
            </div>
          ) : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Revenue</p>
                  <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(financialStats.totalRevenue)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    All income in period
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Net Revenue */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net Revenue</p>
                  <p className={`mt-3 text-xl font-bold ${
                    financialStats.netRevenue >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(financialStats.netRevenue)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Revenue - Expenses
                  </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  financialStats.netRevenue >= 0
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Wallet className={`h-5 w-5 ${
                    financialStats.netRevenue >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Expenses</p>
                  <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(financialStats.totalExpenses)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    All costs in period
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Monthly Growth */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monthly Growth</p>
                  <p className={`mt-3 text-xl font-bold ${
                    financialStats.monthlyGrowthTrend === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {financialStats.monthlyGrowth === null
                      ? 'New'
                      : `${financialStats.monthlyGrowth >= 0 ? '+' : ''}${financialStats.monthlyGrowth.toFixed(1)}%`}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {financialStats.monthlyGrowth === null ? 'No prior revenue' : 'vs previous month'}
                  </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  financialStats.monthlyGrowthTrend === 'up'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {financialStats.monthlyGrowthTrend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </div>
          </div>}
        </div>}

        {/* Business Performance Section */}
        {adminUser?.role === 'owner' && <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Performance</h2>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            {isLoadingChart ? (
              <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Loading chart data...</p>
                </div>
              </div>
            ) : chartLoadError ? (
              <div role="alert" className="flex h-80 items-center justify-center text-center text-sm text-red-700 dark:text-red-300">
                Unable to load performance data. Confirm the Finance schema migration is applied, then try again.
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No financial data available for this period</p>
                  <p className="text-xs mt-1">Start recording transactions to see your performance chart</p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  netMovement: {
                    label: 'Net movement',
                    color: '#2563eb',
                  },
                }}
                className="h-80 w-full"
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value: number) => new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(value)}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [formatCurrency(value), 'Net movement']}
                  />
                  <Line 
                    type="monotone"
                    dataKey="netMovement"
                    stroke="var(--color-netMovement)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-netMovement)', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Net movement"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>}

        {/* Operations Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operations</h2>
          {operationsStatsError ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              Unable to load operations summary. Please refresh and try again.
            </div>
          ) : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Enquiries */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Enquiries</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {operationsStats.totalEnquiries}
                  </p>
                  <Link 
                    to="/admin/enquiries"
                    className="mt-2 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Active Clients */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active Clients</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {operationsStats.activeClients}
                  </p>
                  <Link 
                    to="/admin/clients"
                    className="mt-2 inline-flex items-center text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    Manage clients →
                  </Link>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Pending Quotes */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pending Quotes</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {operationsStats.pendingQuotes}
                  </p>
                  <Link 
                    to="/admin/quotes"
                    className="mt-2 inline-flex items-center text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    View quotes →
                  </Link>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            {/* Completed Deals */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed Deals</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                    {operationsStats.completedTransactions}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Accepted quotes
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/finance"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-green-500 dark:hover:border-green-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Record Income</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add transaction</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/expenses"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-red-500 dark:hover:border-red-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Record Expense</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Log spending</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>

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
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Create Quote</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Generate new quote</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Real-Time Dashboard</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                All financial and operational data is pulled directly from your database. Financial metrics update automatically as you record transactions.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <strong>Your role:</strong> {adminUser?.role === 'owner' ? 'Owner (Full Access)' : 'Editor (Operational Access)'}
              </p>
            </div>
          </div>
        </div>
        </>}
      </div>
    </AdminLayout>
  );
}
