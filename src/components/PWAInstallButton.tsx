import { useState } from 'react';
import { usePWA } from '../contexts/PWAContext';

export function PWAInstallButton() {
  const pwa = usePWA();
  const [clicked, setClicked] = useState(false);

  if (!pwa || pwa.isStandalone) return null;

  const canInstall = !!pwa.installEvent;

  const handleClick = async () => {
    if (canInstall) {
      setClicked(true);
      await pwa.triggerInstall();
      setClicked(false);
    } else {
      const msg = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent)
        ? 'To install: tap Share (□↑) then "Add to Home Screen".'
        : 'To install: open the browser menu (⋮) and choose "Install app" or "Add to Home Screen".';
      alert(msg);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={clicked}
      className="flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-full text-xs font-medium tracking-wide text-white bg-cyan-500/80 hover:bg-cyan-500 border border-cyan-300 border-t-cyan-200/90 border-b-cyan-400/90 shadow-[0_0_12px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6),0_0_8px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_12px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]"
      style={{ textShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(34,211,238,0.5)' }}
      aria-label="Download app"
    >
      <svg className="w-4 h-4 shrink-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span className="text-center" style={{ textShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(34,211,238,0.5)' }}>{clicked ? 'Installing…' : 'Download app'}</span>
    </button>
  );
}
