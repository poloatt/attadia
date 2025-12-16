import React from 'react';
import AgendaToolbarCenter from '../../foco/src/proyectos/AgendaToolbarCenter.jsx';
import AgendaToolbarRight from '../../foco/src/proyectos/AgendaToolbarRight.jsx';

/**
 * Registro de módulos de Toolbar por ruta.
 * Cada entrada puede proveer un componente central para el track centrado.
 */
export const toolbarModules = [
  {
    id: 'agenda',
    match: (path) => (
      path === '/tiempo/tareas' || path.startsWith('/tiempo/tareas/') ||
      path === '/tareas' || path.startsWith('/tareas/')
    ),
    center: AgendaToolbarCenter,
    right: AgendaToolbarRight
  }
];

export function resolveToolbarCenterByPath(currentPath) {
  const mod = toolbarModules.find(m => m.match(currentPath));
  return mod?.center || null;
}

export function resolveToolbarRightByPath(currentPath) {
  const mod = toolbarModules.find(m => m.match(currentPath));
  return mod?.right || null;
}


