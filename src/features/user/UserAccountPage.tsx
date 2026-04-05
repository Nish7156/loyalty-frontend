import { useEffect, useRef, useState, useCallback } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken, referralsApi } from '../../lib/api';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { ThemePicker } from '../../components/ThemePicker';
import { useHaptic } from '../../hooks/useHaptic';
import { useNotifications } from '../../contexts/NotificationContext';
import type { CustomerProfile, ReferralEntry } from '../../lib/api';

// ── 3D Profile Card ──────────────────────────────────────────────────────────
function ProfileCard3D({ name, phone }: { name?: string; phone: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const applyTilt = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = ((clientY - rect.top) / rect.height - 0.5) * -14;
    const ry = ((clientX - rect.left) / rect.width - 0.5) * 18;
    const gx = ((clientX - rect.left) / rect.width) * 100;
    const gy = ((clientY - rect.top) / rect.height) * 100;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: rx, y: ry });
      setGlow({ x: gx, y: gy });
    });
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: 0, y: 0 });
      setGlow({ x: 50, y: 50 });
      setHovered(false);
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const firstLetter = (name || phone)[0].toUpperCase();

  return (
    <div
      ref={wrapRef}
      style={{ perspective: '900px', width: '100%' }}
      onMouseMove={(e) => { setHovered(true); applyTilt(e.clientX, e.clientY); }}
      onMouseLeave={reset}
      onTouchStart={() => setHovered(true)}
      onTouchMove={(e) => applyTilt(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={reset}
    >
      <div style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.012 : 1})`,
        transition: hovered ? 'transform 0.08s linear' : 'transform 0.55s cubic-bezier(.23,1,.32,1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        background: `linear-gradient(135deg, var(--a) 0%, color-mix(in srgb, var(--a) 58%, #000) 100%)`,
        boxShadow: hovered
          ? '0 24px 50px -8px rgba(0,0,0,0.36), 0 8px 20px -4px rgba(0,0,0,0.2)'
          : '0 10px 32px -6px rgba(0,0,0,0.22), 0 3px 10px -2px rgba(0,0,0,0.12)',
        padding: '28px 24px 26px',
      }}>
        {/* Shine */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
          opacity: hovered ? 0.16 : 0, transition: 'opacity 0.2s',
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, #fff 0%, transparent 65%)`,
        }} />
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -24, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ position: 'relative', transform: 'translateZ(20px)', transformStyle: 'preserve-3d', textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 28, fontWeight: 800, color: '#fff',
          }}>
            {firstLetter}
          </div>
          {name && (
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {name}
            </p>
          )}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{phone}</p>
        </div>
      </div>
    </div>
  );
}

// ── Share & Earn ─────────────────────────────────────────────────────────────
function ShareAndEarn() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{ pending: number; completed: number; total: number; totalBonus: number } | null>(null);
  const [list, setList] = useState<ReferralEntry[]>([]);
  const [showList, setShowList] = useState(false);
  const [copied, setCopied] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    referralsApi.getMyCode().then(({ code }) => setCode(code)).catch(() => {});
    referralsApi.getMyStats().then(setStats).catch(() => {});
  }, []);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); haptic.light(); setTimeout(() => setCopied(false), 2500); }).catch(() => legacyCopy(text));
    } else legacyCopy(text);
  };

  const legacyCopy = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.select();
    try { document.execCommand('copy'); setCopied(true); haptic.light(); setTimeout(() => setCopied(false), 2500); } catch { /* silent */ }
    document.body.removeChild(el);
  };

  const shareLink = () => {
    if (!code) return;
    const shareUrl = `${window.location.origin}/?ref=${code}`;
    const shareText = `Join me on Loyalty and earn bonus points! Use my referral code ${code} when you sign up: ${shareUrl}`;
    if (navigator.share) {
      haptic.medium();
      navigator.share({ title: 'Join me on Loyalty', text: shareText, url: shareUrl })
        .catch((err) => { if (err?.name !== 'AbortError') copyToClipboard(shareText); });
    } else copyToClipboard(shareText);
  };

  const loadList = () => {
    if (!showList) referralsApi.getMyList().then(setList).catch(() => {});
    setShowList(!showList);
  };

  return (
    <div style={{ background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bdl)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--a)' }}>card_giftcard</span>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t)', lineHeight: 1.2 }}>Share & Earn</p>
          <p style={{ fontSize: 11, color: 'var(--t3)' }}>Invite friends · earn bonus points</p>
        </div>
      </div>

      {/* Code box */}
      {code ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bdl)', border: '1.5px dashed var(--abd)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
          <span style={{ flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--a)', fontFamily: "'JetBrains Mono', monospace" }}>
            {code}
          </span>
          <button
            onClick={() => { if (code) copyToClipboard(code); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '7px 12px', borderRadius: 10, border: 'none',
              background: copied ? 'var(--grbg)' : 'var(--a)',
              color: copied ? 'var(--gr)' : '#fff',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <div style={{ height: 56, borderRadius: 14, background: 'var(--bdl)', marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Invited', value: stats.total, icon: 'group_add' },
            { label: 'Completed', value: stats.completed, icon: 'verified' },
            { label: 'Bonus pts', value: Math.round(stats.totalBonus), icon: 'stars' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px', background: 'var(--bdl)', borderRadius: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--a)' }}>{icon}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--t)' }}>{value}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Share button */}
      <button
        onClick={shareLink}
        disabled={!code}
        style={{
          width: '100%', minHeight: 46, borderRadius: 14, border: 'none',
          background: 'var(--a)', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          opacity: code ? 1 : 0.5, transition: 'opacity 0.2s, transform 0.1s',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>share</span>
        Share my referral link
      </button>

      {stats && stats.total > 0 && (
        <button onClick={loadList} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 500, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {showList ? 'Hide' : 'See'} referrals
          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{showList ? 'expand_less' : 'expand_more'}</span>
        </button>
      )}

      {showList && list.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.slice(0, 5).map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bdl)', borderRadius: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--t3)' }}>person</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--t2)', fontFamily: "'JetBrains Mono', monospace" }}>{r.referredId}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: r.status === 'COMPLETED' ? 'var(--grbg)' : 'var(--bdl)', color: r.status === 'COMPLETED' ? 'var(--gr)' : 'var(--a)' }}>
                {r.status === 'COMPLETED' ? 'Earned' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function UserAccountPage() {
  const haptic = useHaptic();
  const { isSupported, permission, isSubscribed, requestPermission, unsubscribe } = useNotifications();
  const [notifLoading, setNotifLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleNotifToggle = async () => {
    if (!isSupported) return;
    haptic.light();
    setNotifLoading(true);
    try {
      if (isSubscribed) await unsubscribe();
      else await requestPermission();
    } finally { setNotifLoading(false); }
  };

  useEffect(() => {
    if (!getCustomerTokenIfPresent()) return;
    customersApi.getMyProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    haptic.medium();
    setShowLogoutConfirm(false);
    clearCustomerToken();
    window.location.href = '/';
  };

  if (loading) return <div className="max-w-md mx-auto w-full min-w-0"><SkeletonLoader type="profile" count={1} /></div>;

  if (!profile) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--t3)' }}>No profile found</p>
    </div>
  );

  const { customer } = profile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, paddingBottom: 8 }}>

      {/* ── 3D Profile Card ─────────────────────────────────────────── */}
      <ProfileCard3D name={customer.name ?? undefined} phone={customer.phoneNumber} />

      {/* ── Quick actions ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { icon: 'loyalty', label: 'My Cards', to: '/me' },
          { icon: 'account_balance_wallet', label: 'Rewards', to: '/rewards' },
          { icon: 'history', label: 'History', to: '/history' },
        ].map(({ icon, label, to }) => (
          <a
            key={label}
            href={to}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 16,
              padding: '16px 4px 14px', cursor: 'pointer', textDecoration: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bdl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--a)' }}>{icon}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</span>
          </a>
        ))}
      </div>

      {/* ── Share & Earn ────────────────────────────────────────────── */}
      <ShareAndEarn />

      {/* ── Appearance ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bdl)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--a)' }}>palette</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t)' }}>Appearance</p>
        </div>
        <ThemePicker />
      </div>

      {/* ── Settings list ───────────────────────────────────────────── */}
      <div style={{ background: 'var(--s)', border: '1px solid var(--bdl)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* Notifications row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--bdl)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bdl)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--a)' }}>notifications</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t)' }}>Push Notifications</p>
            {permission === 'denied' && <p style={{ fontSize: 11, color: 'var(--re)', marginTop: 1 }}>Blocked — enable in browser settings</p>}
          </div>
          {isSupported && permission !== 'denied' ? (
            <button
              onClick={handleNotifToggle}
              disabled={notifLoading}
              style={{
                position: 'relative', width: 44, height: 26, borderRadius: 13,
                background: isSubscribed ? 'var(--a)' : 'var(--bdl)',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.25s', opacity: notifLoading ? 0.5 : 1,
              }}
            >
              <span style={{
                position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                left: isSubscribed ? 21 : 3,
                transition: 'left 0.25s cubic-bezier(.23,1,.32,1)',
                display: 'block',
              }} />
            </button>
          ) : (
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--bd)' }}>block</span>
          )}
        </div>

        {/* Help */}
        <button
          onClick={() => setShowHelp(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--bdl)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bdl)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--a)' }}>help</span>
          </div>
          <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--t)' }}>Help & Support</p>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--bd)' }}>chevron_right</span>
        </button>

        {/* About */}
        <button
          onClick={() => setShowAbout(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bdl)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--a)' }}>info</span>
          </div>
          <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--t)' }}>About Loyalty</p>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--bd)' }}>chevron_right</span>
        </button>
      </div>

      {/* ── Sign out ────────────────────────────────────────────────── */}
      <button
        onClick={() => { haptic.light(); setShowLogoutConfirm(true); }}
        style={{
          width: '100%', minHeight: 50, borderRadius: 16,
          border: '1.5px solid var(--bd)', background: 'var(--rebg)',
          color: 'var(--re)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Sign out
      </button>

      {/* ── Help & Support bottom sheet ─────────────────────────────── */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowHelp(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} />
          <div
            className="relative w-full"
            style={{
              background: 'var(--s)',
              borderRadius: '24px 24px 0 0',
              borderTop: '1px solid var(--bdl)',
              borderLeft: '1px solid var(--bdl)',
              borderRight: '1px solid var(--bdl)',
              overflow: 'hidden',
              animation: 'sheet-up 0.38s cubic-bezier(.23,1,.32,1)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--bd)' }} />
            </div>

            {/* Header strip */}
            <div style={{
              background: `linear-gradient(135deg, var(--a) 0%, color-mix(in srgb, var(--a) 60%, #000) 100%)`,
              padding: '16px 20px 20px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#fff' }}>support_agent</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Help & Support</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>We're here to help</p>
              </div>
            </div>

            {/* Contact options */}
            <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  icon: 'mail',
                  label: 'Email Us',
                  value: 'webtrigger11@gmail.com',
                  href: 'mailto:webtrigger11@gmail.com',
                },
                {
                  icon: 'language',
                  label: 'Visit Website',
                  value: 'webtriggers.online',
                  href: 'https://webtriggers.online',
                },
                {
                  icon: 'call',
                  label: 'Call Us',
                  value: '+91 97024 22938',
                  href: 'tel:+919702422938',
                },
              ].map(({ icon, label, value, href }) => (
                <a
                  key={icon}
                  href={href}
                  target={icon === 'language' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 14px',
                    background: 'var(--bdl)', border: '1px solid var(--bd)',
                    borderRadius: 14, textDecoration: 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--s)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--a)' }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                  </div>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--bd)', flexShrink: 0 }}>open_in_new</span>
                </a>
              ))}

              <button
                onClick={() => setShowHelp(false)}
                style={{
                  width: '100%', minHeight: 46, borderRadius: 14, border: 'none',
                  background: 'var(--a)', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', marginTop: 4,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── About bottom sheet ──────────────────────────────────────── */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowAbout(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} />
          <div
            className="relative w-full"
            style={{
              background: 'var(--s)',
              borderRadius: '24px 24px 0 0',
              borderTop: '1px solid var(--bdl)',
              borderLeft: '1px solid var(--bdl)',
              borderRight: '1px solid var(--bdl)',
              overflow: 'hidden',
              animation: 'sheet-up 0.38s cubic-bezier(.23,1,.32,1)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--bd)' }} />
            </div>
            {/* Header strip */}
            <div style={{
              background: `linear-gradient(135deg, var(--a) 0%, color-mix(in srgb, var(--a) 60%, #000) 100%)`,
              padding: '16px 20px 20px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#fff' }}>loyalty</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Loyalty</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Version 1.0</p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>
                Loyalty is a smart rewards platform that connects customers with their favourite local stores. Earn points, track streaks, and redeem rewards — all in one place.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: 'qr_code_scanner', text: 'Scan & check in at stores instantly' },
                  { icon: 'generating_tokens', text: 'Earn points on every purchase' },
                  { icon: 'redeem', text: 'Redeem rewards with a simple code' },
                  { icon: 'group_add', text: 'Refer friends and earn bonus points' },
                ].map(({ icon, text }) => (
                  <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bdl)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--a)' }}>{icon}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--t)', fontWeight: 500 }}>{text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAbout(false)}
                style={{
                  width: '100%', minHeight: 46, borderRadius: 14, border: 'none',
                  background: 'var(--a)', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', marginTop: 4,
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout modal ────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} />
          <div
            className="relative rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in"
            style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--t)' }}>Log out?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--t2)' }}>You'll need to sign in again to access your loyalty cards.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[52px] rounded-xl font-medium"
                style={{ border: '1.5px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 min-h-[52px] rounded-xl text-white font-semibold"
                style={{ background: 'var(--re)' }}
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
