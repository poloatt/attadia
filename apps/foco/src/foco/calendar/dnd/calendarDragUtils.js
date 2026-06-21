import { format, parseISO, startOfDay } from 'date-fns';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  DEFAULT_DURATION_MINUTES,
  getGridHeightPx,
  getTotalGridMinutes,
  SLOT_MINUTES,
} from '../calendarLayout';

export const dayDropId = (day) => `day:${format(day, 'yyyy-MM-dd')}`;

export const parseDayDropId = (id) => {
  const raw = String(id || '');
  if (!raw.startsWith('day:')) return null;
  try {
    return startOfDay(parseISO(raw.slice(4)));
  } catch {
    return null;
  }
};

export const getEventDragId = (event) => {
  const task = event?.task || {};
  const dayKey = event?.start ? format(event.start, 'yyyy-MM-dd') : 'nodate';
  const id = task._id || task.id || task.titulo || 'ev';
  return `ev:${id}:${dayKey}`;
};

/**
 * Convierte delta Y del arrastre en minutos (snap 30 min) relativos al inicio de la rejilla.
 */
export const deltaYToGridMinutes = (deltaY) => {
  const gridHeight = getGridHeightPx();
  const totalMinutes = getTotalGridMinutes();
  if (!gridHeight || !totalMinutes) return 0;
  const raw = (deltaY / gridHeight) * totalMinutes;
  return Math.round(raw / SLOT_MINUTES) * SLOT_MINUTES;
};

/**
 * Calcula nueva fecha/hora al soltar un evento en otra columna día.
 */
export const computeEventMove = (event, targetDay, deltaY = 0) => {
  if (!event?.start || !event?.end || !targetDay) return null;

  const durationMs = event.end.getTime() - event.start.getTime();
  const deltaMinutes = deltaYToGridMinutes(deltaY);

  const startMinsFromMidnight = event.start.getHours() * 60 + event.start.getMinutes() + deltaMinutes;
  const gridStart = DAY_START_HOUR * 60;
  const gridEnd = (DAY_END_HOUR + 1) * 60;
  const clamped = Math.max(gridStart, Math.min(gridEnd - SLOT_MINUTES, startMinsFromMidnight));
  const snappedOffset = Math.round((clamped - gridStart) / SLOT_MINUTES) * SLOT_MINUTES + gridStart;

  const newStart = new Date(targetDay);
  newStart.setHours(Math.floor(snappedOffset / 60), snappedOffset % 60, 0, 0);

  const newEnd = new Date(newStart.getTime() + Math.max(durationMs, DEFAULT_DURATION_MINUTES * 60 * 1000));
  return { newStart, newEnd };
};

export const applyTimedMoveToTask = (task, newStart, newEnd) => {
  const tipo = String(task?.tipo || 'TAREA').toUpperCase();
  if (tipo === 'EVENTO') {
    return {
      fechaInicio: newStart,
      fechaFin: newEnd,
      fechaVencimiento: newEnd,
      googleTasksSync: {
        ...(task?.googleTasksSync || {}),
        hasTimedSchedule: true,
        needsSync: true,
        syncStatus: 'pending',
      },
    };
  }
  return {
    fechaInicio: newStart,
    fechaFin: newEnd,
    fechaVencimiento: newEnd,
    googleTasksSync: {
      ...(task?.googleTasksSync || {}),
      hasTimedSchedule: true,
      needsSync: true,
      syncStatus: 'pending',
    },
  };
};
