import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useState, useRef } from 'react';
import {
  Producto, Lote, Sucursal, Movimiento,
  NivelAlerta, Resumen, ProductoConLotes, LoteConProducto,
  PerdidaMensual, DistribucionCategoria, DiaVencimiento,
} from '../types';
import { haptic } from '../utils/haptics';
import { useAuth } from './AuthContext';
import {
  abrirDB, put, del, encolar,
  cargarProductos, cargarLotes, cargarSucursales, cargarMovimientos,
  obtenerPendientes,
} from '../lib/localDb';
import { sincronizar } from '../lib/sync';
import { supabaseConfigurado } from '../lib/supabase';

// ─── Settings locales ───────────────────────────────────────────────────────
const LS_PREFIX = 'stockly:';
export function getSetting(k: string, def = ''): string {
  try { return localStorage.getItem(LS_PREFIX + k) ?? def; } catch { return def; }
}
export function setSetting(k: string, v: string): void {
  try { localStorage.setItem(LS_PREFIX + k, v); } catch { /* */ }
}

export const UMBRAL_AVISO = () => parseInt(getSetting('umbral-aviso', '60'), 10) || 60;
export const UMBRAL_URGENTE = () => parseInt(getSetting('umbral-urgente', '30'), 10) || 30;
export const UMBRAL_CRITICO = () => parseInt(getSetting('umbral-critico', '7'), 10) || 7;
export const DIAS_AVISO_DEFAULT = () => parseInt(getSetting('dias-aviso-default', '15'), 10) || 15;
export const CATEGORIAS = () =>
  getSetting('categorias', 'Lácteos\nBebidas\nAlmacén\nLimpieza\nMedicamentos\nFiambres\nPanadería\nSnacks\nOtros')
    .split('\n').map(c => c.trim()).filter(Boolean);

// ─── Helpers ────────────────────────────────────────────────────────────────
export function diasRestantes(fechaVencimiento: string, hoy: Date = new Date()): number {
  const venc = new Date(fechaVencimiento + 'T00:00:00');
  const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((venc.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
}
export function calcularNivelAlerta(fechaVencimiento: string, diasAviso?: number): NivelAlerta {
  const dias = diasRestantes(fechaVencimiento);
  if (dias < 0) return 'vencido';
  if (dias <= UMBRAL_CRITICO()) return 'critico';
  if (dias <= UMBRAL_URGENTE()) return 'urgente';
  const umbralAviso = diasAviso ?? UMBRAL_AVISO();
  if (dias <= umbralAviso) return 'aviso';
  return 'ok';
}
export function colorNivel(n: NivelAlerta): string { return `var(--level-${n}-fg)`; }
export function etiquetaNivel(n: NivelAlerta): string {
  return { vencido: 'Vencido', critico: 'Crítico', urgente: 'Urgente', aviso: 'Aviso', ok: 'OK' }[n];
}
export function ordenNivel(n: NivelAlerta): number {
  return ['vencido', 'critico', 'urgente', 'aviso', 'ok'].indexOf(n);
}
export function formatearFecha(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}
export function formatearMoneda(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
export function textoEstado(fechaVencimiento: string): string {
  const d = diasRestantes(fechaVencimiento);
  if (d < 0) return `Vencido hace ${-d} día${-d === 1 ? '' : 's'}`;
  if (d === 0) return 'Vence hoy';
  if (d === 1) return 'Vence mañana';
  return `Vence en ${d} días`;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

// ─── Estado ─────────────────────────────────────────────────────────────────
interface State {
  productos: Producto[];
  lotes: Lote[];
  sucursales: Sucursal[];
  movimientos: Movimiento[];
  sucursalActivaId: string;
  loaded: boolean;
  pendientesSync: number;
}
type Action =
  | { type: 'INIT'; productos: Producto[]; lotes: Lote[]; sucursales: Sucursal[]; movimientos: Movimiento[]; sucursalActivaId: string }
  | { type: 'SET_SUCURSAL_ACTIVA'; id: string }
  | { type: 'UPSERT_PRODUCTO'; producto: Producto }
  | { type: 'REMOVE_PRODUCTO'; id: string }
  | { type: 'UPSERT_LOTE'; lote: Lote }
  | { type: 'REMOVE_LOTE'; id: string }
  | { type: 'UPSERT_SUCURSAL'; sucursal: Sucursal }
  | { type: 'PREPEND_MOVIMIENTO'; movimiento: Movimiento }
  | { type: 'SET_PENDIENTES'; n: number };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'INIT': return { ...state, ...a, loaded: true };
    case 'SET_SUCURSAL_ACTIVA': return { ...state, sucursalActivaId: a.id };
    case 'UPSERT_PRODUCTO': {
      const ex = state.productos.some(p => p.id === a.producto.id);
      return { ...state, productos: ex ? state.productos.map(p => p.id === a.producto.id ? a.producto : p) : [...state.productos, a.producto] };
    }
    case 'REMOVE_PRODUCTO': return { ...state, productos: state.productos.filter(p => p.id !== a.id) };
    case 'UPSERT_LOTE': {
      const ex = state.lotes.some(l => l.id === a.lote.id);
      return { ...state, lotes: ex ? state.lotes.map(l => l.id === a.lote.id ? a.lote : l) : [...state.lotes, a.lote] };
    }
    case 'REMOVE_LOTE': return { ...state, lotes: state.lotes.filter(l => l.id !== a.id) };
    case 'UPSERT_SUCURSAL': {
      const ex = state.sucursales.some(s => s.id === a.sucursal.id);
      return { ...state, sucursales: ex ? state.sucursales.map(s => s.id === a.sucursal.id ? a.sucursal : s) : [...state.sucursales, a.sucursal] };
    }
    case 'PREPEND_MOVIMIENTO': return { ...state, movimientos: [a.movimiento, ...state.movimientos] };
    case 'SET_PENDIENTES': return { ...state, pendientesSync: a.n };
    default: return state;
  }
}

interface StoreContextValue {
  state: State;
  sincronizando: boolean;
  sincronizarAhora: () => Promise<void>;
  estadoNube: { configurado: boolean; ultimoError: string | null; ultimaSyncOk: string | null };
  addProducto: (p: Omit<Producto, 'id' | 'fechaCreacion' | 'activo' | 'comercioId'>) => Promise<string | null>;
  updateProducto: (p: Producto) => Promise<void>;
  deleteProducto: (id: string) => Promise<void>;
  buscarProductoPorCodigo: (codigo: string) => Producto | undefined;
  addLote: (l: Omit<Lote, 'id' | 'fechaIngreso' | 'retirado' | 'comercioId'>) => Promise<string | null>;
  updateLote: (l: Lote) => Promise<void>;
  retirarLote: (id: string, tipo: 'retiro_venta' | 'retiro_vencido' | 'retiro_roto', cantidad?: number, notas?: string) => Promise<void>;
  addSucursal: (s: Omit<Sucursal, 'id' | 'activa' | 'comercioId'>) => Promise<string | null>;
  updateSucursal: (s: Sucursal) => Promise<void>;
  setSucursalActiva: (id: string) => void;
  productosConLotes: () => ProductoConLotes[];
  lotesEnriquecidos: () => LoteConProducto[];
  resumen: () => Resumen;
  fefoSugeridos: (productoId: string) => Lote[];
  perdidasPorMes: (meses?: number) => PerdidaMensual[];
  distribucionPorCategoria: () => DistribucionCategoria[];
  vencimientosDelMes: (anio: number, mes: number) => Map<string, DiaVencimiento>;
  exportarBackup: () => string;
  importarBackup: (json: string) => Promise<{ ok: number; error: number }>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { comercio, miembro } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    productos: [], lotes: [], sucursales: [], movimientos: [],
    sucursalActivaId: '', loaded: false, pendientesSync: 0,
  });
  const [sincronizando, setSincronizando] = useState(false);
  const sincronizandoRef = useRef(false);
  const [estadoNube, setEstadoNube] = useState<{ configurado: boolean; ultimoError: string | null; ultimaSyncOk: string | null }>({
    configurado: supabaseConfigurado,
    ultimoError: null,
    ultimaSyncOk: null,
  });
  // Mantener el ref en sync con el estado, para usarlo en intervalos sin recrearlos
  useEffect(() => { sincronizandoRef.current = sincronizando; }, [sincronizando]);
  const estadoNubeRef = useRef(estadoNube);
  useEffect(() => { estadoNubeRef.current = estadoNube; }, [estadoNube]);

  const comercioId = comercio?.id;
  const usuario = miembro?.nombre || 'Usuario';

  const refrescarPendientes = useCallback(async () => {
    const p = await obtenerPendientes();
    dispatch({ type: 'SET_PENDIENTES', n: p.length });
  }, []);

  // Recargar estado desde IndexedDB (fuente de verdad local)
  const recargarLocal = useCallback(async () => {
    const [productos, lotes, sucursales, movimientos] = await Promise.all([
      cargarProductos(), cargarLotes(), cargarSucursales(), cargarMovimientos(),
    ]);
    const activos = productos.filter(p => p.activo);
    const lotesActivos = lotes.filter(l => !l.retirado);
    const sucursalesActivas = sucursales.filter(s => s.activa);
    movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha));

    const guardada = getSetting('sucursal-activa', '');
    const sucursalActivaId = sucursalesActivas.find(s => s.id === guardada)?.id || sucursalesActivas[0]?.id || '';

    dispatch({
      type: 'INIT',
      productos: activos, lotes: lotesActivos,
      sucursales: sucursalesActivas, movimientos, sucursalActivaId,
    });
  }, []);

  // ─── Init: abrir DB local, cargar, y sincronizar si hay internet ──────────
  useEffect(() => {
    if (!comercioId) {
      // Sin comercio aún (puede estar cargando la sesión o falló sin caché).
      // Abrimos la DB y marcamos como cargado para no quedar en skeleton infinito.
      (async () => {
        try { await abrirDB(); await recargarLocal(); } catch { /* */ }
      })();
      return;
    }
    (async () => {
      await abrirDB();
      await recargarLocal();   // mostrar lo local YA (instantáneo)
      await refrescarPendientes();

      // Sincronizar en segundo plano si hay internet
      if (navigator.onLine) {
        setSincronizando(true);
        try {
          await sincronizar(comercioId);
          await recargarLocal();
          await refrescarPendientes();
        } catch (e) {
          console.warn('Sync inicial falló', e);
        } finally {
          setSincronizando(false);
        }
      }
    })();
  }, [comercioId, recargarLocal, refrescarPendientes]);

  // ─── Sincronizar cuando vuelve internet ───────────────────────────────────
  useEffect(() => {
    if (!comercioId) return;
    const alVolver = async () => {
      setSincronizando(true);
      try {
        await sincronizar(comercioId);
        await recargarLocal();
        await refrescarPendientes();
      } finally {
        setSincronizando(false);
      }
    };
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [comercioId, recargarLocal, refrescarPendientes]);

  // ─── Sincronización periódica (cada 30s si hay internet) ──────────────────
  useEffect(() => {
    if (!comercioId) return;
    const intervalo = setInterval(async () => {
      if (!navigator.onLine || sincronizandoRef.current) return;
      try {
        await sincronizar(comercioId);
        await recargarLocal();
        await refrescarPendientes();
      } catch { /* */ }
    }, 30000);
    return () => clearInterval(intervalo);
  }, [comercioId, recargarLocal, refrescarPendientes]);

  const sincronizarAhora = useCallback(async () => {
    if (!comercioId || !navigator.onLine) return;
    if (sincronizandoRef.current) return; // evitar solapamiento
    sincronizandoRef.current = true;
    setSincronizando(true);
    try {
      const res = await sincronizar(comercioId);
      await recargarLocal();
      await refrescarPendientes();
      setEstadoNube({
        configurado: supabaseConfigurado,
        ultimoError: res.error,
        ultimaSyncOk: res.error ? estadoNubeRef.current.ultimaSyncOk : new Date().toISOString(),
      });
    } finally {
      sincronizandoRef.current = false;
      setSincronizando(false);
    }
  }, [comercioId, recargarLocal, refrescarPendientes]);

  // ─── Escritura: SIEMPRE local primero + encolar ───────────────────────────

  const registrarMovimiento = useCallback(async (m: Omit<Movimiento, 'id' | 'fecha' | 'usuario' | 'comercioId'>) => {
    if (!comercioId) return;
    const mov: Movimiento = {
      ...m, id: crypto.randomUUID(), comercioId,
      fecha: new Date().toISOString(), usuario,
    };
    await put('movimientos', mov);
    await encolar({ tabla: 'movimientos', operacion: 'insert', registroId: mov.id!, payload: mov });
    dispatch({ type: 'PREPEND_MOVIMIENTO', movimiento: mov });
    await refrescarPendientes();
  }, [comercioId, usuario, refrescarPendientes]);

  const addProducto = useCallback(async (p: Omit<Producto, 'id' | 'fechaCreacion' | 'activo' | 'comercioId'>) => {
    if (!comercioId) return null;
    const prod: Producto = {
      ...p, id: crypto.randomUUID(), comercioId,
      fechaCreacion: hoyISO(), activo: true,
    };
    await put('productos', prod);
    await encolar({ tabla: 'productos', operacion: 'insert', registroId: prod.id!, payload: prod });
    dispatch({ type: 'UPSERT_PRODUCTO', producto: prod });
    await registrarMovimiento({ productoId: prod.id!, sucursalId: state.sucursalActivaId, tipo: 'creacion', cantidad: 0, cantidadAnterior: 0, cantidadNueva: 0, notas: `Producto "${p.nombre}" creado` });
    sincronizarAhora();
    return prod.id!;
  }, [comercioId, state.sucursalActivaId, registrarMovimiento, sincronizarAhora]);

  const updateProducto = useCallback(async (p: Producto) => {
    await put('productos', p);
    await encolar({ tabla: 'productos', operacion: 'update', registroId: p.id!, payload: p });
    dispatch({ type: 'UPSERT_PRODUCTO', producto: p });
    await refrescarPendientes();
    sincronizarAhora();
  }, [refrescarPendientes, sincronizarAhora]);

  const deleteProducto = useCallback(async (id: string) => {
    const prod = state.productos.find(p => p.id === id);
    if (prod) await put('productos', { ...prod, activo: false });
    await encolar({ tabla: 'productos', operacion: 'delete', registroId: id, payload: { id } });
    await del('productos', id);
    dispatch({ type: 'REMOVE_PRODUCTO', id });
    await refrescarPendientes();
    sincronizarAhora();
  }, [state.productos, refrescarPendientes, sincronizarAhora]);

  const buscarProductoPorCodigo = useCallback((codigo: string) =>
    state.productos.find(p => p.codigoBarras === codigo), [state.productos]);

  const addLote = useCallback(async (l: Omit<Lote, 'id' | 'fechaIngreso' | 'retirado' | 'comercioId'>) => {
    if (!comercioId) return null;
    const lote: Lote = {
      ...l, id: crypto.randomUUID(), comercioId,
      fechaIngreso: hoyISO(), retirado: false,
    };
    await put('lotes', lote);
    await encolar({ tabla: 'lotes', operacion: 'insert', registroId: lote.id!, payload: lote });
    dispatch({ type: 'UPSERT_LOTE', lote });
    haptic.success();
    await registrarMovimiento({ loteId: lote.id, productoId: l.productoId, sucursalId: l.sucursalId, tipo: 'ingreso', cantidad: l.cantidad, cantidadAnterior: 0, cantidadNueva: l.cantidad, notas: `Ingreso de ${l.cantidad} unid.` });
    sincronizarAhora();
    return lote.id!;
  }, [comercioId, registrarMovimiento, sincronizarAhora]);

  const updateLote = useCallback(async (l: Lote) => {
    const anterior = state.lotes.find(x => x.id === l.id);
    const diff = l.cantidad - (anterior?.cantidad || 0);
    await put('lotes', l);
    await encolar({ tabla: 'lotes', operacion: 'update', registroId: l.id!, payload: l });
    dispatch({ type: 'UPSERT_LOTE', lote: l });
    if (diff !== 0) {
      await registrarMovimiento({ loteId: l.id, productoId: l.productoId, sucursalId: l.sucursalId, tipo: 'ajuste', cantidad: diff, cantidadAnterior: anterior?.cantidad || 0, cantidadNueva: l.cantidad, notas: `Ajuste (${diff > 0 ? '+' : ''}${diff})` });
    }
    await refrescarPendientes();
    sincronizarAhora();
  }, [state.lotes, registrarMovimiento, refrescarPendientes, sincronizarAhora]);

  const retirarLote = useCallback(async (id: string, tipo: 'retiro_venta' | 'retiro_vencido' | 'retiro_roto', cantidad?: number, notas?: string) => {
    const lote = state.lotes.find(l => l.id === id);
    if (!lote) return;
    const cantARetirar = cantidad ?? lote.cantidad;
    const cantNueva = Math.max(0, lote.cantidad - cantARetirar);
    const retirado = cantNueva === 0;
    const actualizado: Lote = { ...lote, cantidad: cantNueva, retirado };

    await put('lotes', actualizado);
    await encolar({ tabla: 'lotes', operacion: 'update', registroId: id, payload: actualizado });
    haptic.medium();
    if (retirado) dispatch({ type: 'REMOVE_LOTE', id });
    else dispatch({ type: 'UPSERT_LOTE', lote: actualizado });
    await registrarMovimiento({ loteId: id, productoId: lote.productoId, sucursalId: lote.sucursalId, tipo, cantidad: -cantARetirar, cantidadAnterior: lote.cantidad, cantidadNueva: cantNueva, notas });
    sincronizarAhora();
  }, [state.lotes, registrarMovimiento, sincronizarAhora]);

  const addSucursal = useCallback(async (s: Omit<Sucursal, 'id' | 'activa' | 'comercioId'>) => {
    if (!comercioId) return null;
    const suc: Sucursal = { ...s, id: crypto.randomUUID(), comercioId, activa: true };
    await put('sucursales', suc);
    await encolar({ tabla: 'sucursales', operacion: 'insert', registroId: suc.id!, payload: suc });
    dispatch({ type: 'UPSERT_SUCURSAL', sucursal: suc });
    await refrescarPendientes();
    sincronizarAhora();
    return suc.id!;
  }, [comercioId, refrescarPendientes, sincronizarAhora]);

  const updateSucursal = useCallback(async (s: Sucursal) => {
    await put('sucursales', s);
    await encolar({ tabla: 'sucursales', operacion: 'update', registroId: s.id!, payload: s });
    dispatch({ type: 'UPSERT_SUCURSAL', sucursal: s });
    await refrescarPendientes();
    sincronizarAhora();
  }, [refrescarPendientes, sincronizarAhora]);

  const setSucursalActiva = useCallback((id: string) => {
    setSetting('sucursal-activa', id);
    dispatch({ type: 'SET_SUCURSAL_ACTIVA', id });
  }, []);

  // ─── Vistas calculadas (idénticas a la versión cloud) ─────────────────────
  const productosConLotes = useCallback((): ProductoConLotes[] =>
    state.productos.map(producto => {
      const lotes = state.lotes.filter(l => l.productoId === producto.id && l.sucursalId === state.sucursalActivaId);
      const cantidadTotal = lotes.reduce((s, l) => s + l.cantidad, 0);
      let nivelPeor: NivelAlerta = 'ok';
      let proxVenc: string | undefined;
      for (const l of lotes) {
        const n = calcularNivelAlerta(l.fechaVencimiento, l.diasAviso);
        if (ordenNivel(n) < ordenNivel(nivelPeor)) nivelPeor = n;
        if (!proxVenc || l.fechaVencimiento < proxVenc) proxVenc = l.fechaVencimiento;
      }
      return { producto, lotes, cantidadTotal, valorTotal: cantidadTotal * producto.precio, nivelPeor, proximoVencimiento: proxVenc };
    }), [state.productos, state.lotes, state.sucursalActivaId]);

  const lotesEnriquecidos = useCallback((): LoteConProducto[] =>
    state.lotes.filter(l => l.sucursalId === state.sucursalActivaId).map(l => {
      const prod = state.productos.find(p => p.id === l.productoId);
      const suc = state.sucursales.find(s => s.id === l.sucursalId);
      return {
        ...l, productoNombre: prod?.nombre || '(eliminado)', productoCategoria: prod?.categoria || '',
        productoPrecio: prod?.precio || 0, sucursalNombre: suc?.nombre || '',
        nivelAlerta: calcularNivelAlerta(l.fechaVencimiento, l.diasAviso),
        diasRestantes: diasRestantes(l.fechaVencimiento), valorLote: l.cantidad * (prod?.precio || 0),
      };
    }), [state.lotes, state.productos, state.sucursales, state.sucursalActivaId]);

  const resumen = useCallback((): Resumen => {
    const e = lotesEnriquecidos();
    const r: Resumen = { productosTotales: productosConLotes().filter(p => p.cantidadTotal > 0).length, lotesTotales: e.length, unidadesTotales: 0, valorTotal: 0, lotesVencidos: 0, lotesCriticos: 0, lotesUrgentes: 0, lotesAviso: 0, lotesOk: 0, valorVencido: 0, valorEnRiesgo: 0 };
    for (const l of e) {
      r.unidadesTotales += l.cantidad; r.valorTotal += l.valorLote;
      switch (l.nivelAlerta) {
        case 'vencido': r.lotesVencidos++; r.valorVencido += l.valorLote; break;
        case 'critico': r.lotesCriticos++; r.valorEnRiesgo += l.valorLote; break;
        case 'urgente': r.lotesUrgentes++; r.valorEnRiesgo += l.valorLote; break;
        case 'aviso': r.lotesAviso++; break;
        case 'ok': r.lotesOk++; break;
      }
    }
    return r;
  }, [lotesEnriquecidos, productosConLotes]);

  const fefoSugeridos = useCallback((productoId: string): Lote[] =>
    state.lotes.filter(l => l.productoId === productoId && l.sucursalId === state.sucursalActivaId && l.cantidad > 0)
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)),
    [state.lotes, state.sucursalActivaId]);

  const perdidasPorMes = useCallback((meses = 6): PerdidaMensual[] => {
    const ET = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hoy = new Date();
    const res: PerdidaMensual[] = [];
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      res.push({ mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, etiqueta: ET[d.getMonth()], valorVencido: 0, valorRoto: 0, unidadesVencidas: 0 });
    }
    const idx = new Map(res.map((r, i) => [r.mes, i]));
    for (const m of state.movimientos) {
      if (m.tipo !== 'retiro_vencido' && m.tipo !== 'retiro_roto') continue;
      const i = idx.get(m.fecha.slice(0, 7));
      if (i === undefined) continue;
      const prod = state.productos.find(p => p.id === m.productoId);
      const valor = Math.abs(m.cantidad) * (prod?.precio || 0);
      if (m.tipo === 'retiro_vencido') { res[i].valorVencido += valor; res[i].unidadesVencidas += Math.abs(m.cantidad); }
      else res[i].valorRoto += valor;
    }
    return res;
  }, [state.movimientos, state.productos]);

  const distribucionPorCategoria = useCallback((): DistribucionCategoria[] => {
    const mapa = new Map<string, DistribucionCategoria>();
    for (const l of state.lotes) {
      if (l.sucursalId !== state.sucursalActivaId) continue;
      const prod = state.productos.find(p => p.id === l.productoId);
      if (!prod) continue;
      const cat = prod.categoria || 'Sin categoría';
      const valor = l.cantidad * prod.precio;
      const ex = mapa.get(cat);
      if (ex) { ex.cantidad += l.cantidad; ex.valor += valor; }
      else mapa.set(cat, { categoria: cat, cantidad: l.cantidad, valor });
    }
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  }, [state.lotes, state.productos, state.sucursalActivaId]);

  const vencimientosDelMes = useCallback((anio: number, mes: number): Map<string, DiaVencimiento> => {
    const mapa = new Map<string, DiaVencimiento>();
    const prefijo = `${anio}-${String(mes + 1).padStart(2, '0')}`;
    for (const l of state.lotes) {
      if (l.sucursalId !== state.sucursalActivaId) continue;
      if (!l.fechaVencimiento.startsWith(prefijo)) continue;
      const nivel = calcularNivelAlerta(l.fechaVencimiento, l.diasAviso);
      const ex = mapa.get(l.fechaVencimiento);
      if (ex) { ex.lotes++; ex.unidades += l.cantidad; if (ordenNivel(nivel) < ordenNivel(ex.nivelPeor)) ex.nivelPeor = nivel; }
      else mapa.set(l.fechaVencimiento, { fecha: l.fechaVencimiento, lotes: 1, unidades: l.cantidad, nivelPeor: nivel });
    }
    return mapa;
  }, [state.lotes, state.sucursalActivaId]);

  // ─── Backup ────────────────────────────────────────────────────────────
  const exportarBackup = useCallback((): string => {
    return JSON.stringify({
      version: 1,
      comercioId,
      exportadoEl: new Date().toISOString(),
      productos: state.productos,
      lotes: state.lotes,
      sucursales: state.sucursales,
      movimientos: state.movimientos,
    }, null, 2);
  }, [comercioId, state]);

  const importarBackup = useCallback(async (json: string): Promise<{ ok: number; error: number }> => {
    if (!comercioId) return { ok: 0, error: 0 };
    let ok = 0, error = 0;

    let data: any;
    try {
      data = JSON.parse(json);
    } catch {
      return { ok: 0, error: 1 };
    }

    // Helper: importa un array a una tabla, regenerando id y reasignando comercio
    const importarTabla = async (
      tabla: 'productos' | 'lotes' | 'sucursales',
      items: any[],
      mapaIds: Map<string, string>
    ) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        try {
          const nuevoId = crypto.randomUUID();
          if (item.id) mapaIds.set(item.id, nuevoId);
          const registro = { ...item, id: nuevoId, comercioId };
          await put(tabla, registro);
          await encolar({ tabla, operacion: 'insert', registroId: nuevoId, payload: registro });
          ok++;
        } catch {
          error++;
        }
      }
    };

    // Mapas para reconectar relaciones (id viejo → id nuevo)
    const mapaSucursales = new Map<string, string>();
    const mapaProductos = new Map<string, string>();

    // 1. Sucursales primero (los lotes dependen de ellas)
    await importarTabla('sucursales', data.sucursales || [], mapaSucursales);

    // 2. Productos
    await importarTabla('productos', data.productos || [], mapaProductos);

    // 3. Lotes (reconectando producto y sucursal)
    if (Array.isArray(data.lotes)) {
      for (const lote of data.lotes) {
        try {
          const nuevoId = crypto.randomUUID();
          const productoId = mapaProductos.get(lote.productoId) || lote.productoId;
          const sucursalId = mapaSucursales.get(lote.sucursalId) || state.sucursalActivaId;
          const registro: Lote = {
            ...lote, id: nuevoId, comercioId, productoId, sucursalId,
          };
          await put('lotes', registro);
          await encolar({ tabla: 'lotes', operacion: 'insert', registroId: nuevoId, payload: registro });
          ok++;
        } catch {
          error++;
        }
      }
    }

    // Recargar estado y sincronizar
    await recargarLocal();
    await refrescarPendientes();
    sincronizarAhora();

    return { ok, error };
  }, [comercioId, state.sucursalActivaId, recargarLocal, refrescarPendientes, sincronizarAhora]);

  return (
    <StoreContext.Provider value={{
      state, sincronizando, sincronizarAhora, estadoNube,
      addProducto, updateProducto, deleteProducto, buscarProductoPorCodigo,
      addLote, updateLote, retirarLote, addSucursal, updateSucursal, setSucursalActiva,
      productosConLotes, lotesEnriquecidos, resumen, fefoSugeridos,
      perdidasPorMes, distribucionPorCategoria, vencimientosDelMes,
      exportarBackup, importarBackup,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider');
  return ctx;
}
