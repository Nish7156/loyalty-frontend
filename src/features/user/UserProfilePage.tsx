import { useEffect, useState, useRef } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken } from '../../lib/api';
import { createCustomerSocket } from '../../lib/socket';
import { Loader } from '../../components/Loader';
import type { CustomerProfile, Reward, CustomerHistory } from '../../lib/api';

const PHONE_KEY = 'loyalty_user_phone';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

export function UserProfilePage() {
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) || '');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedByToken, setLoadedByToken] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const socketRef = useRef<ReturnType<typeof createCustomerSocket> | null>(null);

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
      .getProfile(phone)
      .then((p) => {
        setProfile(p);
        setHistory(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => {
    const customerPhone = profile?.customer?.phoneNumber;
    if (!customerPhone) return;
    const socket = createCustomerSocket(customerPhone);
    socketRef.current = socket;
    const handler = () => {
      if (getCustomerTokenIfPresent()) {
        customersApi.getMyProfile().then(setProfile).catch(() => {});
        customersApi.getMyHistory().then(setHistory).catch(() => {});
      } else {
        customersApi.getProfile(customerPhone).then(setProfile).catch(() => {});
      }
    };
    socket.on('checkin_updated', handler);
    return () => {
      socket.off('checkin_updated', handler);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [profile?.customer?.phoneNumber]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="phone"]')?.value?.trim();
    if (p) {
      setPhone(p);
      localStorage.setItem(PHONE_KEY, p);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    clearCustomerToken();
    setProfile(null);
    setHistory(null);
    setPhone('');
    setLoadedByToken(false);
  };

  if (getCustomerTokenIfPresent() && loading && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 min-h-[50vh] flex items-center justify-center">
        <Loader message="Loading your profile…" />
      </div>
    );
  }

  if (!phone && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8 opacity-0 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">
          My Loyalty Card
        </h1>
        <p className="text-white/60 text-sm mb-6">Enter your phone to view your profile and rewards.</p>
        <form onSubmit={handlePhoneSubmit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)] card-interactive tap-scale">
          <label className="block text-sm font-medium text-white/70 mb-2">Phone</label>
          <input
            name="phone"
            type="tel"
            placeholder="+15551234567"
            className="w-full min-h-[48px] border border-white/20 rounded-xl px-4 py-3 bg-black/30 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition-all duration-200"
            required
          />
          <button
            type="submit"
            className="w-full min-h-[48px] mt-4 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition-all duration-200 touch-manipulation btn-interactive"
          >
            Explore
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 min-h-[50vh] flex items-center justify-center">
        <Loader message="Loading…" />
      </div>
    );
  }
  if (error) return <p className="text-rose-400 text-sm">{error}</p>;
  if (!profile) return null;

  const { customer, storesVisited } = profile;
  const rewards: Reward[] = customer.rewards ?? [];

  const activeRewards = rewards.filter((r) => r.status === 'ACTIVE');
  const redeemedFromHistory = history?.redeemedRewards ?? [];

  const cardClass = 'rounded-2xl p-5 sm:p-6 min-w-0 border border-white/10 bg-white/[0.04] shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)] card-interactive tap-scale opacity-0 animate-fade-in-up';
  const sectionTitleClass = 'text-base font-semibold bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent mb-1';
  const descClass = 'text-white/60 text-sm';

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <div className="flex items-center justify-between gap-3 min-w-0 opacity-0 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent">
          {loadedByToken ? "You're in the club" : 'My Loyalty Card'}
        </h1>
        {loadedByToken && (
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="shrink-0 min-h-[44px] px-4 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all duration-200 touch-manipulation btn-interactive"
          >
            Log out
          </button>
        )}
      </div>

      <div className={`${cardClass} stagger-1`}>
        <p className={descClass}>Member</p>
        <p className="font-mono text-base sm:text-lg tracking-wide text-white break-all mt-0.5">{customer.phoneNumber}</p>
        {loadedByToken && (storesVisited.length > 0 || activeRewards.length > 0) && (
          <p className="text-cyan-300/90 text-sm mt-2">Thanks for being a loyal customer.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-6 sm:gap-8">
          <div>
            <p className={descClass}>Stores visited</p>
            <p className="font-semibold text-white mt-0.5">{storesVisited.length}</p>
          </div>
          <div>
            <p className={descClass}>Rewards to use</p>
            <p className="font-semibold text-white mt-0.5">{activeRewards.length}</p>
          </div>
          {redeemedFromHistory.length > 0 && (
            <div>
              <p className={descClass}>Redeemed</p>
              <p className="font-semibold text-white mt-0.5">{redeemedFromHistory.length}</p>
            </div>
          )}
        </div>
      </div>

      <h2 className={`${sectionTitleClass} opacity-0 animate-fade-in-up stagger-2`}>Stores you use</h2>
      {storesVisited.length === 0 ? (
        <div className={`${cardClass} stagger-2`}>
          <p className={descClass}>No store visits yet. Scan a store QR to check in — your first visit counts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {storesVisited.map((store, index) => {
            const threshold = store.rewardThreshold ?? 5;
            const windowDays = store.rewardWindowDays ?? 30;
            const description = store.rewardDescription || 'Free reward';
            const current = store.streakCurrentCount ?? 0;
            const periodStart = store.streakPeriodStartedAt;
            return (
              <div
                key={store.branchId}
                className={`${cardClass} stagger-2`}
                style={{ animationDelay: `${0.19 + index * 0.08}s` }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-lg truncate">{store.partnerName}</p>
                    <p className={`${descClass} mt-0.5 truncate`}>{store.branchName}</p>
                    {(threshold > 0 && windowDays > 0) && (
                      <p className="text-white/50 text-xs mt-1.5">
                        {threshold} purchases in {windowDays} days → {description}
                      </p>
                    )}
                    {periodStart && (
                      <p className="text-white/50 text-xs mt-0.5">Period started: {formatDate(periodStart)}</p>
                    )}
                    {(threshold > 0) && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-[140px] rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-400/90 animate-progress-fill"
                            style={{ width: `${Math.min(100, (current / threshold) * 100)}%` }}
                          />
                        </div>
                        <span className="text-cyan-300 font-medium text-sm tabular-nums">{current}/{threshold}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className={descClass}>{store.visitCount} visit{store.visitCount !== 1 ? 's' : ''}</p>
                    <p className={descClass}>Last: {formatDate(store.lastVisitAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm logout">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--premium-surface)] p-6 shadow-xl animate-scale-in">
            <p className="text-white font-medium text-center mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition btn-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-500/90 text-white text-sm font-semibold hover:bg-rose-400 transition btn-interactive"
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
