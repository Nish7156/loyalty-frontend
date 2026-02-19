import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'px-4 py-2.5 rounded-xl font-medium transition disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-[var(--premium-gold)] text-[var(--premium-bg)] hover:opacity-90',
    secondary: 'bg-[var(--premium-card)] text-[var(--premium-cream)] border border-[var(--premium-border)] hover:bg-[var(--premium-border)]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'bg-transparent text-[var(--premium-muted)] hover:bg-[var(--premium-card)] hover:text-[var(--premium-cream)]',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
