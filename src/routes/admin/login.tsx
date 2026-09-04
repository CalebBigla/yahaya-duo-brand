import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { signIn, getCurrentSession } from '@/lib/auth';
import { Mail, Lock, AlertCircle, Shield } from 'lucide-react';

export const Route = createFileRoute('/admin/login')({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkExistingSession = async () => {
      const session = await getCurrentSession();
      if (session) {
        navigate({ to: '/admin' });
      }
    };

    checkExistingSession();

    // Check for timeout parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('timeout') === 'true') {
      setShowTimeout(true);
      setError('Your session has expired due to inactivity. Please sign in again.');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        navigate({ to: '/admin' });
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-deep via-primary to-primary-deep/90 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/70">
            Yahaya Travel and Trade Co Ltd
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-primary-foreground/10 bg-card p-8 shadow-elevated">
          {showTimeout && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                <div className="text-sm text-amber-500">
                  Session expired due to inactivity
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <div className="text-sm text-red-500">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-accent py-3.5 font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Security Notice:</strong> This area is
              restricted to authorized personnel only. All access attempts are logged and
              monitored.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Yahaya Travel and Trade Co Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
