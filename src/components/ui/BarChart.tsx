import React from 'react';

interface Barra {
  etiqueta: string;
  valor: number;
  valorSecundario?: number; // para barras apiladas
}

interface BarChartProps {
  barras: Barra[];
  color?: string;
  colorSecundario?: string;
  formatear?: (n: number) => string;
  altura?: number;
}

/**
 * Gráfico de barras vertical en SVG puro.
 * Soporta barras apiladas (valor + valorSecundario).
 */
const BarChart: React.FC<BarChartProps> = ({
  barras,
  color = 'var(--danger)',
  colorSecundario = 'var(--warning)',
  formatear = (n) => n.toString(),
  altura = 160,
}) => {
  const maxValor = Math.max(
    ...barras.map(b => b.valor + (b.valorSecundario || 0)),
    1
  );

  const padding = { top: 20, bottom: 28 };
  const alturaUtil = altura - padding.top - padding.bottom;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
        height: altura, gap: 8, padding: '0 4px',
      }}>
        {barras.map((b, i) => {
          const total = b.valor + (b.valorSecundario || 0);
          const hTotal = (total / maxValor) * alturaUtil;
          const hPrincipal = (b.valor / maxValor) * alturaUtil;
          const hSecundaria = ((b.valorSecundario || 0) / maxValor) * alturaUtil;
          const tieneValor = total > 0;

          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', height: '100%', justifyContent: 'flex-end',
            }}>
              {/* Valor arriba de la barra */}
              {tieneValor && (
                <div style={{
                  fontSize: 9, fontWeight: 600, color: 'var(--text-2)',
                  marginBottom: 4, fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}>
                  {formatear(total)}
                </div>
              )}
              {/* Barra */}
              <div style={{
                width: '100%', maxWidth: 40,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end',
                height: Math.max(hTotal, tieneValor ? 4 : 0),
                borderRadius: '4px 4px 0 0',
                overflow: 'hidden',
                transition: 'height 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {hSecundaria > 0 && (
                  <div style={{ height: hSecundaria, background: colorSecundario }} />
                )}
                {hPrincipal > 0 && (
                  <div style={{ height: hPrincipal, background: color }} />
                )}
              </div>
              {/* Etiqueta */}
              <div style={{
                fontSize: 11, color: 'var(--text-2)', marginTop: 8,
                fontWeight: 500,
              }}>
                {b.etiqueta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
