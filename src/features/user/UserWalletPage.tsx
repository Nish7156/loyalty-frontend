import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi, customersApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { WalletBalance, CustomerProfile, StoreVisit } from '../../lib/api';

const DEFAULT_MIN_REDEEM_PTS = 50;

function getStoreMinRedeem(store: StoreVisit): number {
  return store.minimumRedemptionPoints ?? DEFAULT_MIN_REDEEM_PTS;
}

function formatPoints(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

const CARD_STRIPE_COLORS = ['#D85A30', '#7A6C5C', '#5C6E84', '#7A5C6E'];

export function UserWalletPage() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const openStoreDetail = (store: StoreVisit, wallet: WalletBalance | undefined) => {
    navigate(`/me/store/${store.branchId}`, { state: { store, wallet: wallet ?? null } });
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([walletApi.getAllBalances(), customersApi.getMyProfile()])
      .then(([walletData, profileData]) => {
        setWallets(walletData);
        setProfile(profileData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load wallet'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-md mx-auto w-full min-w-0"><HistorySkeleton /></div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--t)' }}>My Cards</h1>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm" style={{ color: 'var(--re)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const totalPoints = wallets.reduce((sum, w) => sum + w.balance, 0);
  const stores = profile?.storesVisited || [];

  return (
    <div className="max-w-md mx-auto w-full min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '20px', paddingBottom: '8px' }}>

      {/* Greeting + Wallet Strip - matching wireframe 03 */}
      <div className="a1 px-0.5">
        <p className="text-xs mb-1" style={{ color: 'var(--t2)' }}>Welcome back</p>
        <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>
          My Loyalty Cards
        </h1>
      </div>

      {/* Dark wallet strip - matching wireframe 03 */}
      <div
        className="a2 rounded-[18px] overflow-hidden relative"
        style={{
          background: 'var(--t)',
          padding: '20px 22px',
          color: 'var(--s)',
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Total Coins</p>
            <p className="text-[30px] font-bold leading-none mt-1" style={{ letterSpacing: '-0.04em' }}>{formatPoints(totalPoints)}</p>
          </div>
          <button
            className="flex items-center gap-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'var(--a)', color: 'var(--s)', padding: '8px 16px' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>redeem</span>
            Redeem
          </button>
        </div>
      </div>

      {/* Quick action buttons - matching wireframe 03 */}
      <div className="a3 flex gap-3">
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-[10px] font-semibold text-sm"
          style={{ height: '40px', background: 'var(--a)', color: 'var(--s)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>qr_code_scanner</span>
          Scan QR
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[10px] font-semibold text-sm"
          style={{ height: '40px', background: 'var(--s)', border: '1.5px solid var(--bd)', color: 'var(--t2)', padding: '0 16px' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>account_balance_wallet</span>
          Wallet
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[10px] font-semibold text-sm"
          style={{ height: '40px', background: 'var(--s)', border: '1.5px solid var(--bd)', color: 'var(--t2)', padding: '0 16px' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>history</span>
          History
        </button>
      </div>

      {/* My Loyalty Cards section - matching wireframe 03 */}
      <div className="a4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--t3)' }}>MY LOYALTY CARDS</p>
      </div>

      {stores.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center a5">
          <div className="flex justify-center mb-3">
            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--bd)' }}>storefront</span>
          </div>
          <p className="font-semibold mb-2" style={{ color: 'var(--t)' }}>No Stores Yet</p>
          <p className="text-sm" style={{ color: 'var(--t2)' }}>Scan a QR code at a store to check in and start earning!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {stores.map((store, idx) => {
            const wallet = wallets.find(w => w.partnerId === store.partnerId);
            const loyaltyType = store.loyaltyType || 'VISITS';
            const stripeColor = CARD_STRIPE_COLORS[idx % CARD_STRIPE_COLORS.length];
            const threshold = store.rewardThreshold ?? 5;
            const current = store.streakCurrentCount ?? 0;
            const balance = wallet?.balance ?? 0;

            return (
              <div
                key={`${store.partnerId}-${store.branchId}`}
                role="button"
                tabIndex={0}
                onClick={() => openStoreDetail(store, wallet)}
                onKeyDown={(e) => e.key === 'Enter' && openStoreDetail(store, wallet)}
                className={`glass-card rounded-2xl overflow-hidden cursor-pointer ${idx < 2 ? 'a5' : ''}`}
                style={{ borderTop: `2.5px solid ${stripeColor}` }}
              >
                <div style={{ padding: '14px' }}>
                  {/* Brand label */}
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: 'var(--t3)' }}>
                    {store.partnerName}
                  </p>
                  {/* Branch */}
                  <p className="text-[12px] font-medium truncate" style={{ color: 'var(--t)' }}>{store.branchName}</p>

                  {/* Balance or visits */}
                  <div className="mt-3">
                    {loyaltyType === 'POINTS' || loyaltyType === 'HYBRID' ? (
                      <>
                        <p className="text-[20px] font-bold" style={{ color: 'var(--t)', letterSpacing: '-0.04em' }}>
                          {formatPoints(balance)}
                        </p>
                        <p className="text-[10.5px]" style={{ color: 'var(--t3)' }}>coins</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[20px] font-bold" style={{ color: 'var(--t)', letterSpacing: '-0.04em' }}>
                          {current}/{threshold}
                        </p>
                        <p className="text-[10.5px]" style={{ color: 'var(--t3)' }}>visits</p>
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, loyaltyType === 'VISITS' ? (threshold > 0 ? (current / threshold) * 100 : 0) : (wallet ? Math.min(100, (balance / getStoreMinRedeem(store)) * 100) : 0))}%`,
                        background: stripeColor,
                      }}
                    />
                  </div>

                  {/* Earning rate & last visit */}
                  {store.amountPerCoin && (loyaltyType === 'POINTS' || loyaltyType === 'HYBRID') && (
                    <p className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--a)' }}>
                      ₹{store.amountPerCoin} = 1 coin
                    </p>
                  )}
                  <p className="text-[10px] mt-1" style={{ color: 'var(--t3)' }}>
                    Last: {formatDate(store.lastVisitAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Earn banner - matching wireframe 03 */}
      {stores.length > 0 && (
        <div className="glass-card rounded-2xl a6">
          <div className="flex items-center gap-3" style={{ padding: '16px 18px' }}>
            <div
              className="shrink-0 flex items-center justify-center"
              style={{ width: '44px', height: '44px', background: 'var(--bdl)', border: '1px solid var(--bd)', borderRadius: '14px' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '22px', color: 'var(--a)' }}>generating_tokens</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--t)' }}>Earn on Every Purchase</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--t2)' }}>Points added automatically</p>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--bd)' }}>chevron_right</span>
          </div>
        </div>
      )}
    </div>
  );
}
