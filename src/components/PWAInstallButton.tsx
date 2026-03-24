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
      className="flex items-center gap-1.5 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        padding: '7px 13px',
        fontSize: '12px',
        background: '#FAECE7',
        border: '1px solid #F5C4B3',
        color: '#D85A30',
      }}
      aria-label="Download app"
    >
      <span className="material-symbols-rounded shrink-0" style={{ fontSize: '16px' }}>download</span>
      <span>{clicked ? 'Installing…' : 'Download app'}</span>
    </button>
  );
}
