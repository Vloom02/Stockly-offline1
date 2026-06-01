import React, { useState, useMemo } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  MagnifyingGlassIcon, PlusIcon, CubeIcon, TagIcon,
  XMarkIcon, ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import {
  useStore, formatearMoneda, formatearFecha,
  colorNivel, etiquetaNivel, ordenNivel, textoEstado,
} from '../context/StoreContext';
import { ProductoConLotes, NivelAlerta, LoteConProducto } from '../types';
import Card from '../components/ui/Card';
import { NivelBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';

type Vista = 'productos' | 'lotes';

const StockPage: React.FC = () => {
  const { productosConLotes, lotesEnriquecidos } = useStore();
  const history = useHistory();

  const [vista, setVista] = useState<Vista>('productos');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<NivelAlerta | 'todos'>('todos');

  const productos = useMemo(() => productosConLotes(), [productosConLotes]);
  const lotes = useMemo(() => lotesEnriquecidos(), [lotesEnriquecidos]);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter(p => {
      const mb = !q || p.producto.nombre.toLowerCase().includes(q) || (p.producto.codigoBarras?.includes(busqueda.trim()));
      const mf = filtro === 'todos' || p.nivelPeor === filtro;
      return mb && mf;
    }).sort((a, b) => ordenNivel(a.nivelPeor) - ordenNivel(b.nivelPeor));
  }, [productos, busqueda, filtro]);

  const lotesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lotes.filter(l => {
      const mb = !q || l.productoNombre.toLowerCase().includes(q) || (l.numeroLote?.toLowerCase().includes(q));
      const mf = filtro === 'todos' || l.nivelAlerta === filtro;
      return mb && mf;
    }).sort((a, b) => {
      const d = ordenNivel(a.nivelAlerta) - ordenNivel(b.nivelAlerta);
      return d !== 0 ? d : a.fechaVencimiento.localeCompare(b.fechaVencimiento);
    });
  }, [lotes, busqueda, filtro]);

  const filtros: (NivelAlerta | 'todos')[] = ['todos', 'vencido', 'critico', 'urgente', 'aviso', 'ok'];

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 760, margin: '0 auto',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Stock
          </h1>

          {/* Switch de vista */}
          <div style={{
            display: 'flex', background: 'var(--surface-2)',
            borderRadius: 'var(--radius)', padding: 3, marginBottom: 14,
          }}>
            <SegBtn activa={vista === 'productos'} onClick={() => setVista('productos')}
              icon={<CubeIcon width={16} height={16} />}>Por producto</SegBtn>
            <SegBtn activa={vista === 'lotes'} onClick={() => setVista('lotes')}
              icon={<TagIcon width={16} height={16} />}>Por lote</SegBtn>
          </div>

          {/* Búsqueda */}
          <div style={{ marginBottom: 12 }}>
            <Input
              placeholder="Buscar producto o lote..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              leftIcon={<MagnifyingGlassIcon width={18} height={18} />}
              rightAddon={busqueda ? (
                <button type="button" onClick={() => setBusqueda('')}
                  style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '0 10px', cursor: 'pointer',
                    color: 'var(--text-2)', display: 'flex', alignItems: 'center',
                  }}>
                  <XMarkIcon width={16} height={16} />
                </button>
              ) : undefined}
            />
          </div>

          {/* Chips filtro */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 16,
            overflowX: 'auto', paddingBottom: 4,
          }}>
            {filtros.map(f => (
              <FilterChip key={f} activo={filtro === f} nivel={f === 'todos' ? undefined : f}
                onClick={() => setFiltro(f)}>
                {f === 'todos' ? 'Todos' : etiquetaNivel(f)}
              </FilterChip>
            ))}
          </div>

          {/* Lista */}
          {vista === 'productos' ? (
            productosFiltrados.length === 0 ? (
              <EmptyState icon={<ArchiveBoxIcon width={32} height={32} />} title="Sin resultados"
                description="Probá cambiar la búsqueda o los filtros." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {productosFiltrados.map(p => (
                  <ProductoCard key={p.producto.id} p={p}
                    onClick={() => history.push(`/producto/${p.producto.id}`)} />
                ))}
              </div>
            )
          ) : (
            lotesFiltrados.length === 0 ? (
              <EmptyState icon={<TagIcon width={32} height={32} />} title="Sin resultados"
                description="Probá cambiar la búsqueda o los filtros." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lotesFiltrados.map(l => (
                  <LoteRow key={l.id} lote={l} onClick={() => history.push(`/lote/${l.id}`)} />
                ))}
              </div>
            )
          )}

          {/* FAB nuevo producto */}
          <button
            type="button"
            onClick={() => history.push('/producto/nuevo')}
            style={{
              position: 'fixed', right: 16,
              bottom: 'calc(96px + env(safe-area-inset-bottom))',
              width: 52, height: 52, borderRadius: 'var(--radius-md)',
              background: 'var(--surface)', border: '1px solid var(--brand-300)',
              color: 'var(--brand-600)', cursor: 'pointer',
              boxShadow: 'var(--shadow-lg)', zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Nuevo producto"
          >
            <CubeIcon width={24} height={24} />
            <PlusIcon width={14} height={14} style={{ position: 'absolute', top: 8, right: 8 }} />
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

// ─── Subcomponentes ─────────────────────────────────────────────────────
const SegBtn: React.FC<{ activa: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> =
  ({ activa, onClick, icon, children }) => (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, padding: '9px 12px', border: 'none',
        background: activa ? 'var(--surface)' : 'transparent',
        color: activa ? 'var(--text)' : 'var(--text-2)',
        borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: activa ? 'var(--shadow-xs)' : 'none',
        transition: 'all 150ms',
      }}>
      {icon}{children}
    </button>
  );

const FilterChip: React.FC<{ activo: boolean; nivel?: NivelAlerta; onClick: () => void; children: React.ReactNode }> =
  ({ activo, nivel, onClick, children }) => (
    <button type="button" onClick={onClick}
      style={{
        padding: '6px 14px', fontSize: 13, borderRadius: 'var(--radius-full)',
        border: '1px solid ' + (activo ? 'var(--brand-500)' : 'var(--border)'),
        background: activo ? 'var(--brand-500)' : 'var(--surface)',
        color: activo ? '#fff' : 'var(--text-2)',
        cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
        flexShrink: 0, fontFamily: 'inherit', display: 'flex',
        alignItems: 'center', gap: 6, transition: 'all 150ms',
      }}>
      {nivel && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: activo ? '#fff' : `var(--level-${nivel}-fg)`,
        }} />
      )}
      {children}
    </button>
  );

const ProductoCard: React.FC<{ p: ProductoConLotes; onClick: () => void }> = ({ p, onClick }) => (
  <Card padding="sm" onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 4, height: 52, background: colorNivel(p.nivelPeor), borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, letterSpacing: '-0.011em' }}>
          {p.producto.nombre}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
          {p.producto.categoria} · {formatearMoneda(p.producto.precio)} c/u
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NivelBadge nivel={p.nivelPeor} />
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
            {p.cantidadTotal} unid · {p.lotes.length} lote{p.lotes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {formatearMoneda(p.valorTotal)}
        </div>
        {p.proximoVencimiento && (
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            {formatearFecha(p.proximoVencimiento)}
          </div>
        )}
      </div>
    </div>
  </Card>
);

const LoteRow: React.FC<{ lote: LoteConProducto; onClick: () => void }> = ({ lote, onClick }) => (
  <Card padding="sm" onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 4, height: 48, background: colorNivel(lote.nivelAlerta), borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, letterSpacing: '-0.011em' }}>
          {lote.productoNombre}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
          {lote.cantidad} unid.{lote.numeroLote ? ` · Lote ${lote.numeroLote}` : ''}{lote.proveedor ? ` · ${lote.proveedor}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NivelBadge nivel={lote.nivelAlerta} />
          <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>
            {textoEstado(lote.fechaVencimiento)}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{formatearFecha(lote.fechaVencimiento)}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {formatearMoneda(lote.valorLote)}
        </div>
      </div>
    </div>
  </Card>
);

export default StockPage;
