# 🔌 Cómo funciona el modo offline de Stockly

## Resumen
Stockly es **offline-first**: funciona perfecto sin internet y sincroniza solo cuando vuelve la conexión. Nunca perdés un cambio.

## Cómo funciona por dentro

1. **Toda escritura va primero a la base local del dispositivo** (IndexedDB).
   La app responde al instante, haya o no internet.

2. **Cada cambio se encola** en una "cola de sincronización" (outbox).

3. **Cuando hay internet**, un proceso en segundo plano:
   - Sube los cambios pendientes a Supabase (la nube)
   - Baja los cambios que hicieron otras sucursales/dispositivos
   - Esto pasa automáticamente: al abrir la app, cada 30 segundos, y cuando vuelve la conexión

4. **Indicador visual** (banner en el Dashboard):
   - 🟡 "Sin conexión · X cambios pendientes" → estás offline, todo se guarda local
   - 🟢 "Sincronizando..." → subiendo/bajando datos
   - "X cambios por subir · tocá para sincronizar" → podés forzar la sync

## Conflictos
- **Datos editados** (producto, lote): gana el último que escribió (last-write-wins).
- **Movimientos** (ventas, retiros): nunca entran en conflicto porque son eventos que se suman, no se pisan.
- Como los lotes son **por sucursal**, en la práctica los conflictos son rarísimos.

## Probar el modo offline
1. Abrí la app con internet (que cargue los datos)
2. En el navegador: DevTools (F12) → pestaña Network → cambiá "No throttling" a **Offline**
3. Cargá un producto o lote → vas a ver que funciona y aparece el banner amarillo
4. Volvé a poner "No throttling" (online) → el banner cambia a "Sincronizando" y sube todo

## Backup manual (extra seguridad)
Además de la nube, en **Ajustes** podés:
- **Exportar backup**: descarga un JSON con todo tu inventario
- **Importar backup**: carga un JSON previo (agrega los datos, no reemplaza)

Útil para migrar de dispositivo, o como respaldo extra antes de cambios grandes.
