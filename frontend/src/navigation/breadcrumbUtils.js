// breadcrumbUtils.js
// Utilidad para obtener los breadcrumbs jerárquicos según la ruta y el menú
import { menuItems } from './menuStructure';
import { icons } from './menuIcons';

function isRouteActive(path, currentPath) {
  if (!path) return false;
  return currentPath === path || currentPath.startsWith(path + '/');
}

export function getBreadcrumbs(currentPath, items = menuItems, acc = []) {
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