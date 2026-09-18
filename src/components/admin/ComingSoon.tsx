import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface ComingSoonProps {
  moduleName: string;
  description?: string;
  estimatedDate?: string;
}

export function ComingSoon({ moduleName, description, estimatedDate }: ComingSoonProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
          <Construction className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {moduleName} Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          {description || 
            `The ${moduleName} module is currently under development. We're working hard to bring you this feature.`}
        </p>

        {/* Estimated Date */}
        {estimatedDate && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 mb-8">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Expected: {estimatedDate}
            </span>
          </div>
        )}

        {/* Available Features */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-wider">
            Currently Available Modules
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="inline-flex items-center rounded-lg bg-green-100 dark:bg-green-900/30 px-3 py-1.5 text-sm font-medium text-green-800 dark:text-green-200">
              ✓ Dashboard
            </span>
            <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
              Enquiries (Coming Soon)
            </span>
            <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
              Clients (Coming Soon)
            </span>
            <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
              Quotes (Coming Soon)
            </span>
          </div>
        </div>

        {/* Back Button */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Info Card */}
        <div className="mt-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-200">Development Update:</strong> We're building this admin dashboard module-by-module to ensure quality and reliability. Each module undergoes thorough testing before release.
          </p>
        </div>
      </div>
    </div>
  );
}
