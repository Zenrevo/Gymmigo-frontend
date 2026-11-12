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
  async me(): Promise<LoyaltyWallet> {
    const res = await api.get('/wallet/me');
    return res.data?.data || emptyWallet();
  },
  async transactions(limit: number, offset = 0): Promise<WalletPage> {
    const res = await api.get('/wallet/me/transactions', { params: { limit, offset } });
    const data = res.data?.data || {};
    return { wallet: data.wallet || emptyWallet(), transactions: data.transactions || [] };
  },
};
