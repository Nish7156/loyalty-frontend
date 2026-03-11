import { useEffect, useState } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken, walletApi } from '../../lib/api';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useHaptic } from '../../hooks/useHaptic';
import type { CustomerProfile, Reward, CustomerHistory } from '../../lib/api';

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
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedByToken, setLoadedByToken] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [redeemingPartnerId, setRedeemingPartnerId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<{ partnerId: string; rewardsCreated: number } | null>(null);

  useEffect(() => {
    if (getCustomerTokenIfPresent()) {
      setLoading(true);
      setError('');
      Promise.all([customersApi.getMyProfile(), customersApi.getMyHistory()])
        .then(([p, h]) => {
          setProfile(p);
          setPhone(p.customer.phoneNumber);
          setHistory(h);
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
        setHistory(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]); // Only runs on phone change or mount

  useEffect(() => {
    const handler = () => {
      if (getCustomerTokenIfPresent()) {
        customersApi.getMyProfile().then(setProfile).catch(() => {});
        customersApi.getMyHistory().then(setHistory).catch(() => {});
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

  const handleLogout = () => {
    haptic.medium();
    setShowLogoutConfirm(false);
    clearCustomerToken();
    setProfile(null);
    setHistory(null);
    setPhone(DEFAULT_PHONE_PREFIX);
    setLoadedByToken(false);
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

  const { customer, storesVisited } = profile;
  const rewards: Reward[] = customer.rewards ?? [];

  const activeRewards = rewards.filter((r) => r.status === 'ACTIVE');
  const redeemedFromHistory = history?.redeemedRewards ?? [];

  const cardClass = 'glass-card rounded-2xl p-5 sm:p-6 min-w-0 shadow-premium-md card-premium haptic-feedback opacity-0 animate-slide-in-up';
  const sectionTitleClass = 'text-base font-semibold text-gradient-premium mb-1';
  const descClass = 'user-text-muted text-sm';

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <div className="flex items-center justify-between gap-3 min-w-0 opacity-0 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
          {loadedByToken ? "You're in the club" : 'My Loyalty Card'}
        </h1>
        {loadedByToken && (
          <button
            type="button"
            onClick={() => { haptic.light(); setShowLogoutConfirm(true); }}
            className="shrink-0 min-h-[44px] px-4 rounded-xl border text-sm font-medium transition-colors-premium touch-manipulation haptic-feedback"
            style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
          >
            Log out
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 opacity-0 animate-fade-in-up">
          <p className="text-rose-500 text-sm">{error}</p>
          <button type="button" onClick={() => setError('')} className="text-rose-400 text-xs mt-1 hover:text-rose-300">
            Dismiss
          </button>
        </div>
      )}

      <div className={`${cardClass} stagger-1`}>
        {customer.name && (
          <p className="font-semibold user-text text-lg truncate mb-1">{customer.name}</p>
        )}
        <p className={descClass}>Member</p>
        <p className="font-mono text-base sm:text-lg tracking-wide user-text break-all mt-0.5">{customer.phoneNumber}</p>
        {loadedByToken && (storesVisited.length > 0 || activeRewards.length > 0) && (
          <p className="user-reward-box-text text-sm mt-2">Thanks for being a loyal customer.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-6 sm:gap-8">
          <div>
            <p className={descClass}>Stores visited</p>
            <p className="font-semibold user-text mt-0.5">{storesVisited.length}</p>
          </div>
          <div>
            <p className={descClass}>Rewards to use</p>
            <p className="font-semibold user-text mt-0.5">{activeRewards.length}</p>
          </div>
          {redeemedFromHistory.length > 0 && (
            <div>
              <p className={descClass}>Redeemed</p>
              <p className="font-semibold user-text mt-0.5">{redeemedFromHistory.length}</p>
            </div>
          )}
        </div>
      </div>

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
            return (
              <div
                key={store.branchId}
                className={`${cardClass} stagger-2`}
                style={{ animationDelay: `${0.19 + index * 0.08}s` }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold user-text text-lg truncate">{store.partnerName}</p>
                    <p className={`${descClass} mt-0.5 truncate`}>{store.branchName}</p>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className={descClass}>{store.visitCount} visit{store.visitCount !== 1 ? 's' : ''}</p>
                    <p className={descClass}>Last: {formatDate(store.lastVisitAt)}</p>
                  </div>
                </div>

                {/* POINTS-based or HYBRID system */}
                {(loyaltyType === 'POINTS' || loyaltyType === 'HYBRID') && (
                  <>
                    <div className="user-reward-box mt-4 rounded-xl border px-4 py-3 animate-reward-glow">
                      <p className="user-reward-box-text text-xs font-medium uppercase tracking-wider mb-1">Points Balance</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">
                          {pointsBalance.toFixed(0)}
                        </p>
                        <p className="user-reward-box-text text-sm">points</p>
                      </div>
                      <p className="user-reward-box-text-strong mt-2 text-sm">
                        Earn points on every purchase to redeem rewards
                      </p>
                    </div>

                    {/* Redeem Points Button - only show if logged in */}
                    {loadedByToken && pointsBalance >= 50 && (
                      <>
                        {redeemSuccess?.partnerId === store.partnerId ? (
                          <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                            <p className="text-emerald-500 font-semibold text-sm">
                              ✓ Redeemed! {redeemSuccess.rewardsCreated} reward{redeemSuccess.rewardsCreated !== 1 ? 's' : ''} added
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRedeemPoints(store.partnerId, store.branchId)}
                            disabled={!!redeemingPartnerId}
                            className="hover-user-bg w-full min-h-[44px] mt-3 rounded-xl border font-medium transition disabled:opacity-50 touch-manipulation"
                            style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
                          >
                            {redeemingPartnerId === store.partnerId ? 'Redeeming...' : 'Redeem Points for Rewards'}
                          </button>
                        )}
                      </>
                    )}
                    {loadedByToken && pointsBalance < 50 && (
                      <p className="user-text-subtle text-xs mt-3">Minimum 50 points required to redeem</p>
                    )}
                  </>
                )}

                {/* VISITS-based system */}
                {loyaltyType === 'VISITS' && threshold > 0 && windowDays > 0 && (
                  <>
                    <div className="user-reward-box mt-4 rounded-xl border px-4 py-3 animate-reward-glow">
                      <p className="user-reward-box-text text-xs font-medium uppercase tracking-wider mb-1">You win when you complete</p>
                      <p className="user-reward-box-text text-sm font-medium">
                        {threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days
                      </p>
                      <p className="user-reward-box-text-strong mt-1.5 text-base font-semibold">
                        → {description}
                      </p>
                    </div>
                    {periodStart && (
                      <p className="user-text-subtle text-xs mt-2">Period started: {formatDate(periodStart)}</p>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2.5 flex-1 max-w-[180px] rounded-full overflow-hidden" style={{ backgroundColor: 'var(--user-hover)' }}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 animate-progress-fill transition-[width] duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className={`font-semibold text-sm tabular-nums ${isComplete ? 'text-emerald-500' : 'user-reward-box-text-strong'}`}>
                        {current}/{threshold}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm logout">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} aria-hidden="true" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border p-6 shadow-xl animate-scale-in" style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-surface)' }}>
            <p className="user-text font-medium text-center mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="hover-user-bg flex-1 min-h-[44px] rounded-xl border text-sm font-medium transition btn-interactive"
                style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400 transition btn-interactive"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
