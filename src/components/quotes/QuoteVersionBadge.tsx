/**
 * Quote Version Badge Component
 * Displays version number with styling
 */

import { GitBranch } from 'lucide-react';

interface QuoteVersionBadgeProps {
  versionNumber: number;
  isCurrent: boolean;
  className?: string;
}

export function QuoteVersionBadge({ versionNumber, isCurrent, className = '' }: QuoteVersionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isCurrent
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      } ${className}`}
      title={isCurrent ? 'Current version' : 'Superseded version'}
    >
      <GitBranch className="h-3 w-3" />
      v{versionNumber}
      {isCurrent && <span className="ml-1 text-[10px] font-bold">(Current)</span>}
    </span>
  );
}
