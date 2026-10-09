import { createFileRoute, Link, Outlet, useLocation, redirect } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CardGridPageSkeleton } from '@/components/admin/SkeletonLoader';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
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
  AlertCircle,
  Plane,
} from 'lucide-react';

export const Route = createFileRoute('/admin/website')({
  beforeLoad: async ({ location }) => {
    const result = await checkAdminAccess();
    if (!result.isAdmin) {
      throw redirect({ to: '/admin/login', search: { redirect: location.href } });
    }
  },
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

type ModuleKey = 'homepage' | 'services' | 'gallery' | 'testimonials' | 'faqs' | 'visaDestinations' | 'settings' | 'seo';

interface ModuleStatus {
  status: ModuleCard['status'];
  itemCount: number;
}

function WebsitePage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [moduleStatus, setModuleStatus] = useState<Record<ModuleKey, ModuleStatus>>({
    homepage: { status: 'empty', itemCount: 0 },
    services: { status: 'empty', itemCount: 0 },
    gallery: { status: 'empty', itemCount: 0 },
    testimonials: { status: 'empty', itemCount: 0 },
    faqs: { status: 'empty', itemCount: 0 },
    visaDestinations: { status: 'empty', itemCount: 0 },
    settings: { status: 'empty', itemCount: 0 },
    seo: { status: 'empty', itemCount: 0 },
  });
  const [loadingModules, setLoadingModules] = useState(true);
  const [moduleLoadError, setModuleLoadError] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      await loadModuleStatus();
    };

    loadAdminData();
  }, []);

  const loadModuleStatus = async () => {
    const tables: Array<[ModuleKey, string]> = [
      ['homepage', 'website_homepage'],
      ['services', 'website_services'],
      ['gallery', 'website_gallery'],
      ['testimonials', 'website_testimonials'],
      ['faqs', 'website_faqs'],
      ['visaDestinations', 'website_visa_destinations'],
      ['settings', 'website_settings'],
      ['seo', 'website_seo'],
    ];

    const results = await Promise.all(
      tables.map(async ([key, table]) => {
        const { data, error } = await supabase.from(table).select('status');
        if (error) {
          setModuleLoadError(true);
          return [key, { status: 'empty', itemCount: 0 }] as const;
        }

        const rows = data ?? [];
        const published = rows.filter((row) => row.status === 'published').length;
        const draft = rows.filter((row) => row.status === 'draft').length;
        return [
          key,
          {
            status: published > 0 ? 'published' : draft > 0 ? 'draft' : 'empty',
            itemCount: rows.length,
          },
        ] as const;
      }),
    );

    setModuleStatus(Object.fromEntries(results) as Record<ModuleKey, ModuleStatus>);
    setLoadingModules(false);
  };

  if (location.pathname !== '/admin/website') {
    return <Outlet />;
  }

  if (loadingModules) {
    return <AdminLayout adminUser={adminUser}><CardGridPageSkeleton cards={8} /></AdminLayout>;
  }

  const modules: ModuleCard[] = [
    {
      title: 'Homepage',
      description: 'Hero section, stats, mission & vision',
      icon: Home,
      href: '/admin/website/homepage',
      ...moduleStatus.homepage,
    },
    {
      title: 'Services',
      description: 'Travel & trade service listings',
      icon: Briefcase,
      href: '/admin/website/services',
      ...moduleStatus.services,
    },
    {
      title: 'Gallery',
      description: 'Image gallery with categories',
      icon: Image,
      href: '/admin/website/gallery',
      ...moduleStatus.gallery,
    },
    {
      title: 'Testimonials',
      description: 'Client reviews and feedback',
      icon: MessageSquare,
      href: '/admin/website/testimonials',
      ...moduleStatus.testimonials,
    },
    {
      title: 'FAQs',
      description: 'Frequently asked questions',
      icon: HelpCircle,
      href: '/admin/website/faqs',
      ...moduleStatus.faqs,
    },
    {
      title: 'Visa Destination Quick Reference',
      description: 'Destinations, visa types, processing times and notes',
      icon: Plane,
      href: '/admin/website/visa-destinations',
      ...moduleStatus.visaDestinations,
    },
    {
      title: 'Company Info',
      description: 'Contact details, hours, address',
      icon: Settings,
      href: '/admin/website/company-info',
      ...moduleStatus.settings,
    },
    {
      title: 'SEO Settings',
      description: 'Meta tags for each page',
      icon: Search,
      href: '/admin/website/seo',
      ...moduleStatus.seo,
    },
  ];
  const moduleTotals = Object.values(moduleStatus);
  const publishedContent = moduleTotals.reduce(
    (total, module) => total + (module.status === 'published' ? module.itemCount : 0),
    0,
  );
  const draftItems = moduleTotals.reduce(
    (total, module) => total + (module.status === 'draft' ? module.itemCount : 0),
    0,
  );

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
        {moduleLoadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Some CMS module details could not be loaded.</div>}
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Website CMS</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all public-facing website content with draft/publish workflow
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Published Content</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{publishedContent}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Draft Items</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{draftItems}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Modules</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">8</p>
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
                className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                    <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  {getStatusBadge(module.status)}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{module.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{module.description}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {module.itemCount} {module.itemCount === 1 ? 'item' : 'items'}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Guide */}
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-5">
          <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">📖 Quick Guide</h3>
          <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
            <li>
              • <strong>Draft:</strong> Save changes without making them live
            </li>
            <li>
              • <strong>Publish:</strong> Make content visible on the public website
            </li>
            <li>
              • <strong>Permissions:</strong> Staff can view, only admins can publish
            </li>
            <li>
              • <strong>Database:</strong> All content is stored in Supabase with audit logs
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
