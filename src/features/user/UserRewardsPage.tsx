import { useEffect, useState } from 'react';
import { customersApi, rewardsApi } from '../../lib/api';
import { RewardsSkeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
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
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [lastRedeemedCode, setLastRedeemedCode] = useState<string | null>(null);

  const loadProfile = (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    customersApi
      .getMyProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load rewards'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    setError('');
    setLastRedeemedCode(null);
    try {
      const redeemed = await rewardsApi.redeem(rewardId);
      if (redeemed.redemptionCode) setLastRedeemedCode(redeemed.redemptionCode);
      loadProfile(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Redeem failed');
    } finally {
      setRedeemingId(null);
    }
  };

  const rewards: Reward[] = profile?.customer?.rewards ?? [];
  const cardClass = 'user-card rounded-2xl p-5 sm:p-6 min-w-0 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)] card-interactive tap-scale opacity-0 animate-fade-in-up';
  const descClass = 'user-text-muted text-sm';

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <RewardsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
          Rewards
        </h1>
        <div className="user-card rounded-2xl p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)]">
          <p className="text-rose-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent opacity-0 animate-fade-in-up">
        Rewards
      </h1>
      <p className="user-text-muted text-sm -mt-2">Use your rewards at the store — tap Redeem and show the code to staff.</p>

      {lastRedeemedCode && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 opacity-0 animate-fade-in-up">
          <p className="text-sm user-text mb-1">Your reward code — show this to staff at the store</p>
          <p className="text-2xl font-mono font-bold tracking-[0.3em] text-emerald-500">{lastRedeemedCode}</p>
          <p className="text-xs user-text-subtle mt-2">Staff will enter this code to give you your reward.</p>
          <button type="button" onClick={() => setLastRedeemedCode(null)} className="mt-3 text-sm text-cyan-600 font-medium hover:text-cyan-500">
            Dismiss
          </button>
        </div>
      )}

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
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold user-text text-lg truncate">{r.partner?.businessName ?? 'Store'}</p>
                  <span
                    className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'ACTIVE'
                        ? 'bg-cyan-400/20 text-cyan-600'
                        : 'user-text-muted'
                    }`}
                    style={r.status !== 'ACTIVE' ? { backgroundColor: 'var(--user-hover)' } : undefined}
                  >
                    {r.status === 'ACTIVE' ? 'Ready to use' : 'Redeemed'}
                  </span>
                  {r.expiryDate && (
                    <p className="user-text-subtle text-sm mt-2">Expires {formatDate(r.expiryDate)}</p>
                  )}
                </div>
                {r.status === 'ACTIVE' && (
                  <Button
                    onClick={() => handleRedeem(r.id)}
                    disabled={!!redeemingId}
                    className="shrink-0 min-h-[44px] bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold"
                  >
                    {redeemingId === r.id ? 'Redeeming…' : 'Redeem'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
