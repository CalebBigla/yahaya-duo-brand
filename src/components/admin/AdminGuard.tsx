/**
 * Admin Route Guard
 * Protects admin routes from unauthorized access
 * This is a UX convenience - actual security is enforced via RLS
 */
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { checkAdminAccess, InactivityManager } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminRouteSkeleton } from '@/components/admin/SkeletonLoader';
import { AdminAuthContext } from '@/components/admin/AdminAuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
  requireOwner?: boolean;
}

export function AdminGuard({ children, requireOwner = false }: AdminGuardProps) {
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const router = useRouter();
  const sharedAuth = useContext(AdminAuthContext);

  useEffect(() => {
    if (sharedAuth) {
      if (sharedAuth.status === 'authenticated' && requireOwner && sharedAuth.user?.role !== 'owner') {
        navigate({ to: '/admin' });
      }
      return;
    }

    let inactivityManager: InactivityManager | null = null;

    const checkAccess = async () => {
      const result = await checkAdminAccess();

      // Handle database errors separately
      if (result.error === 'DATABASE_ERROR') {
        setAuthState('error');
        setError('Database connection error. Please try refreshing the page or contact support.');
        return;
      }

      if (!result.isAdmin) {
        navigate({ to: '/admin/login' });
        return;
      }

      // If owner role is required, check that too
      if (requireOwner && result.user?.role !== 'owner') {
        navigate({ to: '/admin' }); // Redirect to dashboard
        return;
      }

      // Only set authenticated state after all checks pass
      setAuthState('authenticated');

      // Start inactivity timer for auto-logout
      inactivityManager = new InactivityManager();
    };

    checkAccess();

    return () => {
      if (inactivityManager) {
        inactivityManager.destroy();
      }
    };
  }, [navigate, requireOwner, sharedAuth]);

  const effectiveAuthState = sharedAuth?.status ?? authState;

  if (sharedAuth?.status === 'authenticated' && requireOwner && sharedAuth.user?.role !== 'owner') {
    return <AdminRouteSkeleton pathname={router.state.location.pathname} />;
  }

  // Show loading state while checking authentication
  if (effectiveAuthState === 'checking') {
    if (sharedAuth) return <AdminRouteSkeleton pathname={router.state.location.pathname} />;
    return (
      <AdminLayout adminUser={null}>
        <div aria-live="polite" aria-busy="true">
          <p className="sr-only">Verifying access and loading the admin page.</p>
          <AdminRouteSkeleton pathname={router.state.location.pathname} />
        </div>
      </AdminLayout>
    );
  }

  // Show error if database fails
  if (effectiveAuthState === 'error') {
    if (sharedAuth) {
      return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{sharedAuth.errorMessage || 'Unable to verify admin access. Please try again.'}</div>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-white dark:bg-gray-800 p-8 shadow-xl">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Database Error</h1>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Only render children after authentication is confirmed
  return <>{children}</>;
}
