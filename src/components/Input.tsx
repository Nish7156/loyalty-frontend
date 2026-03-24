import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.02em] mb-1.5" style={{ color: '#7B5E54' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] border rounded-xl px-3 py-2.5 outline-none transition ${error ? 'border-[#B03A2A]' : ''} ${className}`}
        style={{
          background: '#FAF9F6',
          borderColor: error ? '#B03A2A' : '#F5C4B3',
          color: '#5D4037',
        }}
        {...props}
      />
      {error && <p className="mt-1 text-sm" style={{ color: '#B03A2A' }}>{error}</p>}
    </div>
  );
}
