import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess, type AdminUser } from '@/lib/auth';
import { supabase, type Database } from '@/lib/supabase';

export const Route = createFileRoute('/admin/audit-log')({
  component: () => <ThemeProvider><AdminGuard><AuditLogPage /></AdminGuard></ThemeProvider>,
});

type AuditEntry = Database['public']['Tables']['audit_log']['Row'];

function AuditLogPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadAuditLog = async () => {
      const { user } = await checkAdminAccess();
      if (!active) return;
      setAdminUser(user);
      if (user?.role !== 'owner') {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(250);
      if (!active) return;
      if (error) {
        console.error('Unable to load audit log:', error);
        setLoadError(true);
      } else {
        setEntries(data ?? []);
      }
      setLoading(false);
    };
    void loadAuditLog();
    return () => { active = false; };
  }, []);

  const getActivity = (entry: AuditEntry) => {
    const oldValue = entry.old_value ?? {};
    const newValue = entry.new_value ?? {};
    if (entry.target_table === 'financial_transactions') {
      if (entry.action === 'INSERT') return 'Created financial record';
      if (newValue['status'] === 'voided' && oldValue['status'] !== 'voided') return 'Voided financial record';
      return 'Updated financial record';
    }
    const action = entry.action.toLowerCase();
    const verb = action === 'insert' ? 'Created' : action === 'update' ? 'Updated' : action === 'delete' ? 'Deleted' : entry.action;
    return `${verb} ${entry.target_table.replaceAll('_', ' ')}`;
  };

  const getDetails = (entry: AuditEntry) => {
    const value = entry.new_value ?? entry.old_value ?? {};
    const details: string[] = [];
    if (typeof value['transaction_ref'] === 'string') details.push(value['transaction_ref']);
    if (typeof value['amount'] === 'number' || typeof value['amount'] === 'string') {
      details.push(`₦${Number(value['amount']).toLocaleString()}`);
    }
    if (typeof value['description'] === 'string') details.push(value['description']);
    if (value['status'] === 'voided' && typeof value['void_reason'] === 'string') {
      details.push(`Reason: ${value['void_reason']}`);
    }
    if (!details.length && entry.target_id) details.push(`Record ID: ${entry.target_id}`);
    return details.join(' · ') || '—';
  };

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Read-only history of administrative activity. Showing the latest 250 entries.</p>
        </header>

        {adminUser?.role !== 'owner' && !loading ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">You do not have permission to view the audit log.</div>
        ) : loadError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">Unable to load the audit log. Please try again.</div>
        ) : loading ? (
          <div aria-label="Loading audit log" className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Activity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Module</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Actor</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Details</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{getActivity(entry)}</td>
                    <td className="px-5 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">{entry.target_table.replaceAll('_', ' ')}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400" title={entry.actor_id ?? 'System'}>{entry.actor_id ? `User ${entry.actor_id.slice(0, 8)}` : 'System'}</td>
                    <td className="max-w-sm px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{getDetails(entry)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{format(new Date(entry.created_at), 'd MMM yyyy, h:mm a')}</td>
                  </tr>
                ))}
                {entries.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">No audit activity recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
