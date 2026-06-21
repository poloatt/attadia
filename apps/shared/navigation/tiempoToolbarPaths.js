/** Rutas del módulo Tiempo (Hub Foco / Agenda / objetivos / Tareas). */
export function matchTiempoSection(path = '') {
  if (path === '/foco' || path.startsWith('/foco/')) return 'hub';
  if (path === '/agenda' || path.startsWith('/agenda/')) return 'agenda';
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

/** Rutas Foco que usan barra unificada (incluye Hábitos y Archivo). */
export function isFocoToolbarPath(path = '') {
  return isTiempoToolbarPath(path)
    || path === '/rutinas'
    || path.startsWith('/rutinas/')
    || path === '/archivo'
    || path.startsWith('/archivo/');
}

/** Calendario día/semana (antes en /foco). */
export function isAgendaCalendarPath(path = '') {
  return path === '/agenda' || path.startsWith('/agenda/');
}

/** Hub central Foco (Hábitos + previews). */
export function isFocoHubPath(path = '') {
  return path === '/foco' || path.startsWith('/foco/');
}
