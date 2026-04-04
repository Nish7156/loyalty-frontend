import { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const DISMISSED_KEY = 'notif_banner_dismissed';

export function NotificationPermissionBanner() {
  const { isSupported, permission, isSubscribed, requestPermission } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      !isSupported ||
      permission === 'denied' ||
      permission === 'granted' ||
      isSubscribed
    ) {
      setVisible(false);
      return;
    }

    // Show banner after 3s, unless previously dismissed
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [isSupported, permission, isSubscribed]);

  if (!visible) return null;

  const handleEnable = async () => {
    setLoading(true);
    const granted = await requestPermission();
    setLoading(false);
    if (granted) setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 animate-slide-in-up"
      style={{ maxWidth: '480px', margin: '0 auto' }}
    >
      <div
        className="glass-card rounded-2xl p-4 flex items-start gap-3"
        style={{
          background: 'var(--s)',
          border: '1.5px solid var(--abd)',
          boxShadow: '0 8px 32px rgba(216,90,48,0.12)',
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            background: 'var(--abg)',
            border: '1px solid var(--abd)',
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 22, color: 'var(--a)' }}
          >
            notifications
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm leading-snug"
            style={{ color: 'var(--t)' }}
          >
            Stay in the loop
          </p>
          <p
            className="text-xs mt-0.5 leading-relaxed"
            style={{ color: 'var(--t3)' }}
          >
            Get notified when your check-in is approved, rewards are earned, or rewards are about to expire.
          </p>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="btn-premium text-xs px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-60"
              style={{ minWidth: 110 }}
            >
              {loading ? (
                <>
                  <span
                    className="material-symbols-rounded animate-spin"
                    style={{ fontSize: 14 }}
                  >
                    progress_activity
                  </span>
                  Enabling…
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 14 }}
                  >
                    notifications_active
                  </span>
                  Enable
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ color: 'var(--t3)', background: 'var(--s2)' }}
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg"
          style={{ color: 'var(--t3)' }}
          aria-label="Dismiss"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
            close
          </span>
        </button>
      </div>
    </div>
  );
}
