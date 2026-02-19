import { useRef, useState } from 'react';

interface QRReaderProps {
  onScan: (value: string) => void;
  placeholder?: string;
}

export function QRReader({ onScan, placeholder = 'Scan QR code' }: QRReaderProps) {
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = manualCode.trim();
    if (v) onScan(v);
  };

  return (
    <div className="border-2 border-dashed border-[var(--premium-border)] rounded-xl p-6 text-center bg-[var(--premium-card)]">
      <p className="text-[var(--premium-muted)] mb-4">{placeholder}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or enter code / store ID"
          className="border border-[var(--premium-border)] rounded-xl px-3 py-2.5 text-center bg-[var(--premium-surface)] text-[var(--premium-cream)] placeholder-[var(--premium-muted)] focus:ring-2 focus:ring-[var(--premium-gold)]"
        />
        <button type="submit" className="px-4 py-2.5 bg-[var(--premium-gold)] text-[var(--premium-bg)] font-medium rounded-xl hover:opacity-90">
          Submit
        </button>
      </form>
    </div>
  );
}
