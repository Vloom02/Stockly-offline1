import { supabase } from './supabase';
import {
  obtenerPendientes, quitarDeOutbox, actualizarIntentos,
  put, setMeta, getMeta, ItemOutbox, TablaSync,
} from './localDb';

/**
 * Motor de sincronización offline-first.
 *
 * SUBIR (push): vacía la outbox contra Supabase.
 * BAJAR (pull): trae cambios remotos desde la última sincronización.
 *
 * Estrategia de conflictos: last-write-wins por timestamp.
 * Los movimientos son inmutables (solo insert) → nunca generan conflicto.
 */

const MAX_INTENTOS = 5;

// Mapeo camelCase (app) → snake_case (Supabase)
function aSnake(tabla: TablaSync, payload: any, comercioId: string): any {
  switch (tabla) {
    case 'productos':
      return {
        id: payload.id, comercio_id: comercioId, nombre: payload.nombre,
        codigo_barras: payload.codigoBarras ?? null, categoria: payload.categoria,
        precio: payload.precio, dias_aviso_default: payload.diasAvisoDefault,
        activo: payload.activo ?? true,
      };
    case 'lotes':
      return {
        id: payload.id, comercio_id: comercioId, producto_id: payload.productoId,
        sucursal_id: payload.sucursalId, cantidad: payload.cantidad,
        fecha_vencimiento: payload.fechaVencimiento, dias_aviso: payload.diasAviso,
        fecha_ingreso: payload.fechaIngreso, proveedor: payload.proveedor ?? null,
        numero_lote: payload.numeroLote ?? null, retirado: payload.retirado ?? false,
      };
    case 'sucursales':
      return {
        id: payload.id, comercio_id: comercioId, nombre: payload.nombre,
        direccion: payload.direccion ?? null, activa: payload.activa ?? true,
      };
    case 'movimientos':
      return {
        id: payload.id, comercio_id: comercioId, lote_id: payload.loteId ?? null,
        producto_id: payload.productoId, sucursal_id: payload.sucursalId,
        tipo: payload.tipo, cantidad: payload.cantidad,
        cantidad_anterior: payload.cantidadAnterior, cantidad_nueva: payload.cantidadNueva,
        usuario: payload.usuario ?? null, notas: payload.notas ?? null,
        fecha: payload.fecha,
      };
  }
}

/**
 * SUBIR: procesa la cola de cambios pendientes.
 * Devuelve cuántos se sincronizaron OK.
 */
export async function subirPendientes(comercioId: string): Promise<number> {
  const pendientes = await obtenerPendientes();
  let exitosos = 0;
  let ultimoError: string | null = null;

  for (const item of pendientes) {
    try {
      const err = await procesarItem(item, comercioId);
      if (!err) {
        await quitarDeOutbox(item.id);
        exitosos++;
      } else {
        ultimoError = err;
        await manejarFallo(item);
      }
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : 'Error al subir';
      console.warn('Error sincronizando item', item.id, e);
      await manejarFallo(item);
    }
  }

  // Si había pendientes y ninguno subió por un error, lo propagamos
  if (pendientes.length > 0 && exitosos === 0 && ultimoError) {
    throw new Error('Supabase: ' + ultimoError);
  }

  return exitosos;
}

async function procesarItem(item: ItemOutbox, comercioId: string): Promise<string | null> {
  const { tabla, operacion, payload, registroId } = item;

  if (operacion === 'delete') {
    // Para "borrar" usamos soft-delete (activo/retirado = false), no DELETE real
    const { error } = await supabase.from(tabla).update(
      tabla === 'lotes' ? { retirado: true } : { activo: false }
    ).eq('id', registroId);
    return error ? error.message : null;
  }

  // insert o update → upsert (idempotente, seguro ante reintentos)
  const fila = aSnake(tabla, payload, comercioId);
  const { error } = await supabase.from(tabla).upsert(fila, { onConflict: 'id' });
  return error ? error.message : null;
}

async function manejarFallo(item: ItemOutbox) {
  if (item.intentos + 1 >= MAX_INTENTOS) {
    // Después de muchos intentos, lo dejamos pero no bloqueamos la cola
    console.error('Item descartado tras máximos intentos', item);
    await quitarDeOutbox(item.id);
  } else {
    await actualizarIntentos(item);
  }
}

/**
 * BAJAR: trae cambios remotos desde la última sincronización.
 * Actualiza IndexedDB local con lo que cambió en otros dispositivos.
 */
export async function bajarCambios(comercioId: string): Promise<void> {
  const ultimaSync = await getMeta('ultima-sync');
  const desde = ultimaSync || '1970-01-01T00:00:00Z';
  const ahora = new Date().toISOString();

  // Traer registros modificados después de la última sync
  // (Supabase no tiene updated_at por defecto, usamos creado_en + estrategia full para tablas chicas)
  const [prods, lotes, sucs, movs] = await Promise.all([
    supabase.from('productos').select('*').eq('comercio_id', comercioId),
    supabase.from('lotes').select('*').eq('comercio_id', comercioId),
    supabase.from('sucursales').select('*').eq('comercio_id', comercioId),
    supabase.from('movimientos').select('*').eq('comercio_id', comercioId)
      .gt('fecha', desde).order('fecha', { ascending: false }).limit(200),
  ]);

  // Si Supabase devolvió error en alguna tabla, lo reportamos (no fallar en silencio)
  const errSupa = prods.error || lotes.error || sucs.error || movs.error;
  if (errSupa) {
    throw new Error('Supabase: ' + (errSupa.message || 'error al traer datos'));
  }

  // Actualizar local (mapeando a camelCase via los mappers del store)
  if (prods.data) {
    for (const r of prods.data) await put('productos', mapProductoLocal(r));
  }
  if (lotes.data) {
    for (const r of lotes.data) await put('lotes', mapLoteLocal(r));
  }
  if (sucs.data) {
    for (const r of sucs.data) await put('sucursales', mapSucursalLocal(r));
  }
  if (movs.data) {
    for (const r of movs.data) await put('movimientos', mapMovimientoLocal(r));
  }

  await setMeta('ultima-sync', ahora);
}

// Mappers DB → local (camelCase)
const mapProductoLocal = (r: any) => ({
  id: r.id, comercioId: r.comercio_id, nombre: r.nombre,
  codigoBarras: r.codigo_barras ?? undefined, categoria: r.categoria,
  precio: Number(r.precio), diasAvisoDefault: r.dias_aviso_default,
  activo: r.activo, fechaCreacion: r.creado_en,
});
const mapLoteLocal = (r: any) => ({
  id: r.id, comercioId: r.comercio_id, productoId: r.producto_id,
  sucursalId: r.sucursal_id, cantidad: r.cantidad,
  fechaVencimiento: r.fecha_vencimiento, diasAviso: r.dias_aviso,
  fechaIngreso: r.fecha_ingreso, proveedor: r.proveedor ?? undefined,
  numeroLote: r.numero_lote ?? undefined, retirado: r.retirado,
});
const mapSucursalLocal = (r: any) => ({
  id: r.id, comercioId: r.comercio_id, nombre: r.nombre,
  direccion: r.direccion ?? undefined, activa: r.activa,
});
const mapMovimientoLocal = (r: any) => ({
  id: r.id, comercioId: r.comercio_id, loteId: r.lote_id ?? undefined,
  productoId: r.producto_id, sucursalId: r.sucursal_id, tipo: r.tipo,
  cantidad: r.cantidad, cantidadAnterior: r.cantidad_anterior,
  cantidadNueva: r.cantidad_nueva, usuario: r.usuario ?? '', notas: r.notas ?? undefined,
  fecha: r.fecha,
});

/**
 * Sincronización completa: subir pendientes + bajar cambios.
 */
/**
 * Envuelve una promesa con un timeout. Si tarda más de `ms`, rechaza.
 * Evita que una request colgada deje la sincronización trabada para siempre.
 */
function conTimeout<T>(promesa: Promise<T>, ms: number, etiqueta: string): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout en ${etiqueta} (${ms}ms)`)), ms)
    ),
  ]);
}

export async function sincronizar(comercioId: string): Promise<{ subidos: number; error: string | null }> {
  if (!navigator.onLine) return { subidos: 0, error: 'Sin conexión a internet' };
  try {
    const subidos = await conTimeout(subirPendientes(comercioId), 20000, 'subir');
    await conTimeout(bajarCambios(comercioId), 20000, 'bajar');
    return { subidos, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.warn('Sincronización interrumpida:', msg);
    return { subidos: 0, error: msg };
  }
}
