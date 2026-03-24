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
    primary: { background: '#D85A30', color: '#FFF' },
    secondary: { background: '#FFF', borderColor: '#F5C4B3', color: '#7B5E54' },
    danger: { background: '#B03A2A', color: '#FFF' },
    ghost: { background: 'transparent', color: '#7B5E54' },
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
