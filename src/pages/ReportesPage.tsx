import React, { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  ChartPieIcon, CalendarDaysIcon, ArrowTrendingDownIcon, BanknotesIcon,
} from '@heroicons/react/24/outline';
import {
  useStore, formatearMoneda, formatearFecha,
} from '../context/StoreContext';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import DonutChart from '../components/ui/DonutChart';
import BarChart from '../components/ui/BarChart';
import CalendarioVencimientos from '../components/ui/Calendario';
import { Header } from './ProductoPage';

// Paleta para categorías del donut
const PALETA = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#6366f1',
];

const ReportesPage: React.FC = () => {
  const { state, perdidasPorMes, distribucionPorCategoria, vencimientosDelMes, resumen } = useStore();
  const history = useHistory();
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const perdidas = useMemo(() => perdidasPorMes(6), [perdidasPorMes]);
  const distribucion = useMemo(() => distribucionPorCategoria(), [distribucionPorCategoria]);
  const res = useMemo(() => resumen(), [resumen]);

  const totalPerdido = useMemo(
    () => perdidas.reduce((s, p) => s + p.valorVencido + p.valorRoto, 0),
    [perdidas]
  );

  const segmentosDonut = useMemo(() =>
    distribucion.slice(0, 10).map((d, i) => ({
      label: d.categoria,
      valor: d.valor,
      color: PALETA[i % PALETA.length],
    })), [distribucion]);

  const lotesDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    return state.lotes
      .filter(l => l.fechaVencimiento === diaSeleccionado && l.sucursalId === state.sucursalActivaId)
      .map(l => {
        const prod = state.productos.find(p => p.id === l.productoId);
        return { lote: l, nombre: prod?.nombre || '(eliminado)' };
      });
  }, [diaSeleccionado, state.lotes, state.productos, state.sucursalActivaId]);

  const hayDatos = state.productos.length > 0;

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 760, margin: '0 auto',
        }}>
          <Header title="Reportes" onBack={() => history.goBack()} />

          {!hayDatos ? (
            <EmptyState
              icon={<ChartPieIcon width={32} height={32} />}
              title="Sin datos para mostrar"
              description="Cargá productos y lotes para ver reportes y estadísticas."
            />
          ) : (
            <>
              {/* ─── Distribución por categoría ─────────────────────── */}
              <SectionHeader icon={<ChartPieIcon width={16} height={16} />} title="Valor por categoría" />
              <Card padding="md" style={{ marginBottom: 16 }}>
                {distribucion.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-2)', padding: 20, margin: 0, fontSize: 13 }}>
                    No hay stock cargado en esta sucursal
                  </p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <DonutChart
                      segmentos={segmentosDonut}
                      centroValor={formatearMoneda(res.valorTotal)}
                      centroLabel="Total"
                    />
                    <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {distribucion.slice(0, 6).map((d, i) => {
                        const pct = res.valorTotal > 0 ? (d.valor / res.valorTotal) * 100 : 0;
                        return (
                          <div key={d.categoria} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 10, height: 10, borderRadius: 3,
                              background: PALETA[i % PALETA.length], flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {d.categoria}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              {/* ─── Pérdidas mensuales ─────────────────────────────── */}
              <SectionHeader icon={<ArrowTrendingDownIcon width={16} height={16} />} title="Pérdidas por mes" />
              <Card padding="md" style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Total últimos 6 meses
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', letterSpacing: '-0.02em' }}>
                      {formatearMoneda(totalPerdido)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                    <LegendDot color="var(--danger)" label="Vencido" />
                    <LegendDot color="var(--warning)" label="Roto" />
                  </div>
                </div>
                {totalPerdido === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--brand-600)', padding: 16, margin: 0, fontSize: 13, fontWeight: 500 }}>
                    Sin pérdidas registradas. ¡Buen trabajo!
                  </p>
                ) : (
                  <BarChart
                    barras={perdidas.map(p => ({
                      etiqueta: p.etiqueta,
                      valor: p.valorVencido,
                      valorSecundario: p.valorRoto,
                    }))}
                    color="var(--danger)"
                    colorSecundario="var(--warning)"
                    formatear={(n) => n > 0 ? formatearMoneda(n) : ''}
                  />
                )}
              </Card>

              {/* ─── Calendario de vencimientos ─────────────────────── */}
              <SectionHeader icon={<CalendarDaysIcon width={16} height={16} />} title="Calendario de vencimientos" />
              <Card padding="md">
                <CalendarioVencimientos
                  vencimientos={vencimientosDelMes}
                  onDiaClick={setDiaSeleccionado}
                />
              </Card>

              {/* Detalle del día seleccionado */}
              {diaSeleccionado && lotesDelDia.length > 0 && (
                <div className="animate-slide-up" style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-2)' }}>
                    Vencen el {formatearFecha(diaSeleccionado)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lotesDelDia.map(({ lote, nombre }) => (
                      <Card key={lote.id} padding="sm" onClick={() => history.push(`/lote/${lote.id}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{nombre}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{lote.cantidad} unid.</div>
                          </div>
                          <BanknotesIcon width={18} height={18} style={{ color: 'var(--text-3)' }} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
    fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
  }}>
    <span style={{ color: 'var(--brand-600)' }}>{icon}</span>
    {title}
  </div>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)' }}>
    <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
    {label}
  </span>
);

export default ReportesPage;
