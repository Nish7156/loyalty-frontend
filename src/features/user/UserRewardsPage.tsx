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

  if (loading) {
    return <div className="max-w-md mx-auto w-full min-w-0"><RewardsSkeleton /></div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--t)' }}>Rewards</h1>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm" style={{ color: 'var(--re)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5 pb-8 w-full min-w-0" style={{ paddingTop: '20px' }}>
      <div className="a1">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>Rewards</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--t2)' }}>Use your rewards at the store — tap Redeem and show the code to staff.</p>
      </div>

      {lastRedeemedCode && (
        <div className="rounded-2xl p-5 a2" style={{ background: 'var(--grbg)', border: '1.5px solid var(--grbd)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--t)' }}>Your reward code — show this to staff</p>
          <p className="text-2xl font-bold tracking-[0.3em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gr)' }}>{lastRedeemedCode}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--t2)' }}>Staff will enter this code to give you your reward.</p>
          <button type="button" onClick={() => setLastRedeemedCode(null)} className="mt-3 text-sm font-medium" style={{ color: 'var(--a)' }}>
            Dismiss
          </button>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="glass-card rounded-2xl p-5 a2">
          <p className="text-sm" style={{ color: 'var(--t2)' }}>No rewards yet. Keep visiting your favorite stores — you'll earn rewards before you know it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((r, index) => (
            <div
              key={r.id}
              className={`glass-card rounded-2xl overflow-hidden ${index < 3 ? 'a2' : ''}`}
            >
              <div style={{ padding: '16px 18px' }}>
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate" style={{ color: 'var(--t)' }}>{r.partner?.businessName ?? 'Store'}</p>
                    <span
                      className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={
                        r.status === 'ACTIVE'
                          ? { background: 'var(--grbg)', color: 'var(--gr)' }
                          : r.status === 'PENDING'
                          ? { background: 'var(--ambg)', color: 'var(--am)' }
                          : { background: 'var(--s2)', color: 'var(--t3)' }
                      }
                    >
                      {r.status === 'ACTIVE' && 'Ready to use'}
                      {r.status === 'PENDING' && 'Awaiting staff verification'}
                      {r.status === 'REDEEMED' && 'Redeemed'}
                    </span>
                    {r.expiryDate && (
                      <p className="text-xs mt-2" style={{ color: 'var(--t3)' }}>Expires {formatDate(r.expiryDate)}</p>
                    )}
                    {r.status === 'PENDING' && r.redemptionCode && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--ambg)', border: '1px solid rgba(180,83,9,0.18)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--am)' }}>Your redemption code:</p>
                        <p className="text-lg font-bold tracking-[0.2em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--am)' }}>
                          {r.redemptionCode}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(180,83,9,0.7)' }}>Show this to staff at the store</p>
                      </div>
                    )}
                  </div>
                  {r.status === 'ACTIVE' && (
                    <Button
                      onClick={() => handleRedeem(r.id)}
                      disabled={!!redeemingId}
                      className="shrink-0 min-h-[40px] rounded-lg font-semibold text-sm"
                      style={{ background: 'var(--a)', color: 'var(--s)', border: 'none' }}
                    >
                      {redeemingId === r.id ? 'Redeeming...' : 'Redeem'}
                    </Button>
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
