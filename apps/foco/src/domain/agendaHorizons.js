/** Ventana por defecto alineada con backend GTASKS_LIST_* (7 + 90 días). */
export const LIST_LOOKBACK_DAYS = 7;
export const LIST_HORIZON_DAYS = 90;

export function getDefaultListRangeDates(now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - LIST_LOOKBACK_DAYS);
  const to = new Date(today);
  to.setDate(to.getDate() + LIST_HORIZON_DAYS);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}
