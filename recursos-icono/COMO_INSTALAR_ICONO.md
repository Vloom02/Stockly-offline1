# 🎨 Cómo poner el ícono de Stockly en Android

El ícono es el "local neón" (depósito violeta sobre fondo oscuro).

## Forma fácil — Asset Studio (recomendada)
1. En Android Studio: click derecho en la carpeta `app` → New → Image Asset
2. Icon Type: "Launcher Icons (Legacy only)" — importante: LEGACY, porque el ícono ya trae su propio fondo oscuro
3. En "Path", elegí: `icono_1024.png` (de esta carpeta)
4. Resize hasta que se vea bien centrado
5. Next → Finish

## Forma manual — copiar archivos
1. Copiá las carpetas `mipmap-*` de esta carpeta
2. Pegalas en: `android/app/src/main/res/`
   (reemplazá las que ya están)
3. En la terminal: `npx cap sync android`
4. Reconstruí el APK

## Para Google Play
Cuando subas la app, usá `icono_playstore_512.png` como ícono de la ficha.

## Archivos en esta carpeta
- `icono_1024.png` — ícono completo alta resolución
- `icono_foreground_transparente.png` — solo el dibujo (por si usás adaptive)
- `icono_playstore_512.png` — para la ficha de Google Play
- `mipmap-*/` — todos los tamaños listos para Android
