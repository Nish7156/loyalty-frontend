import { useEffect, useState } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken, referralsApi } from '../../lib/api';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { ThemePicker } from '../../components/ThemePicker';
import { useHaptic } from '../../hooks/useHaptic';
import { useNotifications } from '../../contexts/NotificationContext';
import type { CustomerProfile, ReferralEntry } from '../../lib/api';

// ─── Share & Earn card ────────────────────────────────────────────────────────
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

  const shareLink = () => {
    if (!code) return;
    const shareUrl = `${window.location.origin}/?ref=${code}`;
    const shareText = `Join me on Loyalty and earn bonus points! Use my referral code ${code} when you sign up: ${shareUrl}`;

    if (navigator.share) {
      haptic.medium();
      navigator.share({ title: 'Join me on Loyalty', text: shareText, url: shareUrl })
        .catch((err) => {
          // User cancelled or share failed — fall back to clipboard
          if (err?.name !== 'AbortError') copyToClipboard(shareText);
        });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        haptic.light();
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        // Clipboard API blocked — use execCommand fallback
        legacyCopy(text);
      });
    } else {
      legacyCopy(text);
    }
  };

  const legacyCopy = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); setCopied(true); haptic.light(); setTimeout(() => setCopied(false), 2500); } catch { /* silent */ }
    document.body.removeChild(el);
  };

  const copyCode = () => {
    if (!code) return;
    copyToClipboard(code);
  };

  const loadList = () => {
    if (!showList) {
      referralsApi.getMyList().then(setList).catch(() => {});
    }
    setShowList(!showList);
  };

  return (
    <div
      className="rounded-2xl p-5 overflow-hidden"
      style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--abg)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--a)' }}>card_giftcard</span>
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight" style={{ color: 'var(--t)' }}>Share & Earn</h2>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>Invite friends · earn bonus points</p>
        </div>
      </div>

      {/* Referral code */}
      {code ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-3"
          style={{ background: 'var(--abg)', border: '1.5px dashed var(--abd)' }}
        >
          <span
            className="flex-1 text-2xl font-bold tracking-[0.18em] select-all"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--a)' }}
          >
            {code}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: copied ? 'var(--grbg)' : 'var(--a)', color: copied ? 'var(--gr)' : '#fff' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <div className="h-14 rounded-2xl animate-pulse mb-3" style={{ background: 'var(--bdl)' }} />
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Invited', value: stats.total, icon: 'group_add' },
            { label: 'Completed', value: stats.completed, icon: 'verified' },
            { label: 'Bonus pts', value: Math.round(stats.totalBonus), icon: 'stars' },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl"
              style={{ background: 'var(--bg)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--a)' }}>{icon}</span>
              <span className="text-base font-bold" style={{ color: 'var(--t)' }}>{value}</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--t3)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Share button */}
      <button
        type="button"
        onClick={shareLink}
        disabled={!code}
        className="w-full min-h-[46px] rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--a)', color: '#fff', boxShadow: '0 4px 14px rgba(216,90,48,0.25)' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>share</span>
        Share my referral link
      </button>

      {/* Referral list toggle */}
      {stats && stats.total > 0 && (
        <button
          type="button"
          onClick={loadList}
          className="w-full flex items-center justify-center gap-1.5 mt-3 text-xs font-medium py-1"
          style={{ color: 'var(--t3)' }}
        >
          <span>{showList ? 'Hide' : 'See'} referrals</span>
          <span className="material-symbols-rounded" style={{ fontSize: 15 }}>
            {showList ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      )}

      {/* Referral list */}
      {showList && list.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {list.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--bg)' }}
            >
              <span className="material-symbols-rounded text-sm" style={{ fontSize: 16, color: 'var(--t3)' }}>person</span>
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--t2)', fontFamily: "'JetBrains Mono', monospace" }}>
                {r.referredId}
              </span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: r.status === 'COMPLETED' ? 'var(--grbg)' : 'var(--abg)',
                  color: r.status === 'COMPLETED' ? 'var(--gr)' : 'var(--a)',
                }}
              >
                {r.status === 'COMPLETED' ? 'Earned' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserAccountPage() {
  const haptic = useHaptic();
  const { isSupported, permission, isSubscribed, requestPermission, unsubscribe } = useNotifications();
  const [notifLoading, setNotifLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNotifToggle = async () => {
    if (!isSupported) return;
    haptic.light();
    setNotifLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await requestPermission();
      }
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (!getCustomerTokenIfPresent()) return;
    customersApi
      .getMyProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    haptic.medium();
    setShowLogoutConfirm(false);
    clearCustomerToken();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <SkeletonLoader type="profile" count={1} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <p className="text-center text-sm" style={{ color: 'var(--t3)' }}>No profile found</p>
      </div>
    );
  }

  const { customer } = profile;
  const firstLetter = (customer.name || customer.phoneNumber)[0].toUpperCase();

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0" style={{ paddingTop: '20px' }}>
      <h1 className="text-[22px] font-bold tracking-tight a1" style={{ color: 'var(--a)', letterSpacing: '-0.02em' }}>
        My Account
      </h1>

      {/* Profile Card */}
      <div className="rounded-2xl p-6 a2" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        {/* Avatar */}
        <div className="flex justify-center mb-5">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: 'var(--a)', border: '2.5px solid var(--abd)' }}
          >
            {firstLetter}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 text-center">
          {customer.name && (
            <div>
              <p className="text-xs" style={{ color: 'var(--t3)' }}>Name</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--t)' }}>{customer.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs" style={{ color: 'var(--t3)' }}>Phone Number</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--t)' }}>{customer.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Share & Earn */}
      <ShareAndEarn />

      {/* Appearance / Theme Picker */}
      <div className="rounded-2xl p-5 a3" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--a)' }}>palette</span>
          <h2 className="text-base font-semibold" style={{ color: 'var(--t)' }}>Appearance</h2>
        </div>
        <ThemePicker />
      </div>

      {/* Account Actions */}
      <div className="rounded-2xl overflow-hidden a4" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
        {/* Menu items */}
        <button
          className="w-full flex items-center gap-3 text-left transition-colors"
          style={{ padding: '14px 18px', color: 'var(--t2)', borderBottom: '1px solid var(--bdl)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--t3)' }}>edit</span>
          <span className="text-[13px] font-medium">Edit Profile</span>
          <span className="material-symbols-rounded ml-auto" style={{ fontSize: '18px', color: 'var(--bdl)' }}>chevron_right</span>
        </button>
        <div
          className="w-full flex items-center gap-3"
          style={{ padding: '12px 18px', borderBottom: '1px solid var(--bdl)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--t3)' }}>notifications</span>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-medium" style={{ color: 'var(--t2)' }}>Push Notifications</span>
            {permission === 'denied' && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--re)' }}>Blocked in browser — enable in Settings</p>
            )}
          </div>
          {isSupported && permission !== 'denied' ? (
            <button
              type="button"
              onClick={handleNotifToggle}
              disabled={notifLoading}
              aria-label={isSubscribed ? 'Turn off notifications' : 'Turn on notifications'}
              className="relative shrink-0 transition-all disabled:opacity-50"
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: isSubscribed ? 'var(--a)' : 'var(--bdl)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                className="absolute top-[3px] transition-all"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  left: isSubscribed ? 21 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  display: 'block',
                }}
              />
            </button>
          ) : (
            <span className="material-symbols-rounded shrink-0" style={{ fontSize: '18px', color: 'var(--bdl)' }}>
              block
            </span>
          )}
        </div>
        <button
          className="w-full flex items-center gap-3 text-left transition-colors"
          style={{ padding: '14px 18px', color: 'var(--t2)', borderBottom: '1px solid var(--bdl)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--t3)' }}>help</span>
          <span className="text-[13px] font-medium">Help & Support</span>
          <span className="material-symbols-rounded ml-auto" style={{ fontSize: '18px', color: 'var(--bdl)' }}>chevron_right</span>
        </button>
        <button
          className="w-full flex items-center gap-3 text-left transition-colors"
          style={{ padding: '14px 18px', color: 'var(--t2)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--t3)' }}>info</span>
          <span className="text-[13px] font-medium">About Loyalty</span>
          <span className="material-symbols-rounded ml-auto" style={{ fontSize: '18px', color: 'var(--bdl)' }}>chevron_right</span>
        </button>
      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={() => { haptic.light(); setShowLogoutConfirm(true); }}
        className="w-full min-h-[52px] rounded-xl text-sm font-semibold transition a5"
        style={{ border: '1.5px solid var(--bd)', color: 'var(--re)', background: 'var(--rebg)' }}
      >
        Sign out
      </button>

      {/* Logout Modal */}
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
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[52px] rounded-xl font-medium"
                style={{ border: '1.5px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }}
              >
                Cancel
              </button>
              <button
                type="button"
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
