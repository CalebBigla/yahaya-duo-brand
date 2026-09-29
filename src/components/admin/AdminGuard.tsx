/**
 * Admin Route Guard
 * Protects admin routes from unauthorized access
 * This is a UX convenience - actual security is enforced via RLS
 */
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { checkAdminAccess, InactivityManager } from '@/lib/auth';

interface AdminGuardProps {
  children: React.ReactNode;
  requireOwner?: boolean;
}

export function AdminGuard({ children, requireOwner = false }: AdminGuardProps) {
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [navigate, requireOwner]);

  // Show loading state while checking authentication
  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error if database fails
  if (authState === 'error') {
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
