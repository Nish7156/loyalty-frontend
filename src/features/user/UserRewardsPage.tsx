import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customersApi, getCustomerTokenIfPresent } from '../../lib/api';
import { Loader } from '../../components/Loader';
import type { CustomerProfile, Reward } from '../../lib/api';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return s;
  }
}

export function UserRewardsPage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCustomerTokenIfPresent()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    customersApi
      .getMyProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load rewards'))
      .finally(() => setLoading(false));
  }, []);

  const isLoggedIn = !!getCustomerTokenIfPresent();
  const rewards: Reward[] = profile?.customer?.rewards ?? [];
  const cardClass = 'rounded-2xl p-5 sm:p-6 min-w-0 border border-white/10 bg-white/[0.04] shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)] card-interactive tap-scale opacity-0 animate-fade-in-up';
  const descClass = 'text-white/60 text-sm';

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8 opacity-0 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">
          Rewards
        </h1>
        <p className="text-white/60 text-sm mb-6">Log in to see your rewards.</p>
        <div className={`${cardClass} stagger-1`}>
          <Link
            to="/"
            className="flex w-full min-h-[48px] rounded-xl border border-white/40 text-white font-medium items-center justify-center hover:bg-white/10 transition-all duration-200 btn-interactive"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 min-h-[50vh] flex items-center justify-center">
        <Loader message="Loading rewards…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">
          Rewards
        </h1>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent opacity-0 animate-fade-in-up">
        Rewards
      </h1>

      {rewards.length === 0 ? (
        <div className={`${cardClass} stagger-1`}>
          <p className={descClass}>No rewards yet. Keep visiting your favorite stores — you'll earn rewards before you know it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((r, index) => (
            <div
              key={r.id}
              className={cardClass}
              style={{ animationDelay: `${0.12 + index * 0.08}s` }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-lg truncate">{r.partner?.businessName ?? 'Store'}</p>
                  <span
                    className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'ACTIVE'
                        ? 'bg-cyan-400/20 text-cyan-300'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {r.status === 'ACTIVE' ? 'Ready to use' : 'Redeemed'}
                  </span>
                  {r.expiryDate && (
                    <p className="text-white/50 text-sm mt-2">Expires {formatDate(r.expiryDate)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
