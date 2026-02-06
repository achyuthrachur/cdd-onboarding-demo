'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showScrollHint?: boolean;
}

/**
 * ScrollableTable - Wrapper component for wide tables with visible scrollbars
 *
 * Features:
 * - Always-visible horizontal scrollbar at container level
 * - Optional vertical scrolling with max-height
 * - Scroll hint gradient for overflow indication
 * - Custom styled scrollbars for better UX
 *
 * Usage:
 * ```tsx
 * <ScrollableTable maxHeight="70vh">
 *   <table>...</table>
 * </ScrollableTable>
 * ```
 */
export function ScrollableTable({
  children,
  className,
  maxHeight = '70vh',
  showScrollHint = true,
}: ScrollableTableProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftHint, setShowLeftHint] = React.useState(false);
  const [showRightHint, setShowRightHint] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftHint(scrollLeft > 0);
      setShowRightHint(scrollLeft < scrollWidth - clientWidth - 1);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  return (
    <div className="relative">
      {/* Scroll container with visible scrollbars */}
      <div
        ref={containerRef}
        className={cn(
          'overflow-x-auto overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          'scrollbar-track-transparent',
          'border border-gray-200 dark:border-white/10',
          'rounded-lg',
          'scroll-always',
          className
        )}
        style={{ maxHeight }}
      >
        {children}
      </div>

      {/* Left scroll hint */}
      {showScrollHint && showLeftHint && (
        <div
          className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(255, 255, 255, 0.9), transparent)',
          }}
        />
      )}

      {/* Right scroll hint */}
      {showScrollHint && showRightHint && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
          style={{
            background:
              'linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent)',
          }}
        />
      )}
    </div>
  );
}

/**
 * StickyColumnTable - Table with sticky first N columns
 * For tables with many columns where first few should remain visible
 */
interface StickyColumnTableProps {
  children: React.ReactNode;
  stickyColumns?: number;
  className?: string;
}

export function StickyColumnTable({
  children,
  stickyColumns = 2,
  className,
}: StickyColumnTableProps) {
  return (
    <div className={cn('relative overflow-x-auto', className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 dark:border-white/10 rounded-lg">
          <style jsx>{`
            table th:nth-child(-n+${stickyColumns}),
            table td:nth-child(-n+${stickyColumns}) {
              position: sticky;
              left: 0;
              z-index: 10;
              background: white;
            }
            .dark table th:nth-child(-n+${stickyColumns}),
            .dark table td:nth-child(-n+${stickyColumns}) {
              background: rgba(1, 30, 65, 0.95);
            }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  );
}
