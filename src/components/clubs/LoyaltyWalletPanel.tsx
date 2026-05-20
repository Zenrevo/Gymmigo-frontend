import { useCallback, useEffect, useState } from 'react';
import { IndianRupee, RefreshCw, ShoppingBag, Wallet } from 'lucide-react';
import clsx from 'clsx';
import api, { getApiErrorMessage } from '../../utils/api';
import type { LoyaltyWallet, WalletTransaction } from '../../types/clubs';

const SHOP_URL = 'https://shop.gymmigo.in';

const emptyWallet = (): LoyaltyWallet => ({
  id: '',
  user_id: '',
  balance_inr: 0,
  lifetime_earned_inr: 0,
  lifetime_spent_inr: 0,
  currency: 'INR',
});

const formatTxDate = (value?: string | null) => {
  if (!value) return 'Recently';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type Props = {
  refreshKey?: number;
  notice?: string;
  className?: string;
};

export default function LoyaltyWalletPanel({ refreshKey = 0, notice, className }: Props) {
  const [wallet, setWallet] = useState<LoyaltyWallet>(emptyWallet);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get('/wallet/me'),
        api.get('/wallet/me/transactions', { params: { limit: 25, offset: 0 } }),
      ]);
      const summary = summaryRes.data?.data;
      const txData = txRes.data?.data;
      setWallet(summary?.wallet || emptyWallet());
      setTransactions(
        txData?.transactions?.length
          ? txData.transactions
          : summary?.recent_transactions || []
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
      setWallet(emptyWallet());
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet, refreshKey]);

  return (
    <section
      className={clsx(
        'rounded-lg border border-emerald-300/20 bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-slate-900/80 p-4 sm:p-5',
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/15 text-emerald-200">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70">Gymmigo loyalty wallet</p>
              {loading ? (
                <p className="mt-2 text-sm font-semibold text-white/45">Loading balance…</p>
              ) : (
                <>
                  <p className="mt-1 flex items-center gap-1 text-2xl font-black text-white">
                    <IndianRupee size={22} className="text-emerald-300" />
                    {wallet.balance_inr.toLocaleString('en-IN')}
                    <span className="text-sm font-bold text-white/40">cash balance</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/45">
                    Earned ₹{wallet.lifetime_earned_inr.toLocaleString('en-IN')} lifetime
                    {wallet.lifetime_spent_inr > 0 ? ` · Spent ₹${wallet.lifetime_spent_inr.toLocaleString('en-IN')}` : ''}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400 px-3 py-2 text-[10px] font-black uppercase text-black transition hover:brightness-110"
            >
              <ShoppingBag size={14} /> Shop
            </a>
            <button
              type="button"
              onClick={() => void loadWallet()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase text-white/55 hover:border-emerald-300/30 hover:text-emerald-100 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {notice && (
          <p className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-sm font-bold text-emerald-100">
            {notice}
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
            {error}. If this persists, the wallet database migration may need to run on the server.
          </p>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Recent transactions</p>
          {loading ? (
            <p className="mt-3 text-xs font-semibold text-white/40">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-xs font-semibold text-white/45">
              No credits yet. Unlock a club tier and tap <strong className="text-white/70">Claim reward</strong> to add ₹ cash here.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{tx.description}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-white/35">{formatTxDate(tx.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={clsx(
                        'text-sm font-black',
                        tx.direction === 'credit' ? 'text-emerald-300' : 'text-red-300'
                      )}
                    >
                      {tx.direction === 'credit' ? '+' : '−'}₹{tx.amount_inr.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] font-semibold text-white/30">Bal ₹{tx.balance_after_inr.toLocaleString('en-IN')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
