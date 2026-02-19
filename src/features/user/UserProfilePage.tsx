import { useEffect, useState, useRef } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken } from '../../lib/api';
import { createCustomerSocket } from '../../lib/socket';
import type { CustomerProfile, Reward } from '../../lib/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedByToken, setLoadedByToken] = useState(false);
  const socketRef = useRef<ReturnType<typeof createCustomerSocket> | null>(null);

  useEffect(() => {
    if (getCustomerTokenIfPresent()) {
      setLoading(true);
      setError('');
      customersApi
        .getMyProfile()
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
      .getProfile(phone)
      .then(setProfile)
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
    setPhone('');
    setLoadedByToken(false);
  };

  if (getCustomerTokenIfPresent() && loading && !profile) {
    return <p className="p-4 text-[var(--premium-muted)]">Loading…</p>;
  }

  if (!phone && !profile) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4 text-[var(--premium-cream)] tracking-tight">My Loyalty Card</h1>
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <input
            name="phone"
            type="tel"
            placeholder="+15551234567"
            className="w-full border border-[var(--premium-border)] rounded-xl px-3 py-2.5 bg-[var(--premium-card)] text-[var(--premium-cream)] placeholder-[var(--premium-muted)] focus:ring-2 focus:ring-[var(--premium-gold)] focus:border-[var(--premium-gold)]"
            required
          />
          <button type="submit" className="w-full px-4 py-2.5 bg-[var(--premium-gold)] text-[var(--premium-bg)] font-medium rounded-xl hover:opacity-90">
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
  const streaks = customer.streaks ?? [];

  const pointsByPartner = new Map<string, number>();
  for (const s of streaks) {
    pointsByPartner.set(s.partnerId, s.currentCount ?? 0);
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--premium-cream)] tracking-tight">My Loyalty Card</h1>
        {loadedByToken && (
          <button type="button" onClick={handleLogout} className="text-sm text-[var(--premium-gold)] hover:underline">
            Log out
          </button>
        )}
      </div>

      <div className="bg-[var(--premium-surface)] border border-[var(--premium-border)] rounded-xl p-5 ring-1 ring-[var(--premium-gold)]/20">
        <p className="text-[var(--premium-muted)] text-sm">Member</p>
        <p className="font-mono text-lg tracking-wide text-[var(--premium-cream)]">{customer.phoneNumber}</p>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-[var(--premium-muted)] text-xs">Stores visited</p>
            <p className="font-semibold text-[var(--premium-gold)]">{storesVisited.length}</p>
          </div>
          <div>
            <p className="text-[var(--premium-muted)] text-xs">Rewards</p>
            <p className="font-semibold text-[var(--premium-gold)]">{rewards.filter((r) => r.status === 'ACTIVE').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--premium-card)] border border-[var(--premium-border)] rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-[var(--premium-cream)]">Stores I've visited</h2>
        {storesVisited.length === 0 ? (
          <p className="text-[var(--premium-muted)] text-sm">No store visits yet. Scan a store QR to check in.</p>
        ) : (
          <ul className="divide-y divide-[var(--premium-border)] space-y-2">
            {storesVisited.map((store) => (
              <li key={store.branchId} className="py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[var(--premium-cream)]">{store.partnerName}</p>
                    <p className="text-[var(--premium-muted)] text-sm">{store.branchName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[var(--premium-muted)]">{store.visitCount} visit{store.visitCount !== 1 ? 's' : ''}</p>
                    <p className="text-[var(--premium-muted)]">Last: {formatDate(store.lastVisitAt)}</p>
                    <p className="font-medium text-[var(--premium-gold)]">
                      {pointsByPartner.get(store.partnerId) ?? 0} pts
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-[var(--premium-card)] border border-[var(--premium-border)] rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-[var(--premium-cream)]">My rewards</h2>
        {rewards.length === 0 ? (
          <p className="text-[var(--premium-muted)] text-sm">No rewards yet. Keep visiting to earn rewards.</p>
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
