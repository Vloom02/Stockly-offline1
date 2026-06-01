-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  STOCKLY · Esquema multi-tenant para Supabase                          ║
-- ║  Ejecutar este script en: Supabase Dashboard → SQL Editor → New query  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────────
-- 1. COMERCIOS (tenants) — cada comercio que compra Stockly
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists comercios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  plan        text not null default 'trial',        -- trial | activo | suspendido
  trial_hasta timestamptz default (now() + interval '14 days'),
  creado_en   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. MIEMBROS — vincula usuarios (auth.users) con comercios + rol
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists miembros (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  comercio_id uuid not null references comercios(id) on delete cascade,
  rol         text not null default 'empleado',      -- dueno | empleado
  nombre      text,
  creado_en   timestamptz not null default now(),
  unique (user_id, comercio_id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- 3. SUCURSALES — pertenecen a un comercio
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists sucursales (
  id          uuid primary key default gen_random_uuid(),
  comercio_id uuid not null references comercios(id) on delete cascade,
  nombre      text not null,
  direccion   text,
  activa      boolean not null default true,
  creado_en   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. PRODUCTOS — catálogo COMPARTIDO entre sucursales del mismo comercio
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists productos (
  id            uuid primary key default gen_random_uuid(),
  comercio_id   uuid not null references comercios(id) on delete cascade,
  nombre        text not null,
  codigo_barras text,
  categoria     text not null default 'Sin categoría',
  precio        numeric(12,2) not null default 0,
  dias_aviso_default int not null default 15,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- 5. LOTES — stock real, vencimiento INDIVIDUAL por sucursal
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists lotes (
  id                uuid primary key default gen_random_uuid(),
  comercio_id       uuid not null references comercios(id) on delete cascade,
  producto_id       uuid not null references productos(id) on delete cascade,
  sucursal_id       uuid not null references sucursales(id) on delete cascade,
  cantidad          int not null default 0,
  fecha_vencimiento date not null,
  dias_aviso        int not null default 15,
  fecha_ingreso     date not null default current_date,
  proveedor         text,
  numero_lote       text,
  retirado          boolean not null default false,
  creado_en         timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- 6. MOVIMIENTOS — audit log por comercio
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists movimientos (
  id                 uuid primary key default gen_random_uuid(),
  comercio_id        uuid not null references comercios(id) on delete cascade,
  lote_id            uuid references lotes(id) on delete set null,
  producto_id        uuid references productos(id) on delete set null,
  sucursal_id        uuid references sucursales(id) on delete set null,
  tipo               text not null,   -- ingreso|retiro_venta|retiro_vencido|retiro_roto|ajuste|creacion|edicion
  cantidad           int not null default 0,
  cantidad_anterior  int not null default 0,
  cantidad_nueva     int not null default 0,
  usuario            text,
  notas              text,
  fecha              timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- ÍNDICES para performance
-- ──────────────────────────────────────────────────────────────────────────
create index if not exists idx_productos_comercio  on productos(comercio_id);
create index if not exists idx_lotes_comercio       on lotes(comercio_id);
create index if not exists idx_lotes_sucursal       on lotes(sucursal_id);
create index if not exists idx_lotes_producto       on lotes(producto_id);
create index if not exists idx_lotes_venc           on lotes(fecha_vencimiento);
create index if not exists idx_movim_comercio       on movimientos(comercio_id);
create index if not exists idx_movim_fecha          on movimientos(fecha desc);
create index if not exists idx_sucursales_comercio  on sucursales(comercio_id);

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — corazón del multi-tenant
-- Cada usuario SOLO puede ver/editar datos de SU comercio.
-- ══════════════════════════════════════════════════════════════════════════

-- Función helper: devuelve los comercio_id a los que pertenece el usuario actual
create or replace function comercios_del_usuario()
returns setof uuid
language sql security definer stable
as $$
  select comercio_id from miembros where user_id = auth.uid()
$$;

-- Activar RLS en todas las tablas
alter table comercios   enable row level security;
alter table miembros    enable row level security;
alter table sucursales  enable row level security;
alter table productos   enable row level security;
alter table lotes       enable row level security;
alter table movimientos enable row level security;

-- ─── COMERCIOS ───────────────────────────────────────────────────────────
create policy "ver comercio propio" on comercios
  for select using (id in (select comercios_del_usuario()));
create policy "actualizar comercio propio" on comercios
  for update using (id in (select comercios_del_usuario()));

-- ─── MIEMBROS ────────────────────────────────────────────────────────────
create policy "ver miembros de mi comercio" on miembros
  for select using (comercio_id in (select comercios_del_usuario()));
create policy "insertar mi propia membresia" on miembros
  for insert with check (user_id = auth.uid());

-- ─── SUCURSALES ──────────────────────────────────────────────────────────
create policy "acceso total sucursales propias" on sucursales
  for all using (comercio_id in (select comercios_del_usuario()))
  with check (comercio_id in (select comercios_del_usuario()));

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────
create policy "acceso total productos propios" on productos
  for all using (comercio_id in (select comercios_del_usuario()))
  with check (comercio_id in (select comercios_del_usuario()));

-- ─── LOTES ───────────────────────────────────────────────────────────────
create policy "acceso total lotes propios" on lotes
  for all using (comercio_id in (select comercios_del_usuario()))
  with check (comercio_id in (select comercios_del_usuario()));

-- ─── MOVIMIENTOS ─────────────────────────────────────────────────────────
create policy "acceso total movimientos propios" on movimientos
  for all using (comercio_id in (select comercios_del_usuario()))
  with check (comercio_id in (select comercios_del_usuario()));

-- ══════════════════════════════════════════════════════════════════════════
-- TRIGGER: al registrarse un usuario nuevo, crear su comercio + membresía
-- (esto hace que el onboarding sea automático)
-- ══════════════════════════════════════════════════════════════════════════
create or replace function crear_comercio_para_nuevo_usuario()
returns trigger
language plpgsql security definer
as $$
declare
  nuevo_comercio_id uuid;
begin
  -- Crear comercio
  insert into comercios (nombre)
  values (coalesce(new.raw_user_meta_data->>'nombre_comercio', 'Mi comercio'))
  returning id into nuevo_comercio_id;

  -- Crear membresía como dueño
  insert into miembros (user_id, comercio_id, rol, nombre)
  values (new.id, nuevo_comercio_id, 'dueno', new.raw_user_meta_data->>'nombre');

  -- Crear sucursal principal por defecto
  insert into sucursales (comercio_id, nombre)
  values (nuevo_comercio_id, 'Principal');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crear_comercio_para_nuevo_usuario();

-- ══════════════════════════════════════════════════════════════════════════
-- LISTO. Ahora activá Realtime para sincronización entre dispositivos:
-- Dashboard → Database → Replication → activá: productos, lotes, movimientos, sucursales
-- ══════════════════════════════════════════════════════════════════════════
