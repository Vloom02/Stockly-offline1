import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

interface Props {
  onCodigoDetectado: (codigo: string) => void;
  onCancel: () => void;
}

/**
 * Modal de escaneo de códigos de barras.
 *
 * En la web usa la API BarcodeDetector (Chrome/Edge móvil).
 * Si no está disponible, ofrece entrada manual.
 *
 * En la versión Android nativa (Capacitor), se usaría
 * @capacitor-community/barcode-scanner — está incluido en package.json
 * y se puede integrar fácilmente con un BarcodeScanner.scan() call.
 */
const ScannerModal: React.FC<Props> = ({ onCodigoDetectado, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [scannerSupported, setScannerSupported] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    let detector: any = null;

    const start = async () => {
      // Verificar soporte de BarcodeDetector
      if (!('BarcodeDetector' in window)) {
        setScannerSupported(false);
        return;
      }

      // En Android nativo: pedir el permiso de cámara de forma nativa primero.
      // Sin esto, Android no muestra el cartel y da el permiso por denegado.
      if (Capacitor.isNativePlatform()) {
        try {
          const estado = await Camera.checkPermissions();
          if (estado.camera !== 'granted') {
            const pedido = await Camera.requestPermissions({ permissions: ['camera'] });
            if (pedido.camera !== 'granted') {
              setError('Permiso de cámara denegado');
              return;
            }
          }
        } catch (e) {
          // Si falla la verificación nativa, seguimos e intentamos igual
        }
      }

      try {
        // @ts-ignore - BarcodeDetector aún no está en los tipos estándar
        detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Loop de detección
        const detect = async () => {
          if (!active || !videoRef.current || !detector) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              active = false;
              onCodigoDetectado(barcodes[0].rawValue);
              return;
            }
          } catch (e) {
            // Ignorar errores intermitentes
          }
          if (active) requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        const e = err as Error;
        if (e.name === 'NotAllowedError') {
          setError('Permiso de cámara denegado');
        } else {
          setError('No se pudo abrir la cámara: ' + e.message);
        }
      }
    };

    start();

    return () => {
      active = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [onCodigoDetectado]);

  const handleManual = () => {
    const val = manualValue.trim();
    if (!val) return;
    onCodigoDetectado(val);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px calc(12px + env(safe-area-inset-top)) 16px',
        background: 'rgba(0,0,0,0.5)',
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >✕ Cancelar</button>
        <span style={{ color: '#fff', fontWeight: 600 }}>Escanear código</span>
        <div style={{ width: 90 }} />
      </div>

      {/* Cámara o entrada manual */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {scannerSupported && !error ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Marco de escaneo */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxWidth: 320,
              aspectRatio: '16 / 10',
              border: '3px solid #fff',
              borderRadius: 12,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
            }} />
          </>
        ) : (
          <div style={{
            padding: 24,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              {error || 'Tu navegador no soporta el escaneo automático'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 24, maxWidth: 320 }}>
              {error === 'Permiso de cámara denegado'
                ? 'Activá el permiso de cámara desde Ajustes de Android → Aplicaciones → Stockly → Permisos. Mientras tanto, podés ingresar el código manualmente.'
                : 'Podés ingresar el código manualmente o instalar la app en tu celular para usar el escáner nativo'}
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ingresar código manual"
              value={manualValue}
              onChange={e => setManualValue(e.target.value)}
              style={{
                width: '100%',
                maxWidth: 320,
                padding: 12,
                fontSize: 16,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                textAlign: 'center',
                marginBottom: 12,
              }}
            />
            <button
              type="button"
              onClick={handleManual}
              disabled={!manualValue.trim()}
              style={{
                width: '100%',
                maxWidth: 320,
                padding: 12,
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: manualValue.trim() ? 1 : 0.5,
              }}
            >Usar este código</button>
          </div>
        )}
      </div>

      {/* Footer info */}
      {scannerSupported && !error && (
        <div style={{
          padding: '16px 20px calc(16px + env(safe-area-inset-bottom)) 20px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          textAlign: 'center',
          fontSize: 14,
        }}>
          Apuntá la cámara al código de barras
        </div>
      )}
    </div>
  );
};

export default ScannerModal;
