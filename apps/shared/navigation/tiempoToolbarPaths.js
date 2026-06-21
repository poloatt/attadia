/** Rutas del módulo Tiempo (Foco / objetivos / Tareas). */
export function matchTiempoSection(path = '') {
  if (path === '/foco' || path.startsWith('/foco/')) return 'foco';
  if (
    path === '/objetivos'
    || path.startsWith('/objetivos/')
    || path.startsWith('/tiempo/objetivos')
    || path === '/proyectos'
    || path.startsWith('/proyectos/')
    || path.startsWith('/tiempo/proyectos')
  ) return 'objetivos';
  if (
    path === '/tareas'
    || path.startsWith('/tareas/')
    || path.startsWith('/tiempo/tareas')
  ) return 'tareas';
  return null;
}

export function isTiempoToolbarPath(path = '') {
  return matchTiempoSection(path) != null;
}
