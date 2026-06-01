import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  iconRight,
  loading,
  children,
  disabled,
  style,
  ...props
}) => {
  const styles = getButtonStyles(variant, size, fullWidth, disabled || loading);
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{ ...styles, ...style }}
      onMouseDown={(e) => {
        const target = e.currentTarget;
        target.style.transform = 'scale(0.97)';
        setTimeout(() => { target.style.transform = ''; }, 150);
        props.onMouseDown?.(e);
      }}
    >
      {loading ? <Spinner /> : icon}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </button>
  );
};

const Spinner = () => (
  <span
    style={{
      width: 14, height: 14,
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
      display: 'inline-block',
    }}
  />
);

function getButtonStyles(variant: Variant, size: Size, fullWidth?: boolean, disabled?: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '-0.011em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms, box-shadow 150ms, opacity 150ms',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
  };

  // Sizes
  const sizes: Record<Size, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 13, borderRadius: 'var(--radius-sm)', minHeight: 32 },
    md: { padding: '10px 16px', fontSize: 14, borderRadius: 'var(--radius)', minHeight: 40 },
    lg: { padding: '14px 20px', fontSize: 15, borderRadius: 'var(--radius-md)', minHeight: 48 },
  };

  // Variants
  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background: 'var(--brand-500)',
      color: 'var(--text-on-brand)',
      boxShadow: 'var(--shadow-sm)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-2)',
    },
    danger: {
      background: 'var(--danger)',
      color: '#fff',
      boxShadow: 'var(--shadow-sm)',
    },
    success: {
      background: 'var(--surface)',
      color: 'var(--brand-700)',
      border: '1px solid var(--brand-200)',
    },
  };

  return { ...base, ...sizes[size], ...variants[variant] };
}

export default Button;
