import { useEffect, useState } from 'react';
import { customersApi, getCustomerTokenIfPresent, clearCustomerToken } from '../../lib/api';
import { SkeletonLoader } from '../../components/SkeletonLoader';
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
        <p className="user-text-muted text-center">No profile found</p>
      </div>
    );
  }

  const { customer } = profile;
  const firstLetter = (customer.name || customer.phoneNumber)[0].toUpperCase();

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent opacity-0 animate-fade-in-up">
        My Account
      </h1>

      {/* Profile Card */}
      <div className="glass-card rounded-2xl p-6 shadow-premium-md opacity-0 animate-slide-in-up">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {firstLetter}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          {customer.name && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-lg font-semibold user-text">{customer.name}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
            <p className="text-lg font-semibold user-text">{customer.phoneNumber}</p>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => { haptic.light(); setShowLogoutConfirm(true); }}
              className="w-full min-h-[48px] px-6 rounded-xl border text-sm font-medium transition-colors touch-manipulation"
              style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} />
          <div
            className="relative glass-card rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold user-text mb-2">Log out?</h2>
            <p className="user-text-muted text-sm mb-6">You'll need to sign in again to access your loyalty cards.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[44px] rounded-xl border font-medium"
                style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600"
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
