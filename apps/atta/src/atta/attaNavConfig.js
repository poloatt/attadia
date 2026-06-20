/**
 * Re-exporta navegación Atta desde appNavResolver (sin evaluar en import).
 */
export {
  getAttaBranches,
  getAttaBranchPages,
  getFinanzasBranchPages,
  getPropiedadesBranchPages,
  getPropiedadesSectionPages,
  getInventarioSectionPages,
  getAttaBranchById,
  resolveAttaToolbarCenter,
  resolveAttaToolbarRight,
  isAttaPageActive,
  isAttaBranchActive,
} from '@shared/navigation/appNavResolver';

import {
  getAttaBranches,
  getFinanzasBranchPages,
  getPropiedadesBranchPages,
  getPropiedadesSectionPages,
  getInventarioSectionPages,
} from '@shared/navigation/appNavResolver';

export function getAttaBranchFinanzas() {
  return { id: 'finanzas', path: '/finanzas', label: 'Finanzas' };
}

export function getAttaBranchPropiedades() {
  return getPropiedadesSectionPages()[0] ?? null;
}

export function getAttaBranchInventario() {
  return getInventarioSectionPages()[0] ?? null;
}

export function getAttaFinanzasNav() {
  return getFinanzasBranchPages();
}

export function getAttaPropiedadesNav() {
  return getPropiedadesSectionPages();
}

export function getAttaInventarioNav() {
  return getInventarioSectionPages();
}
