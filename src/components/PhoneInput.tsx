import { DEFAULT_PHONE_PREFIX } from '../lib/phone';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function fullFromDigits(digits: string): string {
  return digits ? DEFAULT_PHONE_PREFIX + digits : DEFAULT_PHONE_PREFIX;
}

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
  const digits = value.startsWith('+91') ? value.slice(3).replace(/\D/g, '') : value.replace(/\D/g, '');
  const displayDigits = digits.slice(0, 10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = digitsOnly(e.target.value);
    onChange(fullFromDigits(newDigits));
  };

  const inputId = id || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

  // Both variants now use warm earthy palette
  const _variant = variant; // keep param for API compat
  void _variant;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.02em] mb-2" style={{ color: 'var(--t2)' }}>
          {label}
        </label>
      )}
      <div
        className="flex min-h-[52px] rounded-xl border overflow-hidden transition-shadow"
        style={{
          borderColor: 'var(--bd)',
          boxShadow: displayDigits ? '0 0 0 3px var(--bdl)' : 'none',
        }}
      >
        <span
          className="inline-flex items-center px-3 py-2.5 select-none border-r shrink-0 text-sm font-medium"
          style={{ background: 'var(--bdl)', borderColor: 'var(--bd)', color: 'var(--t2)' }}
          aria-hidden
        >
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
          className="flex-1 min-w-0 px-3 py-2.5 outline-none text-[14.5px]"
          style={{ background: 'var(--s)', color: 'var(--t)' }}
        />
      </div>
    </div>
  );
}
