/**
 * Admin Route Guard
 * Protects admin routes from unauthorized access
 * This is a UX convenience - actual security is enforced via RLS
 */
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { checkAdminAccess, InactivityManager } from '@/lib/auth';
import { LoadingState } from '@/components/site/LoadingState';

interface AdminGuardProps {
  children: React.ReactNode;
  requireOwner?: boolean;
}

export function AdminGuard({ children, requireOwner = false }: AdminGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let inactivityManager: InactivityManager | null = null;

    const checkAccess = async () => {
      const result = await checkAdminAccess();

      // Handle database errors separately
      if (result.error === 'DATABASE_ERROR') {
        setError('Database connection error. Please try refreshing the page or contact support.');
        setIsChecking(false);
        return;
      }

      if (!result.isAdmin) {
        navigate({ to: '/admin/login' });
        return;
      }

      // If owner role is required, check that too
      if (requireOwner && result.user?.role !== 'owner') {
        navigate({ to: '/admin' }); // Redirect to dashboard, show access denied
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);

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

  if (isChecking) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-deep via-primary to-primary-deep/90 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-card p-8 shadow-elevated">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Database Error</h1>
          </div>
          <p className="text-center text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-lg bg-accent py-3 font-bold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Navigation will happen via useEffect
  }

  return <>{children}</>;
}
