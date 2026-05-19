import { isTiempoToolbarPath } from '../../foco/src/foco/tiempoToolbarPaths.js';

const ATTA_PATH_PREFIXES = ['/finanzas', '/propiedades'];
const PULSO_PATH_PREFIXES = ['/datacorporal', '/dieta', '/lab', '/salud'];

export function isAttaToolbarPath(path = '') {
  return ATTA_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isPulsoToolbarPath(path = '') {
  return PULSO_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Rutas que usan barra superior unificada (sin header + toolbar legacy). */
export function isUnifiedToolbarPath(path = '') {
  return isTiempoToolbarPath(path) || isAttaToolbarPath(path) || isPulsoToolbarPath(path);
}
