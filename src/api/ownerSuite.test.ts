import { beforeEach, describe, expect, test, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  get: vi.fn(async () => ({ data: { data: {} } })),
  post: vi.fn(async () => ({ data: { data: {} } })),
  patch: vi.fn(async () => ({ data: { data: {} } })),
  delete: vi.fn(async () => ({ data: { data: {} } })),
}));
vi.mock('../utils/api', () => ({ default: mock, getApiErrorMessage: (e: unknown) => String(e) }));

import { coinCap, inr, ownerSuite } from './ownerSuite';
import { toBars } from '../pages/Dashboard/gym-tabs/suite/shared';

describe('owner suite (web)', () => {
  beforeEach(() => vi.clearAllMocks());

  test('coin cap and rupee format', () => {
    expect(coinCap(1000, 500, 20)).toBe(200);
    expect(coinCap(999, 150, 20)).toBe(150);
    expect(inr(123456)).toBe('₹1,23,456');
  });

  test('long series keep their total when bucketed', () => {
    const pts = Array.from({ length: 365 }, (_, i) => ({ date: new Date(2026, 0, i + 1).toISOString().slice(0, 10), value: 2 }));
    const bars = toBars(pts);
    expect(bars.length).toBeLessThanOrEqual(15);
    expect(bars.reduce((n, b) => n + b.value, 0)).toBe(730);
  });

  test('calls the backend paths', async () => {
    await ownerSuite.dues('g1');
    await ownerSuite.addPayment('g1', 'i1', { amount: 100, method: 'cash' });
    await ownerSuite.payouts('g1');
    await ownerSuite.analytics('g1', '30d');
    await ownerSuite.setMySharing(true);
    expect(mock.get).toHaveBeenCalledWith('/gym-owner/gyms/g1/billing/dues', { params: undefined });
    expect(mock.post).toHaveBeenCalledWith('/gym-owner/gyms/g1/invoices/i1/payments', { amount: 100, method: 'cash' });
    expect(mock.get).toHaveBeenCalledWith('/gym-owner/gyms/g1/trainers-payouts', { params: undefined });
    expect(mock.get).toHaveBeenCalledWith('/gym-owner/gyms/g1/analytics', { params: { range: '30d' } });
    expect(mock.patch).toHaveBeenCalledWith('/members/me/gym-sharing', { share_training: true });
  });
});
