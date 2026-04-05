import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi, customersApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { WalletBalance, CustomerProfile, StoreVisit } from '../../lib/api';


function formatPoints(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}

// ── 3D Flip Wallet Card ──────────────────────────────────────────────────────
function WalletCard3D({
  totalPoints,
  platformWallet,
  onRedeem,
}: {
  totalPoints: number;
  platformWallet?: { balance: number; lifetimeEarned: number };
  onRedeem: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const applyTilt = useCallback((clientX: number, clientY: number) => {
    if (flipped) return; // no tilt on back face
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = ((clientY - rect.top) / rect.height - 0.5) * -16;
    const ry = ((clientX - rect.left) / rect.width - 0.5) * 20;
    const gx = ((clientX - rect.left) / rect.width) * 100;
    const gy = ((clientY - rect.top) / rect.height) * 100;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: rx, y: ry });
      setGlow({ x: gx, y: gy });
    });
  }, [flipped]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: 0, y: 0 });
      setGlow({ x: 50, y: 50 });
      setHovered(false);
    });
  }, []);

  const handleFlip = () => {
    reset();
    setFlipped(f => !f);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const cardH = 150;
  const tiltTransform = flipped
    ? `rotateX(0deg) rotateY(180deg)`
    : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.012 : 1})`;

  return (
    <div
      ref={wrapRef}
      style={{ perspective: '900px', width: '100%', height: cardH }}
      onMouseMove={(e) => { setHovered(true); applyTilt(e.clientX, e.clientY); }}
      onMouseLeave={reset}
      onTouchStart={() => setHovered(true)}
      onTouchMove={(e) => { applyTilt(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={reset}
    >
      {/* Flip container */}
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: tiltTransform,
        transition: flipped
          ? 'transform 0.55s cubic-bezier(.23,1,.32,1)'
          : hovered ? 'transform 0.08s linear' : 'transform 0.55s cubic-bezier(.23,1,.32,1)',
        willChange: 'transform',
      }}>

        {/* ── FRONT: Shop coins ── */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
          backfaceVisibility: 'hidden',
          background: `linear-gradient(135deg, var(--a) 0%, color-mix(in srgb, var(--a) 58%, #000) 100%)`,
          boxShadow: hovered && !flipped
            ? '0 24px 50px -8px rgba(0,0,0,0.36), 0 8px 20px -4px rgba(0,0,0,0.2)'
            : '0 10px 32px -6px rgba(0,0,0,0.22), 0 3px 10px -2px rgba(0,0,0,0.12)',
          padding: '24px 22px 22px',
        }}>
          {/* Shine */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
            opacity: hovered && !flipped ? 0.18 : 0, transition: 'opacity 0.2s',
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, #fff 0%, transparent 65%)`,
          }} />
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -24, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
              Total Coins
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {formatPoints(totalPoints)}
                </span>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>coins</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onRedeem(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 50, padding: '8px 16px', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>redeem</span>
                  Redeem
                </button>
                {platformWallet !== undefined && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'rgba(255,255,255,0.12)', border: 'none',
                      borderRadius: 50, padding: '5px 12px', color: 'rgba(255,255,255,0.75)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>stars</span>
                    {formatPoints(platformWallet.balance)} credits
                    <span className="material-symbols-rounded" style={{ fontSize: 13 }}>flip</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK: Platform credits ── */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: `linear-gradient(135deg, color-mix(in srgb, var(--a) 80%, #000) 0%, color-mix(in srgb, var(--a) 45%, #000) 100%)`,
          boxShadow: '0 10px 32px -6px rgba(0,0,0,0.22)',
          padding: '24px 22px 22px',
        }}>
          <div style={{ position: 'absolute', top: -30, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: -24, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>stars</span>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
                Platform Credits
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {formatPoints(platformWallet?.balance ?? 0)}
                  </span>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>coins</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {formatPoints(platformWallet?.lifetimeEarned ?? 0)} earned from referrals
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: 50, padding: '8px 14px', color: 'rgba(255,255,255,0.8)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>flip</span>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Animated flat store card ────────────────────────────────────────────────
function StoreCard({
  store,
  wallet,
  idx,
  onClick,
}: {
  store: StoreVisit;
  wallet?: WalletBalance;
  idx: number;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const [countVal, setCountVal] = useState(0);

  const loyaltyType = store.loyaltyType || 'VISITS';
  const threshold = store.rewardThreshold ?? 5;
  const current = store.streakCurrentCount ?? 0;
  const balance = wallet?.balance ?? 0;
  const isPoints = loyaltyType === 'POINTS' || loyaltyType === 'HYBRID';

  // For POINTS/HYBRID: progress towards next reward uses pointsToRewardRatio
  // (how many coins = 1 reward), NOT minimumRedemptionPoints
  const pointsTarget = store.pointsToRewardRatio ?? store.minimumRedemptionPoints ?? 100;
  const pointsInCycle = balance % pointsTarget; // coins earned towards next reward
  const progress = isPoints
    ? Math.min(100, pointsTarget > 0 ? (pointsInCycle / pointsTarget) * 100 : 0)
    : Math.min(100, threshold > 0 ? (current / threshold) * 100 : 0);
  const pct = Math.round(progress);
  const targetNum = isPoints ? Math.round(balance) : current;
  const subLabel = isPoints
    ? `${Math.round(pointsInCycle)} / ${pointsTarget} coins`
    : `${current} / ${threshold} visits`;

  // Staggered entrance: progress bar + count-up
  useEffect(() => {
    const delay = 120 + idx * 80;
    const t = setTimeout(() => {
      setBarWidth(pct);
      // Count up
      const duration = 700;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - p, 3);
        setCountVal(Math.round(eased * targetNum));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [pct, targetNum, idx]);

  const mainValue = isPoints ? formatPoints(countVal) : `${countVal}`;

  // Type label + accent color
  const typeLabel = loyaltyType === 'POINTS' ? 'Points' : loyaltyType === 'HYBRID' ? 'Hybrid' : 'Streak';
  const pipCount = Math.min(threshold, 10); // max 10 pips shown

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: 'var(--s)',
        border: `1px solid ${hovered ? 'var(--a)' : 'var(--bdl)'}`,
        borderRadius: 18,
        padding: '16px 16px 14px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        transform: pressed ? 'scale(0.972)' : hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: pressed
          ? 'none'
          : hovered
          ? '0 8px 24px -4px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.08)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: pressed
          ? 'transform 0.08s ease, box-shadow 0.08s ease, border-color 0.15s ease'
          : 'transform 0.32s cubic-bezier(.23,1,.32,1), box-shadow 0.32s ease, border-color 0.2s ease',
      }}
    >
      {/* Row 1: icon + name + type label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'var(--bdl)', border: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'transform 0.2s',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--a)' }}>
            {(store.partnerName ?? store.branchName ?? '?').charAt(0).toUpperCase()}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 1 }}>
            {store.partnerName}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {store.branchName}
          </p>
        </div>

        {/* Type chip */}
        <div style={{
          background: 'var(--bdl)', border: '1px solid var(--bd)',
          borderRadius: 20, padding: '4px 10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--a)' }}>{typeLabel}</span>
        </div>
      </div>

      {/* Row 2: big number + last visit */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 }}>
        <div>
          <p style={{
            fontSize: 38, fontWeight: 800, color: 'var(--t)',
            letterSpacing: '-0.04em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {mainValue}
          </p>
          <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{subLabel}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--t3)' }}>Last: {formatDate(store.lastVisitAt)}</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--a)', marginTop: 2 }}>{pct}%</p>
        </div>
      </div>

      {/* Streak pips for VISITS / HYBRID */}
      {!isPoints && pipCount > 0 && (
        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
          {Array.from({ length: pipCount }).map((_, i) => {
            const filled = i < current;
            return (
              <div
                key={i}
                style={{
                  width: filled ? 10 : 8,
                  height: filled ? 10 : 8,
                  borderRadius: '50%',
                  background: filled ? 'var(--a)' : 'transparent',
                  border: filled ? 'none' : '1.5px solid var(--bd)',
                  boxShadow: filled ? '0 0 6px var(--abd)' : 'none',
                  transition: 'all 0.3s ease',
                  animation: filled ? `pip-pop 0.45s cubic-bezier(.34,1.56,.64,1) ${i * 60}ms both` : 'none',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Floating particles for POINTS */}
      {isPoints && (
        <div style={{ position: 'relative', height: 18, marginTop: 8, overflow: 'hidden' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                left: `${10 + i * 18}%`,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--a)',
                opacity: 0,
                animation: `particle-rise 2.4s ease-in-out ${i * 0.38}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        marginTop: isPoints ? 2 : 10, height: 5, borderRadius: 99,
        background: 'var(--bdl)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${barWidth}%`, height: '100%', borderRadius: 99,
          background: 'var(--a)',
          transition: 'width 0.9s cubic-bezier(.23,1,.32,1)',
          position: 'relative',
        }}>
          {barWidth > 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
              animation: 'bar-shimmer 1.8s ease 0.6s 1',
              borderRadius: 99,
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function UserWalletPage() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    Promise.all([walletApi.getAllBalances(), customersApi.getMyProfile()])
      .then(([walletData, profileData]) => {
        setWallets(walletData);
        setProfile(profileData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load'));
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setError('');
    fetchData();
    setLoading(false);
  }, [fetchData]);

  // Real-time refresh when staff approves/rejects a check-in
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('loyalty_checkin_updated', handler);
    return () => window.removeEventListener('loyalty_checkin_updated', handler);
  }, [fetchData]);

  if (loading) {
    return <div className="max-w-md mx-auto w-full min-w-0"><HistorySkeleton /></div>;
  }

  if (error) {
    return (
      <div style={{ padding: '24px 0' }}>
        <div className="glass-card rounded-2xl p-5">
          <p style={{ fontSize: 14, color: 'var(--re)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const totalPoints = wallets.reduce((sum, w) => sum + w.balance, 0);
  const platformWallet = profile?.platformWallet;
  const stores = profile?.storesVisited ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 16 }}>

      {/* ── 3D Flip Wallet Card ────────────────────────────────────── */}
      <WalletCard3D
        totalPoints={totalPoints}
        platformWallet={platformWallet}
        onRedeem={() => navigate('/rewards')}
      />

      {/* ── Quick actions ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {[
          { icon: 'qr_code_scanner', label: 'Scan QR', to: '/scan' },
          { icon: 'account_balance_wallet', label: 'Wallet', to: '/rewards' },
          { icon: 'history', label: 'History', to: '/history' },
        ].map(({ icon, label, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'var(--s)',
              border: '1px solid var(--bdl)',
              borderRadius: 16,
              padding: '16px 4px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--bdl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--a)' }}>{icon}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Section header ─────────────────────────────────────────── */}
      <div style={{
        padding: '20px 0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)',
        }}>
          My Loyalty Cards
        </p>
        {stores.length > 0 && (
          <button
            onClick={() => navigate('/loyalty-cards')}
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: 13, fontWeight: 600, color: 'var(--a)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            See all
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
          </button>
        )}
      </div>

      {/* ── Flat store cards (recent 5) ─────────────────────────────── */}
      {stores.length === 0 ? (
        <div className="glass-card rounded-2xl" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--bd)' }}>storefront</span>
          <p style={{ fontWeight: 600, color: 'var(--t)', marginTop: 8 }}>No Stores Yet</p>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>
            Scan a QR code at a store to check in and start earning!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          {stores.slice(0, 5).map((store, idx) => {
            const wallet = wallets.find(w => w.partnerId === store.partnerId);
            return (
              <StoreCard
                key={`${store.partnerId}-${store.branchId}`}
                store={store}
                wallet={wallet}
                idx={idx}
                onClick={() =>
                  navigate(`/me/store/${store.branchId}`, { state: { store, wallet: wallet ?? null } })
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── All Cards Page (/loyalty-cards) ─────────────────────────────────────────
export function AllCardsPage() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([walletApi.getAllBalances(), customersApi.getMyProfile()])
      .then(([walletData, profileData]) => { setWallets(walletData); setProfile(profileData); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load'))
      .finally(() => setLoading(false));
  }, []);

  const stores = profile?.storesVisited ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => navigate('/me')}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bdl)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--t)' }}>arrow_back</span>
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t)', letterSpacing: '-0.02em', lineHeight: 1 }}>All Cards</h1>
          {stores.length > 0 && <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{stores.length} stores</p>}
        </div>
      </div>

      {loading && <HistorySkeleton />}

      {error && (
        <div style={{ background: 'var(--rebg)', border: '1px solid var(--re)', borderRadius: 14, padding: '12px 14px' }}>
          <p style={{ fontSize: 13, color: 'var(--re)' }}>{error}</p>
        </div>
      )}

      {!loading && stores.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 18 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--bd)' }}>storefront</span>
          <p style={{ fontWeight: 600, color: 'var(--t)', marginTop: 8 }}>No Stores Yet</p>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Scan a QR code at a store to start earning!</p>
        </div>
      )}

      {!loading && stores.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          {stores.map((store, idx) => {
            const wallet = wallets.find(w => w.partnerId === store.partnerId);
            return (
              <StoreCard
                key={`${store.partnerId}-${store.branchId}`}
                store={store}
                wallet={wallet}
                idx={idx}
                onClick={() => navigate(`/me/store/${store.branchId}`, { state: { store, wallet: wallet ?? null } })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
