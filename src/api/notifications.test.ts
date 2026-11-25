import { describe, expect, test, vi } from 'vitest';

vi.mock('../utils/api', () => ({ default: {} }));
import { timeAgo, webRouteFor } from './notifications';

describe('notification links on the web', () => {
  test('owner alerts open the gym tab only for owners and managers', () => {
    const low = { type: 'gym_low_stock', data: { gym_id: 'g1', screen: 'OwnerPos' } };
    expect(webRouteFor(low, 'gym_owner')).toBe('/app/gym-owner/gyms/g1/pos');
    expect(webRouteFor(low, 'gym_manager')).toBe('/app/gym-owner/gyms/g1/pos');
    expect(webRouteFor(low, 'user')).toBeNull();
    expect(webRouteFor({ type: 'member_applied', data: { gym_id: 'g1' } }, 'gym_owner')).toBe('/app/gym-owner/gyms/g1/members');
  });
  test('member money, clubs and sessions', () => {
    expect(webRouteFor({ type: 'payment_received', data: { gym_id: 'g1' } }, 'user')).toBe('/app/memberships');
    expect(webRouteFor({ type: 'invoice_created', data: { share_url: 'https://x/inv' } }, 'user')).toBe('https://x/inv');
    expect(webRouteFor({ type: 'coins_earned', data: {} }, 'user')).toBe('/app/clubs');
    expect(webRouteFor({ type: 'session_reminder', data: { session_id: 's1' } }, 'user')).toBe('/app/sessions/s1');
    expect(webRouteFor({ type: 'new_follower', data: {} }, 'user')).toBeNull();
  });
  test('time ago', () => {
    const now = Date.parse('2026-11-24T12:00:00Z');
    expect(timeAgo('2026-11-24T11:55:00Z', now)).toBe('5 min ago');
    expect(timeAgo('2026-11-24T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-11-22T12:00:00Z', now)).toBe('2 d ago');
  });
});
