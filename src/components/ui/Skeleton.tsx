import React from 'react';
import { cn } from '../../lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-[var(--radius-sm)]',
        variant === 'line' && 'h-4 w-full',
        variant === 'circle' && 'h-10 w-10 rounded-full',
        variant === 'rect' && 'h-20 w-full',
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0 divide-y divide-border-light">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-6 py-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-40' : 'w-24')} />
          ))}
        </div>
      ))}
    </div>
  );
}
