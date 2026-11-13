import api from '../utils/api';
import type { LoyaltyWallet, WalletTransaction } from '../types/clubs';

export const emptyWallet = (): LoyaltyWallet => ({
  id: '',
  user_id: '',
  balance_inr: 0,
  lifetime_earned_inr: 0,
  lifetime_spent_inr: 0,
  currency: 'INR',
});

export type WalletPage = { wallet: LoyaltyWallet; transactions: WalletTransaction[] };

export const walletApi = {
  /** GET /wallet/me → { wallet, recent_transactions }. */
  async me(): Promise<{ wallet: LoyaltyWallet; recent_transactions: WalletTransaction[] }> {
    const res = await api.get('/wallet/me');
    const d = res.data?.data || {};
    return { wallet: d.wallet || emptyWallet(), recent_transactions: d.recent_transactions || [] };
  },
  async transactions(limit: number, offset = 0): Promise<WalletPage> {
    const res = await api.get('/wallet/me/transactions', { params: { limit, offset } });
    const data = res.data?.data || {};
    return { wallet: data.wallet || emptyWallet(), transactions: data.transactions || [] };
  },
};
