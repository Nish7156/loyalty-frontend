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
  style,
  ...props
}: ButtonProps) {
  const base = 'px-4 py-2.5 rounded-xl font-medium transition disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'text-white',
    secondary: 'border',
    danger: 'text-white',
    ghost: '',
  };
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--a)', color: 'var(--s)' },
    secondary: { background: 'var(--s)', borderColor: 'var(--bd)', color: 'var(--t2)' },
    danger: { background: 'var(--re)', color: 'var(--s)' },
    ghost: { background: 'transparent', color: 'var(--t2)' },
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
