import { createFileRoute, Link } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { 
  Home, 
  Briefcase, 
  Image, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export const Route = createFileRoute('/admin/website')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <WebsitePage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface ModuleCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status: 'published' | 'draft' | 'empty';
  itemCount?: number;
}

function WebsitePage() {
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
    };

    loadAdminData();
  }, []);

  const modules: ModuleCard[] = [
    {
      title: 'Homepage',
      description: 'Hero section, stats, mission & vision',
      icon: Home,
      href: '/admin/website/homepage',
      status: 'published',
      itemCount: 1,
    },
    {
      title: 'Services',
      description: 'Travel & trade service listings',
      icon: Briefcase,
      href: '/admin/website/services',
      status: 'published',
      itemCount: 10,
    },
    {
      title: 'Gallery',
      description: 'Image gallery with categories',
      icon: Image,
      href: '/admin/website/gallery',
      status: 'empty',
      itemCount: 0,
    },
    {
      title: 'Testimonials',
      description: 'Client reviews and feedback',
      icon: MessageSquare,
      href: '/admin/website/testimonials',
      status: 'empty',
      itemCount: 0,
    },
    {
      title: 'FAQs',
      description: 'Frequently asked questions',
      icon: HelpCircle,
      href: '/admin/website/faqs',
      status: 'empty',
      itemCount: 0,
    },
    {
      title: 'Company Info',
      description: 'Contact details, hours, address',
      icon: Settings,
      href: '/admin/website/company-info',
      status: 'published',
      itemCount: 1,
    },
    {
      title: 'SEO Settings',
      description: 'Meta tags for each page',
      icon: Search,
      href: '/admin/website/seo',
      status: 'published',
      itemCount: 6,
    },
  ];

  const getStatusBadge = (status: ModuleCard['status']) => {
    switch (status) {
      case 'published':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </div>
        );
      case 'draft':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Draft
          </div>
        );
      case 'empty':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Empty
          </div>
        );
    }
  };

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Website CMS</h1>
          <p className="text-gray-600 mt-1">
            Manage all public-facing website content with draft/publish workflow
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Published Content</p>
                <p className="text-2xl font-bold text-green-900 mt-1">4</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Draft Items</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">0</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Modules</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">7</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                to={module.href}
                className="block bg-white border rounded-lg p-5 hover:border-teal-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  {getStatusBadge(module.status)}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{module.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                <div className="text-xs text-gray-500">
                  {module.itemCount} {module.itemCount === 1 ? 'item' : 'items'}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Guide */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
          <h3 className="font-semibold text-teal-900 mb-2">📖 Quick Guide</h3>
          <ul className="text-sm text-teal-800 space-y-1">
            <li>• <strong>Draft:</strong> Save changes without making them live</li>
            <li>• <strong>Publish:</strong> Make content visible on the public website</li>
            <li>• <strong>Permissions:</strong> Staff can view, only admins can publish</li>
            <li>• <strong>Database:</strong> All content is stored in Supabase with audit logs</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
