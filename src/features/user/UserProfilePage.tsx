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
      .then((p) => {
        setProfile(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]); // Only runs on phone change or mount

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
      // Refresh profile to show updated wallet balance and rewards
      const p = await customersApi.getMyProfile();
      setProfile(p);
      haptic.medium();
      // Clear success message after 5 seconds
      setTimeout(() => setRedeemSuccess(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to redeem points');
    } finally {
      setRedeemingPartnerId(null);
    }
  };


  if (getCustomerTokenIfPresent() && loading && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <SkeletonLoader type="profile" count={1} />
      </div>
    );
  }

  if (!phone && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8 opacity-0 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gradient-premium tracking-tight">
          My Loyalty Card
        </h1>
        <p className="user-text-muted text-sm mb-6">Enter your phone to view your profile and rewards.</p>
        <form onSubmit={handlePhoneSubmit} className="glass-card rounded-2xl p-5 shadow-premium-md card-premium haptic-feedback">
          <PhoneInput
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="98765 43210"
            required
            variant="dark"
          />
          <button
            type="submit"
            onClick={() => haptic.light()}
            className="btn-premium text-white w-full min-h-[48px] mt-4 rounded-xl font-medium transition-colors-premium touch-manipulation"
          >
            Explore
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <SkeletonLoader type="profile" count={1} />
      </div>
    );
  }
  if (!profile) return null;

  const { storesVisited } = profile;

  const cardClass = 'glass-card rounded-2xl p-5 sm:p-6 min-w-0 shadow-premium-md card-premium haptic-feedback opacity-0 animate-slide-in-up';
  const sectionTitleClass = 'text-base font-semibold text-gradient-premium mb-1';
  const descClass = 'user-text-muted text-sm';

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent opacity-0 animate-fade-in-up">
        {loadedByToken ? "Your Loyalty Cards" : 'My Loyalty Card'}
      </h1>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 opacity-0 animate-fade-in-up">
          <p className="text-rose-500 text-sm">{error}</p>
          <button type="button" onClick={() => setError('')} className="text-rose-400 text-xs mt-1 hover:text-rose-300">
            Dismiss
          </button>
        </div>
      )}

      {profile.wallets && profile.wallets.length > 0 && (
        <>
          <div className="opacity-0 animate-fade-in-up stagger-2">
            <h2 className={sectionTitleClass}>💰 Your Wallet</h2>
            <p className="user-text-subtle text-sm mt-0.5">Points you've earned from purchases.</p>
          </div>
          <div className="space-y-3">
            {profile.wallets.map((wallet, index) => (
              <div
                key={wallet.partnerId}
                className={`${cardClass} stagger-2`}
                style={{ animationDelay: `${0.19 + index * 0.08}s` }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold user-text text-lg truncate">{wallet.partnerName}</p>
                    <p className={descClass}>Wallet Balance</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                      {wallet.balance.toFixed(0)}
                    </p>
                    <p className={descClass}>points</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <p className={descClass}>Earned</p>
                    <p className="font-semibold user-text mt-0.5">+{wallet.lifetimeEarned.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className={descClass}>Spent</p>
                    <p className="font-semibold user-text mt-0.5">-{wallet.lifetimeSpent.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="opacity-0 animate-fade-in-up stagger-2">
        <h2 className={sectionTitleClass}>Stores you use</h2>
        <p className="user-text-subtle text-sm mt-0.5">Your progress and what you win at each store.</p>
      </div>
      {storesVisited.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No stores visited yet"
          description="Scan a store QR code to check in and start earning rewards. Your loyalty journey begins with your first visit!"
          className="stagger-2"
        />
      ) : (
        <div className="space-y-4">
          {storesVisited.map((store, index) => {
            const loyaltyType = store.loyaltyType || 'VISITS';
            const threshold = store.rewardThreshold ?? 5;
            const windowDays = store.rewardWindowDays ?? 30;
            const description = store.rewardDescription || 'Free reward';
            const current = store.streakCurrentCount ?? 0;
            const periodStart = store.streakPeriodStartedAt;
            const progressPct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;
            const isComplete = threshold > 0 && current >= threshold;

            // Find wallet for this partner if POINTS or HYBRID
            const wallet = profile.wallets?.find(w => w.partnerId === store.partnerId);
            const pointsBalance = wallet?.balance ?? 0;
            // Render different card layouts based on loyalty type
            if (loyaltyType === 'POINTS' || loyaltyType === 'HYBRID') {
              // POINTS-BASED CARD - Clean, focused on wallet balance
              return (
                <div
                  key={store.branchId}
                  className={`${cardClass} stagger-2`}
                  style={{ animationDelay: `${0.19 + index * 0.08}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold user-text text-xl truncate">{store.partnerName}</p>
                      <p className={`${descClass} truncate`}>{store.branchName}</p>
                    </div>
                    <div className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'rgb(6, 182, 212)' }}>
                      💳 POINTS
                    </div>
                  </div>

                  {/* Points Balance - Big and Clear */}
                  <div className="text-center py-6 rounded-2xl border mb-4" style={{ borderColor: 'rgba(6, 182, 212, 0.3)', backgroundColor: 'rgba(6, 182, 212, 0.05)' }}>
                    <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'rgb(6, 182, 212)' }}>Your Balance</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <p className="text-5xl font-black bg-gradient-to-r from-cyan-600 to-cyan-400 bg-clip-text text-transparent">
                        {pointsBalance.toFixed(0)}
                      </p>
                      <p className="text-lg font-medium" style={{ color: 'rgb(6, 182, 212)' }}>pts</p>
                    </div>
                    <p className={`${descClass} text-xs mt-2`}>💰 Earn points on every purchase</p>
                  </div>

                  {/* Redeem Button */}
                  {loadedByToken && pointsBalance >= 50 && (
                    <>
                      {redeemSuccess?.partnerId === store.partnerId ? (
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center mb-4">
                          <p className="text-emerald-500 font-bold text-sm">
                            ✓ Success! {redeemSuccess.rewardsCreated} reward{redeemSuccess.rewardsCreated !== 1 ? 's' : ''} added to your account
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRedeemPoints(store.partnerId, store.branchId)}
                          disabled={!!redeemingPartnerId}
                          className="w-full min-h-[52px] rounded-xl font-bold transition disabled:opacity-50 touch-manipulation text-white mb-4"
                          style={{ background: 'linear-gradient(135deg, rgb(6, 182, 212), rgb(14, 165, 233))' }}
                        >
                          {redeemingPartnerId === store.partnerId ? '⏳ Redeeming...' : '🎁 Redeem for Rewards'}
                        </button>
                      )}
                    </>
                  )}
                  {loadedByToken && pointsBalance < 50 && (
                    <div className="text-center py-3 rounded-xl mb-4" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
                      <p className={`${descClass} text-xs`}>Need 50 points minimum to redeem</p>
                    </div>
                  )}

                  {/* Visit Stats */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--user-border-subtle)' }}>
                    <p className={`${descClass} text-xs`}>Total visits: <span className="user-text font-semibold">{store.visitCount}</span></p>
                    <p className={`${descClass} text-xs`}>Last: {formatDate(store.lastVisitAt)}</p>
                  </div>
                </div>
              );
            } else {
              // VISIT-BASED CARD - Focused on progress and streak
              return (
                <div
                  key={store.branchId}
                  className={`${cardClass} stagger-2`}
                  style={{ animationDelay: `${0.19 + index * 0.08}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold user-text text-xl truncate">{store.partnerName}</p>
                      <p className={`${descClass} truncate`}>{store.branchName}</p>
                    </div>
                    <div className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'rgb(168, 85, 247)' }}>
                      📍 VISITS
                    </div>
                  </div>

                  {/* Reward Goal */}
                  {threshold > 0 && windowDays > 0 && (
                    <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: 'rgba(168, 85, 247, 0.3)', backgroundColor: 'rgba(168, 85, 247, 0.05)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎯</span>
                        <p className="font-bold text-sm" style={{ color: 'rgb(168, 85, 247)' }}>Complete the Challenge</p>
                      </div>
                      <p className="user-text font-bold text-lg mb-1">
                        {threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days
                      </p>
                      <p className="text-emerald-500 font-semibold">
                        🎁 {description}
                      </p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {threshold > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className={`${descClass} text-xs font-medium`}>Your Progress</p>
                        <p className={`font-bold text-sm tabular-nums ${isComplete ? 'text-emerald-500' : 'text-purple-500'}`}>
                          {current}/{threshold}
                        </p>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-[width] duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      {isComplete && (
                        <p className="text-emerald-500 font-bold text-xs mt-2 text-center">✓ Challenge Complete!</p>
                      )}
                    </div>
                  )}

                  {/* Visit Stats */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--user-border-subtle)' }}>
                    <p className={`${descClass} text-xs`}>Total visits: <span className="user-text font-semibold">{store.visitCount}</span></p>
                    <p className={`${descClass} text-xs`}>Last: {formatDate(store.lastVisitAt)}</p>
                  </div>
                  {periodStart && (
                    <p className={`${descClass} text-xs mt-1`}>Started: {formatDate(periodStart)}</p>
                  )}
                </div>
              );
            }
          })}
        </div>
      )}

    </div>
  );
}
