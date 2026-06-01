import React, { useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon, QrCodeIcon, PlusIcon, TrashIcon, CubeIcon,
} from '@heroicons/react/24/outline';
import {
  useStore, CATEGORIAS, DIAS_AVISO_DEFAULT,
  formatearFecha, colorNivel,
  calcularNivelAlerta, textoEstado,
} from '../context/StoreContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { NivelBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ScannerModal from '../components/ScannerModal';

interface RouteParams { id?: string; }

const ProductoPage: React.FC = () => {
  const { state, addProducto, updateProducto, deleteProducto, fefoSugeridos, buscarProductoPorCodigo } = useStore();
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const esNuevo = id === 'nuevo' || !id;
  const productoId = !esNuevo ? id : undefined;

  const productoExistente = productoId ? state.productos.find(p => p.id === productoId) : undefined;

  const [nombre, setNombre] = useState(productoExistente?.nombre || '');
  const [codigoBarras, setCodigoBarras] = useState(productoExistente?.codigoBarras || '');
  const [categoria, setCategoria] = useState(productoExistente?.categoria || '');
  const [precio, setPrecio] = useState(productoExistente?.precio.toString() || '0');
  const [diasAviso, setDiasAviso] = useState(
    productoExistente?.diasAvisoDefault.toString() || DIAS_AVISO_DEFAULT().toString()
  );
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [showScanner, setShowScanner] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const lotes = productoId ? fefoSugeridos(productoId) : [];

  const handleGuardar = async () => {
    if (!nombre.trim()) { setToast({ show: true, msg: 'El nombre es obligatorio' }); return; }
    if (codigoBarras.trim()) {
      const ex = buscarProductoPorCodigo(codigoBarras.trim());
      if (ex && ex.id !== productoId) { setToast({ show: true, msg: 'Ya existe un producto con ese código' }); return; }
    }
    const datos = {
      nombre: nombre.trim(),
      codigoBarras: codigoBarras.trim() || undefined,
      categoria: categoria.trim() || 'Sin categoría',
      precio: parseFloat(precio) || 0,
      diasAvisoDefault: parseInt(diasAviso, 10) || 7,
    };
    if (productoExistente) {
      await updateProducto({ ...productoExistente, ...datos });
      history.goBack();
    } else {
      const nuevoId = await addProducto(datos);
      history.replace(`/lote/nuevo?productoId=${nuevoId}`);
    }
  };

  const handleEliminar = async () => {
    if (!productoExistente?.id) return;
    if (lotes.length > 0) { setToast({ show: true, msg: 'Eliminá primero todos los lotes' }); return; }
    if (!confirmarBorrado) {
      setConfirmarBorrado(true);
      setToast({ show: true, msg: 'Tocá de nuevo "Eliminar" para confirmar' });
      setTimeout(() => setConfirmarBorrado(false), 4000);
      return;
    }
    await deleteProducto(productoExistente.id);
    history.goBack();
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 640, margin: '0 auto',
        }}>
          <Header title={esNuevo ? 'Nuevo producto' : 'Editar producto'} onBack={() => history.goBack()} />

          <Card padding="md" style={{ marginBottom: 16 }}>
            <Field label="Nombre del producto" required>
              <Input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Leche La Serenísima 1L" />
            </Field>

            <Field label="Código de barras">
              <Input
                value={codigoBarras}
                onChange={e => setCodigoBarras(e.target.value)}
                inputMode="numeric"
                placeholder="Opcional"
                leftIcon={<QrCodeIcon width={18} height={18} />}
                rightAddon={
                  <Button variant="primary" size="md" onClick={() => setShowScanner(true)}
                    icon={<QrCodeIcon width={18} height={18} />} style={{ padding: '0 14px' }} />
                }
              />
            </Field>

            <Field label="Categoría">
              <Select value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="">— Sin categoría —</option>
                {CATEGORIAS().map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Precio unitario ($)">
                <Input value={precio} onChange={e => setPrecio(e.target.value)} inputMode="decimal" />
              </Field>
              <Field label="Días aviso default" hint="Anticipación">
                <Input value={diasAviso} onChange={e => setDiasAviso(e.target.value)} inputMode="numeric" />
              </Field>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleGuardar}
              icon={<PlusIcon width={18} height={18} />} style={{ marginTop: 8 }}>
              {esNuevo ? 'Crear producto' : 'Guardar cambios'}
            </Button>
          </Card>

          {/* Lotes FEFO */}
          {productoExistente && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Lotes</h2>
                <Button variant="secondary" size="sm"
                  onClick={() => history.push(`/lote/nuevo?productoId=${productoExistente.id}`)}
                  icon={<PlusIcon width={16} height={16} />}>Nuevo lote</Button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 12px' }}>
                Ordenados por FEFO · vendé primero los de arriba
              </p>

              {lotes.length === 0 ? (
                <EmptyState icon={<CubeIcon width={28} height={28} />} title="Sin lotes cargados"
                  description="Agregá un lote con su fecha de vencimiento." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {lotes.map((l, i) => {
                    const nivel = calcularNivelAlerta(l.fechaVencimiento, l.diasAviso);
                    return (
                      <Card key={l.id} padding="sm" onClick={() => history.push(`/lote/${l.id}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                            background: colorNivel(nivel), color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, flexShrink: 0,
                          }}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {l.cantidad} unid.{l.numeroLote ? ` · Lote ${l.numeroLote}` : ''}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <NivelBadge nivel={nivel} />
                              <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 8 }}>
                                {textoEstado(l.fechaVencimiento)}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{formatearFecha(l.fechaVencimiento)}</div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              <Button variant="ghost" size="md" fullWidth onClick={handleEliminar}
                icon={<TrashIcon width={16} height={16} />}
                style={{ color: 'var(--danger)' }}>
                Eliminar producto
              </Button>
            </>
          )}
        </div>

        {showScanner && (
          <ScannerModal
            onCodigoDetectado={(c) => { setCodigoBarras(c); setShowScanner(false); }}
            onCancel={() => setShowScanner(false)}
          />
        )}

        <IonToast isOpen={toast.show} message={toast.msg} duration={2500}
          onDidDismiss={() => setToast({ show: false, msg: '' })} />
      </IonContent>
    </IonPage>
  );
};

export const Header: React.FC<{ title: string; onBack: () => void; action?: React.ReactNode }> =
  ({ title, onBack, action }) => (
    <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <button type="button" onClick={onBack}
        style={{
          width: 40, height: 40, borderRadius: 'var(--radius)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text)', flexShrink: 0,
        }}>
        <ArrowLeftIcon width={20} height={20} />
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1, letterSpacing: '-0.02em' }}>{title}</h1>
      {action}
    </header>
  );

export default ProductoPage;
