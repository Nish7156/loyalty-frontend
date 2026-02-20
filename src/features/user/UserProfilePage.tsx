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

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
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
    return <p className="p-4 text-[var(--premium-muted)]">Loading…</p>;
  }

  if (!phone && !profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <h1 className="text-lg font-bold mb-4 text-[var(--premium-cream)] tracking-tight sm:text-xl">My Loyalty Card</h1>
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <input
            name="phone"
            type="tel"
            placeholder="+15551234567"
            className="w-full min-h-[44px] border border-[var(--premium-border)] rounded-xl px-3 py-2.5 bg-[var(--premium-card)] text-[var(--premium-cream)] placeholder-[var(--premium-muted)] focus:ring-2 focus:ring-[var(--premium-gold)] focus:border-[var(--premium-gold)]"
            required
          />
          <button type="submit" className="w-full min-h-[44px] px-4 py-2.5 bg-[var(--premium-gold)] text-[var(--premium-bg)] font-medium rounded-xl hover:opacity-90 touch-manipulation">
            Load my profile
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <p className="text-[var(--premium-muted)]">Loading…</p>;
  if (error) return <p className="text-rose-400">{error}</p>;
  if (!profile) return null;

  const { customer, storesVisited } = profile;
  const rewards: Reward[] = customer.rewards ?? [];

  const activeRewards = rewards.filter((r) => r.status === 'ACTIVE');
  const redeemedFromHistory = history?.redeemedRewards ?? [];

  return (
    <div className="max-w-md mx-auto space-y-4 sm:space-y-6 pb-8 w-full min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h1 className="text-lg font-bold text-[var(--premium-cream)] tracking-tight truncate sm:text-xl">
          {loadedByToken ? "You're in the club" : 'My Loyalty Card'}
        </h1>
        {loadedByToken && (
          <button type="button" onClick={handleLogout} className="text-sm text-[var(--premium-gold)] hover:underline">
            Log out
          </button>
        )}
      </div>

      <div className="bg-[var(--premium-surface)] border border-[var(--premium-border)] rounded-xl p-4 sm:p-5 ring-1 ring-[var(--premium-gold)]/20 min-w-0">
        <p className="text-[var(--premium-muted)] text-sm">Member</p>
        <p className="font-mono text-base sm:text-lg tracking-wide text-[var(--premium-cream)] break-all">{customer.phoneNumber}</p>
        {loadedByToken && (storesVisited.length > 0 || activeRewards.length > 0) && (
          <p className="text-[var(--premium-gold)]/90 text-sm mt-2">Thanks for being a loyal customer.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 sm:gap-6">
          <div>
            <p className="text-[var(--premium-muted)] text-xs">Stores visited</p>
            <p className="font-semibold text-[var(--premium-gold)]">{storesVisited.length}</p>
          </div>
          <div>
            <p className="text-[var(--premium-muted)] text-xs">Rewards to use</p>
            <p className="font-semibold text-[var(--premium-gold)]">{activeRewards.length}</p>
          </div>
          {redeemedFromHistory.length > 0 && (
            <div>
              <p className="text-[var(--premium-muted)] text-xs">Redeemed</p>
              <p className="font-semibold text-[var(--premium-gold)]">{redeemedFromHistory.length}</p>
            </div>
          )}
        </div>
      </div>

      {loadedByToken && history && (history.activities.length > 0 || history.redeemedRewards.length > 0) && (
        <div className="bg-[var(--premium-card)] border border-[var(--premium-border)] rounded-xl p-4">
          <h2 className="font-semibold mb-1 text-[var(--premium-cream)]">Your history</h2>
          <p className="text-[var(--premium-muted)] text-sm mb-3">Visits and rewards in one place.</p>
          <ul className="space-y-3">
            {[
              ...history.activities.map((a) => ({
                type: 'visit' as const,
                date: a.createdAt,
                store: a.partner?.businessName,
                branch: a.branch?.branchName,
              })),
              ...history.redeemedRewards.map((r) => ({
                type: 'redeem' as const,
                date: r.redeemedAt ?? r.createdAt,
                store: r.partner?.businessName,
                branch: r.redeemedBranch?.branchName ?? null,
              })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 20)
              .map((item, i) => (
                <li key={item.type + item.date + i} className="flex items-start gap-3 py-2 border-b border-[var(--premium-border)] last:border-0">
                  <span className="shrink-0 w-2 h-2 rounded-full mt-1.5 bg-[var(--premium-gold)]" />
                  <div className="min-w-0">
                    <p className="text-[var(--premium-cream)] font-medium">
                      {item.type === 'visit' ? 'Visit' : 'Reward redeemed'} — {item.store}
                    </p>
                    {item.branch && (
                      <p className="text-[var(--premium-muted)] text-sm">{item.branch}</p>
                    )}
                    <p className="text-[var(--premium-muted)] text-xs mt-0.5">{formatDateTime(item.date)}</p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {loadedByToken && redeemedFromHistory.length > 0 && (
        <div className="bg-[var(--premium-card)] border border-[var(--premium-border)] rounded-xl p-4">
          <h2 className="font-semibold mb-1 text-[var(--premium-cream)]">Rewards you've redeemed</h2>
          <p className="text-[var(--premium-muted)] text-sm mb-3">Every reward you've claimed — store and date.</p>
          <ul className="divide-y divide-[var(--premium-border)]">
            {redeemedFromHistory.map((r) => (
              <li key={r.id} className="py-3">
                <p className="font-medium text-[var(--premium-cream)]">{r.partner?.businessName ?? 'Store'}</p>
                {r.redeemedBranch && (
                  <p className="text-[var(--premium-muted)] text-sm">{r.redeemedBranch.branchName}</p>
                )}
                <p className="text-[var(--premium-muted)] text-xs mt-1">
                  Redeemed {r.redeemedAt ? formatDateTime(r.redeemedAt) : formatDate(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-[var(--premium-card)] border border-[var(--premium-border)] rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-[var(--premium-cream)]">Stores you use</h2>
        {storesVisited.length === 0 ? (
          <p className="text-[var(--premium-muted)] text-sm">No store visits yet. Scan a store QR to check in — your first visit counts.</p>
        ) : (
          <ul className="divide-y divide-[var(--premium-border)] space-y-2">
            {storesVisited.map((store) => {
              const threshold = store.rewardThreshold ?? 5;
              const windowDays = store.rewardWindowDays ?? 30;
              const description = store.rewardDescription || 'Free reward';
              const current = store.streakCurrentCount ?? 0;
              const periodStart = store.streakPeriodStartedAt;
              return (
                <li key={store.branchId} className="py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[var(--premium-cream)]">{store.partnerName}</p>
                      <p className="text-[var(--premium-muted)] text-sm">{store.branchName}</p>
                      {(threshold > 0 && windowDays > 0) && (
                        <p className="text-[var(--premium-muted)] text-xs mt-1">
                          {threshold} purchases in {windowDays} days → {description}
                        </p>
                      )}
                      {periodStart && (
                        <p className="text-[var(--premium-muted)] text-xs">Period started: {formatDate(periodStart)}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-[var(--premium-muted)]">{store.visitCount} visit{store.visitCount !== 1 ? 's' : ''}</p>
                      <p className="text-[var(--premium-muted)]">Last: {formatDate(store.lastVisitAt)}</p>
                      {(threshold > 0) && (
                        <p className="font-medium text-[var(--premium-gold)]">
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

      <div className="bg-[var(--premium-card)] border border-[var(--premium-border)] rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-[var(--premium-cream)]">My rewards</h2>
        {rewards.length === 0 ? (
          <p className="text-[var(--premium-muted)] text-sm">No rewards yet. Keep visiting your favorite stores — you'll earn rewards before you know it.</p>
        ) : (
          <ul className="divide-y divide-[var(--premium-border)]">
            {rewards.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex justify-between">
                  <span className="capitalize text-[var(--premium-cream)]">{r.status.toLowerCase()}</span>
                  <span className="text-[var(--premium-muted)]">{r.partner?.businessName}</span>
                </div>
                {r.expiryDate && (
                  <p className="text-[var(--premium-muted)] text-sm mt-0.5">Expires {formatDate(r.expiryDate)}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
