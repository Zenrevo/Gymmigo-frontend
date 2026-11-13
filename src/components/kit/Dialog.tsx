import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';
import { Button, type ButtonVariant } from './Button';
import { cn } from './cn';
import { useFocusTrap, useScrollLock } from './useFocusTrap';

export type DialogAction = { label: string; variant?: ButtonVariant; onClick?: () => void | Promise<void> };

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  message?: ReactNode;
  tone?: 'default' | 'warning' | 'danger';
  actions: DialogAction[];
  children?: ReactNode;
};

/** Small centred alert (app `Dialog`): icon, title, message, stacked actions. */
export function Dialog({ open, onClose, title, message, tone = 'default', actions, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<number | null>(null);
  useFocusTrap(panel, open);
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const Icon = tone === 'default' ? Info : AlertTriangle;
  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-5">
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-[400px] animate-pop-in rounded-gm-xxl border border-border bg-surface p-6 shadow-float outline-none"
        tabIndex={-1}>
        <span
          className={cn(
            'mb-4 flex h-11 w-11 items-center justify-center rounded-gm-md',
            tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent-text',
          )}>
          <Icon size={20} aria-hidden />
        </span>
        <h2 className="t-h2 text-ink">{title}</h2>
        {message ? <p className="t-callout mt-2 text-ink-muted">{message}</p> : null}
        {children}
        <div className="mt-6 flex flex-col gap-2">
          {actions.map((a, i) => (
            <Button
              key={a.label}
              label={a.label}
              size="md"
              fullWidth
              variant={a.variant ?? (i === 0 ? 'primary' : 'ghost')}
              loading={busy === i}
              onClick={async () => {
                if (!a.onClick) return onClose();
                setBusy(i);
                try {
                  await a.onClick();
                } finally {
                  setBusy(null);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { setConfirmHost, type ConfirmOptions, type PendingConfirm } from './confirm';

/** Mount once near the root. */
export function DialogHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  useEffect(() => {
    setConfirmHost(setPending);
    return () => setConfirmHost(null);
  }, []);
  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };
  return (
    <Dialog
      open={!!pending}
      onClose={() => settle(false)}
      title={pending?.title}
      message={pending?.message}
      tone={pending?.tone}
      actions={[
        { label: pending?.confirmLabel ?? 'Confirm', variant: pending?.tone === 'danger' ? 'danger' : 'primary', onClick: () => settle(true) },
        { label: pending?.cancelLabel ?? 'Cancel', variant: 'ghost', onClick: () => settle(false) },
      ]}
    />
  );
}

/** Declarative confirm dialog. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
}: { open: boolean; onClose: () => void; onConfirm: () => void | Promise<void> } & ConfirmOptions) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      message={message}
      tone={tone}
      actions={[
        {
          label: confirmLabel,
          variant: tone === 'danger' ? 'danger' : 'primary',
          onClick: async () => {
            await onConfirm();
            onClose();
          },
        },
        { label: cancelLabel, variant: 'ghost', onClick: onClose },
      ]}
    />
  );
}
