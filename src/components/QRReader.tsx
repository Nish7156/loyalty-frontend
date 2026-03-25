import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRReaderProps {
  onScan: (value: string) => void;
  placeholder?: string;
}

export function QRReader({ onScan, placeholder = 'Scan QR code' }: QRReaderProps) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannedRef = useRef(false);

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch { /* ignore */ }
    scannerRef.current = null;
    setScanning(false);
  };

  const startScanner = async () => {
    setCameraError('');
    scannedRef.current = false;

    try {
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          onScan(decodedText);
          stopScanner();
        },
        () => { /* ignore scan failures */ },
      );
    } catch (err) {
      setScanning(false);
      if (err instanceof Error && err.message.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access.');
      } else {
        setCameraError('Could not access camera. You can enter the store code manually below.');
      }
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = manualCode.trim();
    if (v) onScan(v);
  };

  return (
    <div className="space-y-4">
      {/* Camera Scanner */}
      {scanning ? (
        <div className="rounded-2xl overflow-hidden relative" style={{ background: '#000' }}>
          <div id="qr-reader-container" ref={containerRef} style={{ width: '100%' }} />
          <button
            type="button"
            onClick={stopScanner}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startScanner}
          className="w-full rounded-2xl p-8 flex flex-col items-center gap-3 transition-colors"
          style={{ background: 'var(--bdl)', border: '2px dashed var(--bd)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--a)', color: 'var(--s)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '32px' }}>qr_code_scanner</span>
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--t)' }}>{placeholder}</p>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>Tap to open camera</p>
        </button>
      )}

      {cameraError && (
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--rebg)', border: '1px solid rgba(176,58,42,0.18)' }}>
          <p className="text-xs" style={{ color: 'var(--re)' }}>{cameraError}</p>
        </div>
      )}

      {/* Manual fallback */}
      <div className="rounded-xl p-4" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
        <p className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--t3)' }}>Or enter store code manually</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Store ID or URL"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{ border: '1px solid var(--bd)', background: 'var(--bg)', color: 'var(--t)' }}
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-2.5 font-semibold text-sm rounded-xl disabled:opacity-50"
            style={{ background: 'var(--a)', color: 'var(--s)' }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
