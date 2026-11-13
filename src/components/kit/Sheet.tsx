import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import { useFocusTrap, useScrollLock } from './useFocusTrap';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  /** Pinned below the scrolling body (actions). */
  footer?: ReactNode;
  /** Disable backdrop/Esc dismissal for mandatory steps. */
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const widths = { sm: 'md:max-w-[420px]', md: 'md:max-w-[520px]', lg: 'md:max-w-[720px]' };

/**
 * App `BottomSheet` for the web: a bottom sheet under 768px, a centred dialog above it.
 * Focus-trapped, Esc/backdrop close, body scrolls internally with the header and footer pinned.
 * Uses dvh so the on-screen keyboard shrinks it instead of covering inputs.
 */
export function Sheet({ open, onClose, title, eyebrow, children, footer, dismissible = true, size = 'md', className }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panel, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-gm-xxl border border-b-0 border-border bg-surface shadow-float outline-none md:max-h-[86dvh] md:animate-pop-in md:rounded-gm-xxl md:border-b',
          widths[size],
          className,
        )}>
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border-strong md:hidden" aria-hidden />
        {title || eyebrow || dismissible ? (
          <div className={cn('flex shrink-0 items-start gap-3 px-5 pt-4 md:px-6 md:pt-6', (title || eyebrow) && 'border-b border-border pb-4')}>
            <div className="min-w-0 flex-1">
              {eyebrow ? <p className="t-label-sm mb-0.5 text-ink-subtle">{eyebrow}</p> : null}
              {title ? (
                <h2 id={titleId} className="t-h2 text-ink">
                  {title}
                </h2>
              ) : null}
            </div>
            {dismissible ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-gm-md bg-surface-sunken text-ink transition-colors hover:bg-surface-raised">
                <X size={18} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:px-6">{children}</div>
        {footer ? <div className="shrink-0 border-t border-border px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-6">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
