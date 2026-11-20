import { createFileRoute } from '@tanstack/react-router';
import { ModalFrame, btn, iconButton } from '@/components/admin/ui';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { toast } from 'sonner';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Save, Eye, EyeOff, Edit2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/admin/website/seo')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <SEOPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface SEO {
  id: string;
  page_slug: string;
  meta_title: string;
  meta_description: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_card_type: 'summary' | 'summary_large_image';
  status: 'draft' | 'published';
  updated_at: string;
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Homepage',
  about: 'About Page',
  travel: 'Travel Services',
  trade: 'Trade Services',
  contact: 'Contact Page',
  media: 'Media Gallery',
};

function SEOPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seoPages, setSeoPages] = useState<SEO[]>([]);
  const [editingPage, setEditingPage] = useState<SEO | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchSEO();
    };
    loadData();
  }, []);

  const fetchSEO = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('website_seo')
      .select('*')
      .order('page_slug', { ascending: true });

    if (error) {
      console.error('Error fetching SEO:', error);
    } else {
      setSeoPages(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingPage) return;

    if (!editingPage.meta_title || !editingPage.meta_description) {
      toast.error('Please fill in the meta title and description.');
      return;
    }

    if (editingPage.meta_title.length > 60) {
      toast.error('Meta title must be 60 characters or less.');
      return;
    }

    if (editingPage.meta_description.length > 160) {
      toast.error('Meta description must be 160 characters or less.');
      return;
    }

    const { error } = await supabase
      .from('website_seo')
      .update({
        ...editingPage,
        updated_by: adminUser?.user_id,
      })
      .eq('id', editingPage.id);

    if (error) {
      console.error('Error updating SEO:', error);
      toast.error('Unable to save SEO changes. Please try again.');
      return;
    }

    setEditingPage(null);
    await fetchSEO();
    toast.success('SEO settings updated successfully.');
  };

  const handleToggleStatus = async (page: SEO) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('website_seo')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
        updated_by: adminUser?.user_id,
      })
      .eq('id', page.id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Unable to update SEO publishing status. Please try again.');
    } else {
      await fetchSEO();
      toast.success(`SEO settings ${newStatus === 'published' ? 'published' : 'unpublished'} successfully.`);
    }
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <TablePageSkeleton rows={4} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">SEO Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage meta tags, Open Graph, and Twitter Card settings for each page
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 SEO Best Practices</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • <strong>Meta Title:</strong> 50-60 characters, include main keyword
            </li>
            <li>
              • <strong>Meta Description:</strong> 150-160 characters, compelling and descriptive
            </li>
            <li>
              • <strong>Open Graph:</strong> For social media sharing preview
            </li>
            <li>
              • <strong>Keywords:</strong> Comma-separated, relevant terms
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          {seoPages.map((page) => (
            <div
              key={page.id}
              className="bg-white dark:bg-gray-900 border rounded-lg p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {PAGE_LABELS[page.page_slug] || page.page_slug}
                    </h3>
                    {page.status === 'published' ? (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-emerald-500/15 text-green-800 dark:text-emerald-300 text-xs font-medium rounded">
                        <Eye className="w-3 h-3 inline" /> Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-amber-500/15 text-yellow-800 dark:text-amber-300 text-xs font-medium rounded">
                        <EyeOff className="w-3 h-3 inline" /> Draft
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Title:</strong> {page.meta_title}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">({page.meta_title.length}/60)</span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Description:</strong> {page.meta_description}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        ({page.meta_description.length}/160)
                      </span>
                    </p>
                    {page.meta_keywords && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Keywords:</strong> {page.meta_keywords}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPage(page)}
                  className={btn('secondary', 'sm')}
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(page)}
                  className={btn('secondary', 'sm')}
                >
                  {page.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingPage && (
          <ModalFrame label={'Edit page SEO'} onClose={() => setEditingPage(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit SEO - {PAGE_LABELS[editingPage.page_slug]}
                </h2>
                <button
                  onClick={() => setEditingPage(null)}
                  className={iconButton}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Title * (max 60 characters)
                  </label>
                  <input
                    type="text"
                    value={editingPage.meta_title}
                    onChange={(e) => setEditingPage({ ...editingPage, meta_title: e.target.value })}
                    maxLength={60}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingPage.meta_title.length}/60 characters
                    {editingPage.meta_title.length > 60 && (
                      <span className="text-red-600 ml-2">Too long!</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Description * (max 160 characters)
                  </label>
                  <textarea
                    value={editingPage.meta_description}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, meta_description: e.target.value })
                    }
                    rows={3}
                    maxLength={160}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingPage.meta_description.length}/160 characters
                    {editingPage.meta_description.length > 160 && (
                      <span className="text-red-600 ml-2">Too long!</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editingPage.meta_keywords || ''}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, meta_keywords: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="travel, visa, nigeria, export"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Open Graph (Social Media Preview)
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OG Title (max 60 characters)
                    </label>
                    <input
                      type="text"
                      value={editingPage.og_title || ''}
                      onChange={(e) => setEditingPage({ ...editingPage, og_title: e.target.value })}
                      maxLength={60}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty to use Meta Title"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OG Description (max 200 characters)
                    </label>
                    <textarea
                      value={editingPage.og_description || ''}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, og_description: e.target.value })
                      }
                      rows={2}
                      maxLength={200}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty to use Meta Description"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OG Image URL
                    </label>
                    <input
                      type="url"
                      value={editingPage.og_image_url || ''}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, og_image_url: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://... (recommended: 1200x630px)"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Twitter Card</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Type
                    </label>
                    <select
                      value={editingPage.twitter_card_type}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, twitter_card_type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary with Large Image</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 dark:bg-white/5 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingPage(null)}
                  className={btn('secondary')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={btn('primary')}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </ModalFrame>
        )}
      </div>
    </AdminLayout>
  );
}
