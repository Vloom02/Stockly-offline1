import React, { useMemo } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  BuildingStorefrontIcon, ChevronRightIcon,
  PlusCircleIcon, ArchiveBoxIcon, ExclamationTriangleIcon,
  CheckCircleIcon, ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import {
  useStore, formatearMoneda, formatearFecha, textoEstado,
  colorNivel, etiquetaNivel, ordenNivel,
} from '../context/StoreContext';
import { LoteConProducto, NivelAlerta } from '../types';
import Card from '../components/ui/Card';
import { NivelBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { SkeletonDashboard } from '../components/ui/Skeleton';
import SyncBanner from '../components/SyncBanner';

const DashboardPage: React.FC = () => {
  const { state, resumen, lotesEnriquecidos } = useStore();
  const history = useHistory();

  const res = useMemo(() => resumen(), [resumen]);
  const lotes = useMemo(() => lotesEnriquecidos(), [lotesEnriquecidos]);

  const enRiesgo = useMemo(() => {
    return lotes
      .filter(l => l.nivelAlerta !== 'ok')
      .sort((a, b) => {
        const dn = ordenNivel(a.nivelAlerta) - ordenNivel(b.nivelAlerta);
        if (dn !== 0) return dn;
        return a.fechaVencimiento.localeCompare(b.fechaVencimiento);
      })
      .slice(0, 6);
  }, [lotes]);

  const sucursalActiva = state.sucursales.find(s => s.id === state.sucursalActivaId);

  if (!state.loaded) {
    return (
      <IonPage>
        <IonContent style={{ '--background': 'var(--bg)' } as any}>
          <SkeletonDashboard />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 760, margin: '0 auto',
        }}>

          {/* ─── Header ───────────────────────────────────────────────── */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <Logo size={32} showText />
            <button
              type="button"
              onClick={() => history.push('/sucursales')}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)', padding: '6px 12px 6px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: 'var(--text)',
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-xs)',
              }}
            >
              <BuildingStorefrontIcon width={14} height={14} />
              {sucursalActiva?.nombre || '...'}
              <ChevronRightIcon width={12} height={12} style={{ color: 'var(--text-3)' }} />
            </button>
          </header>

          <SyncBanner />

          {/* ─── BENTO GRID ───────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}>

            {/* Hero: valor inventario (2x2) */}
            <div style={{
              gridColumn: 'span 2', gridRow: 'span 2',
              background: 'linear-gradient(145deg, var(--brand-500), var(--brand-700))',
              borderRadius: 'var(--radius-lg)', padding: 20, color: '#fff',
              boxShadow: '0 8px 24px -6px rgba(76,29,149,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              }} />
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>Valor del inventario</span>
                <div style={{
                  fontSize: 30, fontWeight: 800, margin: '6px 0 16px',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                }}>
                  {formatearMoneda(res.valorTotal)}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Productos</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{res.productosTotales}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Lotes</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{res.lotesTotales}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Unidades</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{res.unidadesTotales}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* En riesgo (2x1) */}
            <div style={{
              gridColumn: 'span 2',
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
              padding: 16, border: '1px solid var(--border)',
              boxShadow: '0 2px 6px rgba(15,23,42,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                  background: 'var(--level-vencido-bg)', color: 'var(--level-vencido-fg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ExclamationTriangleIcon width={15} height={15} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Valor en riesgo</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Vencido</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--level-vencido-fg)' }}>
                    {formatearMoneda(res.valorVencido)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>En peligro</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--level-urgente-fg)' }}>
                    {formatearMoneda(res.valorEnRiesgo)}
                  </div>
                </div>
              </div>
            </div>

            {/* Dos chips de nivel (1x1 cada uno) */}
            <NivelChip nivel="vencido" cantidad={res.lotesVencidos} />
            <NivelChip nivel="critico" cantidad={res.lotesCriticos} />
          </div>

          {/* ─── Fila de niveles restantes ────────────────────────────── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10, marginBottom: 20,
          }}>
            <NivelChip nivel="urgente" cantidad={res.lotesUrgentes} />
            <NivelChip nivel="aviso" cantidad={res.lotesAviso} />
            <NivelChip nivel="ok" cantidad={res.lotesOk} />
          </div>

          {/* ─── Acciones rápidas ─────────────────────────────────────── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10, marginBottom: 24,
          }}>
            <AccionCard icon={<PlusCircleIcon width={22} height={22} />} label="Nuevo lote"
              onClick={() => history.push('/lote/nuevo')} />
            <AccionCard icon={<ArchiveBoxIcon width={22} height={22} />} label="Ver stock"
              onClick={() => history.push('/stock')} />
            <AccionCard icon={<ChartBarSquareIcon width={22} height={22} />} label="Reportes"
              onClick={() => history.push('/reportes')} />
          </div>

          {/* ─── Atención inmediata ───────────────────────────────────── */}
          {enRiesgo.length > 0 ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  Atención inmediata
                </h2>
                <button type="button" onClick={() => history.push('/stock')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--brand-600)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 2,
                    fontFamily: 'inherit', padding: 0,
                  }}>
                  Ver todo <ChevronRightIcon width={14} height={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {enRiesgo.map(l => (
                  <LoteListItem key={l.id} lote={l} onClick={() => history.push(`/lote/${l.id}`)} />
                ))}
              </div>
            </>
          ) : state.productos.length > 0 ? (
            <Card padding="md" style={{ borderColor: 'var(--brand-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'var(--brand-50)', color: 'var(--brand-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircleIcon width={24} height={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Todo en orden</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    No hay productos próximos a vencer
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={<ArchiveBoxIcon width={32} height={32} />}
              title="Tu stock está vacío"
              description="Empezá creando tu primer producto y cargá lotes con sus fechas de vencimiento."
              action={
                <Button variant="primary" size="md" onClick={() => history.push('/producto/nuevo')}
                  icon={<PlusCircleIcon width={18} height={18} />}>
                  Crear primer producto
                </Button>
              }
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

// ─── Subcomponentes ─────────────────────────────────────────────────────

const NivelChip: React.FC<{ nivel: NivelAlerta; cantidad: number }> = ({ nivel, cantidad }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '14px 6px', textAlign: 'center',
    boxShadow: '0 2px 6px rgba(15,23,42,0.05)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: `var(--level-${nivel}-fg)`, marginBottom: 5,
      boxShadow: `0 0 0 3px var(--level-${nivel}-bg)`,
    }} />
    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
      {cantidad}
    </div>
    <div style={{ fontSize: 9, color: 'var(--text-2)', marginTop: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
      {etiquetaNivel(nivel)}
    </div>
  </div>
);

const AccionCard: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> =
  ({ icon, label, onClick }) => (
    <button type="button" onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit',
        fontWeight: 600, fontSize: 12, letterSpacing: '-0.005em',
        boxShadow: '0 2px 6px rgba(15,23,42,0.05)', transition: 'all 150ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-300)'; e.currentTarget.style.color = 'var(--brand-700)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
    >
      <span style={{ color: 'var(--brand-600)' }}>{icon}</span>
      {label}
    </button>
  );

export const LoteListItem: React.FC<{ lote: LoteConProducto; onClick: () => void }> = ({ lote, onClick }) => (
  <Card padding="sm" onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 4, height: 44, background: colorNivel(lote.nivelAlerta), borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.011em' }}>
          {lote.productoNombre}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
          <span>{lote.cantidad} unid.</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)' }} />
          <span>{lote.productoCategoria}</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <NivelBadge nivel={lote.nivelAlerta} />
          <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 8, fontWeight: 500 }}>
            {textoEstado(lote.fechaVencimiento)}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.011em' }}>
          {formatearFecha(lote.fechaVencimiento)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {formatearMoneda(lote.valorLote)}
        </div>
      </div>
    </div>
  </Card>
);

export default DashboardPage;
