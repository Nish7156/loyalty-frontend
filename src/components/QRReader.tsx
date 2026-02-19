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
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
      <p className="text-gray-600 mb-4">{placeholder}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or enter code / store ID"
          className="border border-gray-300 rounded-lg px-3 py-2 text-center"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Submit
        </button>
      </form>
    </div>
  );
}
