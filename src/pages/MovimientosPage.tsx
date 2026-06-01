import React, { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  ArrowDownTrayIcon, BanknotesIcon, TrashIcon, HeartIcon,
  AdjustmentsHorizontalIcon, SparklesIcon, PencilIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../context/StoreContext';
import { TipoMovimiento, Movimiento } from '../types';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { Header } from './ProductoPage';

const MovimientosPage: React.FC = () => {
  const { state } = useStore();
  const history = useHistory();
  const [filtro, setFiltro] = useState<TipoMovimiento | 'todos'>('todos');

  const filtrados = useMemo(() => {
    let r = state.movimientos;
    if (filtro !== 'todos') r = r.filter(m => m.tipo === filtro);
    return r.slice(0, 200);
  }, [state.movimientos, filtro]);

  const porDia = useMemo(() => {
    const grupos: { fecha: string; items: Movimiento[] }[] = [];
    for (const m of filtrados) {
      const dia = m.fecha.slice(0, 10);
      const ult = grupos[grupos.length - 1];
      if (ult && ult.fecha === dia) ult.items.push(m);
      else grupos.push({ fecha: dia, items: [m] });
    }
    return grupos;
  }, [filtrados]);

  const chips: { val: TipoMovimiento | 'todos'; label: string }[] = [
    { val: 'todos', label: 'Todos' },
    { val: 'ingreso', label: 'Ingresos' },
    { val: 'retiro_venta', label: 'Ventas' },
    { val: 'retiro_vencido', label: 'Vencidos' },
    { val: 'retiro_roto', label: 'Rotos' },
    { val: 'ajuste', label: 'Ajustes' },
  ];

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 640, margin: '0 auto',
        }}>
          <Header title="Historial" onBack={() => history.goBack()} />

          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {chips.map(c => (
              <button key={c.val} type="button" onClick={() => setFiltro(c.val)}
                style={{
                  padding: '6px 14px', fontSize: 13, borderRadius: 'var(--radius-full)',
                  border: '1px solid ' + (filtro === c.val ? 'var(--brand-500)' : 'var(--border)'),
                  background: filtro === c.val ? 'var(--brand-500)' : 'var(--surface)',
                  color: filtro === c.val ? '#fff' : 'var(--text-2)',
                  cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
                  flexShrink: 0, fontFamily: 'inherit',
                }}>{c.label}</button>
            ))}
          </div>

          {porDia.length === 0 ? (
            <EmptyState icon={<ClockIcon width={32} height={32} />} title="Sin movimientos"
              description="Los movimientos de stock aparecerán acá." />
          ) : (
            porDia.map(grupo => (
              <div key={grupo.fecha} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                  textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4,
                  letterSpacing: '0.04em',
                }}>{tituloFecha(grupo.fecha)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {grupo.items.map(m => {
                    const prod = state.productos.find(p => p.id === m.productoId);
                    return <MovItem key={m.id} m={m} nombre={prod?.nombre || '(eliminado)'} />;
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

const MovItem: React.FC<{ m: Movimiento; nombre: string }> = ({ m, nombre }) => {
  const info = tipoInfo(m.tipo);
  const hora = m.fecha.slice(11, 16);
  return (
    <Card padding="sm">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius)',
          background: info.bg, color: info.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{info.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{hora}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{nombre}</div>
          {m.cantidad !== 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
              {m.cantidadAnterior} → {m.cantidadNueva}{' '}
              <span style={{ color: m.cantidad > 0 ? 'var(--brand-600)' : 'var(--danger)', fontWeight: 600 }}>
                ({m.cantidad > 0 ? '+' : ''}{m.cantidad})
              </span>
            </div>
          )}
          {m.notas && (
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', marginTop: 2 }}>{m.notas}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{m.usuario}</div>
        </div>
      </div>
    </Card>
  );
};

function tipoInfo(t: TipoMovimiento): { icon: React.ReactNode; label: string; color: string; bg: string } {
  const ico = (C: any) => <C width={18} height={18} />;
  switch (t) {
    case 'ingreso':        return { icon: ico(ArrowDownTrayIcon), label: 'Ingreso', color: 'var(--brand-600)', bg: 'var(--brand-50)' };
    case 'retiro_venta':   return { icon: ico(BanknotesIcon), label: 'Venta', color: 'var(--info)', bg: '#dbeafe' };
    case 'retiro_vencido': return { icon: ico(TrashIcon), label: 'Retiro vencido', color: 'var(--danger)', bg: 'var(--level-vencido-bg)' };
    case 'retiro_roto':    return { icon: ico(HeartIcon), label: 'Retiro roto', color: 'var(--warning)', bg: 'var(--level-aviso-bg)' };
    case 'ajuste':         return { icon: ico(AdjustmentsHorizontalIcon), label: 'Ajuste', color: 'var(--text-2)', bg: 'var(--surface-2)' };
    case 'creacion':       return { icon: ico(SparklesIcon), label: 'Producto creado', color: 'var(--brand-600)', bg: 'var(--brand-50)' };
    case 'edicion':        return { icon: ico(PencilIcon), label: 'Producto editado', color: 'var(--text-2)', bg: 'var(--surface-2)' };
  }
}

function tituloFecha(iso: string): string {
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  if (iso === hoy) return 'Hoy';
  if (iso === ayer.toISOString().slice(0, 10)) return 'Ayer';
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default MovimientosPage;
