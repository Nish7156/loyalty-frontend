import { DEFAULT_PHONE_PREFIX } from '../lib/phone';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function fullFromDigits(digits: string): string {
  return digits ? DEFAULT_PHONE_PREFIX + digits : DEFAULT_PHONE_PREFIX;
}

const light = {
  label: 'block text-sm font-medium text-[var(--premium-muted)] mb-1',
  wrapper: 'flex min-h-[44px] border rounded-xl border-[var(--premium-border)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--premium-gold)] focus-within:border-[var(--premium-gold)]',
  prefix: 'inline-flex items-center px-3 py-2.5 bg-[var(--premium-card)] text-[var(--premium-muted)] select-none border-r border-[var(--premium-border)] shrink-0',
  input: 'flex-1 min-w-0 bg-[var(--premium-card)] text-[var(--premium-cream)] placeholder-[var(--premium-muted)] px-3 py-2.5 outline-none',
};

const dark = {
  label: 'block text-sm font-medium text-white/70 mb-2',
  wrapper: 'flex min-h-[48px] rounded-xl border border-white/20 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-400/40 focus-within:border-cyan-400/50',
  prefix: 'inline-flex items-center px-3 py-2.5 bg-black/30 text-white/50 select-none border-r border-white/20 shrink-0',
  input: 'flex-1 min-w-0 bg-black/30 text-white placeholder-white/40 px-3 py-2.5 outline-none',
};

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  variant?: 'light' | 'dark';
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  label,
  placeholder = '98765 43210',
  required,
  autoComplete = 'tel',
  className = '',
  variant = 'light',
  id,
}: PhoneInputProps) {
  const theme = variant === 'dark' ? dark : light;
  const digits = value.startsWith('+91') ? value.slice(3).replace(/\D/g, '') : value.replace(/\D/g, '');
  const displayDigits = digits.slice(0, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = digitsOnly(e.target.value);
    onChange(fullFromDigits(newDigits));
  };

  const inputId = id || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className={theme.label}>
          {label}
        </label>
      )}
      <div className={theme.wrapper}>
        <span className={theme.prefix} aria-hidden>
          +91
        </span>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={displayDigits}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={theme.input}
        />
      </div>
    </div>
  );
}
