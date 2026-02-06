'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;
}

/**
 * ResponsiveContainer - Dynamic container that responds to size changes
 *
 * Features:
 * - Uses ResizeObserver for efficient resize detection
 * - Exposes current width via data attribute
 * - Optional callback for programmatic responses
 * - Respects min/max width constraints
 *
 * Usage:
 * ```tsx
 * <ResponsiveContainer minWidth={320} maxWidth={1920}>
 *   <div>Content that needs to know its width</div>
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  className,
  minWidth = 320,
  maxWidth = 1920,
  onResize,
}: ResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(width);
        onResize?.(width);
      }
    });

    observer.observe(containerRef.current);

    // Initial size
    const initialWidth = containerRef.current.offsetWidth;
    setContainerWidth(initialWidth);
    onResize?.(initialWidth);

    return () => observer.disconnect();
  }, [onResize]);

  return (
    <div
      ref={containerRef}
      className={cn('w-full transition-all duration-200', className)}
      style={{
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
      }}
      data-container-width={containerWidth}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveGrid - Auto-fit grid that adjusts columns based on item width
 *
 * Features:
 * - CSS Grid with auto-fit for responsive columns
 * - Minimum item width ensures readability
 * - Consistent gap spacing
 * - No media queries needed
 *
 * Usage:
 * ```tsx
 * <ResponsiveGrid minItemWidth={280} gap={24}>
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 * </ResponsiveGrid>
 * ```
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number;
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  minItemWidth = 280,
  gap = 24,
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={cn('grid w-full', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveStack - Switches from row to column based on container width
 *
 * Features:
 * - Horizontal on wide screens
 * - Vertical on narrow screens
 * - Configurable breakpoint
 *
 * Usage:
 * ```tsx
 * <ResponsiveStack breakpoint={768}>
 *   <Button>Cancel</Button>
 *   <Button>Submit</Button>
 * </ResponsiveStack>
 * ```
 */
interface ResponsiveStackProps {
  children: React.ReactNode;
  breakpoint?: number;
  gap?: number;
  className?: string;
}

export function ResponsiveStack({
  children,
  breakpoint = 768,
  gap = 16,
  className,
}: ResponsiveStackProps) {
  const [isStacked, setIsStacked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsStacked(entry.contentRect.width < breakpoint);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [breakpoint]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex transition-all duration-200',
        isStacked ? 'flex-col' : 'flex-row items-center',
        className
      )}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
}
