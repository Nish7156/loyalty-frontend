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
        <p className="text-center text-sm" style={{ color: '#A08880' }}>No profile found</p>
      </div>
    );
  }

  const { customer } = profile;
  const firstLetter = (customer.name || customer.phoneNumber)[0].toUpperCase();

  return (
    <div className="max-w-md mx-auto space-y-6 sm:space-y-8 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight opacity-0 animate-fade-in-up" style={{ color: '#D85A30' }}>
        My Account
      </h1>

      {/* Profile Card */}
      <div className="rounded-2xl p-6 opacity-0 animate-slide-in-up" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
            {firstLetter}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          {customer.name && (
            <div className="text-center">
              <p className="text-sm" style={{ color: '#A08880' }}>Name</p>
              <p className="text-lg font-semibold" style={{ color: '#5D4037' }}>{customer.name}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm" style={{ color: '#A08880' }}>Phone Number</p>
            <p className="text-lg font-semibold" style={{ color: '#5D4037' }}>{customer.phoneNumber}</p>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => { haptic.light(); setShowLogoutConfirm(true); }}
              className="w-full min-h-[48px] px-6 rounded-xl text-sm font-medium transition-colors touch-manipulation"
              style={{ border: '1px solid #F5C4B3', color: '#5D4037', background: '#FAF9F6' }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(93,64,55,0.3)' }} />
          <div
            className="relative rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in"
            style={{ background: '#FFF', border: '1px solid #FAECE7' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#5D4037' }}>Log out?</h2>
            <p className="text-sm mb-6" style={{ color: '#7B5E54' }}>You'll need to sign in again to access your loyalty cards.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[44px] rounded-xl font-medium"
                style={{ border: '1px solid #F5C4B3', color: '#5D4037', background: '#FFF' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 min-h-[44px] rounded-xl text-white font-semibold"
                style={{ background: '#B03A2A' }}
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
