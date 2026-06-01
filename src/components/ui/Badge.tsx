import React from 'react';
import { NivelAlerta } from '../../types';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'subtle';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  icon,
}) => {
  const variants: Record<string, React.CSSProperties> = {
    default:  { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' },
    success:  { background: 'var(--level-ok-bg)', color: 'var(--level-ok-fg)', border: '1px solid var(--level-ok-border)' },
    warning:  { background: 'var(--level-aviso-bg)', color: 'var(--level-aviso-fg)', border: '1px solid var(--level-aviso-border)' },
    danger:   { background: 'var(--level-vencido-bg)', color: 'var(--level-vencido-fg)', border: '1px solid var(--level-vencido-border)' },
    info:     { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
    subtle:   { background: 'transparent', color: 'var(--text-2)' },
  };

  const sizes = {
    sm: { padding: '2px 8px', fontSize: 11, gap: 4 },
    md: { padding: '4px 10px', fontSize: 12, gap: 6 },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 'var(--radius-full)',
      fontWeight: 600,
      letterSpacing: '-0.005em',
      lineHeight: 1.3,
      ...variants[variant],
      ...sizes[size],
    }}>
      {icon}
      {children}
    </span>
  );
};

// ─── Niveles de alerta tipados ──────────────────────────────────────
export const NivelBadge: React.FC<{ nivel: NivelAlerta; size?: 'sm' | 'md' }> = ({ nivel, size = 'sm' }) => {
  const labels: Record<NivelAlerta, string> = {
    ok: 'OK',
    aviso: 'Aviso',
    urgente: 'Urgente',
    critico: 'Crítico',
    vencido: 'Vencido',
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: size === 'sm' ? '2px 8px' : '4px 10px',
    fontSize: size === 'sm' ? 11 : 12,
    fontWeight: 600,
    borderRadius: 'var(--radius-full)',
    letterSpacing: '-0.005em',
    background: `var(--level-${nivel}-bg)`,
    color: `var(--level-${nivel}-fg)`,
    border: `1px solid var(--level-${nivel}-border)`,
  };

  return (
    <span style={baseStyle}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: `var(--level-${nivel}-fg)`,
      }} />
      {labels[nivel]}
    </span>
  );
};

export default Badge;
