import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/team')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <TeamPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function TeamPage() {
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
        moduleName="Team & Permissions"
        description="Manage admin users, assign roles (Owner/Editor), and control access permissions for your team members."
        estimatedDate="Module 8"
      />
    </AdminLayout>
  );
}
