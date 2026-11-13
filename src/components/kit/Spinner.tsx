import { cn } from './cn';

export function Spinner({ size = 20, className, label = 'Loading' }: { size?: number; className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-block shrink-0', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="animate-spin" aria-hidden>
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
