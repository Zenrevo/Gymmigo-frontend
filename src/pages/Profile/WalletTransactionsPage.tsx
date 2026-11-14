import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { AppBar, Button, Card, EmptyState, ErrorState, IconButton, Skeleton, StatTile, Text, cn } from '../../components/kit';
import { getApiErrorMessage } from '../../utils/api';
import { emptyWallet, walletApi } from '../../api/wallet';
import type { LoyaltyWallet, WalletTransaction } from '../../types/clubs';

const PAGE_SIZE = 50;
const money = (value: number) => Math.abs(Number(value) || 0).toLocaleString('en-IN');
const when = (value?: string | null) =>
  value ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
const typeLabel = (value?: string) => {
  if (!value) return 'Wallet activity';
  const label = value.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Reward wallet ledger (GET /wallet/me/transactions, paged). */
export default function WalletTransactionsPage() {
  const [wallet, setWallet] = useState<LoyaltyWallet>(emptyWallet);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const creditCount = useMemo(() => transactions.filter(tx => tx.direction === 'credit').length, [transactions]);

  const load = useCallback(async (nextOffset = 0) => {
    if (nextOffset === 0) setLoading(true);
    else setLoadingMore(true);
    setError('');
    try {
      const page = await walletApi.transactions(PAGE_SIZE, nextOffset);
      setWallet(page.wallet);
      setTransactions(prev => (nextOffset === 0 ? page.transactions : [...prev, ...page.transactions]));
      setOffset(nextOffset + page.transactions.length);
      setHasMore(page.transactions.length === PAGE_SIZE);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[880px] pb-10">
      <AppBar
        backTo="/app/profile"
        caption="REWARD WALLET"
        right={<IconButton icon={RefreshCw} label="Refresh" onClick={() => void load(0)} disabled={loading} className={loading ? '[&_svg]:animate-spin' : ''} />}
      />
      <div className="mt-2 flex flex-col gap-6">
        <div>
          <Text variant="h1">Wallet transactions</Text>
          <Text tone="muted" className="mt-1">
            Rewards, wallet usage and loyalty credits in one ledger.
          </Text>
        </div>

        <Card padding="lg">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-gm-lg bg-success-soft text-success">
                <Wallet size={24} aria-hidden />
              </span>
              <div>
                <Text variant="label" tone="subtle">
                  Current balance
                </Text>
                {loading && !transactions.length ? <Skeleton className="mt-1 h-9 w-32" /> : <Text variant="metric" className="mt-0.5" data-testid="wallet-balance">₹{money(wallet.balance_inr)}</Text>}
                <Text variant="caption" tone="muted" className="mt-1">
                  Earned ₹{money(wallet.lifetime_earned_inr)} lifetime
                  {wallet.lifetime_spent_inr > 0 ? ` · Used ₹${money(wallet.lifetime_spent_inr)}` : ''}
                </Text>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:w-72">
              <StatTile label="Loaded entries" value={transactions.length} />
              <StatTile label="Credits loaded" value={creditCount} captionTone="success" />
            </div>
          </div>
        </Card>

        {error ? <ErrorState message={error} onRetry={() => void load(0)} /> : null}

        <section className="flex flex-col gap-2">
          <div>
            <Text variant="h2">All transactions</Text>
            <Text variant="footnote" tone="muted">
              Includes reward credits, debits and future shop wallet usage.
            </Text>
          </div>
          {loading && !transactions.length ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-[76px] rounded-gm-lg" />
              ))}
            </div>
          ) : !transactions.length ? (
            !error ? <EmptyState icon={Wallet} title="No transactions yet" message="Claim club rewards or use wallet credits and the full history will appear here." actionLabel="Open Clubs" actionTo="/app/clubs" /> : null
          ) : (
            <Card padding="none" className="px-4">
              {transactions.map((tx, i) => {
                const credit = tx.direction === 'credit';
                const Icon = credit ? TrendingUp : TrendingDown;
                return (
                  <article key={tx.id} className={cn('flex items-center gap-3 py-3', i < transactions.length - 1 && 'border-b border-border')}>
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-gm-md', credit ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
                      <Icon size={17} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Text variant="bodyStrong" className="truncate">
                        {tx.description}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {typeLabel(tx.transaction_type)} · {when(tx.created_at)}
                      </Text>
                      <Text variant="labelSm" tone="subtle" className="mt-0.5">
                        Balance after ₹{money(tx.balance_after_inr)}
                        {tx.status && tx.status !== 'completed' ? ` · ${tx.status}` : ''}
                      </Text>
                    </div>
                    <Text variant="subtitle" tone={credit ? 'success' : 'danger'} className="shrink-0">
                      {credit ? '+' : '-'}₹{money(tx.amount_inr)}
                    </Text>
                  </article>
                );
              })}
            </Card>
          )}
          {hasMore ? (
            <div className="mt-3 flex justify-center">
              <Button label="Load more transactions" variant="secondary" loading={loadingMore} onClick={() => void load(offset)} />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
