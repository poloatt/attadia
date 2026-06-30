import { addDays, format, isAfter, isSameDay, startOfDay, subDays } from 'date-fns';
import { es } from './localeEs.js';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from './dateUtils.js';
import { calculateCompletionPercentage, calculateVisibleItems } from './rutinaCalculations.js';

/** Formato legible de fecha de rutina para cabecera de página. */
export function formatRutinaDayLabel(fecha) {
  if (!fecha) return '';
  try {
    return format(parseAPIDate(fecha), 'EEE d MMM yy', { locale: es });
  } catch {
    return '';
  }
}

/** Subtítulo informativo: fecha · % (sin posición en lista). */
export function formatRutinaDaySubtitle({ fecha, percentage }) {
  const dateLabel = formatRutinaDayLabel(fecha);
  const pctLabel = typeof percentage === 'number' ? `${percentage}%` : '—';
  return [dateLabel, pctLabel].filter(Boolean).join(' · ');
}

/** Modo del día activo respecto a hoy. */
export function getRutinaDayMode(fecha, today = getNormalizedToday()) {
  if (!fecha) return 'empty';
  try {
    const day = startOfDay(parseAPIDate(fecha));
    const todayStart = startOfDay(today);
    if (day < todayStart) return 'historical';
    if (isSameDay(day, todayStart)) return 'today';
    return 'future';
  } catch {
    return 'empty';
  }
}

export function isRutinaToday(fecha, today = getNormalizedToday()) {
  return getRutinaDayMode(fecha, today) === 'today';
}

export function isRutinaHistorical(fecha, today = getNormalizedToday()) {
  return getRutinaDayMode(fecha, today) === 'historical';
}

/** Estadísticas de completitud para resumen de día. */
export function getRutinaCompletionStats(rutina, customHabits = null) {
  if (!rutina) {
    return { percentage: 0, completed: 0, total: 0 };
  }
  const percentage = calculateCompletionPercentage(rutina, customHabits);
  const { visibleItems, completedItems } = calculateVisibleItems(rutina, {}, customHabits);
  return {
    percentage,
    completed: completedItems.length,
    total: visibleItems.length,
  };
}

export function findRutinaByDateStr(rutinas = [], dateStr) {
  if (!dateStr || !Array.isArray(rutinas)) return null;
  return rutinas.find((r) => {
    try {
      return formatDateForAPI(parseAPIDate(r.fecha)) === dateStr;
    } catch {
      return false;
    }
  }) ?? null;
}

export function normalizeRutinaNavigateDate(date) {
  if (!date) return formatDateForAPI(getNormalizedToday());
  try {
    return formatDateForAPI(parseAPIDate(date));
  } catch {
    return formatDateForAPI(getNormalizedToday());
  }
}

function getActiveDateStr({ activeDate, activeRutinaId, rutinas = [] }) {
  if (activeDate) return normalizeRutinaNavigateDate(activeDate);
  if (activeRutinaId) {
    const active = rutinas.find((r) => r._id === activeRutinaId);
    if (active?.fecha) {
      try {
        return formatDateForAPI(parseAPIDate(active.fecha));
      } catch {
        // fall through
      }
    }
  }
  return formatDateForAPI(getNormalizedToday());
}

/**
 * Resuelve destino de navegación diaria por fecha calendario.
 * ‹ prev = día anterior; › next = día siguiente.
 */
/** Fecha YYYY-MM-DD desde la cual propagar cambios de config hacia el futuro. */
export function resolveHabitConfigApplyFrom(rutinaOrDate, today = getNormalizedToday()) {
  const fallback = formatDateForAPI(today);
  if (!rutinaOrDate) return fallback;
  const raw = rutinaOrDate?.fecha ?? rutinaOrDate;
  try {
    return formatDateForAPI(parseAPIDate(raw));
  } catch {
    return fallback;
  }
}

export function isForwardConfigScope(scope) {
  const normalized = (scope || 'forward').toString().toLowerCase();
  return normalized === 'forward' || normalized === 'today';
}

export function resolveRutinaNavigateTarget({
  direction,
  date,
  rutinas = [],
  activeRutinaId,
  activeDate,
  today = getNormalizedToday(),
}) {
  const todayStart = startOfDay(today);

  if (direction === 'today' || direction === 'pick') {
    const targetStr = normalizeRutinaNavigateDate(date);
    const cached = findRutinaByDateStr(rutinas, targetStr);
    if (cached?._id) {
      return { type: 'select', rutinaId: cached._id, date: targetStr };
    }
    const targetDay = startOfDay(parseAPIDate(targetStr));
    if (isAfter(targetDay, todayStart)) {
      return { type: 'preview', date: targetStr };
    }
    return { type: 'ensure', date: targetStr };
  }

  if (direction === 'prev' || direction === 'next') {
    const activeStr = getActiveDateStr({ activeDate, activeRutinaId, rutinas });
    const activeDay = startOfDay(parseAPIDate(activeStr));
    const shifted = direction === 'prev' ? subDays(activeDay, 1) : addDays(activeDay, 1);
    const targetStr = formatDateForAPI(shifted);
    const cached = findRutinaByDateStr(rutinas, targetStr);
    if (cached?._id) {
      return { type: 'select', rutinaId: cached._id, date: targetStr };
    }
    if (isAfter(shifted, todayStart)) {
      return { type: 'preview', date: targetStr };
    }
    return { type: 'ensure', date: targetStr };
  }

  return { type: 'noop' };
}
