import { getToolbarModules } from './toolbarRegistry';
export { matchTiempoSection, isTiempoToolbarPath } from './tiempoToolbarPaths';

export function resolveToolbarModule(currentPath) {
  return getToolbarModules().find((m) => m.match(currentPath)) || null;
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
