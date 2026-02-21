import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'loyalty_pwa_install_dismissed';
const DISMISS_DAYS = 7;

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
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
      if (!wasDismissedRecently()) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

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
    <div className="fixed bottom-20 left-3 right-3 z-10 mx-auto max-w-md animate-fade-in-up" role="dialog" aria-label="Install app">
      <div className="rounded-2xl border border-cyan-400/30 bg-[var(--premium-surface)] px-4 py-3 shadow-lg backdrop-blur-md flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/90 uppercase tracking-wide shrink-0">
          Install Loyalty App
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white/80 transition"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-cyan-400/90 text-black text-xs font-semibold uppercase tracking-wide hover:bg-cyan-300 transition btn-interactive"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
