import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { aplicarColorMarca, obtenerColorMarcaGuardado, COLORES_MARCA } from './lib/tema';

// Aplicar el color de marca elegido por el usuario (antes de renderizar)
const colorId = obtenerColorMarcaGuardado();
aplicarColorMarca(colorId);
const colorActual = COLORES_MARCA.find(c => c.id === colorId) || COLORES_MARCA[0];

// Configurar la barra de estado de Android para que NO se superponga al contenido
async function configurarStatusBar() {
  if (Capacitor.getPlatform() === 'android') {
    try {
      // overlay: false = la barra NO se dibuja encima del contenido
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: colorActual.tonos[1] });
    } catch (e) {
      // En web no existe, se ignora
    }
  }
}

configurarStatusBar();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
