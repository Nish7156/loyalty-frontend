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
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--premium-muted)] mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] border rounded-xl px-3 py-2.5 bg-[var(--premium-card)] text-[var(--premium-cream)] placeholder-[var(--premium-muted)] focus:ring-2 focus:ring-[var(--premium-gold)] focus:border-[var(--premium-gold)] ${error ? 'border-rose-500' : 'border-[var(--premium-border)]'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
