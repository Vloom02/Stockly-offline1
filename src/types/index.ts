// ─── Producto maestro (catálogo, compartido entre sucursales) ───────────────
export interface Producto {
  id?: string;                     // UUID en Supabase
  comercioId?: string;
  nombre: string;
  codigoBarras?: string;
  categoria: string;
  precio: number;
  diasAvisoDefault: number;
  activo: boolean;
  fechaCreacion: string;
}

// ─── Lote (stock real, vencimiento individual por sucursal) ─────────────────
export interface Lote {
  id?: string;
  comercioId?: string;
  productoId: string;
  sucursalId: string;
  cantidad: number;
  fechaVencimiento: string;        // ISO date (YYYY-MM-DD)
  diasAviso: number;
  fechaIngreso: string;
  proveedor?: string;
  numeroLote?: string;
  retirado: boolean;
}

// ─── Sucursal ───────────────────────────────────────────────────────────────
export interface Sucursal {
  id?: string;
  comercioId?: string;
  nombre: string;
  direccion?: string;
  activa: boolean;
}

// ─── Movimiento (audit log) ─────────────────────────────────────────────────
export type TipoMovimiento =
  | 'ingreso'
  | 'retiro_venta'
  | 'retiro_vencido'
  | 'retiro_roto'
  | 'ajuste'
  | 'creacion'
  | 'edicion';

export interface Movimiento {
  id?: string;
  comercioId?: string;
  loteId?: string;
  productoId: string;
  sucursalId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  usuario: string;
  notas?: string;
  fecha: string;
}

// ─── Comercio y miembro (multi-tenant) ──────────────────────────────────────
export interface Comercio {
  id: string;
  nombre: string;
  plan: string;
  trialHasta?: string;
}

export interface Miembro {
  id: string;
  userId: string;
  comercioId: string;
  rol: 'dueno' | 'empleado';
  nombre?: string;
}

// ─── Estado de vencimiento con escalado ─────────────────────────────────────
export type NivelAlerta = 'ok' | 'aviso' | 'urgente' | 'critico' | 'vencido';

export interface Resumen {
  productosTotales: number;
  lotesTotales: number;
  unidadesTotales: number;
  valorTotal: number;
  lotesVencidos: number;
  lotesCriticos: number;
  lotesUrgentes: number;
  lotesAviso: number;
  lotesOk: number;
  valorVencido: number;
  valorEnRiesgo: number;
}

export interface ProductoConLotes {
  producto: Producto;
  lotes: Lote[];
  cantidadTotal: number;
  valorTotal: number;
  nivelPeor: NivelAlerta;
  proximoVencimiento?: string;
}

export interface LoteConProducto extends Lote {
  productoNombre: string;
  productoCategoria: string;
  productoPrecio: number;
  sucursalNombre: string;
  nivelAlerta: NivelAlerta;
  diasRestantes: number;
  valorLote: number;
}

export type FiltroEstado = 'todos' | 'vencidos' | 'urgentes' | 'ok';

// ─── Analytics ────────────────────────────────────────────────────────────
export interface PerdidaMensual {
  mes: string;
  etiqueta: string;
  valorVencido: number;
  valorRoto: number;
  unidadesVencidas: number;
}

export interface DistribucionCategoria {
  categoria: string;
  cantidad: number;
  valor: number;
}

export interface DiaVencimiento {
  fecha: string;
  lotes: number;
  unidades: number;
  nivelPeor: NivelAlerta;
}

export type SettingKey =
  | 'sucursal-activa'
  | 'theme'
  | 'onboarding-visto';
