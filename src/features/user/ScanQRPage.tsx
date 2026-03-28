import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const mountedRef = useRef(true);

  const stopCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    } catch { /* ignore */ }
    try {
      scannerRef.current?.clear();
    } catch { /* ignore */ }
    scannerRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    setError('');
    scannedRef.current = false;

    // Wait for DOM element to be ready
    await new Promise((r) => setTimeout(r, 100));
    const el = document.getElementById('qr-scanner');
    if (!el || !mountedRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-scanner', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      // Try to get available cameras first
      let cameraId: string | { facingMode: string } = { facingMode: 'environment' };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length > 0) {
          // Prefer back camera
          const back = cameras.find(
            (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment'),
          );
          cameraId = back?.id || cameras[cameras.length - 1].id;
        }
      } catch {
        // getCameras failed, fall back to facingMode
      }

      // Calculate qrbox based on screen size
      const containerWidth = el.clientWidth || window.innerWidth - 24;
      const qrSize = Math.min(250, Math.floor(containerWidth * 0.7));

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: qrSize, height: qrSize },
          disableFlip: false,
        },
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

      if (mountedRef.current) setCameraActive(true);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser/phone settings and reload.');
      } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
        setError('No camera found on this device.');
      } else if (msg.includes('NotReadableError') || msg.includes('in use')) {
        setError('Camera is in use by another app. Close other apps and try again.');
      } else {
        setError('Could not start camera. Try reloading the page or use the manual entry below.');
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

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
      <div
        className="rounded-2xl overflow-hidden relative mb-4"
        style={{ background: '#000', minHeight: cameraActive ? 'auto' : '280px' }}
      >
        <div id="qr-scanner" style={{ width: '100%', minHeight: '280px' }} />
        {!cameraActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '28px', color: '#fff' }}>photo_camera</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Starting camera...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--rebg)', border: '1px solid rgba(176,58,42,0.18)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--re)' }}>{error}</p>
          <button
            type="button"
            onClick={() => { setError(''); startCamera(); }}
            className="w-full mt-3 min-h-[40px] rounded-xl text-sm font-semibold"
            style={{ background: 'var(--a)', color: 'var(--s)' }}
          >
            Try Again
          </button>
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
