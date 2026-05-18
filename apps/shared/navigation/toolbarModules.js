import React from 'react';
import ObjetivosToolbarCenter from '../../foco/src/foco/ObjetivosToolbarCenter.jsx';
import TareasToolbarCenter from '../../foco/src/foco/TareasToolbarCenter.jsx';
import TiempoToolbarRight from '../../foco/src/foco/TiempoToolbarRight.jsx';
import { matchTiempoSection } from '../../foco/src/foco/tiempoToolbarPaths.js';

/**
 * Registro de módulos de Toolbar por ruta.
 */
export const toolbarModules = [
  {
    id: 'foco',
    match: (path) => matchTiempoSection(path) === 'foco',
    center: null,
    centerDesktop: false,
    right: TiempoToolbarRight,
  },
  {
    id: 'objetivos',
    match: (path) => matchTiempoSection(path) === 'objetivos',
    center: ObjetivosToolbarCenter,
    centerDesktop: true,
    right: TiempoToolbarRight,
  },
  {
    id: 'tareas',
    match: (path) => matchTiempoSection(path) === 'tareas',
    center: TareasToolbarCenter,
    centerDesktop: true,
    right: TiempoToolbarRight,
  },
];

export { matchTiempoSection };
export { isTiempoToolbarPath } from '../../foco/src/foco/tiempoToolbarPaths.js';

export function resolveToolbarModule(currentPath) {
  return toolbarModules.find((m) => m.match(currentPath)) || null;
}

export function resolveToolbarCenterByPath(currentPath) {
  return resolveToolbarModule(currentPath)?.center || null;
}

export function resolveToolbarCenterDesktop(currentPath) {
  return !!resolveToolbarModule(currentPath)?.centerDesktop;
}

export function resolveToolbarRightByPath(currentPath) {
  return resolveToolbarModule(currentPath)?.right || null;
}
