import { createFileRoute } from '@tanstack/react-router';
import { ModalFrame, btn, chipClass, iconButton, iconDangerButton } from '@/components/admin/ui';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CardGridPageSkeleton } from '@/components/admin/SkeletonLoader';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, X, Save, Loader2 } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, isCloudinaryConfigured, titleFromFilename, uploadImage } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { DeleteConfirmation } from '@/components/admin/DeleteConfirmation';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/website/gallery')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <GalleryPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  category: 'travel' | 'trade' | 'events' | 'team' | 'partners';
  display_order: number;
  alt_text?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'trade', label: 'Trade' },
  { value: 'events', label: 'Events' },
  { value: 'team', label: 'Team' },
  { value: 'partners', label: 'Partners' },
] as const;

function GalleryPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchGallery();
    };
    loadData();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('website_gallery')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching gallery:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems =
    activeCategory === 'all' ? items : items.filter((item) => item.category === activeCategory);

  const handleCreate = () => {
    setEditingItem({
      id: '',
      title: '',
      description: '',
      image_url: '',
      category: 'travel',
      display_order: items.length + 1,
      alt_text: '',
      status: 'draft',
      created_at: '',
      updated_at: '',
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    const wasCreating = isCreating;

    if (!editingItem.title || !editingItem.image_url) {
      toast.error('Please add a title and an image.');
      return;
    }

    if (isCreating) {
      const { error } = await supabase.from('website_gallery').insert({
        ...editingItem,
        updated_by: adminUser?.user_id,
      });

      if (error) {
        console.error('Error creating gallery item:', error);
        toast.error('Unable to save this gallery item. Please try again.');
        return;
      }
    } else {
      const { error } = await supabase
        .from('website_gallery')
        .update({
          ...editingItem,
          updated_by: adminUser?.user_id,
        })
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating gallery item:', error);
        toast.error('Unable to save this gallery item. Please try again.');
        return;
      }
    }

    setEditingItem(null);
    setIsCreating(false);
    await fetchGallery();
    toast.success(wasCreating ? 'Gallery item created successfully.' : 'Gallery item updated successfully.');
  };

  const handleDelete = async (item: GalleryItem) => {
    const { data, error } = await supabase.from('website_gallery').delete().eq('id', item.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error('No gallery row was deleted');
    setItems((current) => current.filter((row) => row.id !== item.id));
  };

  const handleToggleStatus = async (item: GalleryItem) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('website_gallery')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
        updated_by: adminUser?.user_id,
      })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Unable to update gallery status. Please try again.');
    } else {
      await fetchGallery();
      toast.success(`Gallery item ${newStatus === 'published' ? 'published' : 'unpublished'} successfully.`);
    }
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <CardGridPageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">Gallery Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage images organized by category</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={chipClass(activeCategory === 'all')}
          >
            All ({items.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={chipClass(activeCategory === cat.value)}
            >
              {cat.label} ({items.filter((i) => i.category === cat.value).length})
            </button>
          ))}
        </div>

        {/* Create Button */}
        <div>
          <button
            onClick={handleCreate}
            className={btn('primary')}
          >
            <Plus className="w-4 h-4" />
            Add Image
          </button>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-lg border-2 border-dashed">
            <p className="text-gray-600 dark:text-gray-400">No images yet. Click "Add Image" to upload one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 border rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
              >
                <div className="aspect-video bg-gray-100 dark:bg-white/10 relative">
                  <img
                    src={item.image_url}
                    alt={item.alt_text || item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://via.placeholder.com/400x300?text=Image+Not+Found';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    {item.status === 'published' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                        <Eye className="w-3 h-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white text-xs font-medium rounded">
                        <EyeOff className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.category}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className={iconButton}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={iconButton}
                        title={item.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {item.status === 'published' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <DeleteConfirmation trigger={<button className={iconDangerButton} title="Delete" aria-label={`Delete ${item.title}`}><Trash2 className="w-4 h-4" /></button>} title="Delete gallery item?" description="Are you sure you want to delete this gallery item? This action cannot be undone." detail={item.title} successMessage="Gallery item deleted successfully." errorMessage="Unable to delete this gallery item. Please try again." onConfirm={() => handleDelete(item)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <ModalFrame label={isCreating ? 'Add image' : 'Edit image'} onClose={() => { setEditingItem(null); setIsCreating(false); }}>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isCreating ? 'Add Image' : 'Edit Image'}
                </h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(false);
                  }}
                  className={iconButton}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Dubai Tour 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingItem.image_url}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, image_url: e.target.value })
                        }
                        className="min-w-0 flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Upload an image or paste a link"
                      />
                      <label
                        className={`${btn('secondary')} ${uploading || !isCloudinaryConfigured() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                        aria-busy={uploading || undefined}
                      >
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                        {uploading ? `${Math.round(uploadProgress * 100)}%` : 'Upload'}
                        <input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          className="sr-only"
                          disabled={uploading || !isCloudinaryConfigured()}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            setUploading(true);
                            setUploadProgress(0);
                            try {
                              const uploaded = await uploadImage(file, { onProgress: setUploadProgress });
                              setEditingItem((current) =>
                                current
                                  ? {
                                      ...current,
                                      image_url: uploaded.url,
                                      title: current.title || titleFromFilename(file.name),
                                    }
                                  : current,
                              );
                              toast.success('Image uploaded. Save to keep it.');
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Upload failed.');
                            } finally {
                              setUploading(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {editingItem.image_url && (
                      <div className="border rounded-lg p-2 bg-gray-50 dark:bg-white/5">
                        <img
                          src={editingItem.image_url}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://via.placeholder.com/400x300?text=Invalid+URL';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alt Text (for accessibility)
                  </label>
                  <input
                    type="text"
                    value={editingItem.alt_text || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, alt_text: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the image for screen readers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={editingItem.category}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, category: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editingItem.display_order}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 dark:bg-white/5 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(false);
                  }}
                  className={btn('secondary')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={btn('primary')}
                >
                  <Save className="w-4 h-4" />
                  {isCreating ? 'Add Image' : 'Save Changes'}
                </button>
              </div>
            </div>
          </ModalFrame>
        )}
      </div>
    </AdminLayout>
  );
}
