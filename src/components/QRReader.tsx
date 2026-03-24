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
    <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{ borderColor: '#F5C4B3', background: '#FFF' }}>
      <p className="mb-4" style={{ color: '#A08880' }}>{placeholder}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or enter code / store ID"
          className="rounded-xl px-3 py-2.5 text-center focus:ring-2 focus:ring-orange-300/40"
          style={{ border: '1px solid #F5C4B3', background: '#FAF9F6', color: '#5D4037' }}
        />
        <button type="submit" className="px-4 py-2.5 font-medium rounded-xl hover:opacity-90" style={{ background: '#D85A30', color: '#FFF' }}>
          Submit
        </button>
      </form>
    </div>
  );
}
