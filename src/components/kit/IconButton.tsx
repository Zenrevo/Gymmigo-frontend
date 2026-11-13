import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

type Variant = 'surface' | 'ghost' | 'accent' | 'sunken';

const variantClass: Record<Variant, string> = {
  surface: 'bg-surface text-ink border-border hover:bg-surface-sunken',
  sunken: 'bg-surface-sunken text-ink border-transparent hover:bg-surface-raised',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-sunken',
  accent: 'bg-accent text-on-accent border-accent hover:bg-accent-pressed',
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: LucideIcon;
  /** Accessible name (required: icon-only). */
  label: string;
  variant?: Variant;
  size?: number;
  badge?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon: Icon, label, variant = 'surface', size = 40, badge, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-gm-md border transition-colors duration-150 active:scale-95 disabled:opacity-40',
        variantClass[variant],
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}>
      <Icon size={Math.round(size * 0.45)} strokeWidth={2} aria-hidden />
      {badge ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" /> : null}
    </button>
  );
});
