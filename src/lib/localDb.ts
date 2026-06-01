import { Producto, Lote, Sucursal, Movimiento } from '../types';

/**
 * Capa de persistencia local (IndexedDB).
 * Es la FUENTE DE VERDAD local: la app siempre lee/escribe acá primero.
 * Los cambios se encolan en 'outbox' para sincronizar con Supabase después.
 */

const DB_NAME = 'stockly-offline';
const DB_VER = 1;
let db: IDBDatabase | null = null;

export type TablaSync = 'productos' | 'lotes' | 'sucursales' | 'movimientos';
export type OperacionSync = 'insert' | 'update' | 'delete';

export interface ItemOutbox {
  id: string;              // uuid local de la operación
  tabla: TablaSync;
  operacion: OperacionSync;
  registroId: string;      // id del registro afectado
  payload: any;            // datos a enviar
  intentos: number;
  creadoEn: number;
}

export function abrirDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (db) { res(db); return; }
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result;
      // Tablas espejo de Supabase
      for (const t of ['productos', 'lotes', 'sucursales', 'movimientos'] as const) {
        if (!d.objectStoreNames.contains(t)) {
          d.createObjectStore(t, { keyPath: 'id' });
        }
      }
      // Cola de sincronización (outbox)
      if (!d.objectStoreNames.contains('outbox')) {
        d.createObjectStore('outbox', { keyPath: 'id' });
      }
      // Metadatos (última sincronización, etc.)
      if (!d.objectStoreNames.contains('meta')) {
        d.createObjectStore('meta', { keyPath: 'k' });
      }
    };
    r.onsuccess = (e) => { db = (e.target as IDBOpenDBRequest).result; res(db!); };
    r.onerror = () => rej(r.error);
  });
}

function store(tabla: string, modo: IDBTransactionMode = 'readonly'): IDBObjectStore {
  if (!db) throw new Error('DB local no abierta');
  return db.transaction(tabla, modo).objectStore(tabla);
}

// ─── CRUD genérico ──────────────────────────────────────────────────────────
export function getAll<T>(tabla: string): Promise<T[]> {
  return new Promise((res, rej) => {
    const r = store(tabla).getAll();
    r.onsuccess = () => res(r.result as T[]);
    r.onerror = () => rej(r.error);
  });
}

export function put<T>(tabla: string, obj: T): Promise<void> {
  return new Promise((res, rej) => {
    const r = store(tabla, 'readwrite').put(obj);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

export function del(tabla: string, id: string): Promise<void> {
  return new Promise((res, rej) => {
    const r = store(tabla, 'readwrite').delete(id);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

export function clearTabla(tabla: string): Promise<void> {
  return new Promise((res, rej) => {
    const r = store(tabla, 'readwrite').clear();
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

// ─── Outbox (cola de cambios pendientes) ────────────────────────────────────
export function encolar(item: Omit<ItemOutbox, 'id' | 'intentos' | 'creadoEn'>): Promise<void> {
  const completo: ItemOutbox = {
    ...item,
    id: crypto.randomUUID(),
    intentos: 0,
    creadoEn: Date.now(),
  };
  return put('outbox', completo);
}

export function obtenerPendientes(): Promise<ItemOutbox[]> {
  return getAll<ItemOutbox>('outbox').then(items =>
    items.sort((a, b) => a.creadoEn - b.creadoEn) // orden cronológico
  );
}

export function quitarDeOutbox(id: string): Promise<void> {
  return del('outbox', id);
}

export function actualizarIntentos(item: ItemOutbox): Promise<void> {
  return put('outbox', { ...item, intentos: item.intentos + 1 });
}

// ─── Meta ───────────────────────────────────────────────────────────────────
export function getMeta(k: string): Promise<string | null> {
  return new Promise((res) => {
    const r = store('meta').get(k);
    r.onsuccess = () => res(r.result?.v ?? null);
    r.onerror = () => res(null);
  });
}

export function setMeta(k: string, v: string): Promise<void> {
  return put('meta', { k, v });
}

// ─── Reset completo (al cerrar sesión) ──────────────────────────────────────
export async function limpiarTodoLocal(): Promise<void> {
  await Promise.all([
    clearTabla('productos'),
    clearTabla('lotes'),
    clearTabla('sucursales'),
    clearTabla('movimientos'),
    clearTabla('outbox'),
    clearTabla('meta'),
  ]);
}

// Helpers tipados de carga
export const cargarProductos = () => getAll<Producto>('productos');
export const cargarLotes = () => getAll<Lote>('lotes');
export const cargarSucursales = () => getAll<Sucursal>('sucursales');
export const cargarMovimientos = () => getAll<Movimiento>('movimientos');
