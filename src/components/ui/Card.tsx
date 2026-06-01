import React from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'subtle';
  style?: React.CSSProperties;
  interactive?: boolean;
}

const PAD = { none: 0, sm: 12, md: 16, lg: 20 };

const Card: React.FC<CardProps> = ({
  children,
  onClick,
  padding = 'md',
  variant = 'default',
  style,
  interactive,
}) => {
  const isClickable = !!onClick || interactive;

  const variants: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
    },
    elevated: {
      background: 'var(--surface)',
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      background: 'transparent',
      border: '1px solid var(--border)',
    },
    subtle: {
      background: 'var(--surface-2)',
    },
  };

  const baseStyle: React.CSSProperties = {
    ...variants[variant],
    borderRadius: 'var(--radius-md)',
    padding: PAD[padding],
    transition: 'transform 150ms, box-shadow 150ms, border-color 150ms',
    cursor: isClickable ? 'pointer' : 'default',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    color: 'inherit',
    ...style,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={baseStyle}
        onMouseEnter={(e) => {
          if (variant === 'default' || variant === 'outlined') {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }
          if (variant === 'elevated') {
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = variants[variant].border as string || 'transparent';
          e.currentTarget.style.boxShadow = variants[variant].boxShadow as string || 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.99)';
          setTimeout(() => { e.currentTarget.style.transform = ''; }, 150);
        }}
      >
        {children}
      </button>
    );
  }

  return <div style={baseStyle}>{children}</div>;
};

export default Card;
