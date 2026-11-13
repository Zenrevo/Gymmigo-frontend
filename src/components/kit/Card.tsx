import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CardVariant = 'surface' | 'raised' | 'sunken' | 'outline' | 'accent';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

const variantClass: Record<CardVariant, string> = {
  surface: 'bg-surface border-border shadow-card',
  raised: 'bg-surface-raised border-border shadow-raised',
  sunken: 'bg-surface-sunken border-transparent',
  outline: 'bg-transparent border-border-strong',
  accent: 'bg-accent-soft border-accent-border',
};

const paddingClass: Record<CardPadding, string> = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-5', xl: 'p-6' };

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Makes the whole card a button (keyboard + pressed state). */
  onClick?: () => void;
  children?: ReactNode;
};

/** App `Card`: 16px radius, 1px border; light uses soft shadows, dark relies on borders. */
export function Card({ variant = 'surface', padding = 'md', onClick, className, children, ...rest }: Props) {
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-gm-xl border',
        variantClass[variant],
        paddingClass[padding],
        interactive && 'cursor-pointer transition-[transform,background-color,border-color] duration-150 hover:border-border-strong active:scale-[0.99] active:bg-surface-sunken',
        className,
      )}
      {...rest}>
      {children}
    </div>
  );
}

type SignatureProps = HTMLAttributes<HTMLDivElement> & { glow?: 'ember' | 'green' | 'none'; padding?: CardPadding };

const glowCss = {
  ember: 'radial-gradient(85% 75% at 92% 2%, rgba(255,87,34,0.26) 0%, rgba(255,87,34,0.08) 45%, rgba(255,87,34,0) 100%)',
  green: 'radial-gradient(85% 75% at 92% 2%, rgba(34,197,94,0.26) 0%, rgba(34,197,94,0.08) 45%, rgba(34,197,94,0) 100%)',
};

/** Always-dark hero card with the ember glow (today's move, FitCard, clubs). Forces dark tokens inside. */
export function SignatureCard({ glow = 'ember', padding = 'lg', className, style, children, ...rest }: SignatureProps) {
  return (
    <div
      data-theme="dark"
      className={cn('relative overflow-hidden rounded-gm-xxl border border-[#2E2C30] bg-signature text-ink', paddingClass[padding], className)}
      style={{ ...(glow !== 'none' ? { backgroundImage: glowCss[glow] } : null), ...style }}
      {...rest}>
      {children}
    </div>
  );
}

/** Soft ember glow to drop behind hero sections (absolute, non-interactive). */
export function HeroGlow({ tone = 'ember', className }: { tone?: 'ember' | 'green' | 'red'; className?: string }) {
  const rgb = tone === 'green' ? '34,197,94' : tone === 'red' ? '239,68,68' : '255,87,34';
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{ backgroundImage: `radial-gradient(85% 75% at 92% 2%, rgba(${rgb},0.24) 0%, rgba(${rgb},0.07) 45%, rgba(${rgb},0) 100%)` }}
    />
  );
}
