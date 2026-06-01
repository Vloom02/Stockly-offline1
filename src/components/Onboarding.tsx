import React, { useState } from 'react';
import {
  ArchiveBoxIcon, BellAlertIcon, ArrowPathRoundedSquareIcon,
  ArrowRightIcon, CheckIcon,
} from '@heroicons/react/24/outline';
import Logo from './ui/Logo';
import Button from './ui/Button';
import { haptic } from '../utils/haptics';

interface Slide {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    icon: <ArchiveBoxIcon width={40} height={40} />,
    titulo: 'Controlá tu stock por lotes',
    descripcion: 'Cargá cada producto una vez y agregá lotes con distintas fechas de vencimiento. Stockly los organiza por vos.',
    color: 'var(--brand-500)',
  },
  {
    icon: <BellAlertIcon width={40} height={40} />,
    titulo: 'Alertas antes de que sea tarde',
    descripcion: 'Niveles escalados (aviso, urgente, crítico) te avisan con anticipación. Nunca más perdés plata por vencimientos.',
    color: 'var(--warning)',
  },
  {
    icon: <ArrowPathRoundedSquareIcon width={40} height={40} />,
    titulo: 'Vendé en el orden correcto',
    descripcion: 'El sistema FEFO te dice qué lote vender primero (el que vence antes), reduciendo el desperdicio al mínimo.',
    color: 'var(--info)',
  },
];

interface Props {
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [paso, setPaso] = useState(0);
  const esUltimo = paso === SLIDES.length - 1;
  const slide = SLIDES[paso];

  const siguiente = () => {
    haptic.light();
    if (esUltimo) {
      haptic.success();
      onComplete();
    } else {
      setPaso(p => p + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      zIndex: 2000,
      display: 'flex', flexDirection: 'column',
      padding: 'calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom))',
    }}>
      {/* Header con logo y skip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={28} showText />
        {!esUltimo && (
          <button type="button" onClick={onComplete}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit',
            }}>
            Saltar
          </button>
        )}
      </div>

      {/* Contenido central */}
      <div key={paso} className="animate-scale-in" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: 'var(--radius-xl)',
          background: 'var(--surface-2)',
          color: slide.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          {slide.icon}
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
          maxWidth: 320, lineHeight: 1.2,
        }}>{slide.titulo}</h1>
        <p style={{
          fontSize: 15, color: 'var(--text-2)', maxWidth: 320,
          lineHeight: 1.6, marginTop: 8,
        }}>{slide.descripcion}</p>
      </div>

      {/* Indicadores de paso */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{
            width: i === paso ? 24 : 8,
            height: 8,
            borderRadius: 999,
            background: i === paso ? 'var(--brand-500)' : 'var(--border-strong)',
            transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        ))}
      </div>

      {/* Botón */}
      <Button
        variant="primary" size="lg" fullWidth onClick={siguiente}
        iconRight={esUltimo ? <CheckIcon width={18} height={18} /> : <ArrowRightIcon width={18} height={18} />}
      >
        {esUltimo ? 'Empezar' : 'Siguiente'}
      </Button>
    </div>
  );
};

export default Onboarding;
