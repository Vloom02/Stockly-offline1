import React from 'react';

/**
 * Skeleton loaders: placeholders animados mientras carga la data.
 * Mejoran la percepción de velocidad vs una pantalla en blanco.
 */

export const SkeletonBox: React.FC<{ width?: number | string; height?: number; radius?: number; style?: React.CSSProperties }> =
  ({ width = '100%', height = 16, radius = 6, style }) => (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );

export const SkeletonLoteCard: React.FC = () => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }}>
    <SkeletonBox width={4} height={44} radius={2} />
    <div style={{ flex: 1 }}>
      <SkeletonBox width="60%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonBox width="40%" height={11} style={{ marginBottom: 8 }} />
      <SkeletonBox width={70} height={18} radius={999} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <SkeletonBox width={50} height={13} />
      <SkeletonBox width={40} height={11} />
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div style={{
    padding: '20px 16px',
    maxWidth: 760, margin: '0 auto',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
      <SkeletonBox width={120} height={32} radius={8} />
      <SkeletonBox width={100} height={32} radius={999} />
    </div>

    {/* Hero */}
    <SkeletonBox height={140} radius={16} style={{ marginBottom: 12 }} />

    {/* Niveles */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBox key={i} height={64} radius={10} />
      ))}
    </div>

    {/* Acciones */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonBox key={i} height={72} radius={12} />
      ))}
    </div>

    {/* Lista */}
    <SkeletonBox width={160} height={20} style={{ marginBottom: 12 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: 4 }).map((_, i) => <SkeletonLoteCard key={i} />)}
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonLoteCard key={i} />)}
  </div>
);
