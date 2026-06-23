export { TIEMPO_ICON_KEYS, TIEMPO_MODULE_ICON_KEY } from './tiempoIconKeys.js';

import { resolveFlatModulePages, resolveFlatModulePagesMap } from './appNavResolver.js';

/** Orden de secciones Foco (toolbar desktop y bottom nav móvil). */
export const TIEMPO_NAV_ORDER = ['rutinas', 'objetivos', 'tareas'];

/** Mapa id → destino para TiempoToolbarRight (desde menuStructure vía appNavResolver). */
export function getTiempoNavTargets() {
  return resolveFlatModulePagesMap('tiempo');
}

/** Compatibilidad: `import { TIEMPO_NAV_TARGETS }`. */
export const TIEMPO_NAV_TARGETS = getTiempoNavTargets();

/** Ítems de bottom nav móvil para la app Foco (páginas hijas, no switcher de apps). */
export function getTiempoBottomNavItems() {
  const byId = Object.fromEntries(
    resolveFlatModulePages('tiempo').map((page) => [page.id, page]),
  );
  return TIEMPO_NAV_ORDER.map((id) => byId[id]).filter(Boolean);
}
