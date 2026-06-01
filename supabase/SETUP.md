# 🚀 Configurar Supabase para Stockly

Seguí estos pasos **una sola vez** para tener el backend en la nube funcionando.

## 1. Crear cuenta y proyecto

1. Andá a https://supabase.com → **Start your project** (es gratis, login con GitHub o email)
2. **New project**
   - Name: `stockly`
   - Database Password: poné una contraseña fuerte y **guardala** (la vas a necesitar)
   - Region: **South America (São Paulo)** — el más cercano a Argentina
   - Pricing plan: **Free**
3. Esperá ~2 minutos a que se cree el proyecto

## 2. Crear las tablas

1. En el menú izquierdo → **SQL Editor**
2. Click en **New query**
3. Abrí el archivo `supabase/schema.sql` de este proyecto, copiá TODO el contenido
4. Pegalo en el editor de Supabase
5. Click en **Run** (abajo a la derecha) o Ctrl+Enter
6. Si dice "Success. No rows returned" → ✅ funcionó

## 3. Activar Realtime (sincronización entre sucursales)

1. Menú izquierdo → **Database** → **Replication**
2. En "Source" vas a ver `supabase_realtime`
3. Activá (toggle) estas tablas:
   - `productos`
   - `lotes`
   - `movimientos`
   - `sucursales`

## 4. Configurar autenticación

1. Menú izquierdo → **Authentication** → **Providers**
2. **Email** ya viene activado por defecto ✅
3. (Opcional pero recomendado) Para evitar el paso de confirmar email mientras probás:
   - **Authentication** → **Settings** (o "Sign In / Up")
   - Desactivá temporalmente **"Confirm email"**
   - ⚠️ Volvé a activarlo antes de distribuir a clientes reales

## 5. Copiar tus claves

1. Menú izquierdo → **Project Settings** (el engranaje) → **API**
2. Vas a ver dos datos que necesitás:
   - **Project URL** → algo como `https://xxxxx.supabase.co`
   - **anon public** key → una cadena larga que empieza con `eyJ...`
3. Copiá ambos

## 6. Pegar las claves en el proyecto

1. En la raíz del proyecto, creá un archivo llamado `.env`
2. Pegá esto reemplazando con tus valores:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-clave-larga...
```

3. Guardá el archivo

> ⚠️ **Importante**: El archivo `.env` NO se sube a Git (ya está en `.gitignore`). Cada vez que clones el proyecto en otra PC, tenés que crear este archivo de nuevo.

## 7. Probar

```bash
npm install
npm run dev
```

Abrí el navegador → deberías ver la pantalla de **registro/login**. Creá una cuenta de prueba y listo, ya estás usando la nube.

---

## 💰 Sobre los costos

- **Free tier de Supabase**: 500MB de base de datos, 2GB de transferencia/mes, 50.000 usuarios activos mensuales. Para arrancar con varios comercios te sobra.
- Cuando crezcas: el plan **Pro** son USD $25/mes e incluye muchísimo más.
- Con eso podés tener decenas de comercios pagándote suscripción antes de necesitar pagar el Pro.

## 🔐 Sobre la seguridad (multi-tenant)

El esquema usa **Row Level Security (RLS)**: aunque todos los comercios comparten la misma base de datos, cada uno SOLO puede ver y modificar sus propios datos. Es imposible que un comercio vea el stock de otro. Esto está garantizado a nivel de base de datos, no solo en la app.
