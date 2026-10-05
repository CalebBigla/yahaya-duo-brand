import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/admin/website/testimonials')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <TestimonialsPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface Testimonial {
  id: string;
  client_name: string;
  client_title?: string;
  client_photo_url?: string;
  testimonial: string;
  rating?: number;
  service_division?: 'travel' | 'trade' | 'both';
  display_order: number;
  featured: boolean;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

function TestimonialsPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchTestimonials();
    };
    loadData();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('website_testimonials')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching testimonials:', error);
    } else {
      setTestimonials(data || []);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingItem({
      id: '',
      client_name: '',
      client_title: '',
      client_photo_url: '',
      testimonial: '',
      rating: 5,
      service_division: 'both',
      display_order: testimonials.length + 1,
      featured: false,
      status: 'draft',
      created_at: '',
      updated_at: '',
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    if (!editingItem.client_name || !editingItem.testimonial) {
      alert('Please fill in client name and testimonial');
      return;
    }

    if (isCreating) {
      const { error } = await supabase.from('website_testimonials').insert({
        ...editingItem,
        updated_by: adminUser?.user_id,
      });

      if (error) {
        console.error('Error creating testimonial:', error);
        alert('Failed to create testimonial: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('website_testimonials')
        .update({
          ...editingItem,
          updated_by: adminUser?.user_id,
        })
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating testimonial:', error);
        alert('Failed to update testimonial: ' + error.message);
        return;
      }
    }

    setEditingItem(null);
    setIsCreating(false);
    await fetchTestimonials();
  };

  const handleDelete = async (item: Testimonial) => {
    if (!confirm(`Delete testimonial from "${item.client_name}"? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('website_testimonials').delete().eq('id', item.id);

    if (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    } else {
      await fetchTestimonials();
    }
  };

  const handleToggleStatus = async (item: Testimonial) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('website_testimonials')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
        updated_by: adminUser?.user_id,
      })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      await fetchTestimonials();
    }
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading testimonials...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Testimonials Management</h1>
          <p className="text-gray-600 mt-1">Manage client reviews and feedback</p>
        </div>

        <div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Testimonial
          </button>
        </div>

        {testimonials.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-600">
              No testimonials yet. Click "Add Testimonial" to create one.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="flex h-full flex-col rounded-lg border bg-white p-5 transition-colors hover:border-teal-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.client_name}</h3>
                      {item.featured && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          ⭐ Featured
                        </span>
                      )}
                      {item.status === 'published' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                          <Eye className="w-3 h-3 inline" /> Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          <EyeOff className="w-3 h-3 inline" /> Draft
                        </span>
                      )}
                    </div>
                    {item.client_title && (
                      <p className="text-sm text-gray-600 mb-2">{item.client_title}</p>
                    )}
                    <p className="line-clamp-5 text-gray-700 mb-2">"{item.testimonial}"</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < item.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      )}
                      {item.service_division && (
                        <span className="capitalize">{item.service_division}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                  >
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Add Testimonial' : 'Edit Testimonial'}
                </h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={editingItem.client_name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, client_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Title/Role
                  </label>
                  <input
                    type="text"
                    value={editingItem.client_title || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, client_title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., CEO, ABC Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Testimonial * (max 1000 characters)
                  </label>
                  <textarea
                    value={editingItem.testimonial}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, testimonial: e.target.value })
                    }
                    rows={4}
                    maxLength={1000}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Write the testimonial here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingItem.testimonial.length}/1000 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <select
                      value={editingItem.rating || 5}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, rating: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                      <option value={3}>⭐⭐⭐ (3 stars)</option>
                      <option value={2}>⭐⭐ (2 stars)</option>
                      <option value={1}>⭐ (1 star)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Division
                    </label>
                    <select
                      value={editingItem.service_division || 'both'}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, service_division: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="both">Both</option>
                      <option value="travel">Travel</option>
                      <option value="trade">Trade</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Photo URL
                  </label>
                  <input
                    type="text"
                    value={editingItem.client_photo_url || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, client_photo_url: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editingItem.featured}
                    onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured (show on homepage)
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isCreating ? 'Add Testimonial' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
