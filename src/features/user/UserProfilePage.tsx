import { useEffect, useState } from 'react';
import { customersApi, getCustomerTokenIfPresent, walletApi } from '../../lib/api';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useHaptic } from '../../hooks/useHaptic';
import type { CustomerProfile } from '../../lib/api';

const PHONE_KEY = 'loyalty_user_phone';
const CHECKIN_UPDATED_EVENT = 'loyalty_checkin_updated';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

export function UserProfilePage() {
  const haptic = useHaptic();
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) || DEFAULT_PHONE_PREFIX);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedByToken, setLoadedByToken] = useState(false);
  const [redeemingPartnerId, setRedeemingPartnerId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<{ partnerId: string; rewardsCreated: number } | null>(null);

  useEffect(() => {
    if (getCustomerTokenIfPresent()) {
      setLoading(true);
      setError('');
      customersApi.getMyProfile()
        .then((p) => {
          setProfile(p);
          setPhone(p.customer.phoneNumber);
          setLoadedByToken(true);
        })
        .catch(() => setLoading(false))
        .finally(() => setLoading(false));
      return;
    }
    if (!phone) return;
    setLoading(true);
    setError('');
    customersApi
      .getProfile(normalizeIndianPhone(phone))
      .then((p) => setProfile(p))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => {
    const handler = () => {
      if (getCustomerTokenIfPresent()) {
        customersApi.getMyProfile().then(setProfile).catch(() => {});
      } else if (profile?.customer?.phoneNumber) {
        customersApi.getProfile(profile.customer.phoneNumber).then(setProfile).catch(() => {});
      }
    };
    window.addEventListener(CHECKIN_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CHECKIN_UPDATED_EVENT, handler);
  }, [profile?.customer?.phoneNumber]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) {
      const normalized = normalizeIndianPhone(phone);
      setPhone(normalized);
      localStorage.setItem(PHONE_KEY, normalized);
    }
  };

  const handleRedeemPoints = async (partnerId: string, branchId: string) => {
    if (!loadedByToken) return;
    setRedeemingPartnerId(partnerId);
    setError('');
    setRedeemSuccess(null);
    try {
      const result = await walletApi.redeemPoints(partnerId, branchId);
      setRedeemSuccess({ partnerId, rewardsCreated: result.rewardsCreated });
      const p = await customersApi.getMyProfile();
      setProfile(p);
      haptic.medium();
      setTimeout(() => setRedeemSuccess(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to redeem points');
    } finally {
      setRedeemingPartnerId(null);
    }
  };

  if (getCustomerTokenIfPresent() && loading && !profile) {
    return <div className="max-w-md mx-auto w-full min-w-0"><SkeletonLoader type="profile" count={1} /></div>;
  }

  if (!phone && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8 a1">
        <h1 className="text-[22px] font-bold mb-2" style={{ color: '#5D4037', letterSpacing: '-0.02em' }}>My Loyalty Card</h1>
        <p className="text-sm mb-6" style={{ color: '#7B5E54' }}>Enter your phone to view your profile and rewards.</p>
        <form onSubmit={handlePhoneSubmit} className="glass-card rounded-2xl p-5">
          <PhoneInput label="Phone" value={phone} onChange={setPhone} placeholder="98765 43210" required variant="dark" />
          <button
            type="submit"
            onClick={() => haptic.light()}
            className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition touch-manipulation"
            style={{ background: '#D85A30', color: '#FFF', fontSize: '15px' }}
          >
            Explore
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-md mx-auto w-full min-w-0"><SkeletonLoader type="profile" count={1} /></div>;
  }
  if (!profile) return null;

  const { storesVisited } = profile;

  return (
    <div className="max-w-md mx-auto space-y-5 pb-8 w-full min-w-0" style={{ paddingTop: '20px' }}>
      <h1 className="text-[22px] font-bold a1" style={{ color: '#5D4037', letterSpacing: '-0.02em' }}>
        {loadedByToken ? 'Your Loyalty Cards' : 'My Loyalty Card'}
      </h1>

      {error && (
        <div className="rounded-xl p-3 a2" style={{ background: '#FDEEE9', border: '1px solid rgba(176,58,42,0.18)' }}>
          <p className="text-sm" style={{ color: '#B03A2A' }}>{error}</p>
          <button type="button" onClick={() => setError('')} className="text-xs mt-1" style={{ color: '#D85A30' }}>Dismiss</button>
        </div>
      )}

      {/* Wallets */}
      {profile.wallets && profile.wallets.length > 0 && (
        <>
          <div className="a2">
            <h2 className="text-base font-semibold" style={{ color: '#D85A30' }}>Your Wallet</h2>
            <p className="text-xs mt-0.5" style={{ color: '#A08880' }}>Points shared across all branch locations.</p>
          </div>
          <div className="space-y-3">
            {profile.wallets.map((wallet) => (
              <div key={wallet.partnerId} className="glass-card rounded-2xl overflow-hidden a3">
                <div style={{ padding: '16px 18px' }}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate" style={{ color: '#5D4037' }}>{wallet.partnerName}</p>
                      <p className="text-xs" style={{ color: '#7B5E54' }}>Wallet Balance</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold" style={{ color: '#D85A30' }}>{wallet.balance.toFixed(0)}</p>
                      <p className="text-xs" style={{ color: '#7B5E54' }}>points</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div>
                      <p className="text-xs" style={{ color: '#A08880' }}>Earned</p>
                      <p className="font-semibold mt-0.5" style={{ color: '#2A6040' }}>+{wallet.lifetimeEarned.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#A08880' }}>Spent</p>
                      <p className="font-semibold mt-0.5" style={{ color: '#B03A2A' }}>-{wallet.lifetimeSpent.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Stores */}
      <div className="a4">
        <h2 className="text-base font-semibold" style={{ color: '#D85A30' }}>Stores you use</h2>
        <p className="text-xs mt-0.5" style={{ color: '#A08880' }}>Your progress and what you win at each store.</p>
      </div>

      {storesVisited.length === 0 ? (
        <EmptyState
          icon="storefront"
          title="No stores visited yet"
          description="Scan a store QR code to check in and start earning rewards."
        />
      ) : (
        <div className="space-y-3">
          {storesVisited.map((store) => {
            const loyaltyType = store.loyaltyType || 'VISITS';
            const threshold = store.rewardThreshold ?? 5;
            const windowDays = store.rewardWindowDays ?? 30;
            const description = store.rewardDescription || 'Free reward';
            const current = store.streakCurrentCount ?? 0;
            const periodStart = store.streakPeriodStartedAt;
            const progressPct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;
            const isComplete = threshold > 0 && current >= threshold;
            const wallet = profile.wallets?.find(w => w.partnerId === store.partnerId);
            const pointsBalance = wallet?.balance ?? 0;

            if (loyaltyType === 'POINTS' || loyaltyType === 'HYBRID') {
              return (
                <div key={`${store.partnerId}-${store.branchId}`} className="glass-card rounded-2xl overflow-hidden a5">
                  <div style={{ padding: '16px 18px' }}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg truncate" style={{ color: '#5D4037' }}>{store.partnerName}</p>
                        <p className="text-xs truncate" style={{ color: '#7B5E54' }}>{store.branchName}</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.05em] rounded-full px-2.5 py-1" style={{ background: '#FAECE7', color: '#D85A30' }}>
                        POINTS
                      </span>
                    </div>

                    {/* Balance */}
                    <div className="text-center py-5 rounded-xl mb-4" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#D85A30' }}>Your Balance</p>
                      <div className="flex items-baseline justify-center gap-1.5">
                        <p className="text-4xl font-bold" style={{ color: '#D85A30', letterSpacing: '-0.04em' }}>{pointsBalance.toFixed(0)}</p>
                        <p className="text-base font-medium" style={{ color: '#D85A30', opacity: 0.7 }}>pts</p>
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#7B5E54' }}>Valid at all {store.partnerName} locations</p>
                    </div>

                    {/* Redeem */}
                    {loadedByToken && pointsBalance >= 50 && (
                      <>
                        {redeemSuccess?.partnerId === store.partnerId ? (
                          <div className="rounded-xl p-3 text-center mb-4" style={{ background: '#E4F2EB', border: '1px solid #A8D4BA' }}>
                            <p className="text-sm font-semibold" style={{ color: '#2A6040' }}>
                              Success! {redeemSuccess.rewardsCreated} reward{redeemSuccess.rewardsCreated !== 1 ? 's' : ''} added
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRedeemPoints(store.partnerId, store.branchId)}
                            disabled={!!redeemingPartnerId}
                            className="w-full min-h-[52px] rounded-xl font-bold text-sm transition disabled:opacity-50 touch-manipulation mb-4"
                            style={{ background: '#D85A30', color: '#FFF' }}
                          >
                            {redeemingPartnerId === store.partnerId ? 'Redeeming...' : 'Redeem for Rewards'}
                          </button>
                        )}
                      </>
                    )}
                    {loadedByToken && pointsBalance < 50 && (
                      <div className="text-center py-3 rounded-xl mb-4" style={{ background: '#EDEFEE' }}>
                        <p className="text-xs font-medium" style={{ color: '#A08880' }}>50 points minimum to redeem</p>
                        <p className="text-xs mt-1" style={{ color: '#A08880' }}>{Math.ceil(50 - pointsBalance)} more to go</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: '1px solid #FAECE7' }}>
                      <p className="text-xs" style={{ color: '#A08880' }}>All-time: <span className="font-semibold" style={{ color: '#5D4037' }}>{store.visitCount}</span></p>
                      <p className="text-xs" style={{ color: '#A08880' }}>Last: {formatDate(store.lastVisitAt)}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // VISITS card
            return (
              <div key={`${store.partnerId}-${store.branchId}`} className="glass-card rounded-2xl overflow-hidden a5">
                <div style={{ padding: '16px 18px' }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lg truncate" style={{ color: '#5D4037' }}>{store.partnerName}</p>
                      <p className="text-xs truncate" style={{ color: '#7B5E54' }}>{store.branchName}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.05em] rounded-full px-2.5 py-1" style={{ background: '#EDEFEE', color: '#7B5E54' }}>
                      VISITS
                    </span>
                  </div>

                  {threshold > 0 && windowDays > 0 && (
                    <div className="rounded-xl p-4 mb-4" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
                      <p className="font-bold text-sm mb-1" style={{ color: '#D85A30' }}>Complete the Challenge</p>
                      <p className="font-bold text-base mb-1" style={{ color: '#5D4037' }}>
                        {threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days
                      </p>
                      <p className="text-sm font-semibold" style={{ color: '#2A6040' }}>{description}</p>
                    </div>
                  )}

                  {threshold > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium" style={{ color: '#A08880' }}>Window Progress</p>
                        <p className="text-sm font-bold tabular-nums" style={{ color: isComplete ? '#2A6040' : '#D85A30' }}>{current}/{threshold}</p>
                      </div>
                      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#EDEFEE' }}>
                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${progressPct}%`, background: '#D85A30' }} />
                      </div>
                      {isComplete ? (
                        <p className="text-xs font-bold mt-2 text-center" style={{ color: '#2A6040' }}>Complete! Next visit earns reward</p>
                      ) : (
                        <p className="text-xs mt-2 text-center" style={{ color: '#A08880' }}>{windowDays}-day challenge</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: '1px solid #FAECE7' }}>
                    <p className="text-xs" style={{ color: '#A08880' }}>All-time: <span className="font-semibold" style={{ color: '#5D4037' }}>{store.visitCount}</span></p>
                    <p className="text-xs" style={{ color: '#A08880' }}>Last: {formatDate(store.lastVisitAt)}</p>
                  </div>
                  {periodStart && (
                    <p className="text-xs mt-1" style={{ color: '#A08880' }}>Window started: {formatDate(periodStart)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
