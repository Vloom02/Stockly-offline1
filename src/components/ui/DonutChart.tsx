import React from 'react';

interface Segmento {
  label: string;
  valor: number;
  color: string;
}

interface DonutChartProps {
  segmentos: Segmento[];
  size?: number;
  grosor?: number;
  centroLabel?: string;
  centroValor?: string;
}

/**
 * Gráfico de dona en SVG puro (sin librerías).
 * Anima los segmentos con stroke-dasharray.
 */
const DonutChart: React.FC<DonutChartProps> = ({
  segmentos,
  size = 160,
  grosor = 22,
  centroLabel,
  centroValor,
}) => {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const centro = size / 2;

  let offsetAcumulado = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Fondo */}
        <circle
          cx={centro} cy={centro} r={radio}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={grosor}
        />
        {/* Segmentos */}
        {total > 0 && segmentos.map((seg, i) => {
          const porcentaje = seg.valor / total;
          const longitud = porcentaje * circunferencia;
          const dasharray = `${longitud} ${circunferencia - longitud}`;
          const dashoffset = -offsetAcumulado;
          offsetAcumulado += longitud;

          return (
            <circle
              key={i}
              cx={centro} cy={centro} r={radio}
              fill="none"
              stroke={seg.color}
              strokeWidth={grosor}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })}
      </svg>
      {/* Centro */}
      {(centroLabel || centroValor) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {centroValor && (
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {centroValor}
            </div>
          )}
          {centroLabel && (
            <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {centroLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
