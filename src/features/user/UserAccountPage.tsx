import { useEffect, useState } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken } from '../../lib/api';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { ThemePicker } from '../../components/ThemePicker';
import { useHaptic } from '../../hooks/useHaptic';
import type { CustomerProfile } from '../../lib/api';

export function UserAccountPage() {
  const haptic = useHaptic();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        <button
          className="w-full flex items-center gap-3 text-left transition-colors"
          style={{ padding: '14px 18px', color: 'var(--t2)', borderBottom: '1px solid var(--bdl)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--t3)' }}>notifications</span>
          <span className="text-[13px] font-medium">Notifications</span>
          <span className="material-symbols-rounded ml-auto" style={{ fontSize: '18px', color: 'var(--bdl)' }}>chevron_right</span>
        </button>
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
          <span className="text-[13px] font-medium">About loyale.</span>
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
