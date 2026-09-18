import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/website')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <WebsitePage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function WebsitePage() {
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
    };

    loadAdminData();
  }, []);

  return (
    <AdminLayout adminUser={adminUser}>
      <ComingSoon
        moduleName="Website CMS"
        description="Edit website content, update service listings, manage hero sections, and control all public-facing content without touching code."
        estimatedDate="Module 6"
      />
    </AdminLayout>
  );
}
