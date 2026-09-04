import { createFileRoute, Link } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { signOut, checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  LogOut,
  Shield,
  Activity,
} from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: () => (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  ),
});

function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [stats, setStats] = useState({
    newSubmissions: 0,
    totalContent: 0,
  });

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
    };

    loadAdminData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/admin/login';
  };

  const isOwner = adminUser?.role === 'owner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h1 className="font-display text-xl font-bold text-primary">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Yahaya Travel and Trade Co Ltd
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-page py-8">
        {/* Welcome Section */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-bold text-primary">
            Welcome back, {isOwner ? 'Owner' : 'Editor'}!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Manage your website content and view form submissions from this dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New Submissions
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {stats.newSubmissions}
                </p>
              </div>
              <MessageSquare className="h-10 w-10 text-accent/50" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Content Blocks
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {stats.totalContent}
                </p>
              </div>
              <FileText className="h-10 w-10 text-accent/50" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                <p className="mt-2 text-xl font-bold text-accent capitalize">
                  {adminUser?.role || 'Loading...'}
                </p>
              </div>
              <Shield className="h-10 w-10 text-accent/50" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="mt-2 flex items-center gap-2 text-xl font-bold text-green-500">
                  <Activity className="h-5 w-5" />
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Content Manager */}
          <Link
            to="/admin/content"
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary group-hover:text-accent">
                  Content Manager
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Edit text and images across all pages
                </p>
              </div>
            </div>
          </Link>

          {/* Form Submissions */}
          <Link
            to="/admin/submissions"
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary group-hover:text-accent">
                  Form Submissions
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  View and manage contact form submissions
                </p>
              </div>
            </div>
          </Link>

          {/* Admin Users (Owner Only) */}
          {isOwner && (
            <Link
              to="/admin/users"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent">
                    Admin Users
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Manage admin access and permissions
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-6">
          <div className="flex gap-4">
            <Shield className="h-6 w-6 shrink-0 text-accent" />
            <div>
              <h3 className="font-bold text-accent">Security Notice</h3>
              <p className="mt-2 text-sm text-foreground/80">
                Your session will automatically expire after 30 minutes of inactivity. All
                actions are logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
