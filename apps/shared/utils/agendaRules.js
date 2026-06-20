import {
  addMonths,
  isSameMonth,
  isThisMonth,
  isThisWeek,
  isThisYear,
  isToday,
  isTomorrow,
} from 'date-fns';

/**
 * Reglas de agenda (AHORA/LUEGO) basadas en best practices:
 * - `due` representa el compromiso (lo que vence).
 * - `start` representa disponibilidad (fallback cuando no hay due).
 *
 * Nota: las tareas pueden traer hora (ISO con `T`), por lo que NO usamos `parseAPIDate`.
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

/** Normaliza un due “solo día” a mediodía local (evita 9:00 por UTC). */
export const normalizeDateOnlyDue = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : parseTaskDate(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  if (!isDateOnlyDueRaw(value) && !isDateOnlyDueInstant(value, parsed)) return parsed;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0);
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

export const isTaskCompleted = (t) => {
  if (!t) return false;
  if (t.completada === true || t.completada === 'true') return true;
  const estado = String(t.estado || '').toUpperCase();
  if (estado === 'COMPLETADA') return true;
  const gCompleted = t.googleTasksSync?.completed;
  if (gCompleted instanceof Date) return !Number.isNaN(gCompleted.getTime());
  if (typeof gCompleted === 'string' && gCompleted.trim()) return true;
  return false;
};

export const getTaskStart = (t) =>
  parseTaskDate(t?.fechaInicio || t?.inicio || t?.start);

export const getTaskDue = (t) => {
  const due = parseTaskDate(
    t?.fechaVencimiento || t?.vencimiento || t?.dueDate || t?.fecha,
  );
  if (due) return due;
  if (String(t?.tipo || '').toUpperCase() === 'EVENTO') {
    return parseTaskDate(t?.fechaFin);
  }
  return null;
};

export const getStartOfToday = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

export const getEndOfTomorrow = (now = new Date()) => {
  const startOfToday = getStartOfToday(now);
  const endOfTomorrow = new Date(startOfToday);
  endOfTomorrow.setDate(startOfToday.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59, 999);
  return endOfTomorrow;
};

/**
 * Ancla de agenda:
 * - Si hay due -> due manda.
 * - Si no hay due -> start.
 * - Si no hay fechas -> null.
 */
export const getAnchorDate = (task) => {
  const due = getTaskDue(task);
  if (due) return due;
  const start = getTaskStart(task);
  return start || null;
};

export const isInAhora = (task, now = new Date()) => {
  const due = getTaskDue(task);
  const start = getTaskStart(task);
  const endOfTomorrow = getEndOfTomorrow(now);

  // sin fechas => AHORA
  if (!due && !start) return true;
  // due manda si existe
  if (due) return due <= endOfTomorrow;
  // fallback start
  return start <= endOfTomorrow;
};

export const isInLuego = (task, now = new Date()) => {
  const due = getTaskDue(task);
  const start = getTaskStart(task);
  const endOfTomorrow = getEndOfTomorrow(now);

  // sin fechas => no es LUEGO (se queda en AHORA)
  if (!due && !start) return false;
  // due manda si existe
  if (due) return due > endOfTomorrow;
  // fallback start
  return start > endOfTomorrow;
};

export const getBucketAhora = (task, now = new Date()) => {
  const anchor = getAnchorDate(task);
  if (!anchor) return 'SIN FECHA';

  const startOfToday = getStartOfToday(now);

  // Overdue: se agrupa en HOY (sin bucket separado)
  if (anchor < startOfToday) return 'HOY';
  if (isToday(anchor)) return 'HOY';
  if (isTomorrow(anchor)) return 'MAÑANA';
  if (isThisWeek(anchor)) return 'ESTA SEMANA';
  if (isThisMonth(anchor)) return 'ESTE MES';
  // Nota: "próximo trimestre" = ventana móvil de ~3 meses hacia adelante
  if (anchor < addMonths(now, 3)) return 'PRÓXIMO TRIMESTRE';
  if (isThisYear(anchor)) return 'ESTE AÑO';
  return 'MÁS ADELANTE';
};

export const getBucketLuego = (task, now = new Date()) => {
  const anchor = getAnchorDate(task);
  if (!anchor) return 'SIN FECHA';

  if (isThisWeek(anchor)) return 'ESTA SEMANA';
  if (isThisMonth(anchor)) return 'ESTE MES';
  // Mes siguiente (calendario) como bucket propio
  if (isSameMonth(anchor, addMonths(now, 1))) return 'PRÓXIMO MES';
  if (anchor < addMonths(now, 3)) return 'PRÓXIMO TRIMESTRE';
  if (isThisYear(anchor)) return 'ESTE AÑO';
  return 'MÁS ADELANTE';
};

export const getAgendaBucket = (task, agendaView = 'ahora', now = new Date()) => {
  if (agendaView === 'luego') return getBucketLuego(task, now);
  return getBucketAhora(task, now);
};

export const getAgendaSortKey = (task) => getAnchorDate(task);


