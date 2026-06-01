import React, { useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  BuildingStorefrontIcon, PencilIcon, PlusIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../context/StoreContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Header } from './ProductoPage';

const SucursalesPage: React.FC = () => {
  const { state, addSucursal, updateSucursal, setSucursalActiva } = useStore();
  const history = useHistory();

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDir, setNuevaDir] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDir, setEditDir] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });

  const crear = async () => {
    if (!nuevoNombre.trim()) { setToast({ show: true, msg: 'Nombre obligatorio' }); return; }
    await addSucursal({ nombre: nuevoNombre.trim(), direccion: nuevaDir.trim() || undefined });
    setNuevoNombre(''); setNuevaDir('');
    setToast({ show: true, msg: 'Sucursal creada' });
  };

  const editar = async (id: string) => {
    if (!editNombre.trim()) return;
    const s = state.sucursales.find(x => x.id === id);
    if (!s) return;
    await updateSucursal({ ...s, nombre: editNombre.trim(), direccion: editDir.trim() || undefined });
    setEditando(null);
    setToast({ show: true, msg: 'Actualizada' });
  };

  const seleccionar = (id: string) => {
    setSucursalActiva(id);
    setToast({ show: true, msg: 'Sucursal cambiada' });
    setTimeout(() => history.push('/dashboard'), 700);
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div className="animate-fade-in" style={{
          padding: '20px 16px calc(96px + env(safe-area-inset-bottom)) 16px',
          maxWidth: 640, margin: '0 auto',
        }}>
          <Header title="Sucursales" onBack={() => history.goBack()} />

          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
            El stock se gestiona por sucursal. Cambiá la activa para ver o cargar productos en otra.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {state.sucursales.map(s => {
              const activa = s.id === state.sucursalActivaId;
              const enEd = editando === s.id;
              return (
                <Card key={s.id} padding="md"
                  style={{ borderColor: activa ? 'var(--brand-300)' : 'var(--border)' }}>
                  {enEd ? (
                    <>
                      <Field label="Nombre">
                        <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                      </Field>
                      <Field label="Dirección">
                        <Input value={editDir} onChange={e => setEditDir(e.target.value)} />
                      </Field>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => setEditando(null)}>Cancelar</Button>
                        <Button variant="primary" size="sm" fullWidth onClick={() => editar(s.id!)}>Guardar</Button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius)',
                        background: activa ? 'var(--brand-50)' : 'var(--surface-2)',
                        color: activa ? 'var(--brand-600)' : 'var(--text-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <BuildingStorefrontIcon width={20} height={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{s.nombre}</span>
                          {activa && <Badge variant="success" size="sm">Activa</Badge>}
                        </div>
                        {s.direccion && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{s.direccion}</div>}
                      </div>
                      {!activa && (
                        <Button variant="secondary" size="sm" onClick={() => seleccionar(s.id!)}>Usar</Button>
                      )}
                      <button type="button"
                        onClick={() => { setEditando(s.id!); setEditNombre(s.nombre); setEditDir(s.direccion || ''); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-3)', padding: 6, display: 'flex',
                        }}>
                        <PencilIcon width={18} height={18} />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Nueva sucursal</h2>
          <Card padding="md">
            <Field label="Nombre">
              <Input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                placeholder="Ej: Sucursal Norte" />
            </Field>
            <Field label="Dirección">
              <Input value={nuevaDir} onChange={e => setNuevaDir(e.target.value)} placeholder="Opcional" />
            </Field>
            <Button variant="primary" size="md" fullWidth onClick={crear}
              icon={<PlusIcon width={18} height={18} />}>Crear sucursal</Button>
          </Card>
        </div>

        <IonToast isOpen={toast.show} message={toast.msg} duration={1500}
          onDidDismiss={() => setToast({ show: false, msg: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default SucursalesPage;
