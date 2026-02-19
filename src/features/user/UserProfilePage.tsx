import { useEffect, useState } from 'react';
import { customersApi, rewardsApi } from '../../lib/api';
import type { Reward } from '../../lib/api';

const PHONE_KEY = 'loyalty_user_phone';

export function UserProfilePage() {
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) || '');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [customer, setCustomer] = useState<{ phoneNumber: string; streaks?: unknown[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    Promise.all([
      customersApi.getByPhone(phone).catch(() => null),
      rewardsApi.byCustomer(phone).catch(() => []),
    ])
      .then(([c, r]) => {
        setCustomer(c || null);
        setRewards(Array.isArray(r) ? r : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="phone"]')?.value?.trim();
    if (p) {
      setPhone(p);
      localStorage.setItem(PHONE_KEY, p);
    }
  };

  if (!phone) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">My Streaks & Rewards</h1>
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <input
            name="phone"
            type="tel"
            placeholder="+15551234567"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg">
            Load my profile
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">My Streaks & Rewards</h1>
      <p className="text-gray-600 mb-4">Phone: {phone}</p>
      {customer?.streaks && (customer.streaks as { currentCount?: number }[]).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="font-semibold mb-2">Streaks</h2>
          <ul className="divide-y">
            {(customer.streaks as { currentCount?: number; partnerId?: string }[]).map((s, i) => (
              <li key={i} className="py-2">Count: {s.currentCount ?? 0}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-2">Rewards ({rewards.length})</h2>
        {rewards.length === 0 ? (
          <p className="text-gray-500">No rewards yet.</p>
        ) : (
          <ul className="divide-y">
            {rewards.map((r) => (
              <li key={r.id} className="py-2 flex justify-between">
                <span>{r.status}</span>
                <span className="text-gray-500">{r.partner?.businessName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
