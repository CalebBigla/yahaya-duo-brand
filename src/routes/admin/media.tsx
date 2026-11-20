import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthContext } from '@/components/admin/AdminAuthContext';
import { DeleteConfirmation } from '@/components/admin/DeleteConfirmation';
import { Badge, EmptyState, ErrorBanner, LoadingRows, PageHeader, btn, card, chipClass, iconButton, iconDangerButton, inputClass } from '@/components/admin/ui';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess, type AdminUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  ACCEPTED_IMAGE_TYPES,
  isCloudinaryConfigured,
  thumbnailUrl,
  titleFromFilename,
  uploadImage,
  validateImage,
} from '@/lib/cloudinary';

export const Route = createFileRoute('/admin/media')({
  // The admin session lives in localStorage, so auth can only be checked in the browser.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const result = await checkAdminAccess();
    if (!result.isAdmin) {
      throw redirect({ to: '/admin/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <MediaPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'trade', label: 'Trade' },
  { value: 'events', label: 'Events' },
  { value: 'team', label: 'Team' },
  { value: 'partners', label: 'Partners' },
] as const;
type Category = (typeof CATEGORIES)[number]['value'];

interface GalleryRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: Category;
  display_order: number;
  alt_text: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

type QueueStatus = 'ready' | 'uploading' | 'saving' | 'done' | 'error';
interface QueueItem {
  key: string;
  file: File;
  preview: string;
  title: string;
  alt: string;
  status: QueueStatus;
  progress: number;
  error?: string | undefined;
  /** Kept after a successful Cloudinary upload, so a failed database save can retry without re-uploading. */
  uploadedUrl?: string | undefined;
}

/** Uploads at most this many images at the same time. */
const CONCURRENCY = 3;

function MediaPage() {
  const sharedAuth = useContext(AdminAuthContext);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(sharedAuth?.user ?? null);
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Category>('all');

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [category, setCategory] = useState<Category>('travel');
  const [publishNow, setPublishNow] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const configured = isCloudinaryConfigured();
  const ids = { category: useId(), publish: useId() };

  useEffect(() => {
    if (adminUser) return;
    checkAdminAccess().then(({ user }) => setAdminUser(user));
  }, [adminUser]);

  const fetchRows = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await supabase
      .from('website_gallery')
      .select('id, title, description, image_url, category, display_order, alt_text, status, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading media:', error);
      setLoadError('Could not load the media library.');
    } else {
      setRows((data ?? []) as GalleryRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  // Release preview object URLs when items leave the queue or the page closes.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const current = new Set(queue.map((q) => q.preview));
    for (const url of previews.current) if (!current.has(url)) URL.revokeObjectURL(url);
    previews.current = current;
  }, [queue]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const update = (key: string, patch: Partial<QueueItem>) =>
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const added: QueueItem[] = [];
    const rejected: string[] = [];
    for (const file of list) {
      const problem = validateImage(file);
      if (problem) {
        rejected.push(`${file.name}: ${problem}`);
        continue;
      }
      added.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
        title: titleFromFilename(file.name),
        alt: '',
        status: 'ready',
        progress: 0,
      });
    }
    if (added.length) setQueue((items) => [...items, ...added]);
    if (rejected.length) toast.error(rejected.length === 1 ? rejected[0] : `${rejected.length} files were skipped. ${rejected[0]}`);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!running && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  /** Upload one queued image to Cloudinary, then save its URL to the gallery table. */
  const processItem = async (item: QueueItem, order: number, signal: AbortSignal) => {
    try {
      let url = item.uploadedUrl;
      if (!url) {
        update(item.key, { status: 'uploading', progress: 0, error: undefined });
        const uploaded = await uploadImage(item.file, {
          signal,
          onProgress: (p) => update(item.key, { progress: p }),
        });
        url = uploaded.url;
        update(item.key, { uploadedUrl: url });
      }
      update(item.key, { status: 'saving', progress: 1 });
      const title = item.title.trim() || titleFromFilename(item.file.name);
      const { error } = await supabase.from('website_gallery').insert({
        title,
        alt_text: item.alt.trim() || title,
        image_url: url,
        category,
        display_order: order,
        status: publishNow ? 'published' : 'draft',
        published_at: publishNow ? new Date().toISOString() : null,
        updated_by: adminUser?.user_id ?? null,
      });
      if (error) throw new Error('The image uploaded, but saving it to the library failed. Retry to save it.');
      update(item.key, { status: 'done' });
      return true;
    } catch (err) {
      update(item.key, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed.' });
      return false;
    }
  };

  const startUpload = async () => {
    const pending = queue.filter((q) => q.status === 'ready' || q.status === 'error');
    if (!pending.length) return;
    setRunning(true);
    const controller = new AbortController();
    abort.current = controller;
    let nextOrder = rows.reduce((max, r) => Math.max(max, r.display_order ?? 0), 0) + 1;
    let index = 0;
    let ok = 0;
    const worker = async () => {
      while (index < pending.length && !controller.signal.aborted) {
        const item = pending[index++]!;
        if (await processItem(item, nextOrder++, controller.signal)) ok++;
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
    abort.current = null;
    setRunning(false);
    const failed = pending.length - ok;
    if (ok) {
      toast.success(
        `${ok} image${ok === 1 ? '' : 's'} added to the library${publishNow ? ' and published on the Media page' : ' as drafts'}.`,
      );
      await fetchRows();
      // Clear finished items after a moment so the confirmation is visible.
      setTimeout(() => setQueue((items) => items.filter((q) => q.status !== 'done')), 1500);
    }
    if (failed) toast.error(`${failed} image${failed === 1 ? '' : 's'} could not be added. Check the list and retry.`);
  };

  const togglePublished = async (row: GalleryRow) => {
    const status = row.status === 'published' ? 'draft' : 'published';
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status } : r)));
    const { error } = await supabase
      .from('website_gallery')
      .update({ status, published_at: status === 'published' ? new Date().toISOString() : null, updated_by: adminUser?.user_id ?? null })
      .eq('id', row.id);
    if (error) {
      setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status: row.status } : r)));
      toast.error('Could not change the status. Please try again.');
    } else {
      toast.success(status === 'published' ? 'Published on the Media page.' : 'Hidden from the Media page.');
    }
  };

  const deleteRow = async (row: GalleryRow) => {
    const { data, error } = await supabase.from('website_gallery').delete().eq('id', row.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error('Nothing was deleted');
    setRows((all) => all.filter((r) => r.id !== row.id));
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Image link copied.');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  const visible = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.category === filter)), [rows, filter]);
  const pendingCount = queue.filter((q) => q.status === 'ready' || q.status === 'error').length;
  const publishedCount = rows.filter((r) => r.status === 'published').length;

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <PageHeader
          title="Media"
          description="Upload photos for the website's Media page. Images are stored on Cloudinary; their links are saved to the gallery."
          actions={
            <a href="/media" target="_blank" rel="noopener noreferrer" className={btn('secondary')}>
              <ExternalLink /> View Media page
            </a>
          }
        />

        {!configured && (
          <div role="alert" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Uploads are not set up on this build. Add <code className="font-mono">VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
              <code className="font-mono">VITE_CLOUDINARY_UPLOAD_PRESET</code> (an unsigned preset) to the environment, then rebuild.
            </p>
          </div>
        )}

        {/* Upload */}
        <section className={`${card} p-5`} aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
            Upload images
          </h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!running && configured) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-gray-300 bg-gray-50/60 dark:border-white/15 dark:bg-white/[0.02]'
            } ${!configured ? 'opacity-60' : ''}`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400">
              <UploadCloud className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Drag photos here</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, PNG, WebP, AVIF or GIF, up to 10 MB each</p>
            <button
              type="button"
              className={`${btn('secondary')} mt-4`}
              onClick={() => fileInput.current?.click()}
              disabled={running || !configured}
            >
              <ImagePlus /> Choose images
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {queue.length > 0 && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor={ids.category} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</span>
                  <select
                    id={ids.category}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    disabled={running}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Applies to every image in this upload.</span>
                </label>
                <label htmlFor={ids.publish} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-white/10 sm:mt-6">
                  <input
                    id={ids.publish}
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                    disabled={running}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    <span className="block font-medium text-gray-900 dark:text-white">Publish straight away</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      Untick to save as drafts and publish later.
                    </span>
                  </span>
                </label>
              </div>

              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-white/5 dark:border-white/10">
                {queue.map((item) => (
                  <li key={item.key} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    <img src={item.preview} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <input
                        aria-label={`Title for ${item.file.name}`}
                        value={item.title}
                        onChange={(e) => update(item.key, { title: e.target.value })}
                        disabled={item.status !== 'ready' && item.status !== 'error'}
                        className={inputClass}
                        placeholder="Title"
                        maxLength={120}
                      />
                      <input
                        aria-label={`Description for screen readers, ${item.file.name}`}
                        value={item.alt}
                        onChange={(e) => update(item.key, { alt: e.target.value })}
                        disabled={item.status !== 'ready' && item.status !== 'error'}
                        className={inputClass}
                        placeholder="What the photo shows (alt text)"
                        maxLength={200}
                      />
                      <QueueStatusLine item={item} />
                    </div>
                    <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                      {item.status === 'error' && !running && (
                        <button type="button" className={iconButton} aria-label={`Retry ${item.file.name}`} title="Retry" onClick={() => update(item.key, { status: 'ready', error: undefined })}>
                          <RotateCcw />
                        </button>
                      )}
                      {(item.status === 'ready' || item.status === 'error') && !running && (
                        <button type="button" className={iconButton} aria-label={`Remove ${item.file.name}`} title="Remove" onClick={() => setQueue((all) => all.filter((q) => q.key !== item.key))}>
                          <X />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {running ? (
                  <button type="button" className={btn('ghost')} onClick={() => abort.current?.abort()}>
                    Stop after current uploads
                  </button>
                ) : (
                  <button type="button" className={btn('ghost')} onClick={() => setQueue([])}>
                    Clear list
                  </button>
                )}
                <button
                  type="button"
                  className={btn('primary')}
                  onClick={startUpload}
                  disabled={running || pendingCount === 0 || !configured}
                  aria-busy={running || undefined}
                >
                  {running ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                  {running ? 'Uploading...' : `Upload ${pendingCount} image${pendingCount === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Library */}
        <section aria-labelledby="library-heading" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="library-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
                Library
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {rows.length} image{rows.length === 1 ? '' : 's'}, {publishedCount} shown on the Media page. Edit titles and order in{' '}
                <Link to="/admin/website/gallery" className={btn('link', 'sm')}>
                  Gallery
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              <button type="button" className={chipClass(filter === 'all')} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" className={chipClass(filter === c.value)} aria-pressed={filter === c.value} onClick={() => setFilter(c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {loadError ? (
            <ErrorBanner message={loadError} onRetry={() => void fetchRows()} />
          ) : loading ? (
            <div className={card}>
              <LoadingRows rows={4} />
            </div>
          ) : visible.length === 0 ? (
            <div className={card}>
              <EmptyState
                icon={ImagePlus}
                title={rows.length ? 'No images in this category' : 'No images yet'}
                body={rows.length ? 'Choose another category, or upload images above.' : 'Upload your first photos above and they will appear here.'}
              />
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((row) => (
                <li key={row.id} className={`${card} group overflow-hidden`}>
                  <div className="relative aspect-[3/2] bg-gray-100 dark:bg-white/5">
                    <img
                      src={thumbnailUrl(row.image_url)}
                      alt={row.alt_text || row.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2">
                      <Badge tone={row.status === 'published' ? 'green' : 'neutral'}>
                        {row.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white" title={row.title}>
                        {row.title}
                      </p>
                      <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{row.category}</p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button type="button" className={iconButton} aria-label={`Copy link for ${row.title}`} title="Copy link" onClick={() => copyUrl(row.image_url)}>
                        <Copy />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={row.status === 'published' ? `Hide ${row.title} from the Media page` : `Publish ${row.title}`}
                        title={row.status === 'published' ? 'Unpublish' : 'Publish'}
                        onClick={() => togglePublished(row)}
                      >
                        {row.status === 'published' ? <EyeOff /> : <Eye />}
                      </button>
                      <DeleteConfirmation
                        trigger={
                          <button type="button" className={iconDangerButton} aria-label={`Delete ${row.title}`} title="Delete">
                            <Trash2 />
                          </button>
                        }
                        title="Delete this image?"
                        description="It will be removed from the library and the Media page. The file stays in your Cloudinary account."
                        detail={row.title}
                        successMessage="Image deleted."
                        errorMessage="Could not delete the image. Please try again."
                        onConfirm={() => deleteRow(row)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

function QueueStatusLine({ item }: { item: QueueItem }) {
  if (item.status === 'error') {
    return (
      <p role="alert" className="text-xs text-rose-600 sm:col-span-2 dark:text-rose-400">
        {item.error}
      </p>
    );
  }
  if (item.status === 'done') {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-700 sm:col-span-2 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Added to the library
      </p>
    );
  }
  if (item.status === 'uploading' || item.status === 'saving') {
    const pct = Math.round(item.progress * 100);
    return (
      <div className="flex items-center gap-2 sm:col-span-2">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
          role="progressbar"
          aria-label={`Uploading ${item.file.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-blue-600 transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-16 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {item.status === 'saving' ? 'Saving' : `${pct}%`}
        </span>
      </div>
    );
  }
  return (
    <p className="text-xs text-gray-500 sm:col-span-2 dark:text-gray-400">
      {(item.file.size / 1024 / 1024).toFixed(1)} MB, ready to upload
    </p>
  );
}
