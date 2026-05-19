import React from 'react';
import ObjetivosToolbarCenter from '../../foco/src/foco/ObjetivosToolbarCenter.jsx';
import TareasToolbarCenter from '../../foco/src/foco/TareasToolbarCenter.jsx';
import TiempoToolbarRight from '../../foco/src/foco/TiempoToolbarRight.jsx';
import { matchTiempoSection } from '../../foco/src/foco/tiempoToolbarPaths.js';
import { matchAttaSection } from '../../atta/src/atta/attaToolbarPaths.js';
import AttaToolbarLeft from '../../atta/src/atta/AttaToolbarLeft.jsx';
import AttaToolbarCenter from '../../atta/src/atta/AttaToolbarCenter.jsx';
import AttaToolbarRight from '../../atta/src/atta/AttaToolbarRight.jsx';
import { matchPulsoSection } from '../../pulso/src/pulso/pulsoToolbarPaths.js';
import PulsoToolbarCenter from '../../pulso/src/pulso/PulsoToolbarCenter.jsx';
import PulsoToolbarRight from '../../pulso/src/pulso/PulsoToolbarRight.jsx';

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
  {
    id: 'atta',
    match: (path) => matchAttaSection(path) != null,
    left: AttaToolbarLeft,
    center: AttaToolbarCenter,
    centerDesktop: true,
    right: AttaToolbarRight,
  },
  {
    id: 'pulso',
    match: (path) => matchPulsoSection(path) != null,
    center: PulsoToolbarCenter,
    centerDesktop: true,
    right: PulsoToolbarRight,
  },
];

export { matchTiempoSection };
export { isTiempoToolbarPath } from '../../foco/src/foco/tiempoToolbarPaths.js';

export function resolveToolbarModule(currentPath) {
  return toolbarModules.find((m) => m.match(currentPath)) || null;
}

export function resolveToolbarLeftByPath(currentPath) {
  return resolveToolbarModule(currentPath)?.left || null;
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
