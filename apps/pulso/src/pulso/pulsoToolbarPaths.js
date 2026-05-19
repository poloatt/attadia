/** Rutas del módulo Pulso. */
export function matchPulsoSection(path = '') {
  if (path === '/datacorporal' || path.startsWith('/datacorporal/')) return 'datacorporal';
  if (path === '/dieta' || path.startsWith('/dieta/')) return 'dieta';
  if (path === '/lab' || path.startsWith('/lab/')) return 'lab';
  if (path === '/salud' || path.startsWith('/salud/')) return 'salud';
  return null;
}
