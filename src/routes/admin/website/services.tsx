import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DeleteConfirmation } from '@/components/admin/DeleteConfirmation';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/website/services')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <ServicesPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface Service {
  id: string;
  division: 'travel' | 'trade';
  slug: string;
  title: string;
  summary: string;
  detail: string;
  icon_name?: string;
  image_url?: string;
  display_order: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

function ServicesPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [activeDivision, setActiveDivision] = useState<'travel' | 'trade'>('travel');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchServices();
    };
    loadData();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('website_services')
      .select('*')
      .order('division', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const filteredServices = services.filter((s) => s.division === activeDivision);

  const handleCreate = () => {
    setEditingService({
      id: '',
      division: activeDivision,
      slug: '',
      title: '',
      summary: '',
      detail: '',
      display_order: filteredServices.length + 1,
      status: 'draft',
      created_at: '',
      updated_at: '',
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingService) return;
    const wasCreating = isCreating;

    // Validate required fields
    if (
      !editingService.title ||
      !editingService.slug ||
      !editingService.summary ||
      !editingService.detail
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (isCreating) {
      const { error } = await supabase.from('website_services').insert({
        ...editingService,
        updated_by: adminUser?.user_id,
      });

      if (error) {
        console.error('Error creating service:', error);
        toast.error('Unable to save the service. Please try again.');
        return;
      }
    } else {
      const { error } = await supabase
        .from('website_services')
        .update({
          ...editingService,
          updated_by: adminUser?.user_id,
        })
        .eq('id', editingService.id);

      if (error) {
        console.error('Error updating service:', error);
        toast.error('Unable to save the service. Please try again.');
        return;
      }
    }

    setEditingService(null);
    setIsCreating(false);
    await fetchServices();
    toast.success(wasCreating ? 'Service created successfully.' : 'Service updated successfully.');
  };

  const handleDelete = async (service: Service) => {
    const { data, error } = await supabase.from('website_services').delete().eq('id', service.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error('No service row was deleted');
    setServices((current) => current.filter((row) => row.id !== service.id));
  };

  const handleToggleStatus = async (service: Service) => {
    const newStatus = service.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('website_services')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
        updated_by: adminUser?.user_id,
      })
      .eq('id', service.id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Unable to update service status. Please try again.');
    } else {
      await fetchServices();
      toast.success(`Service ${newStatus === 'published' ? 'published' : 'unpublished'} successfully.`);
    }
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <TablePageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-1">Manage travel and trade service listings</p>
        </div>

        {/* Division Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveDivision('travel')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeDivision === 'travel'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Travel Services ({services.filter((s) => s.division === 'travel').length})
          </button>
          <button
            onClick={() => setActiveDivision('trade')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeDivision === 'trade'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Trade Services ({services.filter((s) => s.division === 'trade').length})
          </button>
        </div>

        {/* Create Button */}
        <div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add {activeDivision === 'travel' ? 'Travel' : 'Trade'} Service
          </button>
        </div>

        {/* Services List */}
        <div className="space-y-3">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <p className="text-gray-600">No services yet. Click "Add Service" to create one.</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border rounded-lg p-4 hover:border-teal-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <button className="mt-1 text-gray-400 hover:text-gray-600 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.summary}</p>
                        <p className="text-xs text-gray-500 mt-1">Slug: /{service.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.status === 'published' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <Eye className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            <EyeOff className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setEditingService(service)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(service)}
                        className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 flex items-center gap-1"
                      >
                        {service.status === 'published' ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Publish
                          </>
                        )}
                      </button>
                      <DeleteConfirmation trigger={<button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>} title="Delete service?" description="Are you sure you want to delete this service? This action cannot be undone." detail={service.title} successMessage="Service deleted successfully." errorMessage="Unable to delete this service. Please try again." onConfirm={() => handleDelete(service)} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Modal */}
        {editingService && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Create Service' : 'Edit Service'}
                </h2>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setIsCreating(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                  <select
                    value={editingService.division}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        division: e.target.value as 'travel' | 'trade',
                      })
                    }
                    disabled={!isCreating}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="travel">Travel</option>
                    <option value="trade">Trade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingService.title}
                    onChange={(e) =>
                      setEditingService({ ...editingService, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., Visa Processing Services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug * (URL-friendly, no spaces)
                  </label>
                  <input
                    type="text"
                    value={editingService.slug}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., visa-processing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary * (Brief description)
                  </label>
                  <textarea
                    value={editingService.summary}
                    onChange={(e) =>
                      setEditingService({ ...editingService, summary: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="One-line summary shown in cards"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    value={editingService.detail}
                    onChange={(e) =>
                      setEditingService({ ...editingService, detail: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Full description shown on service detail pages"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon Name (Lucide icon)
                    </label>
                    <input
                      type="text"
                      value={editingService.icon_name || ''}
                      onChange={(e) =>
                        setEditingService({ ...editingService, icon_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., Plane, Ship, Briefcase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editingService.display_order}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          display_order: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={editingService.image_url || ''}
                    onChange={(e) =>
                      setEditingService({ ...editingService, image_url: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingService(null);
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
                  {isCreating ? 'Create Service' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
