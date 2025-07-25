// breadcrumbUtils.js
// Utilidad para obtener los breadcrumbs jerárquicos según la ruta y el menú
// import { modulos } from './menuStructure'; // Eliminado: ahora es argumento obligatorio
import { icons } from './menuIcons';

function isRouteActive(path, currentPath) {
  if (!path) return false;
  return currentPath === path || currentPath.startsWith(path + '/');
}

// Ahora items es obligatorio, no hay valor por defecto
export function getBreadcrumbs(currentPath, items, acc = []) {
  for (const item of items) {
    if (item.path && isRouteActive(item.path, currentPath)) {
      acc.push(item);
      if (item.subItems) {
        const deeper = getBreadcrumbs(currentPath, item.subItems, []);
        if (deeper.length) return [...acc, ...deeper];
      }
      return acc;
    }
    if (item.subItems) {
      const deeper = getBreadcrumbs(currentPath, item.subItems, []);
      if (deeper.length) return [item, ...deeper];
    }
  }
  return [];
} 