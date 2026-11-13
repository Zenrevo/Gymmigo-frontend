import type { CSSProperties } from 'react';
import { cn } from './cn';

const shimmer = {
  backgroundImage: 'linear-gradient(90deg, var(--gm-skeleton) 0%, var(--gm-skeleton-highlight) 50%, var(--gm-skeleton) 100%)',
  backgroundSize: '200% 100%',
} satisfies CSSProperties;

export function Skeleton({ className, style, rounded = 'md' }: { className?: string; style?: CSSProperties; rounded?: 'sm' | 'md' | 'xl' | 'full' }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer',
        { sm: 'rounded-gm-sm', md: 'rounded-gm-md', xl: 'rounded-gm-xl', full: 'rounded-full' }[rounded],
        className,
      )}
      style={{ ...shimmer, ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}
