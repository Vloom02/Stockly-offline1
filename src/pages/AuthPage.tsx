import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  EnvelopeIcon, LockClosedIcon, UserIcon, BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { haptic } from '../utils/haptics';

type Modo = 'login' | 'registro';

const AuthPage: React.FC = () => {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState<Modo>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreComercio, setNombreComercio] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const submit = async () => {
    setError('');
    setExito('');

    if (!email.trim() || !password) {
      setError('Completá email y contraseña');
      return;
    }

    setCargando(true);
    try {
      if (modo === 'login') {
        const { error } = await iniciarSesion(email.trim(), password);
        if (error) { setError(error); haptic.warning(); }
        else haptic.success();
      } else {
        if (!nombre.trim() || !nombreComercio.trim()) {
          setError('Completá tu nombre y el del comercio');
          setCargando(false);
          return;
        }
        const { error } = await registrarse(email.trim(), password, nombre.trim(), nombreComercio.trim());
        if (error) {
          setError(error);
          haptic.warning();
        } else {
          haptic.success();
          setExito('¡Cuenta creada! Revisá tu email si pide confirmación, o ya podés iniciar sesión.');
          setModo('login');
        }
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--bg)' } as any}>
        <div style={{
          minHeight: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'calc(40px + env(safe-area-inset-top)) 24px calc(40px + env(safe-area-inset-bottom))',
          maxWidth: 420, margin: '0 auto',
        }}>
          {/* Logo y título */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', marginBottom: 16 }}>
              <Logo size={48} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
              {modo === 'login' ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
              {modo === 'login'
                ? 'Ingresá para gestionar tu stock'
                : 'Empezá a controlar tus vencimientos hoy'}
            </p>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="animate-slide-up" style={{
              background: 'var(--level-vencido-bg)', color: 'var(--level-vencido-fg)',
              border: '1px solid var(--level-vencido-border)',
              borderRadius: 'var(--radius)', padding: 12, fontSize: 13,
              marginBottom: 16, fontWeight: 500,
            }}>{error}</div>
          )}
          {exito && (
            <div className="animate-slide-up" style={{
              background: 'var(--level-ok-bg)', color: 'var(--level-ok-fg)',
              border: '1px solid var(--level-ok-border)',
              borderRadius: 'var(--radius)', padding: 12, fontSize: 13,
              marginBottom: 16, fontWeight: 500,
            }}>{exito}</div>
          )}

          {/* Form */}
          {modo === 'registro' && (
            <>
              <Field label="Tu nombre">
                <Input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  leftIcon={<UserIcon width={18} height={18} />} />
              </Field>
              <Field label="Nombre del comercio">
                <Input value={nombreComercio} onChange={e => setNombreComercio(e.target.value)}
                  placeholder="Almacén Don Juan"
                  leftIcon={<BuildingStorefrontIcon width={18} height={18} />} />
              </Field>
            </>
          )}

          <Field label="Email">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoCapitalize="off"
              leftIcon={<EnvelopeIcon width={18} height={18} />} />
          </Field>

          <Field label="Contraseña" hint={modo === 'registro' ? 'Mínimo 6 caracteres' : undefined}>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<LockClosedIcon width={18} height={18} />}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          </Field>

          <Button variant="primary" size="lg" fullWidth onClick={submit}
            loading={cargando} style={{ marginTop: 8 }}>
            {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>

          {/* Cambiar modo */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-2)' }}>
            {modo === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button type="button"
              onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); setExito(''); }}
              style={{
                background: 'none', border: 'none', color: 'var(--brand-600)',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
              }}>
              {modo === 'login' ? 'Registrate gratis' : 'Iniciá sesión'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 32 }}>
            Stockly · 14 días de prueba gratis
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuthPage;
