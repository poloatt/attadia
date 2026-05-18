import { addHours, addMinutes, endOfDay, isSameDay, startOfDay } from 'date-fns';
import {
  getAnchorDate,
  getTaskDue,
  getTaskStart,
  isTaskCompleted,
  parseTaskDate,
} from '@shared/utils/agendaRules';
import { dedupeTasksById } from '@shared/utils/taskListUtils';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  DEFAULT_DURATION_MINUTES,
} from './calendarLayout';

const isDateOnlyString = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export const isAllDayTask = (task) => {
  if (task?.virtual) return true;

  const rawStart = task?.fechaInicio || task?.inicio || task?.start;
  const rawDue = task?.fechaVencimiento || task?.fechaFin || task?.vencimiento;
  if (isDateOnlyString(rawStart) || isDateOnlyString(rawDue)) return true;

  const tipo = String(task?.tipo || 'TAREA').toUpperCase();
  const start = tipo === 'EVENTO'
    ? (getTaskStart(task) || getTaskDue(task))
    : (getAnchorDate(task) || getTaskStart(task) || getTaskDue(task));
  if (!start) return true;

  const endRaw = task?.fechaFin || (tipo === 'EVENTO' ? task?.fechaVencimiento : null);
  if (!endRaw) {
    return start.getHours() === 0 && start.getMinutes() === 0;
  }

  const end = parseTaskDate(endRaw);
  if (!end) return start.getHours() === 0 && start.getMinutes() === 0;

  return (
    start.getHours() === 0
    && start.getMinutes() === 0
    && end.getHours() === 0
    && end.getMinutes() === 0
  );
};

export const getObjetivoMeta = (task, objetivos = []) => {
  const objetivoId = task?.objetivo?._id || task?.objetivo;
  if (!objetivoId) return null;
  const found = objetivos.find((p) => p._id === objetivoId);
  return found
    ? { id: found._id, nombre: found.nombre || found.titulo, color: found.color }
    : { id: objetivoId, nombre: 'OBJETIVO', color: null };
};

/**
 * @returns {{ task, start: Date, end: Date, allDay: boolean, completed: boolean, objetivo: object|null }|null}
 */
export const taskToCalendarEvent = (task, objetivos = []) => {
  if (!task) return null;

  const tipo = String(task?.tipo || 'TAREA').toUpperCase();
  const start = tipo === 'EVENTO'
    ? (getTaskStart(task) || getTaskDue(task))
    : (getAnchorDate(task) || getTaskStart(task) || getTaskDue(task));
  if (!start) return null;

  const allDay = isAllDayTask(task);
  let end = tipo === 'EVENTO'
    ? (parseTaskDate(task?.fechaFin) || parseTaskDate(task?.fechaVencimiento))
    : (parseTaskDate(task?.fechaFin) || parseTaskDate(task?.fechaVencimiento));

  if (!end || end <= start) {
    end = allDay
      ? endOfDay(start)
      : addMinutes(start, DEFAULT_DURATION_MINUTES);
  }

  if (allDay) {
    return {
      task,
      start: startOfDay(start),
      end: endOfDay(start),
      allDay: true,
      completed: isTaskCompleted(task),
      objetivo: getObjetivoMeta(task, objetivos),
    };
  }

  return {
    task,
    start,
    end,
    allDay: false,
    completed: isTaskCompleted(task),
    objetivo: getObjetivoMeta(task, objetivos),
  };
};

export const eventsOverlapRange = (event, rangeStart, rangeEnd) =>
  event.start < rangeEnd && event.end > rangeStart;

export const filterTasksInRange = (tasks, rangeStart, rangeEnd, objetivos = []) => {
  const list = dedupeTasksById(Array.isArray(tasks) ? tasks : []);
  const events = [];
  const seen = new Set();

  for (const t of list) {
    const ev = taskToCalendarEvent(t, objetivos);
    if (!ev || !eventsOverlapRange(ev, rangeStart, rangeEnd)) continue;
    const id = String(t._id ?? t.id ?? '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    events.push(ev);
  }

  return events;
};

export const splitEventsByDay = (events, day) => {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return events.filter((ev) => eventsOverlapRange(ev, dayStart, dayEnd));
};

/**
 * Reparte eventos solapados en columnas (evita apilar todo a las 12:00).
 */
export const layoutTimedEventsForDay = (events = []) => {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const columnEnds = [];
  const placed = [];

  for (const event of sorted) {
    const startMs = event.start.getTime();
    const endMs = event.end.getTime();
    let column = columnEnds.findIndex((end) => end <= startMs);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(endMs);
    } else {
      columnEnds[column] = Math.max(columnEnds[column], endMs);
    }
    placed.push({ event, column });
  }

  const totalColumns = Math.max(1, columnEnds.length);
  const gapPx = 2;

  return placed.map(({ event, column }) => {
    const pos = getTimedPosition(event.start, event.end);
    const widthPct = 100 / totalColumns;
    const leftPct = column * widthPct;
    return {
      event,
      style: {
        top: pos.top,
        height: pos.height,
        left: `calc(${leftPct}% + ${gapPx}px)`,
        width: `calc(${widthPct}% - ${gapPx * 2}px)`,
      },
    };
  });
};

export const getTimedPosition = (start, end) => {
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const clamp = (mins) => Math.max(0, Math.min(totalMinutes, mins));

  const startMins = clamp((start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
  let endMins = clamp((end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());
  if (endMins <= startMins) {
    endMins = Math.min(totalMinutes, startMins + DEFAULT_DURATION_MINUTES);
  }

  const topPct = (startMins / totalMinutes) * 100;
  const heightPct = Math.max(((endMins - startMins) / totalMinutes) * 100, 2.5);

  return { top: `${topPct}%`, height: `${heightPct}%` };
};

export const clampEventToDay = (event, day) => {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  let start = event.start < dayStart ? dayStart : event.start;
  let end = event.end > dayEnd ? dayEnd : event.end;
  if (end <= start) {
    end = addHours(start, 1);
  }
  return { ...event, start, end };
};

export const formatHourLabel = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

export const isEventOnDay = (event, day) => isSameDay(event.start, day) || eventsOverlapRange(event, startOfDay(day), endOfDay(day));
