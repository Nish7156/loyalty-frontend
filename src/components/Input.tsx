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
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.02em] mb-1.5" style={{ color: 'var(--t2)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] border rounded-xl px-3 py-2.5 outline-none transition ${error ? 'border-[#B03A2A]' : ''} ${className}`}
        style={{
          background: 'var(--bg)',
          borderColor: error ? 'var(--re)' : 'var(--bd)',
          color: 'var(--t)',
        }}
        {...props}
      />
      {error && <p className="mt-1 text-sm" style={{ color: 'var(--re)' }}>{error}</p>}
    </div>
  );
}
