import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

/**
 * Logo de Stockly: local/depósito estilo neón violeta sobre fondo oscuro.
 * Coherente con el ícono de la app.
 */
const Logo: React.FC<LogoProps> = ({ size = 28, showText = false }) => {
  const gid = React.useId();
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={`bg-${gid}`} cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#1a1033" />
            <stop offset="100%" stopColor="#070310" />
          </radialGradient>
          <linearGradient id={`neon-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="45%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>

        {/* Fondo oscuro redondeado */}
        <rect width="64" height="64" rx="15" fill={`url(#bg-${gid})`} />

        {/* Local / depósito en neón violeta */}
        <g fill="none" stroke={`url(#neon-${gid})`} strokeWidth="2.6"
           strokeLinejoin="round" strokeLinecap="round">
          {/* Toldo */}
          <path d="M 17 25 L 20 19 L 44 19 L 47 25 Z" fill="rgba(124,58,237,0.18)" />
          <line x1="25" y1="19" x2="24" y2="25" />
          <line x1="32" y1="19" x2="32" y2="25" />
          <line x1="39" y1="19" x2="40" y2="25" />
          {/* Cuerpo */}
          <path d="M 19.5 25 L 19.5 46 L 44.5 46 L 44.5 25" />
          {/* Base */}
          <line x1="17" y1="46" x2="47" y2="46" />
          {/* Portón / vidriera */}
          <path d="M 24 46 L 24 32 L 40 32 L 40 46" fill="rgba(124,58,237,0.18)" />
          {/* Caja dentro */}
          <path d="M 28.5 46 L 28.5 38 L 35.5 38 L 35.5 46" strokeWidth="2.1" />
        </g>
      </svg>
      {showText && (
        <span style={{
          fontSize: size * 0.7,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--text)',
        }}>
          Stockly
        </span>
      )}
    </div>
  );
};

export default Logo;
