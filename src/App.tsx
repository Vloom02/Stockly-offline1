import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import ProductoPage from './pages/ProductoPage';
import LotePage from './pages/LotePage';
import MovimientosPage from './pages/MovimientosPage';
import ReportesPage from './pages/ReportesPage';
import SucursalesPage from './pages/SucursalesPage';
import ConfigPage from './pages/ConfigPage';
import AuthPage from './pages/AuthPage';
import TabBar from './components/TabBar';
import Onboarding from './components/Onboarding';
import Logo from './components/ui/Logo';

import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, getSetting, setSetting } from './context/StoreContext';
import { supabaseConfigurado } from './lib/supabase';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

// ─── App autenticada (con datos) ──────────────────────────────────────────
const AppAutenticada: React.FC<{ isDark: boolean; onThemeToggle: () => void }> = ({ isDark, onThemeToggle }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (getSetting('onboarding-visto', '') !== 'si') setShowOnboarding(true);
  }, []);

  const completar = () => { setSetting('onboarding-visto', 'si'); setShowOnboarding(false); };

  return (
    <StoreProvider>
      {showOnboarding && <Onboarding onComplete={completar} />}
      <IonReactRouter>
        <IonRouterOutlet id="main">
          <Route path="/dashboard" exact><DashboardPage /></Route>
          <Route path="/stock" exact><StockPage /></Route>
          <Route path="/producto/:id" exact><ProductoPage /></Route>
          <Route path="/lote/:id" exact><LotePage /></Route>
          <Route path="/movimientos" exact><MovimientosPage /></Route>
          <Route path="/reportes" exact><ReportesPage /></Route>
          <Route path="/sucursales" exact><SucursalesPage /></Route>
          <Route path="/config" exact><ConfigPage onThemeToggle={onThemeToggle} isDark={isDark} /></Route>
          <Route path="/" exact><Redirect to="/dashboard" /></Route>
        </IonRouterOutlet>
        <TabBar />
      </IonReactRouter>
    </StoreProvider>
  );
};

// ─── Pantalla de carga ──────────────────────────────────────────────────────
const Cargando: React.FC = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)',
  }}>
    <Logo size={56} />
    <div style={{
      width: 24, height: 24, border: '3px solid var(--surface-3)',
      borderTopColor: 'var(--brand-500)', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  </div>
);

// ─── Router de auth ───────────────────────────────────────────────────────
const Router: React.FC<{ isDark: boolean; onThemeToggle: () => void }> = ({ isDark, onThemeToggle }) => {
  const { session, cargando } = useAuth();

  if (cargando) return <Cargando />;
  if (!session) {
    return (
      <IonReactRouter>
        <IonRouterOutlet>
          <Route><AuthPage /></Route>
        </IonRouterOutlet>
      </IonReactRouter>
    );
  }
  return <AppAutenticada isDark={isDark} onThemeToggle={onThemeToggle} />;
};

// ─── Error si falta configuración ─────────────────────────────────────────
const SinConfig: React.FC = () => (
  <div style={{ padding: 32, maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
    <Logo size={48} />
    <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>Falta configurar Supabase</h1>
    <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
      Creá un archivo <code>.env</code> en la raíz del proyecto con tus claves de Supabase.
      Mirá las instrucciones en <code>supabase/SETUP.md</code>.
    </p>
  </div>
);

const App: React.FC = () => {
  const [isDark, setDark] = useState(false);

  useEffect(() => {
    const saved = getSetting('theme', '');
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(dark);
    document.body.classList.toggle('dark', dark);
  }, []);

  const onThemeToggle = () => {
    const next = !isDark;
    setDark(next);
    document.body.classList.toggle('dark', next);
    setSetting('theme', next ? 'dark' : 'light');
  };

  if (!supabaseConfigurado) {
    return <IonApp className={isDark ? 'dark' : ''}><SinConfig /></IonApp>;
  }

  return (
    <IonApp className={isDark ? 'dark' : ''}>
      <AuthProvider>
        <Router isDark={isDark} onThemeToggle={onThemeToggle} />
      </AuthProvider>
    </IonApp>
  );
};

export default App;
