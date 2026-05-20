/**
 * Re-exporta navegación Atta desde appNavResolver (sin evaluar en import).
 */
export {
  getAttaBranches,
  getAttaBranchPages,
  getFinanzasBranchPages,
  getPropiedadesBranchPages,
  getInventarioBranchPages,
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
  getInventarioBranchPages,
} from '@shared/navigation/appNavResolver';

export function getAttaBranchFinanzas() {
  return getAttaBranches().find((b) => b.id === 'finanzas');
}

export function getAttaBranchPropiedades() {
  return getAttaBranches().find((b) => b.id === 'propiedades');
}

export function getAttaBranchInventario() {
  return getAttaBranches().find((b) => b.id === 'inventario');
}

export function getAttaFinanzasNav() {
  return getFinanzasBranchPages();
}

export function getAttaPropiedadesNav() {
  return getPropiedadesBranchPages();
}

export function getAttaInventarioNav() {
  return getInventarioBranchPages();
}
