import { useEffect, useState, useRef } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken } from '../../lib/api';
import { createCustomerSocket } from '../../lib/socket';
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
    clearCustomerToken();
    setProfile(null);
    setHistory(null);
    setPhone('');
    setLoadedByToken(false);
  };

  if (getCustomerTokenIfPresent() && loading && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 min-h-[50vh] flex items-center justify-center">
        <p className="text-white/70 text-sm animate-pulse-soft">Loading…</p>
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
        <p className="text-white/70 text-sm animate-pulse-soft">Loading…</p>
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
            onClick={handleLogout}
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

      <div className={`${cardClass} stagger-2`}>
        <h2 className={`${sectionTitleClass} mb-3`}>Stores you use</h2>
        {storesVisited.length === 0 ? (
          <p className={descClass}>No store visits yet. Scan a store QR to check in — your first visit counts.</p>
        ) : (
          <ul className="divide-y divide-white/10 space-y-2">
            {storesVisited.map((store) => {
              const threshold = store.rewardThreshold ?? 5;
              const windowDays = store.rewardWindowDays ?? 30;
              const description = store.rewardDescription || 'Free reward';
              const current = store.streakCurrentCount ?? 0;
              const periodStart = store.streakPeriodStartedAt;
              return (
                <li key={store.branchId} className="py-2.5 transition-colors duration-200 rounded-xl hover:bg-white/[0.03] -mx-2 px-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{store.partnerName}</p>
                      <p className={`${descClass} mt-0.5`}>{store.branchName}</p>
                      {(threshold > 0 && windowDays > 0) && (
                        <p className="text-white/50 text-xs mt-1">
                          {threshold} purchases in {windowDays} days → {description}
                        </p>
                      )}
                      {periodStart && (
                        <p className="text-white/50 text-xs mt-0.5">Period started: {formatDate(periodStart)}</p>
                      )}
                      {(threshold > 0) && (
                        <div className="mt-2 h-1.5 w-full max-w-[120px] rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-400/90 animate-progress-fill"
                            style={{ width: `${Math.min(100, (current / threshold) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className={descClass}>{store.visitCount} visit{store.visitCount !== 1 ? 's' : ''}</p>
                      <p className={descClass}>Last: {formatDate(store.lastVisitAt)}</p>
                      {(threshold > 0) && (
                        <p className="font-medium text-cyan-300 mt-0.5">
                          {current}/{threshold}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={`${cardClass} stagger-3`}>
        <h2 className={`${sectionTitleClass} mb-3`}>My rewards</h2>
        {rewards.length === 0 ? (
          <p className={descClass}>No rewards yet. Keep visiting your favorite stores — you'll earn rewards before you know it.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {rewards.map((r) => (
              <li key={r.id} className="py-2.5 rounded-xl hover:bg-white/[0.03] -mx-2 px-2 transition-colors duration-200">
                <div className="flex justify-between">
                  <span className="capitalize text-white">{r.status.toLowerCase()}</span>
                  <span className={descClass}>{r.partner?.businessName}</span>
                </div>
                {r.expiryDate && (
                  <p className="text-white/50 text-sm mt-0.5">Expires {formatDate(r.expiryDate)}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
