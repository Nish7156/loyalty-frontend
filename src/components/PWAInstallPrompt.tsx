import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'loyalty_pwa_install_dismissed';
const DELAY_MS = 45 * 1000;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {}
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
      || document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    if (isStandalone || wasDismissed() || !installEvent) return;
    const t = setTimeout(() => setShowBanner(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [installEvent, isStandalone]);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed();
  };

  if (isStandalone || !showBanner || !installEvent) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Install app">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={handleDismiss} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--premium-surface)] p-6 shadow-xl animate-scale-in">
        <div className="flex flex-col items-center text-center gap-4">
          <img src="/icon-192.png" alt="" className="h-16 w-16 rounded-2xl object-contain" />
          <div>
            <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Install Loyalty</h3>
            <p className="text-white/60 text-sm mt-1">Add to your home screen for a better experience.</p>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 min-h-[44px] rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition btn-interactive"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 min-h-[44px] rounded-xl bg-cyan-400/90 text-black text-sm font-semibold uppercase tracking-wide hover:bg-cyan-300 transition btn-interactive"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
