import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/settings')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <SettingsPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function SettingsPage() {
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
        moduleName="Settings"
        description="Configure system settings, update your profile, manage notification preferences, and customize your dashboard experience."
        estimatedDate="Module 9"
      />
    </AdminLayout>
  );
}
