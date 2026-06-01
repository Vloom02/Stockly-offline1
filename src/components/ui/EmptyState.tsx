import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div
    className="animate-fade-in"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '48px 24px',
      gap: 4,
    }}
  >
    <div style={{
      width: 64, height: 64, borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-3)', marginBottom: 12,
    }}>
      {icon}
    </div>
    <h3 style={{
      fontSize: 16, fontWeight: 600, color: 'var(--text)',
      letterSpacing: '-0.02em', margin: 0,
    }}>{title}</h3>
    {description && (
      <p style={{
        fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0',
        maxWidth: 320, lineHeight: 1.5,
      }}>{description}</p>
    )}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export default EmptyState;
