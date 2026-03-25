import { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { customersApi, walletApi, getCustomerTokenIfPresent } from '../../lib/api';
import type { StoreVisit, WalletBalance, WalletTransaction, CustomerProfile } from '../../lib/api';

const DEFAULT_MIN_REDEEM_PTS = 50;

function formatPoints(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return s;
  }
}

export function StoreDetailPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const passedState = location.state as { store?: StoreVisit; wallet?: WalletBalance | null } | null;

  const [store, setStore] = useState<StoreVisit | null>(passedState?.store ?? null);
  const [wallet, setWallet] = useState<WalletBalance | null>(passedState?.wallet ?? null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(!passedState?.store);
  const [txLoading, setTxLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{ rewardsCreated: number } | null>(null);
  const [redeemError, setRedeemError] = useState('');

  useEffect(() => {
    if (!branchId) return;
    if (passedState?.store) {
      setStore(passedState.store);
      if (passedState.wallet) setWallet(passedState.wallet);
      setLoading(false);
      return;
    }
    setLoading(true);
    customersApi
      .getMyProfile()
      .then((profile: CustomerProfile) => {
        const s = profile.storesVisited.find((st) => st.branchId === branchId) ?? null;
        setStore(s);
        const w = profile.wallets?.find((w) => s && w.partnerId === s.partnerId) ?? null;
        setWallet(w ?? null);
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [branchId, passedState?.store, passedState?.wallet]);

  useEffect(() => {
    if (!wallet?.partnerId) return;
    setTxLoading(true);
    walletApi
      .getTransactions(wallet.partnerId, 20, 0)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false));
  }, [wallet?.partnerId]);

  if (loading || !store) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-6">
        <Link to="/me" className="text-sm font-medium" style={{ color: 'var(--a)' }}>
          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>arrow_back</span>
          Back to overview
        </Link>
        <div className="mt-4 rounded-[22px] p-6 text-center" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const loyaltyType = store.loyaltyType || 'VISITS';
  const isPoints = loyaltyType === 'POINTS' || loyaltyType === 'HYBRID';
  const isVisits = loyaltyType === 'VISITS' || loyaltyType === 'HYBRID';
  const isLoggedIn = !!getCustomerTokenIfPresent();

  const handleRedeemPoints = async () => {
    if (!store || !wallet || !branchId) return;
    setRedeeming(true);
    setRedeemError('');
    setRedeemSuccess(null);
    try {
      const result = await walletApi.redeemPoints(store.partnerId, branchId);
      setRedeemSuccess({ rewardsCreated: result.rewardsCreated });
      // Refresh wallet balance
      const profile = await customersApi.getMyProfile();
      const updatedStore = profile.storesVisited.find((st) => st.branchId === branchId) ?? null;
      setStore(updatedStore);
      const updatedWallet = profile.wallets?.find((w) => updatedStore && w.partnerId === updatedStore.partnerId) ?? null;
      setWallet(updatedWallet);
      setTimeout(() => setRedeemSuccess(null), 5000);
    } catch (e) {
      setRedeemError(e instanceof Error ? e.message : 'Failed to redeem');
    } finally {
      setRedeeming(false);
    }
  };
  const threshold = store.rewardThreshold ?? 5;
  const windowDays = store.rewardWindowDays ?? 30;
  const description = store.rewardDescription || 'Free reward';
  const current = store.streakCurrentCount ?? 0;
  const progressPct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;
  const isComplete = threshold > 0 && current >= threshold;

  return (
    <div className="max-w-md mx-auto w-full min-w-0 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/me')}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--bdl)', border: '1px solid var(--bd)' }}
          aria-label="Back"
        >
          <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '20px' }}>arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-syne text-xl font-black truncate" style={{ color: 'var(--t)' }}>{store.partnerName}</h1>
          <p className="text-sm truncate" style={{ color: 'var(--t3)' }}>
            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>location_on</span>
            {store.branchName}
          </p>
        </div>
        <span
          className="shrink-0 inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5"
          style={{
            background: loyaltyType === 'VISITS' ? 'var(--bdl)' : 'var(--grbg)',
            border: loyaltyType === 'VISITS' ? '1px solid var(--bd)' : '1px solid rgba(42,96,64,0.2)',
            color: loyaltyType === 'VISITS' ? 'var(--a)' : 'var(--gr)',
          }}
        >
          {loyaltyType === 'VISITS' ? 'VISITS' : loyaltyType === 'HYBRID' ? 'HYBRID' : 'POINTS'}
        </span>
      </div>

      {isPoints && wallet && (
        <div className="rounded-[22px] overflow-hidden mb-4" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--bdl)' }}>
            <p className="text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--t3)' }}>Points Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="font-syne text-4xl font-black" style={{ color: 'var(--a)' }}>{formatPoints(wallet.balance)}</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--a)', opacity: 0.7 }}>Pts</span>
            </div>
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-[10px] uppercase" style={{ color: 'var(--t3)' }}>Earned</p>
                <p className="font-syne font-bold" style={{ color: 'var(--gr)' }}>+{formatPoints(wallet.lifetimeEarned)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase" style={{ color: 'var(--t3)' }}>Spent</p>
                <p className="font-syne font-bold" style={{ color: 'var(--re)' }}>-{formatPoints(wallet.lifetimeSpent)}</p>
              </div>
            </div>
            {store?.amountPerCoin && (
              <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--a)' }}>
                  <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>generating_tokens</span>
                  Earn 1 coin for every ₹{store.amountPerCoin} spent
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>
                  e.g. ₹{store.amountPerCoin * 5} purchase = 5 coins
                </p>
              </div>
            )}
            {/* Redeem button */}
            {isLoggedIn && (() => {
              const minRedeem = store?.minimumRedemptionPoints ?? DEFAULT_MIN_REDEEM_PTS;
              const balance = wallet?.balance ?? 0;
              return balance >= minRedeem ? (
                <>
                  {redeemSuccess ? (
                    <div className="mt-3 rounded-xl p-3 text-center" style={{ background: 'var(--grbg)', border: '1px solid var(--grbd)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--gr)' }}>
                        Success! {redeemSuccess.rewardsCreated} reward{redeemSuccess.rewardsCreated !== 1 ? 's' : ''} created — check Rewards page
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRedeemPoints}
                      disabled={redeeming}
                      className="w-full min-h-[48px] mt-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
                      style={{ background: 'var(--a)', color: 'var(--s)' }}
                    >
                      {redeeming ? 'Redeeming...' : 'Redeem Coins for Rewards'}
                    </button>
                  )}
                </>
              ) : (
                <div className="mt-3 text-center py-2 rounded-xl" style={{ background: 'var(--s2)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--t3)' }}>{minRedeem} coins needed to redeem • {Math.ceil(minRedeem - balance)} more to go</p>
                </div>
              );
            })()}
            {redeemError && (
              <div className="mt-2 rounded-xl p-3" style={{ background: 'var(--rebg)', border: '1px solid rgba(176,58,42,0.18)' }}>
                <p className="text-xs" style={{ color: 'var(--re)' }}>{redeemError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isVisits && (
        <div className="rounded-[22px] overflow-hidden mb-4" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div style={{ padding: '20px 18px' }}>
            <p className="text-[10px] uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--t3)' }}>Visit challenge</p>
            <p className="font-syne text-xl font-black" style={{ color: 'var(--a)' }}>{threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days</p>
            <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
              <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>redeem</span>
              {description}
            </p>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bdl)' }}>
              <div className="h-full rounded-full transition-[width]" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--a), #E8784E)' }} />
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--t2)' }}>{current} of {threshold} visits</p>
            {isComplete && <p className="text-sm font-semibold mt-2" style={{ color: 'var(--gr)' }}>
              <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>check_circle</span>
              Challenge complete!
            </p>}
            <p className="text-xs mt-3" style={{ color: 'var(--t3)' }}>Total visits: {store.visitCount} • Last: {formatDate(store.lastVisitAt)}</p>
          </div>
        </div>
      )}

      {isPoints && wallet && (
        <div className="rounded-[22px] overflow-hidden" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--bdl)' }}>
            <h2 className="font-syne font-black text-base" style={{ color: 'var(--t)' }}>Recent activity</h2>
          </div>
          <div style={{ padding: '12px 18px 18px' }}>
            {txLoading ? (
              <p className="text-sm" style={{ color: 'var(--t3)' }}>Loading…</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--t3)' }}>No transactions yet.</p>
            ) : (
              <ul className="space-y-3">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--bdl)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--t)' }}>{tx.description || tx.type}</p>
                      <p className="text-xs" style={{ color: 'var(--t3)' }}>{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className="font-semibold tabular-nums" style={{ color: tx.type === 'EARN' ? 'var(--gr)' : tx.type === 'SPEND' || tx.type === 'EXPIRE' ? 'var(--re)' : 'var(--t3)' }}>
                      {tx.type === 'EARN' ? '+' : '-'}{formatPoints(Math.abs(tx.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
