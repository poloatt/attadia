import { format, isSameDay, startOfDay } from 'date-fns';
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

/** Subtítulo informativo: fecha · % · posición en registros cargados. */
export function formatRutinaDaySubtitle({ fecha, percentage, currentPage, totalPages }) {
  const dateLabel = formatRutinaDayLabel(fecha);
  const pctLabel = typeof percentage === 'number' ? `${percentage}%` : '—';
  const positionLabel = currentPage > 0 && totalPages > 0
    ? `registro ${currentPage} de ${totalPages}`
    : '';
  return [dateLabel, pctLabel, positionLabel].filter(Boolean).join(' · ');
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

/**
 * Resuelve el destino de navegación toolbar (prev/next/today).
 * Lista ordenada: índice 0 = registro más reciente (convención temporal).
 * En UI: ‹ = día anterior (más antiguo), › = día siguiente (más reciente).
 */
export function resolveRutinaNavigateTarget({
  direction,
  date,
  rutinas = [],
  activeRutinaId,
}) {
  if (!Array.isArray(rutinas) || rutinas.length === 0) {
    return { type: 'noop' };
  }

  if (direction === 'today') {
    const todayStr = date || formatDateForAPI(getNormalizedToday());
    const target = rutinas.find((r) => {
      try {
        return formatDateForAPI(parseAPIDate(r.fecha)) === todayStr;
      } catch {
        return false;
      }
    });
    if (target?._id) {
      return { type: 'select', rutinaId: target._id };
    }
    return { type: 'create', date: todayStr };
  }

  if (direction === 'prev' || direction === 'next') {
    const idx = activeRutinaId
      ? rutinas.findIndex((r) => r._id === activeRutinaId)
      : -1;
    if (idx < 0) return { type: 'noop' };
    const newIndex = direction === 'prev'
      ? Math.max(0, idx - 1)
      : Math.min(rutinas.length - 1, idx + 1);
    const target = rutinas[newIndex];
    if (target?._id) {
      return { type: 'select', rutinaId: target._id };
    }
    return { type: 'noop' };
  }

  return { type: 'noop' };
}
