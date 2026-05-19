export { TIEMPO_ICON_KEYS, TIEMPO_MODULE_ICON_KEY } from './tiempoIconKeys.js';

import { resolveFlatModulePagesMap } from './appNavResolver.js';

/** Mapa id → destino para TiempoToolbarRight (desde menuStructure vía appNavResolver). */
export function getTiempoNavTargets() {
  return resolveFlatModulePagesMap('tiempo');
}

/** Compatibilidad: `import { TIEMPO_NAV_TARGETS }`. */
export const TIEMPO_NAV_TARGETS = getTiempoNavTargets();
