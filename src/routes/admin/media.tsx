import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/media')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <MediaPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function MediaPage() {
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
        moduleName="Media Library"
        description="Upload, organize and manage all your images and documents. Integrated with Cloudinary for optimized media delivery."
        estimatedDate="Module 7"
      />
    </AdminLayout>
  );
}
