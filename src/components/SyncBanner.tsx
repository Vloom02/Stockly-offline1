import React from 'react';
import { CloudIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useOnline } from '../utils/useOnline';
import { useStore } from '../context/StoreContext';

/**
 * Banner que informa el estado de conexión y sincronización.
 * - Offline: muestra que los cambios se guardan local
 * - Sincronizando: spinner
 * - Pendientes: cuántos cambios faltan subir
 */
const SyncBanner: React.FC = () => {
  const online = useOnline();
  const { sincronizando, state, sincronizarAhora } = useStore();

  // Si todo OK y sin pendientes, no mostrar nada
  if (online && !sincronizando && state.pendientesSync === 0) return null;

  let bg = 'var(--surface-2)';
  let color = 'var(--text-2)';
  let icon = <CloudIcon width={16} height={16} />;
  let texto = '';
  let clickable = false;

  if (!online) {
    bg = 'var(--level-aviso-bg)';
    color = 'var(--level-aviso-fg)';
    icon = <ExclamationTriangleIcon width={16} height={16} />;
    texto = state.pendientesSync > 0
      ? `Sin conexión · ${state.pendientesSync} cambio${state.pendientesSync !== 1 ? 's' : ''} pendiente${state.pendientesSync !== 1 ? 's' : ''}`
      : 'Sin conexión · los cambios se guardan en el dispositivo';
  } else if (sincronizando) {
    bg = 'var(--brand-50)';
    color = 'var(--brand-700)';
    icon = <ArrowPathIcon width={16} height={16} style={{ animation: 'spin 0.8s linear infinite' }} />;
    texto = 'Sincronizando...';
  } else if (state.pendientesSync > 0) {
    bg = 'var(--brand-50)';
    color = 'var(--brand-700)';
    icon = <CloudIcon width={16} height={16} />;
    texto = `${state.pendientesSync} cambio${state.pendientesSync !== 1 ? 's' : ''} por subir · tocá para sincronizar`;
    clickable = true;
  }

  return (
    <div
      onClick={clickable ? () => sincronizarAhora() : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: bg, color,
        borderRadius: 'var(--radius)', padding: '8px 12px',
        fontSize: 12, fontWeight: 600, marginBottom: 12,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {icon}
      <span>{texto}</span>
    </div>
  );
};

export default SyncBanner;
