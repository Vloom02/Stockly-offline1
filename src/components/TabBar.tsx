import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  HomeIcon, CubeIcon, PlusIcon, ClockIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  CubeIcon as CubeSolid,
  ClockIcon as ClockSolid,
  Cog6ToothIcon as CogSolid,
} from '@heroicons/react/24/solid';

interface TabConfig {
  path: string;
  Icon: React.ComponentType<{ width?: number; height?: number; style?: React.CSSProperties }>;
  IconActive: React.ComponentType<{ width?: number; height?: number; style?: React.CSSProperties }>;
  label: string;
  fab?: boolean;
}

const TABS: TabConfig[] = [
  { path: '/dashboard',   Icon: HomeIcon,    IconActive: HomeSolid,  label: 'Inicio' },
  { path: '/stock',       Icon: CubeIcon,    IconActive: CubeSolid,  label: 'Stock' },
  { path: '/lote/nuevo',  Icon: PlusIcon,    IconActive: PlusIcon,   label: 'Nuevo', fab: true },
  { path: '/movimientos', Icon: ClockIcon,   IconActive: ClockSolid, label: 'Historial' },
  { path: '/config',      Icon: Cog6ToothIcon, IconActive: CogSolid, label: 'Ajustes' },
];

const TabBar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      {TABS.map(t => {
        const isFab = t.fab;
        const active = isFab
          ? location.pathname.includes('/nuevo')
          : location.pathname === t.path ||
            (t.path !== '/dashboard' && location.pathname.startsWith(t.path));

        const Ico = active ? t.IconActive : t.Icon;

        if (isFab) {
          return (
            <button
              key={t.path}
              type="button"
              onClick={() => history.push(t.path)}
              style={{
                background: 'var(--brand-500)',
                border: 'none',
                cursor: 'pointer',
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-brand)',
                transition: 'transform 150ms, box-shadow 200ms',
                marginTop: -8,
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.92)';
                setTimeout(() => { e.currentTarget.style.transform = ''; }, 150);
              }}
            >
              <PlusIcon width={26} height={26} strokeWidth={2.5 as any} />
            </button>
          );
        }

        return (
          <button
            key={t.path}
            type="button"
            onClick={() => history.push(t.path)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: active ? 'var(--brand-600)' : 'var(--text-3)',
              transition: 'color 150ms',
              minHeight: 48,
            }}
          >
            <Ico width={22} height={22} />
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 500,
              letterSpacing: '-0.005em',
            }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;
