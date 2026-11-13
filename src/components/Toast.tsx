import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import type { Notification as NotificationType } from '../context/NotificationContext';

const TONE = {
  success: { icon: CheckCircle2, chip: 'bg-success-soft text-success' },
  error: { icon: XCircle, chip: 'bg-danger-soft text-danger' },
  warning: { icon: AlertCircle, chip: 'bg-warning-soft text-warning' },
  info: { icon: Info, chip: 'bg-info-soft text-info' },
} as const;

/** App `ToastCard`: surface card, tone icon chip, message, close. */
const Toast: React.FC<{ notification: NotificationType }> = ({ notification }) => {
  const { removeNotification } = useNotification();
  const tone = TONE[notification.type];
  const Icon = tone.icon;
  return (
    <motion.div
      layout
      role={notification.type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="pointer-events-auto relative flex w-full max-w-md items-center gap-3 rounded-gm-xl border border-border bg-surface p-3 pr-11 shadow-float md:min-w-[320px]">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-gm-md ${tone.chip}`}>
        <Icon size={18} aria-hidden />
      </span>
      <p className="t-callout text-ink">{notification.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => removeNotification(notification.id)}
        className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-gm-sm text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink">
        <X size={14} aria-hidden />
      </button>
    </motion.div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();
  return (
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-[9999] flex flex-col items-center gap-2 md:left-auto md:right-6 md:top-6 md:items-end">
      <AnimatePresence mode="popLayout">
        {notifications.map(n => (
          <Toast key={n.id} notification={n} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
