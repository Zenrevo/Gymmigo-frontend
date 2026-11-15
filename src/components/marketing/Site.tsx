import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Monitor, Moon, Plus, Sun } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTheme } from '../../theme/themeContext';
import type { ThemePreference } from '../../theme/theme';
import { cn } from '../kit/cn';
import { EASE } from './motionUtils';

export const PLAY_URL = 'https://play.google.com/store/apps/details?id=in.zenrevo.gymmigo';

/** Store links drawn in the site's own style (no official badge artwork). */
export function StoreButtons({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'inverse' }) {
  const inverse = tone === 'inverse';
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <a
        href={PLAY_URL}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'inline-flex h-12 items-center gap-3 rounded-xl px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          inverse ? 'bg-white text-[#131315] hover:bg-white/90' : 'bg-ink text-background hover:bg-ink/90',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M5 3.5v17a.8.8 0 0 0 1.2.7l14.4-8.5a.8.8 0 0 0 0-1.4L6.2 2.8A.8.8 0 0 0 5 3.5Z" fill="currentColor" />
        </svg>
        <span className="flex flex-col text-left leading-none">
          <span className="text-[10px] font-medium opacity-70">Get it on</span>
          <span className="mt-0.5 text-[15px] font-semibold tracking-tight">Google Play</span>
        </span>
      </a>
      <span
        className={cn(
          'inline-flex h-12 items-center gap-3 rounded-xl border px-4',
          inverse ? 'border-white/25 text-white/85' : 'border-border-strong text-ink-muted',
        )}
        title="The iPhone app is in testing"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <rect x="6" y="2.5" width="12" height="19" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="10" y="4.5" width="4" height="1.2" rx="0.6" fill="currentColor" />
        </svg>
        <span className="flex flex-col text-left leading-none">
          <span className="text-[10px] font-medium">iPhone</span>
          <span className="mt-0.5 text-[15px] font-semibold tracking-tight">Coming soon</span>
        </span>
      </span>
    </div>
  );
}

/** One-tap light/dark switch for the navigation bar. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { scheme, setPreference } = useTheme();
  const next = scheme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`Switch to ${next} theme`}
      className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-accent', className)}
    >
      {scheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

/** Light / Dark / System, for the footer. */
export function ThemePicker() {
  const { preference, setPreference } = useTheme();
  const options: Array<[ThemePreference, string, typeof Sun]> = [
    ['light', 'Light', Sun],
    ['dark', 'Dark', Moon],
    ['system', 'System', Monitor],
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-full border border-border bg-surface p-1">
      {options.map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          onClick={() => setPreference(value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent',
            preference === value ? 'bg-ink text-background' : 'text-ink-subtle hover:text-ink',
          )}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  );
}

export function Faq({ items }: { items: Array<{ question: string; answer: ReactNode }> }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  const id = useId();
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {item.question}
                <Plus size={18} className={cn('shrink-0 text-ink-subtle transition-transform duration-300', isOpen && 'rotate-45')} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-${i}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="max-w-[68ch] pb-6 text-[15px] leading-7 text-ink-muted">{item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[13px] font-semibold text-accent-text', className)}>{children}</p>;
}

/** Section heading: display title + optional lead. */
export function Heading({ eyebrow, title, lead, className, center }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; className?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-[40rem]', center && 'mx-auto text-center', className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[44px]">{title}</h2>
      {lead ? <p className="mt-4 text-[17px] leading-7 text-ink-muted">{lead}</p> : null}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-5 sm:px-8', className)}>{children}</div>;
}
