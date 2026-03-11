import { useEffect, useState } from 'react';
import { walletApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { WalletTransaction } from '../../lib/api';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s;
  }
}

function getTransactionIcon(type: WalletTransaction['type']) {
  switch (type) {
    case 'EARN':
      return '✅';
    case 'SPEND':
      return '🎁';
    case 'EXPIRE':
      return '⏰';
    case 'ADJUST':
      return '⚙️';
    default:
      return '•';
  }
}

function getTransactionColor(type: WalletTransaction['type']) {
  switch (type) {
    case 'EARN':
      return 'text-emerald-500';
    case 'SPEND':
      return 'text-cyan-500';
    case 'EXPIRE':
      return 'text-amber-500';
    case 'ADJUST':
      return 'text-slate-500';
    default:
      return 'user-text';
  }
}

type StoreTransactions = {
  partnerId: string;
  partnerName: string;
  transactions: WalletTransaction[];
};

function groupTransactionsByStore(transactions: WalletTransaction[]): StoreTransactions[] {
  const byPartner = new Map<string, StoreTransactions>();

  for (const tx of transactions) {
    const id = tx.partnerId;
    const name = tx.partnerName;
    if (!byPartner.has(id)) {
      byPartner.set(id, { partnerId: id, partnerName: name, transactions: [] });
    }
    byPartner.get(id)!.transactions.push(tx);
  }

  const list = Array.from(byPartner.values());
  list.forEach((s) => {
    s.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  list.sort((a, b) => {
    const aLatest = Math.max(...a.transactions.map((t) => new Date(t.createdAt).getTime()), 0);
    const bLatest = Math.max(...b.transactions.map((t) => new Date(t.createdAt).getTime()), 0);
    return bLatest - aLatest;
  });

  return list;
}

export function UserWalletPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    walletApi
      .getTransactions()
      .then(setTransactions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load wallet history'))
      .finally(() => setLoading(false));
  }, []);

  const cardClass = 'user-card rounded-2xl p-5 sm:p-6 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)]';
  const sectionTitleClass = 'text-sm font-semibold user-text uppercase tracking-wider mb-2';
  const descClass = 'user-text-muted text-sm';
  const itemClass = 'user-item-border flex items-start gap-3 py-2.5 border-b last:border-0';

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <HistorySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
          💰 Wallet History
        </h1>
        <div className={cardClass}>
          <p className="text-rose-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const stores = transactions.length > 0 ? groupTransactionsByStore(transactions) : [];

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
        💰 Wallet History
      </h1>
      <p className="user-text-muted text-sm">Your points earned and spent by store.</p>

      {stores.length === 0 ? (
        <div className={cardClass}>
          <p className={descClass}>No wallet transactions yet. Make purchases at stores with wallet enabled to earn points.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {stores.map((store) => {
            const earnTransactions = store.transactions.filter((t) => t.type === 'EARN');
            const spendTransactions = store.transactions.filter((t) => t.type === 'SPEND');
            const totalEarned = earnTransactions.reduce((sum, t) => sum + t.amount, 0);
            const totalSpent = Math.abs(spendTransactions.reduce((sum, t) => sum + t.amount, 0));

            return (
              <div key={store.partnerId} className={cardClass}>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                  {store.partnerName}
                </h2>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className={descClass}>Total Earned</p>
                    <p className="font-semibold text-emerald-500 mt-0.5">+{totalEarned.toFixed(0)} pts</p>
                  </div>
                  {totalSpent > 0 && (
                    <div>
                      <p className={descClass}>Total Spent</p>
                      <p className="font-semibold text-cyan-500 mt-0.5">-{totalSpent.toFixed(0)} pts</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className={sectionTitleClass}>Transactions</h3>
                  <ul className="user-history-visits-list mt-1 max-h-[400px] overflow-y-auto overflow-x-hidden">
                    {store.transactions.map((tx) => (
                      <li key={tx.id} className={itemClass}>
                        <span className="shrink-0 text-lg leading-none mt-0.5">{getTransactionIcon(tx.type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="user-text font-medium">{tx.description}</p>
                          <p className="user-text-subtle text-xs mt-0.5">{formatDateTime(tx.createdAt)}</p>
                          {tx.metadata && typeof tx.metadata === 'object' && (
                            <>
                              {(tx.metadata as { transactionValue?: number }).transactionValue && (
                                <p className="user-text-subtle text-xs mt-0.5">
                                  Purchase: ₹{(tx.metadata as { transactionValue: number }).transactionValue}
                                </p>
                              )}
                            </>
                          )}
                          {tx.expiresAt && new Date(tx.expiresAt) > new Date() && (
                            <p className="text-amber-500 text-xs mt-0.5">
                              Expires: {new Date(tx.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(0)}
                          </p>
                          <p className="user-text-subtle text-xs mt-0.5">
                            {tx.balanceAfter.toFixed(0)} bal
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
