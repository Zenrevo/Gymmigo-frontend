import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  IndianRupee,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import api, { getApiErrorMessage } from '../../utils/api';
import type { LoyaltyWallet, WalletTransaction } from '../../types/clubs';

const PAGE_SIZE = 50;

const emptyWallet = (): LoyaltyWallet => ({
  id: '',
  user_id: '',
  balance_inr: 0,
  lifetime_earned_inr: 0,
  lifetime_spent_inr: 0,
  currency: 'INR',
});

const formatCurrency = (value: number) => Math.abs(Number(value) || 0).toLocaleString('en-IN');

const formatDate = (value?: string | null) => {
  if (!value) return 'Recent';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTransactionType = (value?: string) => {
  if (!value) return 'Wallet activity';
  const label = value.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export default function WalletTransactionsPage() {
  const [wallet, setWallet] = useState<LoyaltyWallet>(emptyWallet);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const creditCount = useMemo(
    () => transactions.filter((tx) => tx.direction === 'credit').length,
    [transactions]
  );

  const loadTransactions = useCallback(async (nextOffset = 0) => {
    if (nextOffset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const res = await api.get('/wallet/me/transactions', {
        params: { limit: PAGE_SIZE, offset: nextOffset },
      });
      const data = res.data?.data || {};
      const rows: WalletTransaction[] = data.transactions || [];

      setWallet(data.wallet || emptyWallet());
      setTransactions((prev) => (nextOffset === 0 ? rows : [...prev, ...rows]));
      setOffset(nextOffset + rows.length);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions(0);
  }, [loadTransactions]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/app/profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-primary/30 hover:text-primary"
            aria-label="Back to profile"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Reward wallet</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">Wallet Transactions</h1>
            <p className="mt-1 text-sm font-semibold text-white/40">Rewards, wallet usage, and loyalty credits in one ledger.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadTransactions(0)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <section className="rounded-lg border border-emerald-300/20 bg-gradient-to-r from-emerald-500/15 via-slate-900/80 to-slate-900/80 p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/15 text-emerald-200">
              <Wallet size={25} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70">Current balance</p>
              <p className="mt-1 flex items-center gap-1 text-4xl font-black text-white">
                <IndianRupee size={28} className="text-emerald-300" />
                {formatCurrency(wallet.balance_inr)}
              </p>
              <p className="mt-2 text-xs font-semibold text-white/45">
                Earned ₹{formatCurrency(wallet.lifetime_earned_inr)} lifetime
                {wallet.lifetime_spent_inr > 0 ? ` · Used ₹${formatCurrency(wallet.lifetime_spent_inr)}` : ''}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:w-64">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black text-white">{transactions.length}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">Loaded entries</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black text-emerald-300">{creditCount}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">Credits loaded</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">All transactions</h2>
            <p className="text-xs font-semibold text-white/40">Includes reward credits, debits, and future shop wallet usage.</p>
          </div>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center text-sm font-bold text-white/45">
            Loading wallet ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 px-6 text-center">
            <Wallet size={44} className="text-white/15" />
            <h3 className="mt-4 text-lg font-black text-white">No transactions yet</h3>
            <p className="mt-2 max-w-sm text-sm font-semibold text-white/40">
              Claim club rewards or use wallet credits and the full history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = tx.direction === 'credit';
              const Icon = isCredit ? TrendingUp : TrendingDown;
              return (
                <article
                  key={tx.id}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={clsx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                        isCredit
                          ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300'
                          : 'border-red-300/20 bg-red-400/10 text-red-300'
                      )}
                    >
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white">{tx.description}</p>
                      <p className="mt-1 text-xs font-semibold text-white/35">
                        {formatTransactionType(tx.transaction_type)} · {formatDate(tx.created_at)}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/25">
                        Balance after ₹{formatCurrency(tx.balance_after_inr)}
                        {tx.status && tx.status !== 'completed' ? ` · ${tx.status}` : ''}
                      </p>
                    </div>
                  </div>
                  <p
                    className={clsx(
                      'shrink-0 text-lg font-black',
                      isCredit ? 'text-emerald-300' : 'text-red-300'
                    )}
                  >
                    {isCredit ? '+' : '-'}₹{formatCurrency(tx.amount_inr)}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => void loadTransactions(offset)}
              disabled={loadingMore}
              className="inline-flex min-w-56 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-xs font-black uppercase text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Loading
                </>
              ) : (
                'Load more transactions'
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
