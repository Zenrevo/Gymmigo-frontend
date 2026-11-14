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
        'rounded-lg border border-success/30 bg-gradient-to-r from-success-soft via-background/80 to-background/80 p-4 sm:p-5',
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success-soft text-success">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-success">Gymmigo loyalty wallet</p>
              {loading ? (
                <p className="mt-2 text-sm font-semibold text-ink/45">Loading balance…</p>
              ) : (
                <>
                  <p className="mt-1 flex items-center gap-1 text-2xl font-black text-ink">
                    <IndianRupee size={22} className="text-success" />
                    {wallet.balance_inr.toLocaleString('en-IN')}
                    <span className="text-sm font-bold text-ink/40">cash balance</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink/45">
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
              className="inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success px-3 py-2 text-[10px] font-black uppercase text-on-accent transition hover:brightness-110"
            >
              <ShoppingBag size={14} /> Shop
            </a>
            <button
              type="button"
              onClick={() => void loadWallet()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-surface-sunken px-3 py-2 text-[10px] font-black uppercase text-ink-muted hover:border-success/30 hover:text-success disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {notice && (
          <p className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm font-bold text-success">
            {notice}
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">
            {error}. If this persists, the wallet database migration may need to run on the server.
          </p>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-ink/35">Recent transactions</p>
          {loading ? (
            <p className="mt-3 text-xs font-semibold text-ink/40">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="mt-3 rounded-lg border border-ink/10 bg-surface-sunken px-3 py-3 text-xs font-semibold text-ink-muted">
              No credits yet. Unlock a club tier and tap <strong className="text-ink/70">Claim reward</strong> to add ₹ cash here.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-surface-sunken px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{tx.description}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-ink/35">{formatTxDate(tx.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={clsx(
                        'text-sm font-black',
                        tx.direction === 'credit' ? 'text-success' : 'text-danger'
                      )}
                    >
                      {tx.direction === 'credit' ? '+' : '−'}₹{tx.amount_inr.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] font-semibold text-ink/30">Bal ₹{tx.balance_after_inr.toLocaleString('en-IN')}</p>
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
