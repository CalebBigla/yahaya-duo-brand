import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/admin/website/faqs')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <FAQsPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface FAQ {
  id: string;
  category: 'general' | 'travel' | 'trade' | 'visa' | 'payment';
  question: string;
  answer: string;
  display_order: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'travel', label: 'Travel' },
  { value: 'trade', label: 'Trade' },
  { value: 'visa', label: 'Visa' },
  { value: 'payment', label: 'Payment' },
] as const;

function FAQsPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<FAQ | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchFAQs();
    };
    loadData();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('website_faqs')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
    } else {
      setFaqs(data || []);
    }
    setLoading(false);
  };

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const handleCreate = () => {
    setEditingItem({
      id: '',
      category: 'general',
      question: '',
      answer: '',
      display_order: faqs.length + 1,
      status: 'draft',
      created_at: '',
      updated_at: '',
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    if (!editingItem.question || !editingItem.answer) {
      alert('Please fill in question and answer');
      return;
    }

    if (isCreating) {
      const { error } = await supabase
        .from('website_faqs')
        .insert({
          ...editingItem,
          updated_by: adminUser?.id,
        });

      if (error) {
        console.error('Error creating FAQ:', error);
        alert('Failed to create FAQ: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('website_faqs')
        .update({
          ...editingItem,
          updated_by: adminUser?.id,
        })
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating FAQ:', error);
        alert('Failed to update FAQ: ' + error.message);
        return;
      }
    }

    setEditingItem(null);
    setIsCreating(false);
    await fetchFAQs();
  };

  const handleDelete = async (item: FAQ) => {
    if (!confirm(`Delete this FAQ? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('website_faqs')
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ');
    } else {
      await fetchFAQs();
    }
  };

  const handleToggleStatus = async (item: FAQ) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('website_faqs')
      .update({ 
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
        updated_by: adminUser?.id,
      })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      await fetchFAQs();
    }
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading FAQs...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">FAQs Management</h1>
          <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({faqs.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({faqs.filter(f => f.category === cat.value).length})
            </button>
          ))}
        </div>

        <div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add FAQ
          </button>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-600">No FAQs yet. Click "Add FAQ" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-lg p-4 hover:border-teal-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                        {item.category}
                      </span>
                      {item.status === 'published' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.question}</h3>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
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
                  {isCreating ? 'Add FAQ' : 'Edit FAQ'}
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
                    Category *
                  </label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question * (max 500 characters)
                  </label>
                  <textarea
                    value={editingItem.question}
                    onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., How long does visa processing take?"
                  />
                  <p className="text-xs text-gray-500 mt-1">{editingItem.question.length}/500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer * (max 2000 characters)
                  </label>
                  <textarea
                    value={editingItem.answer}
                    onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                    rows={5}
                    maxLength={2000}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Provide a detailed answer..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{editingItem.answer.length}/2000 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingItem.display_order}
                    onChange={(e) => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
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
                  {isCreating ? 'Add FAQ' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
