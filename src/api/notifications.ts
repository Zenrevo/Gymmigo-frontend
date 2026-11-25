import api from '../utils/api';

export type InboxItem = { id: string; category: string; type: string; title: string; body: string; data: Record<string, unknown>; read: boolean; created_at: string | null };
export type InboxPage = { items: InboxItem[]; has_more: boolean; next_before: string | null; unread: number };
export type NotificationPrefs = { categories: { key: string; label: string; enabled: boolean; locked: boolean }[] };

const d = <T,>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const inbox = {
  list: (params?: { before?: string; category?: string; limit?: number }) => d<InboxPage>(api.get('/notifications', { params })),
  unread: () => d<{ unread: number }>(api.get('/notifications/unread-count')),
  read: (ids: string[]) => d<{ unread: number }>(api.post('/notifications/read', { ids })),
  readAll: () => d<{ unread: number }>(api.post('/notifications/read', { all: true })),
  remove: (id: string) => api.delete(`/notifications/${id}`),
  prefs: () => d<NotificationPrefs>(api.get('/notifications/prefs')),
  savePrefs: (enabled: Record<string, boolean>) => d<NotificationPrefs>(api.patch('/notifications/prefs', { enabled })),
};

const OWNER_TAB: Record<string, string> = {
  OwnerBilling: 'billing', OwnerPos: 'pos', OwnerClubRewards: 'clubs', OwnerTrainers: 'trainers', OwnerMembers: 'members',
  OwnerReminders: 'reminders', OwnerAnalytics: 'analytics',
};

/** Where a notification opens on the web (null = nowhere useful; stay on the list). */
export function webRouteFor(n: Pick<InboxItem, 'type' | 'data'>, role?: string | null): string | null {
  const s = (k: string) => (typeof n.data?.[k] === 'string' && n.data[k] ? (n.data[k] as string) : undefined);
  const gym = s('gym_id');
  const owner = role === 'gym_owner' || role === 'gym_manager';
  const screen = s('screen');
  if (screen && OWNER_TAB[screen]) return owner && gym ? `/app/gym-owner/gyms/${gym}/${OWNER_TAB[screen]}` : null;
  const t = n.type;
  if (['member_applied', 'new_member', 'member_cancelled'].includes(t)) return owner && gym ? `/app/gym-owner/gyms/${gym}/members` : null;
  if (t === 'gym_digest') return owner && gym ? `/app/gym-owner/gyms/${gym}/billing` : null;
  if (t.startsWith('session_') || t.startsWith('booking_') || t === 'new_booking_trainer') return s('session_id') ? `/app/sessions/${s('session_id')}` : null;
  if (['coins_earned', 'coins_used', 'reward_claimed', 'reward_redeemed', 'clubs', 'club_level_up'].includes(t)) return '/app/clubs';
  if (t.startsWith('membership_') || t.startsWith('gym_') || ['payment_received', 'invoice_created', 'pos_receipt', 'refund'].includes(t)) {
    return s('share_url') && t === 'invoice_created' ? s('share_url')! : '/app/memberships';
  }
  if (t === 'program_reminder') return '/app/migo';
  return null;
}

export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  return days < 7 ? `${days} d ago` : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
