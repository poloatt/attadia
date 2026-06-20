/**
 * Normaliza filtros de estado para queries de transacciones.
 * El frontend usa PAGADO; sync MP y formularios manuales guardan COMPLETADA.
 */
export function buildEstadoFilter(estado) {
  if (!estado) return undefined;
  if (estado === 'PAGADO') {
    return { $in: ['PAGADO', 'COMPLETADA'] };
  }
  return estado;
}
