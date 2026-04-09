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
      <Badge variant="outline" className={`text-crowe-coral border-crowe-coral/40 dark:text-crowe-coral dark:border-crowe-coral-dark ${className}`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {showLabel && 'Error'}
      </Badge>
    );
  }

  if (activeProvider === 'none') {
    return (
      <Badge variant="outline" className={`text-crowe-amber-dark border-crowe-amber/50 dark:text-crowe-amber-bright dark:border-crowe-amber-dark ${className}`}>
        <Sparkles className="h-3 w-3 mr-1" />
        {showLabel && 'Demo Mode'}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-crowe-teal-dark border-crowe-teal/40 dark:text-crowe-teal-bright dark:border-crowe-teal-dark ${className}`}>
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
      <div className={`h-4 w-4 rounded-full bg-crowe-amber animate-pulse ${className}`} title="Demo Mode - No API Key" />
    );
  }

  return (
    <div className={`h-4 w-4 rounded-full bg-crowe-teal ${className}`} title={`AI Ready (${activeProvider})`} />
  );
}
