// Colores de marca que el usuario puede elegir en Ajustes.
// Cada uno define la paleta brand-400 a brand-800 (los tonos que usa la app).

export interface ColorMarca {
  id: string;
  nombre: string;
  // tonos: [400, 500 (principal), 600, 700, 800]
  tonos: [string, string, string, string, string];
  // versiones claras para fondos de badges (brand-50, brand-100, brand-200, brand-300)
  claros: [string, string, string, string];
}

export const COLORES_MARCA: ColorMarca[] = [
  {
    id: 'violeta',
    nombre: 'Violeta',
    tonos: ['#a78bfa', '#5b21b6', '#4c1d95', '#3b0764', '#2e1065'],
    claros: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd'],
  },
  {
    id: 'azul',
    nombre: 'Azul',
    tonos: ['#60a5fa', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
    claros: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd'],
  },
  {
    id: 'esmeralda',
    nombre: 'Verde',
    tonos: ['#34d399', '#10b981', '#059669', '#047857', '#065f46'],
    claros: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7'],
  },
  {
    id: 'rojo',
    nombre: 'Rojo',
    tonos: ['#f87171', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    claros: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5'],
  },
  {
    id: 'naranja',
    nombre: 'Naranja',
    tonos: ['#fb923c', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
    claros: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74'],
  },
  {
    id: 'rosa',
    nombre: 'Rosa',
    tonos: ['#f472b6', '#db2777', '#be185d', '#9d174d', '#831843'],
    claros: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4'],
  },
  {
    id: 'cian',
    nombre: 'Cian',
    tonos: ['#22d3ee', '#0891b2', '#0e7490', '#155e75', '#164e63'],
    claros: ['#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9'],
  },
  {
    id: 'indigo',
    nombre: 'Índigo',
    tonos: ['#818cf8', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
    claros: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc'],
  },
];

const KEY = 'stockly:color-marca';

export function obtenerColorMarcaGuardado(): string {
  try {
    return localStorage.getItem(KEY) || 'violeta';
  } catch {
    return 'violeta';
  }
}

export function guardarColorMarca(id: string) {
  try { localStorage.setItem(KEY, id); } catch { /* */ }
}

/**
 * Aplica el color de marca elegido inyectando las variables CSS.
 * Sobreescribe los --brand-* que define variables.css.
 */
export function aplicarColorMarca(id: string) {
  const color = COLORES_MARCA.find(c => c.id === id) || COLORES_MARCA[0];
  const root = document.documentElement;
  const [c50, c100, c200, c300] = color.claros;
  const [c400, c500, c600, c700, c800] = color.tonos;
  root.style.setProperty('--brand-50', c50);
  root.style.setProperty('--brand-100', c100);
  root.style.setProperty('--brand-200', c200);
  root.style.setProperty('--brand-300', c300);
  root.style.setProperty('--brand-400', c400);
  root.style.setProperty('--brand-500', c500);
  root.style.setProperty('--brand-600', c600);
  root.style.setProperty('--brand-700', c700);
  root.style.setProperty('--brand-800', c800);
  // Color de la barra de estado / theme
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', c500);
}
