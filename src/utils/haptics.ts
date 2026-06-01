import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Wrapper de feedback háptico.
 * En Android nativo usa el motor de vibración real (Capacitor Haptics).
 * En web hace fallback a navigator.vibrate si está disponible.
 * Nunca tira error si no hay soporte.
 */

const isNative = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const haptic = {
  // Toque ligero — para taps normales, selección
  light: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch { /* sin soporte, ignorar */ }
  },

  // Toque medio — para confirmaciones, guardar
  medium: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch { /* */ }
  },

  // Éxito — para acciones completadas
  success: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if ('vibrate' in navigator) {
        navigator.vibrate([15, 50, 15]);
      }
    } catch { /* */ }
  },

  // Error / advertencia
  warning: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if ('vibrate' in navigator) {
        navigator.vibrate([30, 40, 30]);
      }
    } catch { /* */ }
  },
};
