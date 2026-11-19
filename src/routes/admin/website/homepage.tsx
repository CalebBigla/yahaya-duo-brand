import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormSkeleton } from '@/components/admin/SkeletonLoader';
import { useConfirm } from '@/components/admin/ui';
import { toast } from 'sonner';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Save, Eye, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { contentFields, withDraft } from '@/lib/cmsDraft';

export const Route = createFileRoute('/admin/website/homepage')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <HomepagePage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface HomepageData {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image_url?: string;
  stats_years_experience: number;
  stats_clients_served: number;
  stats_destinations: number;
  stats_success_rate: number;
  mission_title: string;
  mission_content: string;
  vision_title: string;
  vision_content: string;
  status: 'draft' | 'published';
  updated_at: string;
}

function HomepagePage() {
  const [confirmAction, confirmDialog] = useConfirm();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<HomepageData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  // True when draft_data holds saved changes that are not live yet.
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchHomepage();
    };
    loadData();
  }, []);

  const fetchHomepage = async () => {
    setLoading(true);
    const { data: homepage, error } = await supabase.from('website_homepage').select('*').single();

    if (error) {
      console.error('Error fetching homepage:', error);
      // If no record exists, create default
      if (error.code === 'PGRST116') {
        await createDefaultHomepage();
      }
    } else {
      const editor = withDraft(homepage);
      setData(editor.data as HomepageData);
      setHasDraft(editor.hasDraft);
    }
    setLoading(false);
  };

  const createDefaultHomepage = async () => {
    const { data: newHomepage, error } = await supabase
      .from('website_homepage')
      .insert({
        hero_title: 'Your Trusted Partner for Global Travel and International Trade',
        hero_subtitle:
          'Connecting continents through reliable visa services, seamless logistics, and strategic sourcing solutions.',
        hero_cta_text: 'Get Started',
        hero_cta_link: '/contact',
        stats_years_experience: 10,
        stats_clients_served: 500,
        stats_destinations: 45,
        stats_success_rate: 98,
        mission_title: 'Our Mission',
        mission_content:
          'To provide world-class travel and trade solutions that connect businesses and individuals across borders with integrity, efficiency, and excellence.',
        vision_title: 'Our Vision',
        vision_content:
          'To be the most trusted name in international travel and trade facilitation across Africa and beyond.',
        status: 'draft',
      })
      .select()
      .single();

    if (!error && newHomepage) {
      setData(newHomepage);
    }
  };

  // Saves to draft_data only. The live columns and status are not touched, so the
  // public website keeps showing the published version.
  const handleSaveDraft = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase
      .from('website_homepage')
      .update({ draft_data: contentFields(data), updated_by: adminUser?.user_id })
      .eq('id', data.id);

    if (error) {
      console.error('Error saving draft:', error);
      toast.error('Unable to save changes. Please try again.');
    } else {
      setHasChanges(false);
      await fetchHomepage();
      toast.success('Draft saved. The live website is unchanged until you publish.');
    }
    setSaving(false);
  };

  const handleDiscardDraft = async () => {
    if (!data) return;
    if (!(await confirmAction({ title: 'Discard draft?', body: 'The saved draft is deleted and the editor goes back to the live version.', confirmLabel: 'Discard draft', tone: 'danger' }))) {
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('website_homepage')
      .update({ draft_data: null, updated_by: adminUser?.user_id })
      .eq('id', data.id);

    if (error) {
      console.error('Error discarding draft:', error);
      toast.error('Unable to discard the draft. Please try again.');
    } else {
      setHasChanges(false);
      await fetchHomepage();
      toast.success('Draft discarded.');
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!data) return;
    if (!(await confirmAction({ title: 'Publish homepage changes?', body: 'They become visible on the public website straight away.', confirmLabel: 'Publish' }))) {
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('website_homepage')
      .update({
        ...contentFields(data),
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: adminUser?.user_id,
        draft_data: null,
      })
      .eq('id', data.id);

    if (error) {
      console.error('Error publishing:', error);
      toast.error('Unable to publish homepage changes. Please try again.');
    } else {
      setHasChanges(false);
      await fetchHomepage();
      toast.success('Homepage published successfully.');
    }
    setSaving(false);
  };

  const updateField = (field: keyof HomepageData, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <FormSkeleton />
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout adminUser={adminUser}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Failed to load homepage data</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      {confirmDialog}
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">Homepage Editor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage hero section, statistics, mission, and vision</p>
        </div>

        {/* Status Banner */}
        {data.status === 'published' ? (
          <div className="bg-green-50 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Published</p>
              <p className="text-xs text-green-700 dark:text-emerald-300">
                Last updated: {new Date(data.updated_at).toLocaleString()}
              </p>
            </div>
            {hasDraft && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                Unpublished changes
              </span>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-amber-500/10 border border-yellow-200 dark:border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Draft</p>
              <p className="text-xs text-yellow-700 dark:text-amber-300">
                Changes are not visible on the public website
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hero Section</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hero Title</label>
            <input
              type="text"
              value={data.hero_title}
              onChange={(e) => updateField('hero_title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hero Subtitle</label>
            <textarea
              value={data.hero_subtitle}
              onChange={(e) => updateField('hero_subtitle', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CTA Button Text
              </label>
              <input
                type="text"
                value={data.hero_cta_text}
                onChange={(e) => updateField('hero_cta_text', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CTA Link</label>
              <input
                type="text"
                value={data.hero_cta_link}
                onChange={(e) => updateField('hero_cta_link', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hero Image URL (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.hero_image_url || ''}
                onChange={(e) => updateField('hero_image_url', e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/15 flex items-center gap-2"
                disabled
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Image upload coming soon. Use direct URLs for now.
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                value={data.stats_years_experience}
                onChange={(e) => updateField('stats_years_experience', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clients Served</label>
              <input
                type="number"
                value={data.stats_clients_served}
                onChange={(e) => updateField('stats_clients_served', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destinations</label>
              <input
                type="number"
                value={data.stats_destinations}
                onChange={(e) => updateField('stats_destinations', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Success Rate (%)
              </label>
              <input
                type="number"
                value={data.stats_success_rate}
                onChange={(e) => updateField('stats_success_rate', parseInt(e.target.value))}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mission & Vision</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mission Title</label>
            <input
              type="text"
              value={data.mission_title}
              onChange={(e) => updateField('mission_title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mission Content</label>
            <textarea
              value={data.mission_content}
              onChange={(e) => updateField('mission_content', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vision Title</label>
            <input
              type="text"
              value={data.vision_title}
              onChange={(e) => updateField('vision_title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vision Content</label>
            <textarea
              value={data.vision_content}
              onChange={(e) => updateField('vision_content', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Save Bar */}
        {(hasChanges || hasDraft) && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t shadow-lg p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasChanges ? 'You have unsaved changes' : 'You have a saved draft that is not published yet'}
            </div>
            <div className="flex gap-3">
              {hasChanges ? (
                <button
                  onClick={() => {
                    fetchHomepage();
                    setHasChanges(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  disabled={saving}
                >
                  Discard
                </button>
              ) : (
                <button
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  disabled={saving}
                >
                  Discard draft
                </button>
              )}
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/15 flex items-center gap-2 disabled:opacity-50"
                disabled={saving || !hasChanges}
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                disabled={saving}
              >
                <Eye className="w-4 h-4" />
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
