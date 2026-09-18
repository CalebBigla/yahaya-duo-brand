import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { signIn, getCurrentSession } from '@/lib/auth';
import { Mail, Lock, AlertCircle, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

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

    // Rate limiting: max 5 attempts
    if (attemptCount >= 5) {
      setIsRateLimited(true);
      setError('Too many failed attempts. Please wait 5 minutes before trying again.');
      setTimeout(() => {
        setIsRateLimited(false);
        setAttemptCount(0);
      }, 5 * 60 * 1000); // 5 minutes
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        // Reset attempt count on successful login
        setAttemptCount(0);
        navigate({ to: '/admin' });
      } else {
        // Increment attempt count on failure
        setAttemptCount(prev => prev + 1);
        setError(result.error || 'Sign in failed');
      }
    } catch (err) {
      setAttemptCount(prev => prev + 1);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-blue-100/70">
            Yahaya Travel and Trade Co Ltd
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-white/10 bg-white shadow-2xl p-8">
          {showTimeout && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  Session expired due to inactivity
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="admin@example.com"
                  disabled={isLoading || isRateLimited}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="••••••••••••"
                  disabled={isLoading || isRateLimited}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading || isRateLimited}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isRateLimited}
              className="w-full rounded-lg bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Rate Limit Warning */}
            {attemptCount > 2 && attemptCount < 5 && !isRateLimited && (
              <p className="text-xs text-center text-amber-600">
                {5 - attemptCount} {attemptCount === 4 ? 'attempt' : 'attempts'} remaining before temporary lockout
              </p>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-900">Security Notice:</strong> This area is
              restricted to authorized personnel only. All access attempts are logged and
              monitored.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-blue-100/70">
          © {new Date().getFullYear()} Yahaya Travel and Trade Co Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
