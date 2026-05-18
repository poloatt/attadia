/**
 * Iconos y rutas del módulo Tiempo (Agenda / objetivos / Tareas).
 * Las claves de icono corresponden a `menuIcons.js` (getIconByKey).
 */
export const TIEMPO_ICON_KEYS = {
  foco: 'calendarToday',
  objetivos: 'objetivo',
  tareas: 'task',
};

/** Icono del módulo padre en sidebar y bottom nav. */
export const TIEMPO_MODULE_ICON_KEY = TIEMPO_ICON_KEYS.foco;

export const TIEMPO_NAV_TARGETS = {
  foco: { path: '/foco', label: 'Agenda', iconKey: TIEMPO_ICON_KEYS.foco },
  objetivos: { path: '/objetivos', label: 'Objetivos', iconKey: TIEMPO_ICON_KEYS.objetivos },
  tareas: { path: '/tareas', label: 'Tareas', iconKey: TIEMPO_ICON_KEYS.tareas },
};
