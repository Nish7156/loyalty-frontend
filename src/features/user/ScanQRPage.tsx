import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

function extractBranchId(value: string): string {
  let branchId = value.trim();
  try {
    const url = new URL(branchId);
    const parts = url.pathname.split('/');
    const scanIdx = parts.indexOf('scan');
    if (scanIdx !== -1 && parts[scanIdx + 1]) {
      branchId = parts[scanIdx + 1];
    }
  } catch {
    // Not a URL, use as-is
  }
  return branchId;
}

export function ScanQRPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    } catch { /* ignore */ }
    scannerRef.current = null;
  };

  const startCamera = async () => {
    setError('');
    scannedRef.current = false;
    try {
      const scanner = new Html5Qrcode('qr-scanner');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (text) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          const id = extractBranchId(text);
          if (id) {
            stopCamera();
            navigate(`/scan/${id}`, { replace: true });
          }
        },
        () => {},
      );
    } catch {
      if (mountedRef.current) setError('Could not access camera. Allow camera permission or enter store code below.');
    }
  };

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractBranchId(manualCode);
    if (id) navigate(`/scan/${id}`);
  };

  return (
    <div className="max-w-md mx-auto w-full min-w-0 pb-8" style={{ paddingTop: '20px' }}>
      <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>Scan QR Code</h1>
      <p className="text-sm mb-4" style={{ color: 'var(--t2)' }}>Point your camera at a store's QR code</p>

      {/* Camera viewfinder */}
      <div className="rounded-2xl overflow-hidden relative mb-4" style={{ background: '#000', minHeight: '300px' }}>
        <div id="qr-scanner" style={{ width: '100%' }} />
      </div>

      {error && (
        <div className="rounded-xl p-3 mb-4 text-center" style={{ background: 'var(--rebg)', border: '1px solid rgba(176,58,42,0.18)' }}>
          <p className="text-xs" style={{ color: 'var(--re)' }}>{error}</p>
        </div>
      )}

      {/* Manual fallback */}
      <div className="rounded-xl p-4" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
        <p className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--t3)' }}>Or enter store code manually</p>
        <form onSubmit={handleManual} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Store ID or URL"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ border: '1px solid var(--bd)', background: 'var(--bg)', color: 'var(--t)' }}
          />
          <button type="submit" disabled={!manualCode.trim()} className="px-4 py-2.5 font-semibold text-sm rounded-xl disabled:opacity-50" style={{ background: 'var(--a)', color: 'var(--s)' }}>
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
