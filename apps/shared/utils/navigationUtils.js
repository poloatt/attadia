import { modulos } from '../navigation/menuStructure';

/**
 * Utilidades centralizadas para lógica de navegación
 * Elimina duplicación en Layout.jsx, BottomNavigation.jsx, Toolbar.jsx
 */

/**
 * Encuentra el módulo activo según la ruta actual
 * @param {string} currentPath - Ruta actual (location.pathname)
 * @returns {Object|null} - Módulo activo o null si no se encuentra
 */
export function findActiveModule(currentPath) {
  if (!currentPath) return null;
  
  return modulos.find(modulo =>
    modulo.subItems?.some(sub => currentPath.startsWith(sub.path)) ||
    currentPath.startsWith(modulo.path)
  ) || null;
}

/**
 * Encuentra el nivel 1 activo dentro del módulo activo
 * @param {Object} moduloActivo - Módulo activo
 * @param {string} currentPath - Ruta actual
 * @returns {Object|null} - Nivel 1 activo o null
 */
export function findActiveLevel1(moduloActivo, currentPath) {
  if (!moduloActivo || !currentPath) return null;
  
  return moduloActivo.subItems?.find(
    sub => currentPath.startsWith(sub.path)
  ) || null;
}

/**
 * Obtiene los hijos de nivel 2 del nivel 1 activo
 * @param {Object} nivel1Activo - Nivel 1 activo
 * @returns {Array} - Array de hijos de nivel 2 o array vacío
 */
export function getLevel2Children(nivel1Activo) {
  return nivel1Activo?.subItems || [];
}

/**
 * Hook personalizado que combina toda la lógica de navegación
 * @param {string} currentPath - Ruta actual
 * @returns {Object} - Objeto con todas las propiedades de navegación
 */
export function useNavigationState(currentPath) {
  const moduloActivo = findActiveModule(currentPath);
  const nivel1Activo = findActiveLevel1(moduloActivo, currentPath);
  const nivel2 = getLevel2Children(nivel1Activo);
  
  return {
    moduloActivo,
    nivel1Activo,
    nivel2,
    // Utilidades adicionales
    hasActiveModule: !!moduloActivo,
    hasActiveLevel1: !!nivel1Activo,
    hasLevel2Children: nivel2.length > 0
  };
}

/**
 * Obtiene los módulos principales para navegación
 * @param {Array} moduleIds - IDs de módulos a filtrar (opcional)
 * @returns {Array} - Array de módulos filtrados
 */
export function getMainModules(moduleIds = ['assets', 'salud', 'tiempo']) {
  return modulos.filter(m => moduleIds.includes(m.id));
}

/**
 * Reordena módulos poniendo el activo primero
 * @param {Array} modules - Array de módulos
 * @param {Object} activeModule - Módulo activo
 * @returns {Array} - Array reordenado
 */
export function reorderModulesWithActiveFirst(modules, activeModule) {
  if (!activeModule) return modules;
  
  const otherModules = modules.filter(m => m.id !== activeModule.id);
  return [activeModule, ...otherModules];
}

/**
 * Verifica si una ruta está activa
 * @param {string} currentPath - Ruta actual
 * @param {string|Array} targetPaths - Ruta(s) objetivo
 * @returns {boolean} - True si está activa
 */
export function isRouteActive(currentPath, targetPaths) {
  if (Array.isArray(targetPaths)) {
    return targetPaths.some(path => {
      if (path === '/') {
        return currentPath === '/' || currentPath.startsWith('/assets/');
      }
      return currentPath === path || currentPath.startsWith(path + '/');
    });
  }
  
  if (targetPaths === '/') {
    return currentPath === '/' || currentPath.startsWith('/assets/');
  }
  
  return currentPath === targetPaths || currentPath.startsWith(targetPaths + '/');
}

/**
 * Obtiene información de navegación para breadcrumbs
 * @param {string} currentPath - Ruta actual
 * @returns {Object} - Información para breadcrumbs
 */
export function getBreadcrumbInfo(currentPath) {
  const { moduloActivo, nivel1Activo } = useNavigationState(currentPath);
  
  const pathParts = currentPath.split('/').filter(Boolean);
  const canGoBack = pathParts.length > 1;
  const parentPath = canGoBack ? '/' + pathParts.slice(0, -1).join('/') : '/';
  
  return {
    moduloActivo,
    nivel1Activo,
    canGoBack,
    parentPath,
    pathParts
  };
} 