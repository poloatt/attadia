/**
 * Navegación derivada de menuStructure.js
 *
 * Niveles Atta (assets):
 * - app: Atta (assets)
 * - branch: Finanzas | Propiedades | Inventario (nivel 1 bajo app)
 * - page: Transacciones, Cuentas, Propiedades… (nivel 2)
 *
 * Foco/Pulso: subItems del módulo = páginas planas (sin rama intermedia).
 */

import { modulos } from './menuStructure';
import {
  findActiveModule,
  findActiveLevel1,
  getLevel2Children,
} from '../utils/navigationUtils';

/** @typedef {'branch' | 'page' | 'section'} NavLevel */

/**
 * @param {object} item - Nodo de menuStructure
 * @param {NavLevel} navLevel
 * @param {string|null} branchId
 */
function toNavItem(item, navLevel, branchId = null) {
  if (!item?.path) return null;
  return {
    id: item.id,
    path: item.path,
    label: item.title,
    iconKey: item.icon,
    navLevel,
    branchId,
    isUnderConstruction: !!item.isUnderConstruction,
    isBranchSwitcher: navLevel === 'branch',
  };
}

function getAssetsModule() {
  return modulos.find((m) => m.id === 'assets') || null;
}

/** Ramas Atta: Finanzas, Propiedades, Inventario */
export function getAttaBranches() {
  const assets = getAssetsModule();
  return (assets?.subItems || [])
    .map((b) => toNavItem(b, 'branch'))
    .filter(Boolean);
}

/** Subpáginas de una rama Atta (todas las del menú, incl. en construcción). */
export function getAttaBranchPages(branchId) {
  const assets = getAssetsModule();
  const branch = assets?.subItems?.find((s) => s.id === branchId);
  if (!branch?.subItems) return [];

  return branch.subItems
    .map((page) => toNavItem(page, 'page', branchId))
    .filter(Boolean);
}

/** Subpáginas Finanzas: solo hub / cards in-page, no en toolbar ni strip contextual. */
export const FINANZAS_TOOLBAR_EXCLUDE_PAGE_IDS = [
  'transacciones',
  'cuentas',
  'monedas',
  'recurrente',
  'inversiones',
  'deudores',
];

/**
 * Páginas Finanzas para toolbar centro y strip en subpáginas.
 * Excluye secciones con hub cards (navegación in-page).
 */
export function getFinanzasBranchPages() {
  const exclude = new Set(FINANZAS_TOOLBAR_EXCLUDE_PAGE_IDS);
  return getAttaBranchPages('finanzas').filter((page) => !exclude.has(page.id));
}

/** Subpáginas Propiedades: solo hub / cards in-page, no en toolbar ni strip contextual. */
export const PROPIEDADES_TOOLBAR_EXCLUDE_PAGE_IDS = [
  'propiedades',
  'contratos',
  'inquilinos',
];

/** Subpáginas Inventario: solo hub / cards in-page, no en toolbar ni strip contextual. */
export const INVENTARIO_TOOLBAR_EXCLUDE_PAGE_IDS = [
  'inventario-en-propiedades',
  'vehiculos',
  'inventario-sin-ubicacion',
];

/**
 * Páginas Propiedades para toolbar centro y strip en subpáginas.
 * Vacío: navegación vía hub (/propiedades) y botón atrás en subpáginas.
 */
export function getPropiedadesBranchPages() {
  const exclude = new Set(PROPIEDADES_TOOLBAR_EXCLUDE_PAGE_IDS);
  return getAttaBranchPages('propiedades').filter((page) => !exclude.has(page.id));
}

/**
 * Páginas Inventario para toolbar centro y strip en subpáginas.
 * Vacío: navegación vía hub (/propiedades/inventario) y botón atrás en subpáginas.
 */
export function getInventarioBranchPages() {
  const exclude = new Set(INVENTARIO_TOOLBAR_EXCLUDE_PAGE_IDS);
  return getAttaBranchPages('inventario').filter((page) => !exclude.has(page.id));
}

export function getAttaBranchById(branchId) {
  return getAttaBranches().find((b) => b.id === branchId) || null;
}

/**
 * Ítems para bottom nav móvil según módulo y ruta.
 * Atta: ramas [Finanzas, Propiedades, Inventario] (páginas hoja en toolbar centro).
 * Foco/Pulso: subItems del módulo (secciones planas).
 */
export function resolveBottomNavItems(currentPath) {
  const moduloActivo = findActiveModule(currentPath);
  if (!moduloActivo) return [];

  if (moduloActivo.id === 'assets') {
    return getAttaBranches();
  }

  const orderMap = {
    foco: 1,
    objetivos: 2,
    tareas: 3,
    rutinas: 4,
    datacorporal: 1,
    dieta: 2,
    lab: 3,
  };

  return resolveFlatModulePages(moduloActivo.id).sort(
    (a, b) => (orderMap[a.id] || 999) - (orderMap[b.id] || 999),
  );
}

/** Toolbar derecha Atta (desktop): ramas Finanzas | Propiedades | Inventario. */
export function resolveAttaToolbarRight(currentPath) {
  const moduloActivo = findActiveModule(currentPath);
  if (moduloActivo?.id !== 'assets') {
    return { branches: [], activeBranchId: null };
  }

  const nivel1 = findActiveLevel1(moduloActivo, currentPath);
  return {
    branches: getAttaBranches(),
    activeBranchId: nivel1?.id || null,
  };
}

/**
 * Si la ruta está en una page con subItems (p. ej. transacciones → recurrentes),
 * devuelve navegación contextual [page, ...subpages]; si no, todas las pages de la rama.
 */
function resolveAttaBranchToolbarPages(currentPath, branchId) {
  if (branchId === 'finanzas') {
    return getFinanzasBranchPages();
  }

  if (branchId === 'propiedades') {
    return getPropiedadesBranchPages();
  }

  if (branchId === 'inventario') {
    return getInventarioBranchPages();
  }

  const assets = getAssetsModule();
  const branch = assets?.subItems?.find((s) => s.id === branchId);
  if (!branch?.subItems) return [];

  for (const page of branch.subItems) {
    if (!page.subItems?.length) continue;
    const onParent = isPathActive(currentPath, page.path);
    const onChild = page.subItems.some((sub) => isPathActive(currentPath, sub.path));
    if (onParent || onChild) {
      return [
        toNavItem(page, 'page', branchId),
        ...page.subItems.map((sub) => toNavItem(sub, 'page', branchId)),
      ].filter(Boolean);
    }
  }

  return getAttaBranchPages(branchId);
}

/** Toolbar centro Atta (móvil y desktop): subpáginas de la rama o subnav contextual. */
export function resolveAttaToolbarCenter(currentPath) {
  const moduloActivo = findActiveModule(currentPath);
  if (moduloActivo?.id !== 'assets') return [];

  const nivel1 = findActiveLevel1(moduloActivo, currentPath);
  const branchId = nivel1?.id || 'finanzas';
  return resolveAttaBranchToolbarPages(currentPath, branchId);
}

function isInventarioBranchRoute(pathname) {
  return (
    pathname === '/propiedades/inventario'
    || pathname.startsWith('/propiedades/inventario/')
    || pathname === '/propiedades/autos'
    || pathname.startsWith('/propiedades/autos/')
  );
}

export function isAttaPageActive(pathname, page) {
  if (!page) return false;
  if (page.id === 'finanzas') {
    return pathname === '/finanzas';
  }
  if (page.id === 'propiedades') {
    if (isInventarioBranchRoute(pathname)) {
      return false;
    }
    return pathname === '/propiedades' || pathname.startsWith('/propiedades/habitaciones');
  }
  if (
    page.id === 'inventario-en-propiedades'
    || page.id === 'inventario-sin-ubicacion'
  ) {
    return isPathActive(pathname, page.path);
  }
  if (page.id === 'vehiculos') {
    return (
      pathname === '/propiedades/autos'
      || pathname.startsWith('/propiedades/autos/')
    );
  }
  return isPathActive(pathname, page.path);
}

export function isPathActive(pathname, path) {
  if (!path) return false;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Secciones planas (Foco, Pulso): subItems del módulo. */
export function resolveFlatModulePages(moduleId) {
  const modulo = modulos.find((m) => m.id === moduleId);
  return (modulo?.subItems || [])
    .filter((item) => !item.isUnderConstruction)
    .map((item) => toNavItem(item, 'section'))
    .filter(Boolean);
}

/** Mapa id → { path, label, iconKey } para toolbars (Foco). */
export function resolveFlatModulePagesMap(moduleId) {
  return Object.fromEntries(
    resolveFlatModulePages(moduleId).map((t) => [
      t.id,
      { path: t.path, label: t.label, iconKey: t.iconKey },
    ]),
  );
}

/**
 * Hub de rama Atta para botón «atrás» en subpáginas.
 * Finanzas → /finanzas; Propiedades → /propiedades; Inventario → /propiedades/inventario.
 * @returns {string|null} path del hub o null si ya estás en el hub.
 */
export function resolveAttaBranchHubPath(pathname) {
  if (pathname === '/finanzas' || pathname.startsWith('/finanzas/')) {
    return pathname === '/finanzas' ? null : '/finanzas';
  }
  if (
    pathname === '/propiedades/inventario'
    || pathname.startsWith('/propiedades/inventario/')
    || pathname === '/propiedades/autos'
    || pathname.startsWith('/propiedades/autos/')
  ) {
    return pathname === '/propiedades/inventario' ? null : '/propiedades/inventario';
  }
  if (pathname === '/propiedades' || pathname.startsWith('/propiedades/')) {
    return pathname === '/propiedades' ? null : '/propiedades';
  }
  return null;
}

/** Etiqueta del hub de rama (tooltip del botón atrás). */
export function resolveAttaBranchHubLabel(pathname) {
  const hubPath = resolveAttaBranchHubPath(pathname);
  if (!hubPath) return null;
  if (hubPath === '/finanzas') return 'Finanzas';
  if (hubPath === '/propiedades') return 'Propiedades';
  if (hubPath === '/propiedades/inventario') return 'Inventario';
  return 'Volver';
}

export function isAttaBranchActive(pathname, branch) {
  if (!branch) return false;
  if (branch.id === 'finanzas') {
    return pathname === '/finanzas' || pathname.startsWith('/finanzas/');
  }
  if (branch.id === 'propiedades') {
    if (isInventarioBranchRoute(pathname)) {
      return false;
    }
    return pathname === '/propiedades' || pathname.startsWith('/propiedades/');
  }
  if (branch.id === 'inventario') {
    return isInventarioBranchRoute(pathname);
  }
  return isPathActive(pathname, branch.path);
}
