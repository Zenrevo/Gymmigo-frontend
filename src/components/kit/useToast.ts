import { useCallback } from 'react';
import { useNotification, type NotificationType } from '../../context/NotificationContext';

/** App-style toast: `toast({ tone: 'success', title: 'Saved' })`, backed by NotificationContext. */
export function useToast() {
  const { showNotification } = useNotification();
  return useCallback(
    ({ tone = 'info', title, message }: { tone?: NotificationType | 'danger'; title: string; message?: string }) =>
      showNotification(message ? `${title} — ${message}` : title, tone === 'danger' ? 'error' : tone),
    [showNotification],
  );
}
