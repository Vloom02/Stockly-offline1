import React, { useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import {
  BanknotesIcon, TrashIcon, HeartIcon, CheckIcon,
} from '@heroicons/react/24/outline';
import {
  useStore, formatearFecha, colorNivel,
  calcularNivelAlerta, textoEstado,
} from '../context/StoreContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { NivelBadge } from '../components/ui/Badge';
import { Header } from './ProductoPage';

interface RouteParams { id?: string; }

const LotePage: React.FC = () => {
  const { state, addLote, updateLote, retirarLote } = useStore();
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
  const esNuevo = id === 'nuevo' || !id;
  const loteId = !esNuevo ? id : undefined;

  const productoIdInicial = new URLSearchParams(location.search).get('productoId');
  const loteExistente = loteId ? state.lotes.find(l => l.id === loteId) : undefined;

  const [productoId, setProductoId] = useState<string>(
    loteExistente?.productoId ?? (productoIdInicial || '')
  );
  const [cantidad, setCantidad] = useState(loteExistente?.cantidad.toString() || '1');
  const [fechaVencimiento, setFechaVencimiento] = useState(loteExistente?.fechaVencimiento || fechaTresMeses());
  const [diasAviso, setDiasAviso] = useState(loteExistente?.diasAviso.toString() || '');
  const [proveedor, setProveedor] = useState(loteExistente?.proveedor || '');
  const [numeroLote, setNumeroLote] = useState(loteExistente?.numeroLote || '');

  const [showRetirar, setShowRetirar] = useState(false);
  const [tipoRetiro, setTipoRetiro] = useState<'retiro_venta' | 'retiro_vencido' | 'retiro_roto'>('retiro_venta');
  const [cantRetirar, setCantRetirar] = useState('');
  const [notasRetiro, setNotasRetiro] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });

  const producto = productoId ? state.productos.find(p => p.id === productoId) : undefined;
  const diasAvisoEf = diasAviso ? parseInt(diasAviso, 10) : (producto?.diasAvisoDefault || 7);
  const nivel = fechaVencimiento ? calcularNivelAlerta(fechaVencimiento, diasAvisoEf) : 'ok';

  const handleGuardar = async () => {
    if (!productoId) { setToast({ show: true, msg: 'Elegí un producto' }); return; }
    const cant = parseInt(cantidad, 10);
    if (!Number.isFinite(cant) || cant <= 0) { setToast({ show: true, msg: 'Cantidad inválida' }); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento)) { setToast({ show: true, msg: 'Fecha inválida' }); return; }

    const datos = {
      productoId: productoId,
      sucursalId: state.sucursalActivaId,
      cantidad: cant,
      fechaVencimiento,
      diasAviso: diasAvisoEf,
      proveedor: proveedor.trim() || undefined,
      numeroLote: numeroLote.trim() || undefined,
    };
    if (loteExistente) await updateLote({ ...loteExistente, ...datos });
    else await addLote(datos);
    history.goBack();
  };

  const handleRetirar = async () => {
    if (!loteExistente?.id) return;
    const cant = parseInt(cantRetirar, 10);
    if (!Number.isFinite(cant) || cant <= 0 || cant > loteExistente.cantidad) {
      setToast({ show: true, msg: 'Cantidad inválida' }); return;
    }
    await retirarLote(loteExistente.id, tipoRetiro, cant, notasRetiro.trim() || undefined);
    history.goBack();
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 640, margin: '0 auto',
        }}>
          <Header title={esNuevo ? 'Nuevo lote' : 'Editar lote'} onBack={() => history.goBack()} />

          {/* Preview del nivel */}
          {fechaVencimiento && (
            <Card padding="md" style={{
              marginBottom: 16,
              background: `var(--level-${nivel}-bg)`,
              borderColor: `var(--level-${nivel}-border)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <NivelBadge nivel={nivel} size="md" />
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
                    {textoEstado(fechaVencimiento)}
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: colorNivel(nivel), letterSpacing: '-0.02em' }}>
                  {formatearFecha(fechaVencimiento)}
                </div>
              </div>
            </Card>
          )}

          <Card padding="md" style={{ marginBottom: 12 }}>
            <Field label="Producto" required>
              <Select value={productoId}
                onChange={e => setProductoId(e.target.value)}
                disabled={!!loteExistente}>
                <option value="">— Elegir producto —</option>
                {state.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
            </Field>
            {!loteExistente && (
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '-6px 0 12px' }}>
                ¿No está? <button type="button" onClick={() => history.push('/producto/nuevo')}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 12 }}>
                  Crear producto nuevo</button>
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Cantidad" required>
                <Input value={cantidad} onChange={e => setCantidad(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Días aviso">
                <Input value={diasAviso} onChange={e => setDiasAviso(e.target.value)} inputMode="numeric"
                  placeholder={producto?.diasAvisoDefault.toString()} />
              </Field>
            </div>

            <Field label="Fecha de vencimiento" required>
              <Input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Número de lote">
                <Input value={numeroLote} onChange={e => setNumeroLote(e.target.value)} placeholder="Opcional" />
              </Field>
              <Field label="Proveedor">
                <Input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Opcional" />
              </Field>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleGuardar}
              icon={<CheckIcon width={18} height={18} />} style={{ marginTop: 8 }}>
              {esNuevo ? 'Crear lote' : 'Guardar cambios'}
            </Button>
          </Card>

          {/* Retiros */}
          {loteExistente && (
            <Card padding="md">
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Retirar stock</h2>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 12px' }}>
                Registra venta, vencimiento o rotura. Queda en el historial.
              </p>
              {!showRetirar ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <RetiroBtn icon={<BanknotesIcon width={20} height={20} />} label="Venta" color="var(--brand-600)"
                    onClick={() => { setTipoRetiro('retiro_venta'); setShowRetirar(true); }} />
                  <RetiroBtn icon={<TrashIcon width={20} height={20} />} label="Vencido" color="var(--danger)"
                    onClick={() => { setTipoRetiro('retiro_vencido'); setCantRetirar(loteExistente.cantidad.toString()); setShowRetirar(true); }} />
                  <RetiroBtn icon={<HeartIcon width={20} height={20} />} label="Roto" color="var(--warning)"
                    onClick={() => { setTipoRetiro('retiro_roto'); setShowRetirar(true); }} />
                </div>
              ) : (
                <>
                  <Field label={`Cantidad a retirar (máx. ${loteExistente.cantidad})`}>
                    <Input value={cantRetirar} onChange={e => setCantRetirar(e.target.value)} inputMode="numeric" />
                  </Field>
                  <Field label="Notas">
                    <Input value={notasRetiro} onChange={e => setNotasRetiro(e.target.value)}
                      placeholder="Ej: Cliente X, factura 123..." />
                  </Field>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" size="md" fullWidth
                      onClick={() => { setShowRetirar(false); setCantRetirar(''); setNotasRetiro(''); }}>
                      Cancelar</Button>
                    <Button variant="primary" size="md" fullWidth onClick={handleRetirar}>
                      Confirmar</Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>

        <IonToast isOpen={toast.show} message={toast.msg} duration={2500}
          onDidDismiss={() => setToast({ show: false, msg: '' })} />
      </IonContent>
    </IonPage>
  );
};

const RetiroBtn: React.FC<{ icon: React.ReactNode; label: string; color: string; onClick: () => void }> =
  ({ icon, label, color, onClick }) => (
    <button type="button" onClick={onClick}
      style={{
        background: 'var(--surface-2)', border: `1px solid var(--border)`,
        borderRadius: 'var(--radius)', padding: 12, color,
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, fontFamily: 'inherit',
        fontWeight: 600, fontSize: 12, transition: 'all 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
      {icon}{label}
    </button>
  );

function fechaTresMeses(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export default LotePage;
