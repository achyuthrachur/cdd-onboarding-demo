'use client';

import { useAIStatus } from '@/hooks/use-ai-status';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AIStatusBadgeProps {
  showLabel?: boolean;
  className?: string;
}

/**
 * Badge component that shows the current AI API status.
 * Useful for indicating whether AI features are available or in demo mode.
 */
export function AIStatusBadge({ showLabel = true, className }: AIStatusBadgeProps) {
  const { activeProvider, loading, error } = useAIStatus();

  if (loading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (error) {
    return (
      <Badge variant="outline" className={`text-red-600 border-red-300 dark:text-red-400 dark:border-red-700 ${className}`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {showLabel && 'Error'}
      </Badge>
    );
  }

  if (activeProvider === 'none') {
    return (
      <Badge variant="outline" className={`text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-600 ${className}`}>
        <Sparkles className="h-3 w-3 mr-1" />
        {showLabel && 'Demo Mode'}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-green-600 border-green-300 dark:text-green-400 dark:border-green-700 ${className}`}>
      <CheckCircle2 className="h-3 w-3 mr-1" />
      {showLabel && `AI Ready (${activeProvider})`}
    </Badge>
  );
}

/**
 * Compact version that just shows an icon with tooltip-style info
 */
export function AIStatusIndicator({ className }: { className?: string }) {
  const { activeProvider, loading } = useAIStatus();

  if (loading) {
    return <Skeleton className="h-4 w-4 rounded-full" />;
  }

  if (activeProvider === 'none') {
    return (
      <div className={`h-4 w-4 rounded-full bg-amber-500 animate-pulse ${className}`} title="Demo Mode - No API Key" />
    );
  }

  return (
    <div className={`h-4 w-4 rounded-full bg-green-500 ${className}`} title={`AI Ready (${activeProvider})`} />
  );
}
