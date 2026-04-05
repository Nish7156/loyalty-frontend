import { useEffect, useState } from 'react';
import { customersApi, rewardsApi } from '../../lib/api';
import { RewardsSkeleton } from '../../components/Skeleton';
import type { CustomerProfile, Reward } from '../../lib/api';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}

function RewardCard({ r, redeemingId, onRedeem }: { r: Reward; redeemingId: string | null; onRedeem: (id: string) => void }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isActive = r.status === 'ACTIVE';
  const isPending = r.status === 'PENDING';
  const isRedeemed = r.status === 'REDEEMED';

  const statusConfig = isActive
    ? { label: 'Ready to use', bg: 'var(--grbg)', color: 'var(--gr)', dot: true }
    : isPending
    ? { label: 'Awaiting verification', bg: 'var(--ambg)', color: 'var(--am)', dot: true }
    : { label: 'Redeemed', bg: 'var(--bdl)', color: 'var(--t3)', dot: false };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: 'var(--s)',
        border: `1px solid ${isActive ? 'var(--grbd, var(--bdl))' : 'var(--bdl)'}`,
        borderRadius: 18,
        overflow: 'hidden',
        transform: pressed ? 'scale(0.98)' : hovered ? 'translateY(-2px)' : 'none',
        boxShadow: pressed ? 'none' : hovered
          ? '0 8px 24px -4px rgba(0,0,0,0.12)'
          : isActive ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'transform 0.25s cubic-bezier(.23,1,.32,1), box-shadow 0.25s ease',
        opacity: isRedeemed ? 0.65 : 1,
      }}
    >
      {/* Top accent stripe for active */}
      {isActive && (
        <div style={{ height: 3, background: 'var(--a)', width: '100%' }} />
      )}

      <div style={{ padding: '16px 16px 14px' }}>
        {/* Row 1: store name + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            {/* Store letter */}
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: isActive ? 'var(--bdl)' : 'var(--bdl)',
              border: '1px solid var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: isRedeemed ? 'var(--t3)' : 'var(--a)' }}>
                {(r.partner?.businessName ?? 'S')[0].toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.partner?.businessName ?? 'Store'}
              </p>
              {r.expiryDate && !isRedeemed && (
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                  Expires {formatDate(r.expiryDate)}
                </p>
              )}
              {isRedeemed && (
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Reward used</p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: statusConfig.bg,
            borderRadius: 20, padding: '4px 10px 4px 7px',
            flexShrink: 0,
          }}>
            {statusConfig.dot && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: statusConfig.color,
                display: 'inline-block',
                animation: isActive ? 'pulse-dot 2s ease-in-out infinite' : 'none',
              }} />
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Redemption code (PENDING) */}
        {isPending && r.redemptionCode && (
          <div style={{
            marginTop: 12, padding: '12px 14px',
            background: 'var(--ambg)', borderRadius: 12,
            border: '1px solid rgba(180,83,9,0.15)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--am)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Redemption Code
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--am)', fontFamily: "'JetBrains Mono', monospace" }}>
              {r.redemptionCode}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(180,83,9,0.65)', marginTop: 4 }}>Show this to staff at the store</p>
          </div>
        )}

        {/* Redeem button (ACTIVE) */}
        {isActive && (
          <button
            onClick={() => onRedeem(r.id)}
            disabled={!!redeemingId}
            style={{
              marginTop: 14,
              width: '100%', minHeight: 42, borderRadius: 12, border: 'none',
              background: redeemingId ? 'var(--bdl)' : 'var(--a)',
              color: redeemingId ? 'var(--t3)' : '#fff',
              fontSize: 14, fontWeight: 600, cursor: redeemingId ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.2s, transform 0.1s',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              {redeemingId === r.id ? 'hourglass_empty' : 'redeem'}
            </span>
            {redeemingId === r.id ? 'Redeeming...' : 'Redeem now'}
          </button>
        )}
      </div>
    </div>
  );
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
    customersApi.getMyProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load rewards'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []);

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
  const active = rewards.filter(r => r.status === 'ACTIVE');
  const others = rewards.filter(r => r.status !== 'ACTIVE');

  if (loading) return <div className="max-w-md mx-auto w-full min-w-0"><RewardsSkeleton /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 16 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t)', letterSpacing: '-0.02em', lineHeight: 1 }}>Rewards</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
          Tap Redeem and show the code to staff at the store.
        </p>
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: 'var(--rebg)', border: '1px solid var(--re)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--re)' }}>{error}</p>
        </div>
      )}

      {/* ── Last redeemed code banner ───────────────────────────────── */}
      {lastRedeemedCode && (
        <div style={{
          background: 'var(--grbg)', border: '1.5px solid var(--gr)',
          borderRadius: 16, padding: '16px', marginBottom: 14,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gr)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Show this code to staff
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.28em', color: 'var(--gr)', fontFamily: "'JetBrains Mono', monospace" }}>
            {lastRedeemedCode}
          </p>
          <button onClick={() => setLastRedeemedCode(null)} style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--gr)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {rewards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 18 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--bd)' }}>redeem</span>
          <p style={{ fontWeight: 600, color: 'var(--t)', marginTop: 8 }}>No rewards yet</p>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Keep visiting stores to earn rewards!</p>
        </div>
      )}

      {/* ── Active rewards ──────────────────────────────────────────── */}
      {active.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>
            Available · {active.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {active.map(r => (
              <RewardCard key={r.id} r={r} redeemingId={redeemingId} onRedeem={handleRedeem} />
            ))}
          </div>
        </div>
      )}

      {/* ── Other rewards ───────────────────────────────────────────── */}
      {others.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>
            Past · {others.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {others.map(r => (
              <RewardCard key={r.id} r={r} redeemingId={redeemingId} onRedeem={handleRedeem} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
