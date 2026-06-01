import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { DiaVencimiento } from '../../types';

interface CalendarioProps {
  vencimientos: (anio: number, mes: number) => Map<string, DiaVencimiento>;
  onDiaClick?: (fecha: string) => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendario mensual que marca con puntos de color los días con vencimientos.
 */
const CalendarioVencimientos: React.FC<CalendarioProps> = ({ vencimientos, onDiaClick }) => {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());

  const datos = vencimientos(anio, mes);

  // Primer día del mes (ajustado a lunes = 0)
  const primerDia = new Date(anio, mes, 1);
  let offsetInicial = primerDia.getDay() - 1; // getDay: domingo=0
  if (offsetInicial < 0) offsetInicial = 6;   // domingo va al final

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyStr = hoy.toISOString().slice(0, 10);

  const cambiarMes = (delta: number) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  // Construir celdas
  const celdas: (number | null)[] = [];
  for (let i = 0; i < offsetInicial; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  return (
    <div>
      {/* Header navegación */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <button type="button" onClick={() => cambiarMes(-1)} style={navBtn}>
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {MESES[mes]} {anio}
        </div>
        <button type="button" onClick={() => cambiarMes(1)} style={navBtn}>
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 600,
            color: 'var(--text-3)', textTransform: 'uppercase',
          }}>{d}</div>
        ))}
      </div>

      {/* Grilla de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`empty-${i}`} />;

          const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const info = datos.get(fechaStr);
          const esHoy = fechaStr === hoyStr;

          return (
            <button
              key={dia}
              type="button"
              onClick={() => info && onDiaClick?.(fechaStr)}
              disabled={!info}
              style={{
                aspectRatio: '1',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2,
                borderRadius: 'var(--radius-sm)',
                border: esHoy ? '1.5px solid var(--brand-500)' : '1px solid transparent',
                background: info ? `var(--level-${info.nivelPeor}-bg)` : 'transparent',
                cursor: info ? 'pointer' : 'default',
                fontFamily: 'inherit',
                padding: 0,
                transition: 'transform 120ms',
              }}
              onMouseDown={(e) => {
                if (info) {
                  e.currentTarget.style.transform = 'scale(0.92)';
                  setTimeout(() => { e.currentTarget.style.transform = ''; }, 120);
                }
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: esHoy ? 700 : info ? 600 : 400,
                color: info ? `var(--level-${info.nivelPeor}-fg)` : esHoy ? 'var(--brand-600)' : 'var(--text-2)',
              }}>{dia}</span>
              {info && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: `var(--level-${info.nivelPeor}-fg)`,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const navBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 'var(--radius)',
  background: 'var(--surface-2)', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text)',
};

export default CalendarioVencimientos;
