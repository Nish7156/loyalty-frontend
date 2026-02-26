import { useState, useEffect } from 'react';
import { usePWA } from '../contexts/PWAContext';

const DELAY_MS = 40 * 1000;  // 40s
const MAX_SHOW_COUNT = 2;

const COPY = {
  default: { title: 'Install Loyalty', subtitle: 'Add to your home screen for a better experience.' },
  login: { title: 'Install Loyalty', subtitle: 'Add to home screen for quick login (owners & staff).' },
} as const;

export function PWAInstallPrompt({ variant = 'default' }: { variant?: 'default' | 'login' } = {}) {
  const pwa = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [showCount, setShowCount] = useState(0);

  useEffect(() => {
    if (!pwa || pwa.isStandalone || !pwa.installEvent || showBanner || showCount >= MAX_SHOW_COUNT) return;
    const t = setTimeout(() => {
      setShowBanner(true);
      setShowCount((c) => c + 1);
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [pwa?.installEvent, pwa?.isStandalone, showBanner, showCount]);

  const handleInstall = async () => {
    if (!pwa) return;
    const outcome = await pwa.triggerInstall();
    if (outcome === 'accepted') setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!pwa || pwa.isStandalone || !showBanner || !pwa.installEvent) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Install app">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} aria-hidden="true" onClick={handleDismiss} />
      <div className="relative w-full max-w-sm rounded-2xl border p-4 sm:p-6 shadow-xl animate-scale-in min-w-0 safe-area-x" style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-surface)' }}>
        <div className="flex flex-col items-center text-center gap-4">
          <img src="/icon-192.png" alt="" className="h-16 w-16 rounded-2xl object-contain" />
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wide" style={{ color: 'var(--user-text)' }}>{COPY[variant].title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--user-text-muted)' }}>{COPY[variant].subtitle}</p>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="hover-user-bg flex-1 min-h-[44px] rounded-xl border text-sm font-medium transition btn-interactive"
              style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 min-h-[44px] rounded-xl bg-cyan-500 text-white text-sm font-semibold uppercase tracking-wide hover:bg-cyan-400 transition btn-interactive"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
