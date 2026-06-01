# 📦 Stockly — Control de vencimientos en la nube

App multi-tenant de control de vencimientos de stock para comercios. Ionic React + TypeScript + Capacitor + **Supabase**.

## ✨ Qué hace

- ☁️ **Datos en la nube**: backup automático, nunca perdés el inventario
- 🔄 **Sincronización en tiempo real** entre dispositivos y sucursales
- 🏪 **Multi-sucursal**: productos compartidos, vencimientos individuales por sucursal
- 🔐 **Multi-tenant**: cada comercio ve solo sus datos (Row Level Security)
- 👤 **Login/registro** con email
- 📦 Producto + lotes con FEFO (First Expired, First Out)
- 🚨 Alertas escaladas: aviso → urgente → crítico → vencido
- 💰 Dashboard con valor de inventario y plata en riesgo
- 📊 Reportes: distribución por categoría, pérdidas mensuales, calendario
- 📜 Audit log completo de movimientos
- 🌙 Tema claro/oscuro

## 🚀 Setup (importante, leé primero)

**1. Configurá Supabase** siguiendo la guía paso a paso en `supabase/SETUP.md`
   (crear cuenta, correr el SQL, copiar las claves)

**2. Creá el archivo `.env`** en la raíz (copiá de `.env.example`):
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave
```

**3. Instalá y corré:**
```bash
npm install
npm run dev
```

## 📱 Generar APK Android

```bash
npm run build
npx cap add android      # primera vez
npm run cap:android
```

## 🏗️ Arquitectura

```
Supabase (Postgres en la nube)
  ├─ comercios     → cada negocio (tenant)
  ├─ miembros      → usuarios vinculados a comercios + rol
  ├─ sucursales    → del comercio
  ├─ productos     → catálogo compartido entre sucursales
  ├─ lotes         → stock real, vencimiento por sucursal
  └─ movimientos   → audit log

Seguridad: Row Level Security garantiza que cada comercio
ve SOLO sus datos, a nivel de base de datos.
```

## 💰 Modelo de negocio

- Free tier de Supabase aguanta varios comercios sin costo
- Cuando escales: Supabase Pro USD $25/mes
- Cada comercio arranca con 14 días de prueba (campo `plan: trial`)
- Para cobrar suscripción real necesitás integrar un cobro (Mercado Pago, Stripe) — pendiente

## 📂 Estructura

```
src/
├── lib/supabase.ts          # Cliente Supabase
├── context/
│   ├── AuthContext.tsx      # Login/registro/sesión
│   └── StoreContext.tsx     # Datos + Realtime
├── pages/
│   ├── AuthPage.tsx         # Login/registro
│   ├── DashboardPage.tsx
│   ├── StockPage.tsx
│   ├── ProductoPage.tsx
│   ├── LotePage.tsx
│   ├── MovimientosPage.tsx
│   ├── ReportesPage.tsx
│   ├── SucursalesPage.tsx
│   └── ConfigPage.tsx
├── components/ui/           # Design system
└── theme/variables.css

supabase/
├── schema.sql               # Esquema completo (correr en Supabase)
└── SETUP.md                 # Guía paso a paso
```
