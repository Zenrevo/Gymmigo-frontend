import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

const sizeClass: Record<ButtonSize, string> = {
  lg: 'h-14 px-5 rounded-gm-lg t-button gap-2',
  md: 'h-12 px-5 rounded-gm-lg t-button gap-2',
  sm: 'h-9 px-3 rounded-full t-button-sm gap-1.5',
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent border-accent hover:bg-accent-pressed hover:border-accent-pressed shadow-[0px_10px_24px_-8px_rgba(255,87,34,0.55)] active:shadow-[0px_4px_12px_-6px_rgba(255,87,34,0.55)]',
  secondary: 'bg-surface-raised text-ink border-border-strong hover:bg-surface-sunken',
  outline: 'bg-surface text-ink border-border-strong hover:bg-surface-sunken',
  ghost: 'bg-transparent text-accent-text border-transparent hover:bg-surface-sunken',
  danger: 'bg-danger-soft text-danger border-danger-soft hover:brightness-95',
};

type CommonProps = {
  label?: ReactNode;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  /** Renders a router link styled as a button. */
  to?: string;
  href?: string;
  target?: string;
};

export type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

/** App `Button`: 56/48/36 high, 14px radius (pill when small), orange glow on primary. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { label, children, variant = 'primary', size = 'lg', icon: Icon, iconRight: IconRight, loading, disabled, fullWidth, className, to, href, target, type = 'button', ...rest },
  ref,
) {
  const inactive = disabled || loading;
  const neutralDisabled = disabled && (variant === 'primary' || variant === 'danger');
  const classes = cn(
    'relative inline-flex select-none items-center justify-center whitespace-nowrap border transition-[background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.97]',
    sizeClass[size],
    neutralDisabled ? 'bg-surface-sunken text-ink-subtle border-surface-sunken shadow-none' : variantClass[variant],
    size === 'sm' && 'shadow-none active:shadow-none',
    inactive && 'pointer-events-none',
    disabled && !neutralDisabled && 'opacity-45',
    fullWidth && 'w-full',
    className,
  );
  const iconSize = size === 'sm' ? 16 : 20;
  const content = loading ? (
    <Spinner size={iconSize} />
  ) : (
    <>
      {Icon ? <Icon size={iconSize} strokeWidth={2} aria-hidden /> : null}
      <span className="truncate">{label ?? children}</span>
      {IconRight ? <IconRight size={size === 'sm' ? 16 : 18} strokeWidth={2} aria-hidden /> : null}
    </>
  );
  if (to && !inactive) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  if (href && !inactive) {
    return (
      <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} disabled={inactive} aria-busy={loading || undefined} className={classes} {...rest}>
      {content}
    </button>
  );
});
