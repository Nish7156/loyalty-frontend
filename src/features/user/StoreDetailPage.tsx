import { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { customersApi, walletApi } from '../../lib/api';
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
        <Link to="/me" className="text-sm font-medium" style={{ color: '#D85A30' }}>
          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>arrow_back</span>
          Back to overview
        </Link>
        <div className="mt-4 rounded-[22px] p-6 text-center" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <p className="text-sm" style={{ color: '#A08880' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const loyaltyType = store.loyaltyType || 'VISITS';
  const isPoints = loyaltyType === 'POINTS' || loyaltyType === 'HYBRID';
  const isVisits = loyaltyType === 'VISITS' || loyaltyType === 'HYBRID';
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
          style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}
          aria-label="Back"
        >
          <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '20px' }}>arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-syne text-xl font-black truncate" style={{ color: '#5D4037' }}>{store.partnerName}</h1>
          <p className="text-sm truncate" style={{ color: '#A08880' }}>
            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>location_on</span>
            {store.branchName}
          </p>
        </div>
        <span
          className="shrink-0 inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5"
          style={{
            background: loyaltyType === 'VISITS' ? '#FAECE7' : '#E4F2EB',
            border: loyaltyType === 'VISITS' ? '1px solid #F5C4B3' : '1px solid rgba(42,96,64,0.2)',
            color: loyaltyType === 'VISITS' ? '#D85A30' : '#2A6040',
          }}
        >
          {loyaltyType === 'VISITS' ? 'VISITS' : loyaltyType === 'HYBRID' ? 'HYBRID' : 'POINTS'}
        </span>
      </div>

      {isPoints && wallet && (
        <div className="rounded-[22px] overflow-hidden mb-4" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div style={{ padding: '20px 18px', borderBottom: '1px solid #FAECE7' }}>
            <p className="text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: '#A08880' }}>Points Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="font-syne text-4xl font-black" style={{ color: '#D85A30' }}>{formatPoints(wallet.balance)}</span>
              <span className="text-lg font-semibold" style={{ color: '#D85A30', opacity: 0.7 }}>Pts</span>
            </div>
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-[10px] uppercase" style={{ color: '#A08880' }}>Earned</p>
                <p className="font-syne font-bold" style={{ color: '#2A6040' }}>+{formatPoints(wallet.lifetimeEarned)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase" style={{ color: '#A08880' }}>Spent</p>
                <p className="font-syne font-bold" style={{ color: '#B03A2A' }}>-{formatPoints(wallet.lifetimeSpent)}</p>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: '#A08880' }}>Redeem at {store?.minimumRedemptionPoints ?? DEFAULT_MIN_REDEEM_PTS} pts minimum</p>
          </div>
        </div>
      )}

      {isVisits && (
        <div className="rounded-[22px] overflow-hidden mb-4" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div style={{ padding: '20px 18px' }}>
            <p className="text-[10px] uppercase tracking-[0.07em] mb-2" style={{ color: '#A08880' }}>Visit challenge</p>
            <p className="font-syne text-xl font-black" style={{ color: '#D85A30' }}>{threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days</p>
            <p className="text-sm mt-1" style={{ color: '#A08880' }}>
              <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>redeem</span>
              {description}
            </p>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: '#FAECE7' }}>
              <div className="h-full rounded-full transition-[width]" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #D85A30, #E8784E)' }} />
            </div>
            <p className="text-sm mt-2" style={{ color: '#7B5E54' }}>{current} of {threshold} visits</p>
            {isComplete && <p className="text-sm font-semibold mt-2" style={{ color: '#2A6040' }}>
              <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>check_circle</span>
              Challenge complete!
            </p>}
            <p className="text-xs mt-3" style={{ color: '#A08880' }}>Total visits: {store.visitCount} • Last: {formatDate(store.lastVisitAt)}</p>
          </div>
        </div>
      )}

      {isPoints && wallet && (
        <div className="rounded-[22px] overflow-hidden" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #FAECE7' }}>
            <h2 className="font-syne font-black text-base" style={{ color: '#5D4037' }}>Recent activity</h2>
          </div>
          <div style={{ padding: '12px 18px 18px' }}>
            {txLoading ? (
              <p className="text-sm" style={{ color: '#A08880' }}>Loading…</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm" style={{ color: '#A08880' }}>No transactions yet.</p>
            ) : (
              <ul className="space-y-3">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #FAECE7' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#5D4037' }}>{tx.description || tx.type}</p>
                      <p className="text-xs" style={{ color: '#A08880' }}>{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className="font-semibold tabular-nums" style={{ color: tx.type === 'EARN' ? '#2A6040' : tx.type === 'SPEND' ? '#B03A2A' : '#A08880' }}>
                      {tx.type === 'EARN' ? '+' : tx.type === 'SPEND' ? '-' : ''}{formatPoints(tx.amount)}
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
