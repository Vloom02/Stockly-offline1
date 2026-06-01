import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Comercio, Miembro } from '../types';

interface AuthContextValue {
  session: Session | null;
  comercio: Comercio | null;
  miembro: Miembro | null;
  cargando: boolean;
  registrarse: (email: string, password: string, nombre: string, nombreComercio: string) => Promise<{ error?: string }>;
  iniciarSesion: (email: string, password: string) => Promise<{ error?: string }>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar comercio + membresía del usuario logueado
  const cargarDatosUsuario = async (userId: string) => {
    const { data: miembros } = await supabase
      .from('miembros')
      .select('*, comercios(*)')
      .eq('user_id', userId)
      .limit(1);

    if (miembros && miembros.length > 0) {
      const m = miembros[0] as any;
      const miembroData = {
        id: m.id,
        userId: m.user_id,
        comercioId: m.comercio_id,
        rol: m.rol,
        nombre: m.nombre,
      };
      setMiembro(miembroData);
      try { localStorage.setItem('stockly:cache-miembro', JSON.stringify(miembroData)); } catch { /* */ }

      if (m.comercios) {
        const comercioData = {
          id: m.comercios.id,
          nombre: m.comercios.nombre,
          plan: m.comercios.plan,
          trialHasta: m.comercios.trial_hasta,
        };
        setComercio(comercioData);
        try { localStorage.setItem('stockly:cache-comercio', JSON.stringify(comercioData)); } catch { /* */ }
      }
    }
  };

  // Respaldo offline: cargar comercio/miembro del caché si no hay red
  const cargarDesdeCache = () => {
    try {
      const c = localStorage.getItem('stockly:cache-comercio');
      const m = localStorage.getItem('stockly:cache-miembro');
      if (c) setComercio(JSON.parse(c));
      if (m) setMiembro(JSON.parse(m));
    } catch { /* */ }
  };

  useEffect(() => {
    let montado = true;

    // Timeout de seguridad: si en 8s no resolvió, dejamos de cargar igual
    // (evita spinner infinito si no hay internet al abrir)
    const timeoutId = setTimeout(() => {
      if (montado) setCargando(false);
    }, 8000);

    // Sesión inicial
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!montado) return;
        setSession(session);
        if (session?.user) {
          try {
            await cargarDatosUsuario(session.user.id);
          } catch (e) {
            // Sin internet o error al traer datos: usamos el caché local
            // así la app abre igual (offline-first)
            console.warn('No se pudieron cargar datos del usuario al inicio, usando caché', e);
            cargarDesdeCache();
          }
        }
      })
      .catch((e) => {
        console.warn('Error obteniendo sesión', e);
      })
      .finally(() => {
        if (montado) {
          clearTimeout(timeoutId);
          setCargando(false);
        }
      });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!montado) return;
      setSession(session);
      if (session?.user) {
        try {
          await cargarDatosUsuario(session.user.id);
        } catch (e) {
          console.warn('No se pudieron cargar datos del usuario', e);
        }
      } else {
        setComercio(null);
        setMiembro(null);
      }
    });

    return () => {
      montado = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const registrarse = async (email: string, password: string, nombre: string, nombreComercio: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, nombre_comercio: nombreComercio },
      },
    });
    if (error) return { error: traducirError(error.message) };
    return {};
  };

  const iniciarSesion = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: traducirError(error.message) };
    return {};
  };

  const cerrarSesion = async () => {
    // Limpiar caché local primero (esto siempre funciona)
    try {
      const { limpiarTodoLocal } = await import('../lib/localDb');
      await limpiarTodoLocal();
    } catch { /* */ }
    try {
      localStorage.removeItem('stockly:cache-comercio');
      localStorage.removeItem('stockly:cache-miembro');
    } catch { /* */ }
    // Intentar signOut en la nube, pero sin bloquear si no hay internet
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch { /* */ }
    // Pase lo que pase, limpiamos el estado local → vuelve al login
    setSession(null);
    setComercio(null);
    setMiembro(null);
  };

  return (
    <AuthContext.Provider value={{
      session, comercio, miembro, cargando,
      registrarse, iniciarSesion, cerrarSesion,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

// Traducir errores comunes de Supabase al español
function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos';
  if (msg.includes('User already registered')) return 'Ese email ya está registrado';
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres';
  if (msg.includes('Unable to validate email')) return 'El email no es válido';
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de iniciar sesión';
  return msg;
}
