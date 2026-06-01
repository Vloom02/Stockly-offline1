import React from 'react';

// ─── Base styles ─────────────────────────────────────────────────────────
const baseFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
  fontFamily: 'inherit',
  letterSpacing: '-0.011em',
  transition: 'border-color 150ms, box-shadow 150ms',
  minHeight: 40,
};

const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.borderColor = 'var(--brand-500)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.12)';
};

const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.borderColor = 'var(--border)';
  e.currentTarget.style.boxShadow = 'none';
};

// ─── Field wrapper (con label, hint, error) ───────────────────────────
interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, error, required, children }) => (
  <div style={{ marginBottom: 12 }}>
    {label && (
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-2)',
        marginBottom: 6,
        letterSpacing: '-0.005em',
      }}>
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
    )}
    {children}
    {hint && !error && (
      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>{hint}</p>
    )}
    {error && (
      <p style={{ fontSize: 11, color: 'var(--danger)', margin: '4px 0 0', fontWeight: 500 }}>{error}</p>
    )}
  </div>
);

// ─── Input ───────────────────────────────────────────────────────────
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftIcon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ leftIcon, rightAddon, style, ...props }) => {
  if (!leftIcon && !rightAddon) {
    return (
      <input
        {...props}
        style={{ ...baseFieldStyle, ...style }}
        onFocus={(e) => { focusStyle(e); props.onFocus?.(e); }}
        onBlur={(e) => { blurStyle(e); props.onBlur?.(e); }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: rightAddon ? 6 : 0 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        {leftIcon && (
          <div style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>{leftIcon}</div>
        )}
        <input
          {...props}
          style={{ ...baseFieldStyle, paddingLeft: leftIcon ? 38 : 12, ...style }}
          onFocus={(e) => { focusStyle(e); props.onFocus?.(e); }}
          onBlur={(e) => { blurStyle(e); props.onBlur?.(e); }}
        />
      </div>
      {rightAddon}
    </div>
  );
};

// ─── Select ──────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ children, style, ...props }) => (
  <select
    {...props}
    style={{
      ...baseFieldStyle,
      paddingRight: 32,
      backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      appearance: 'none',
      cursor: 'pointer',
      ...style,
    }}
    onFocus={(e) => { focusStyle(e); props.onFocus?.(e); }}
    onBlur={(e) => { blurStyle(e); props.onBlur?.(e); }}
  >
    {children}
  </select>
);

// ─── Textarea ────────────────────────────────────────────────────────
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ style, ...props }) => (
  <textarea
    {...props}
    style={{
      ...baseFieldStyle,
      minHeight: 100,
      resize: 'vertical',
      lineHeight: 1.5,
      fontFamily: 'var(--font-mono)',
      ...style,
    }}
    onFocus={(e) => { focusStyle(e); props.onFocus?.(e); }}
    onBlur={(e) => { blurStyle(e); props.onBlur?.(e); }}
  />
);
