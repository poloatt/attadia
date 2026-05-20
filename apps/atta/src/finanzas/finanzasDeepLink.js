export const MONEDAS_PATH = '/finanzas/monedas';
export const CUENTAS_PATH = '/finanzas/cuentas';

export function monedaDetailPath(monedaId) {
  return `${MONEDAS_PATH}?id=${monedaId}`;
}

export function cuentaDetailPath(cuentaId) {
  return `${CUENTAS_PATH}?cuenta=${cuentaId}`;
}
