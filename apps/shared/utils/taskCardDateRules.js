import { isToday } from 'date-fns';
import { getTaskDue, parseTaskDate } from './agendaRules.js';

/** Compara una fecha de tarea con el día local actual. */
export function isSameDayAsToday(date, now = new Date()) {
  const parsed = date instanceof Date ? date : parseTaskDate(date);
  if (!parsed || Number.isNaN(parsed.getTime())) return false;
  return isToday(parsed, { referenceDate: now });
}

/**
 * Fecha fin / límite para tarjetas y filas colapsadas.
 * TAREA → fechaVencimiento; EVENTO → fechaVencimiento o fechaFin (via getTaskDue).
 */
export function getTaskCardEndDate(task) {
  return getTaskDue(task);
}

/** Ocultar fecha fin/límite en tarjetas cuando cae en el día de hoy. */
export function shouldShowEndDateOnCard(date, now = new Date()) {
  const parsed = date instanceof Date ? date : parseTaskDate(date);
  if (!parsed || Number.isNaN(parsed.getTime())) return false;
  return !isSameDayAsToday(parsed, now);
}
