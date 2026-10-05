import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { Save, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/admin/website/company-info')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <CompanyInfoPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface CompanySettings {
  id: string;
  company_name: string;
  company_short_name: string;
  sub_brand: string;
  rc_number: string;
  email: string;
  phone_primary: string;
  phone_secondary?: string;
  whatsapp_number: string;
  address_street: string;
  address_locality: string;
  address_region: string;
  address_country: string;
  business_hours: Array<{ days: string; time: string }>;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
  status: 'draft' | 'published';
  updated_at: string;
}

function CompanyInfoPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CompanySettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await fetchSettings();
    };
    loadData();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data: settings, error } = await supabase.from('website_settings').select('*').single();

    if (error) {
      console.error('Error fetching settings:', error);
    } else {
      setData(settings);
    }
    setLoading(false);
  };

  const handleSaveDraft = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase
      .from('website_settings')
      .update({ ...data, status: 'draft', updated_by: adminUser?.user_id })
      .eq('id', data.id);

    if (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } else {
      setHasChanges(false);
      await fetchSettings();
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!data) return;
    if (
      !confirm(
        'Publish company information changes? This will update contact details on the website.',
      )
    ) {
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('website_settings')
      .update({
        ...data,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: adminUser?.user_id,
      })
      .eq('id', data.id);

    if (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish');
    } else {
      setHasChanges(false);
      await fetchSettings();
      alert('Company information published successfully!');
    }
    setSaving(false);
  };

  const updateField = (field: keyof CompanySettings, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
    setHasChanges(true);
  };

  const updateBusinessHour = (index: number, field: 'days' | 'time', value: string) => {
    if (!data) return;
    const newHours = [...data.business_hours];
    newHours[index] = {
      days: newHours[index]?.days ?? '',
      time: newHours[index]?.time ?? '',
      [field]: value,
    };
    setData({ ...data, business_hours: newHours });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout adminUser={adminUser}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Failed to load company information</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6 max-w-4xl">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Company Information</h1>
          <p className="text-gray-600 mt-1">Contact details, address, and business hours</p>
        </div>

        {data.status === 'published' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Published</p>
              <p className="text-xs text-green-700">
                Last updated: {new Date(data.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Draft</p>
              <p className="text-xs text-yellow-700">
                Changes are not visible on the public website
              </p>
            </div>
          </div>
        )}

        {/* Company Details */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Company Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                value={data.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Name</label>
              <input
                type="text"
                value={data.company_short_name}
                onChange={(e) => updateField('company_short_name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Brand</label>
              <input
                type="text"
                value={data.sub_brand}
                onChange={(e) => updateField('sub_brand', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RC Number</label>
              <input
                type="text"
                value={data.rc_number}
                onChange={(e) => updateField('rc_number', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Phone *
              </label>
              <input
                type="tel"
                value={data.phone_primary}
                onChange={(e) => updateField('phone_primary', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Phone
              </label>
              <input
                type="tel"
                value={data.phone_secondary || ''}
                onChange={(e) => updateField('phone_secondary', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number *
            </label>
            <input
              type="tel"
              value={data.whatsapp_number}
              onChange={(e) => updateField('whatsapp_number', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., 2349127650968"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Address</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              value={data.address_street}
              onChange={(e) => updateField('address_street', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Locality *
              </label>
              <input
                type="text"
                value={data.address_locality}
                onChange={(e) => updateField('address_locality', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State/Region *</label>
              <input
                type="text"
                value={data.address_region}
                onChange={(e) => updateField('address_region', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <input
              type="text"
              value={data.address_country}
              onChange={(e) => updateField('address_country', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Business Hours</h2>

          {data.business_hours.map((hour, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                <input
                  type="text"
                  value={hour.days}
                  onChange={(e) => updateBusinessHour(index, 'days', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="text"
                  value={hour.time}
                  onChange={(e) => updateBusinessHour(index, 'time', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Social Media */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
            <input
              type="url"
              value={data.facebook_url || ''}
              onChange={(e) => updateField('facebook_url', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
            <input
              type="url"
              value={data.instagram_url || ''}
              onChange={(e) => updateField('instagram_url', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X URL</label>
              <input
                type="url"
                value={data.twitter_url || ''}
                onChange={(e) => updateField('twitter_url', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={data.linkedin_url || ''}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TikTok URL</label>
              <input
                type="url"
                value={data.tiktok_url || ''}
                onChange={(e) => updateField('tiktok_url', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">You have unsaved changes</div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  fetchSettings();
                  setHasChanges(false);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={saving}
              >
                Discard
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                disabled={saving}
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
