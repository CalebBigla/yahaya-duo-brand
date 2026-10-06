import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess, type AdminUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/admin/website/visa-destinations')({
  component: () => <ThemeProvider><AdminGuard><VisaDestinationsPage /></AdminGuard></ThemeProvider>,
});

interface VisaDestination {
  id: string;
  country: string;
  visa_types: string;
  processing_time: string;
  notes: string;
  display_order: number;
  status: 'draft' | 'published';
  updated_by: string | null;
}

type DestinationForm = Pick<VisaDestination, 'country' | 'visa_types' | 'processing_time' | 'notes' | 'status'>;
const emptyForm: DestinationForm = { country: '', visa_types: '', processing_time: '', notes: '', status: 'draft' };

function getVisaDestinationErrorMessage(error: unknown, action: 'save' | 'load' = 'load') {
  const dbError = error && typeof error === 'object' ? error as { code?: string; message?: string } : {};
  if (dbError.code === 'PGRST205' || dbError.code === 'PGRST204' || dbError.code === '42P01') {
    return 'Visa destination storage is not set up in Supabase. Run the website-visa-destinations SQL migration, then reload this page.';
  }
  if (dbError.code === '23505') return 'A destination with this name already exists. Use a different country or destination name.';
  if (dbError.code === '42501' || dbError.code === '401' || dbError.code === '403') {
    return 'You do not have permission to manage visa destinations. Please contact an administrator.';
  }
  return action === 'save'
    ? 'Unable to save this destination. Please check the details and try again.'
    : 'Unable to load destinations. Please refresh and try again.';
}

function VisaDestinationsPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [items, setItems] = useState<VisaDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<DestinationForm>(emptyForm);
  const [editing, setEditing] = useState<VisaDestination | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<VisaDestination | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void checkAdminAccess().then(({ user }) => setAdminUser(user));
    void loadItems();
  }, []);

  const loadItems = async (showInitialLoading = true) => {
    if (showInitialLoading) setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from('website_visa_destinations').select('*').order('display_order');
    if (error) {
      console.error('Unable to load visa destinations:', error);
      setLoadError(getVisaDestinationErrorMessage(error));
    } else {
      setItems((data ?? []) as VisaDestination[]);
    }
    if (showInitialLoading) setLoading(false);
  };

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ...form,
        updated_by: user?.id ?? null,
        published_at: form.status === 'published' ? new Date().toISOString() : null,
      };
      const result = editing
        ? await supabase.from('website_visa_destinations').update(payload).eq('id', editing.id).select('*').single()
        : await supabase.from('website_visa_destinations').insert(payload).select('*').single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('Save did not return a persisted destination');
      setItems((current) => {
        const next = editing
          ? current.map((row) => row.id === editing.id ? result.data as VisaDestination : row)
          : [...current, result.data as VisaDestination];
        return next.sort((a, b) => a.display_order - b.display_order);
      });
      toast.success(editing ? 'Visa destination updated successfully.' : 'Visa destination added successfully.');
      resetForm();
    } catch (error) {
      console.error('Unable to save visa destination:', error);
      toast.error(getVisaDestinationErrorMessage(error, 'save'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: VisaDestination) => {
    setEditing(item);
    setForm({ country: item.country, visa_types: item.visa_types, processing_time: item.processing_time, notes: item.notes, status: item.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStatus = async (item: VisaDestination) => {
    const status = item.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('website_visa_destinations').update({
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).eq('id', item.id);
    if (error) {
      console.error('Unable to update visa destination publishing status:', error);
      toast.error('Unable to update publishing status. Please try again.');
      return;
    }
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, status } : row));
    toast.success(`Visa destination ${status === 'published' ? 'published' : 'unpublished'} successfully.`);
  };

  const moveItem = async (item: VisaDestination, offset: -1 | 1) => {
    const ordered = [...items].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((row) => row.id === item.id);
    const other = ordered[index + offset];
    if (!other) return;
    const results = await Promise.all([
      supabase.from('website_visa_destinations').update({ display_order: other.display_order }).eq('id', item.id),
      supabase.from('website_visa_destinations').update({ display_order: item.display_order }).eq('id', other.id),
    ]);
    if (results.some((result) => result.error)) {
      console.error('Unable to reorder visa destinations:', results.map((result) => result.error).filter(Boolean));
      toast.error('Unable to reorder destinations. Please try again.');
      await loadItems(false);
      return;
    }
    setItems(ordered.map((row) => row.id === item.id ? { ...row, display_order: other.display_order } : row.id === other.id ? { ...row, display_order: item.display_order } : row).sort((a, b) => a.display_order - b.display_order));
    toast.success('Destination order updated.');
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    const { data, error } = await supabase.from('website_visa_destinations').delete().eq('id', pendingDelete.id).select('id').maybeSingle();
    if (error || !data?.id) {
      console.error('Unable to delete visa destination:', error ?? 'No row deleted');
      toast.error('Unable to delete this destination. Please try again.');
    } else {
      setItems((current) => current.filter((row) => row.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success('Visa destination deleted successfully.');
    }
    setDeleting(false);
  };

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Destination Quick Reference</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage the destination information shown on the public Travel page.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Edit destination' : 'Add destination'}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">Country or destination
              <input required maxLength={120} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            </label>
            <label className="space-y-1 text-sm font-medium">Visa types
              <input required maxLength={500} value={form.visa_types} onChange={(e) => setForm({ ...form, visa_types: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            </label>
            <label className="space-y-1 text-sm font-medium">Typical processing time
              <input required maxLength={120} value={form.processing_time} onChange={(e) => setForm({ ...form, processing_time: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            </label>
            <label className="space-y-1 text-sm font-medium">Publishing status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DestinationForm['status'] })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">Important notes
            <textarea required maxLength={1000} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : <><Plus className="mr-2 h-4 w-4" />Add destination</>}</Button>
            {editing && <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>}
          </div>
        </form>

        {loading ? <div aria-label="Loading destinations" className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />)}</div>
          : loadError ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>
          : <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {items.length === 0 ? <p className="p-6 text-sm text-gray-600 dark:text-gray-400">No destinations yet. Add one above.</p> : items.map((item, index) => (
              <div key={item.id} className="flex flex-wrap items-center gap-4 border-b border-gray-200 p-4 last:border-0 dark:border-gray-700">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{item.display_order}</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900 dark:text-white">{item.country}</h3><span className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></div><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.visa_types} · {item.processing_time}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.notes}</p></div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" aria-label={`Move ${item.country} up`} disabled={index === 0} onClick={() => void moveItem(item, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" aria-label={`Move ${item.country} down`} disabled={index === items.length - 1} onClick={() => void moveItem(item, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => void updateStatus(item)}>{item.status === 'published' ? 'Unpublish' : 'Publish'}</Button>
                  <Button variant="outline" size="icon" aria-label={`Edit ${item.country}`} onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" aria-label={`Delete ${item.country}`} className="text-red-600 hover:text-red-700" onClick={() => setPendingDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>}
      </div>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open && !deleting) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete destination?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete {pendingDelete?.country}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={deleting} onClick={(event) => { event.preventDefault(); void confirmDelete(); }} className="bg-red-600 text-white hover:bg-red-700">{deleting ? 'Deleting…' : 'Delete'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
