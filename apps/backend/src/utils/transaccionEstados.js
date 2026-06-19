/** Estados que impactan el balance (manual usa PAGADO, sync externa usa COMPLETADA). */
export const ESTADOS_BALANCE = ['PAGADO', 'COMPLETADA'];

/**
 * Normaliza filtro de estado para consultas de balance.
 * PAGADO y COMPLETADA se tratan como equivalentes.
 */
export function buildEstadoQuery(estado) {
  if (!estado) return undefined;
  if (estado === 'PAGADO' || estado === 'COMPLETADA') {
    return { $in: ESTADOS_BALANCE };
  }
  return estado;
}
