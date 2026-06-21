/**
 * Utilidades de fecha de tareas SIN dependencia de `date-fns`.
 *
 * Se separan de `agendaRules.js` porque el backend importa este código a través
 * de `googleTasksScheduleNotes.js`, y el backend resuelve `date-fns` desde
 * `apps/shared/node_modules` (no desde `apps/backend/node_modules`). Mantener
 * estas funciones libres de `date-fns` evita un ERR_MODULE_NOT_FOUND en deploy.
 */

/** Cadena sin hora de pared (Google Tasks date-only, medianoche UTC, etc.). */
export const isDateOnlyDueRaw = (value) => {
  if (value == null) return false;
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return true;
  if (/T00:00:00(\.000)?Z?$/i.test(raw)) return true;
  if (/T12:00:00(\.000)?Z?$/i.test(raw)) return true;
  if (/T00:00:00(\.000)?([+-]\d{2}:?\d{2})?$/i.test(raw)) return true;
  return false;
};

/** Instante ya parseado que representa solo un día (p. ej. mediodía local canónico). */
export const isDateOnlyDueInstant = (value, parsed = null) => {
  if (isDateOnlyDueRaw(value)) return true;
  const d = parsed ?? (value instanceof Date ? value : null);
  if (!d || Number.isNaN(d.getTime())) return false;
  if (d.getHours() === 12 && d.getMinutes() === 0 && d.getSeconds() === 0) return true;
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) return true;
  return false;
};

export const parseTaskDate = (value) => {
  if (!value) return null;

  // Date ya construido
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    if (isDateOnlyDueInstant(value, value)) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
    }
    return value;
  }

  const raw = String(value);

  // Formato día (YYYY-MM-DD): tratar como "día local" y evitar problemas de DST.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // ISO con hora o cualquier otro parseable por Date
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  if (isDateOnlyDueRaw(raw)) {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12, 0, 0, 0);
  }
  return dt;
};

/** Normaliza un due “solo día” a mediodía local (evita 9:00 por UTC). */
export const normalizeDateOnlyDue = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : parseTaskDate(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  if (!isDateOnlyDueRaw(value) && !isDateOnlyDueInstant(value, parsed)) return parsed;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0);
};
