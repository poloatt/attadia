import { addHours, addMinutes, endOfDay, isSameDay, startOfDay, format } from 'date-fns';
import {
  getAnchorDate,
  getTaskDue,
  getTaskStart,
  isDateOnlyDueInstant,
  isDateOnlyDueRaw,
  isTaskCompleted,
  normalizeDateOnlyDue,
  parseTaskDate,
} from '@shared/utils/agendaRules';
import { isTimedScheduleInstant, parseScheduleFromNotes, taskHasTimedSchedule } from '@shared/utils/googleTasksScheduleNotes';
import { normalizeTaskList } from '@shared/utils/taskListUtils';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  DEFAULT_DURATION_MINUTES,
  getGridHeightPx,
  getTotalGridMinutes,
  MIN_EVENT_HEIGHT_PX,
  SLOT_MINUTES,
} from './calendarLayout';

/** Máx. columnas solapadas en la rejilla horaria (evita “código de barras”). */
export const MAX_OVERLAP_COLUMNS = 6;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const calendarDayKey = (date) => format(date, 'yyyy-MM-dd');

const isDateOnlyString = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isGoogleTaskOrigin = (task) => Boolean(
  task?.googleTasksSync?.googleTaskId
  || task?.googleTasksSync?.enabled
  || task?.googleTasksSync?.googleTaskListId,
);

/** Google Tasks no tiene hora en due; legacy UTC puede caer a las 9:00 local. */
function isGoogleDateOnlyDue(task) {
  const rawDue = task?.fechaVencimiento || task?.vencimiento;
  const rawStart = task?.fechaInicio || task?.inicio || task?.start;
  for (const raw of [rawDue, rawStart]) {
    if (!raw) continue;
    if (isDateOnlyDueRaw(raw)) return true;
    const d = parseTaskDate(raw);
    if (d && isDateOnlyDueInstant(raw, d)) return true;
  }
  if (!isGoogleTaskOrigin(task)) return false;
  const d = parseTaskDate(rawDue || rawStart);
  if (!d) return false;
  // Sin minutos/segundos → due de Google (incluye 9:00 por T12:00:00Z en UTC-3).
  return d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
}

export const isAllDayTask = (task) => {
  if (taskHasTimedSchedule(task)) return false;

  const schedule = parseScheduleFromNotes(task?.descripcion || '');
  if (schedule?.fechaInicio && schedule?.fechaFin) return false;

  const rawStart = task?.fechaInicio || task?.inicio || task?.start;
  const tipo = String(task?.tipo || 'TAREA').toUpperCase();
  const rawDue = tipo === 'EVENTO'
    ? (task?.fechaVencimiento || task?.fechaFin || task?.vencimiento)
    : (task?.fechaVencimiento || task?.vencimiento);
  if (isDateOnlyString(rawStart) || isDateOnlyString(rawDue)) return true;

  const start = tipo === 'EVENTO'
    ? (getTaskStart(task) || getTaskDue(task))
    : (getAnchorDate(task) || getTaskStart(task) || getTaskDue(task));
  if (!start) return true;

  const endRaw = task?.fechaFin || (tipo === 'EVENTO' ? task?.fechaVencimiento : null);
  const end = parseTaskDate(endRaw || task?.fechaVencimiento);
  if (start && end && isTimedScheduleInstant(start, end)) return false;

  if (tipo !== 'EVENTO' && isGoogleDateOnlyDue(task)) return true;

  if (!endRaw) {
    return start.getHours() === 0 && start.getMinutes() === 0;
  }

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
  const found = objetivos.find((p) => String(p._id) === String(objetivoId));
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
  const allDay = isAllDayTask(task);
  const rawAnchor = tipo === 'EVENTO'
    ? (task?.fechaInicio || task?.inicio || task?.start || task?.fechaVencimiento || task?.vencimiento)
    : (task?.fechaVencimiento || task?.vencimiento || task?.fechaInicio || task?.inicio || task?.start);
  let start = tipo === 'EVENTO'
    ? (getTaskStart(task) || getTaskDue(task))
    : (taskHasTimedSchedule(task)
      ? (getTaskStart(task) || getAnchorDate(task) || getTaskDue(task))
      : (getAnchorDate(task) || getTaskStart(task) || getTaskDue(task)));
  if (!start) return null;
  if (allDay) {
    start = normalizeDateOnlyDue(rawAnchor) || startOfDay(start);
  }
  const endFromFin = parseTaskDate(task?.fechaFin);
  const endFromDue = parseTaskDate(task?.fechaVencimiento);

  let end;
  if (tipo === 'EVENTO') {
    end = endFromFin || endFromDue;
  } else {
    // TAREA: fechaFin suele ser fin de ventana/recurrencia, no la hora del bloque.
    end = endFromDue;
    if (
      endFromFin
      && endFromFin > start
      && isSameDay(endFromFin, start)
      && endFromFin.getTime() - start.getTime() <= ONE_DAY_MS
    ) {
      end = endFromFin;
    }
  }

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

const pickPreferredCalendarEvent = (current, candidate) => {
  const cur = current.task;
  const cand = candidate.task;
  if (cand.googleTasksSync?.googleTaskId && !cur.googleTasksSync?.googleTaskId) {
    return candidate;
  }
  if (cur.googleTasksSync?.googleTaskId && !cand.googleTasksSync?.googleTaskId) {
    return current;
  }
  if (!cand.virtual && cur.virtual) return candidate;
  if (cand.virtual && !cur.virtual) return current;
  return current;
};

const calendarOccurrenceKey = (ev) => {
  const task = ev.task;
  const day = calendarDayKey(ev.start);
  const sid = String(task?.serieId?._id ?? task?.serieId ?? '');
  if (sid) return `s:${sid}|${day}`;
  const gtid = task?.googleTasksSync?.googleTaskId;
  if (gtid) return `g:${gtid}|${day}`;
  const oid = String(task?.objetivo?._id ?? task?.objetivo ?? '');
  const title = String(task?.titulo || '').trim().toLowerCase().slice(0, 80);
  if (title) return `t:${oid}|${day}|${title}`;
  return String(task?._id ?? task?.id ?? '');
};

/** Una ocurrencia visible por serie/día, Google task/día o título/día. */
export const dedupeCalendarEventsByOccurrence = (events = []) => {
  const byKey = new Map();

  for (const ev of events) {
    const key = calendarOccurrenceKey(ev);
    if (!key) continue;
    const prev = byKey.get(key);
    byKey.set(key, prev ? pickPreferredCalendarEvent(prev, ev) : ev);
  }

  return [...byKey.values()];
};

export const filterTasksInRange = (tasks, rangeStart, rangeEnd, objetivos = []) => {
  const list = normalizeTaskList(Array.isArray(tasks) ? tasks : []);
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

  return dedupeCalendarEventsByOccurrence(events);
};

export const splitEventsByDay = (events, day) => {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return events.filter((ev) => {
    if (!eventsOverlapRange(ev, dayStart, dayEnd)) return false;
    const tipo = String(ev.task?.tipo || 'TAREA').toUpperCase();
    if (!ev.allDay && tipo !== 'EVENTO') {
      return isSameDay(ev.start, day);
    }
    return true;
  });
};

/**
 * Reparte eventos solapados: EVENTO en columnas; TAREA como barras compactas apiladas.
 */
export const layoutTimedEventsForDay = (events = []) => {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const tasks = sorted.filter((ev) => String(ev.task?.tipo || 'TAREA').toUpperCase() !== 'EVENTO');
  const eventos = sorted.filter((ev) => String(ev.task?.tipo || 'TAREA').toUpperCase() === 'EVENTO');

  const taskItems = layoutCompactTaskBars(tasks);
  const eventoItems = layoutColumnEvents(eventos);

  return {
    items: [...taskItems.items, ...eventoItems.items],
    hiddenCount: taskItems.hiddenCount + eventoItems.hiddenCount,
  };
};

const layoutColumnEvents = (events = []) => {
  const columnEnds = [];
  const placed = [];

  for (const event of events) {
    const startMs = event.start.getTime();
    const endMs = event.end.getTime();
    let column = columnEnds.findIndex((end) => end <= startMs);
    if (column === -1) {
      if (columnEnds.length >= MAX_OVERLAP_COLUMNS) {
        column = MAX_OVERLAP_COLUMNS - 1;
        columnEnds[column] = Math.max(columnEnds[column], endMs);
      } else {
        column = columnEnds.length;
        columnEnds.push(endMs);
      }
    } else {
      columnEnds[column] = Math.max(columnEnds[column], endMs);
    }
    placed.push({ event, column });
  }

  const totalColumns = Math.min(
    Math.max(1, columnEnds.length),
    MAX_OVERLAP_COLUMNS,
  );
  const gapPx = 2;

  const items = placed.map(({ event, column }) => {
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

  return { items, hiddenCount: 0 };
};

const layoutCompactTaskBars = (events = []) => {
  const gapPx = 2;
  const gridHeight = getGridHeightPx();
  const compactHeightPct = (MIN_EVENT_HEIGHT_PX / gridHeight) * 100;
  const stackStepPct = ((MIN_EVENT_HEIGHT_PX + gapPx) / gridHeight) * 100;
  const placed = [];
  let hiddenCount = 0;

  for (const event of events) {
    const startMs = event.start.getTime();
    const endMs = event.end.getTime();
    const overlapping = placed.filter(
      (p) => p.event.start.getTime() < endMs && p.event.end.getTime() > startMs,
    );
    const stackIndex = overlapping.length;

    if (stackIndex >= MAX_OVERLAP_COLUMNS) {
      hiddenCount += 1;
      continue;
    }

    const pos = getTimedPosition(event.start, event.end);
    const topPct = parseFloat(pos.top) + stackIndex * stackStepPct;

    placed.push({
      event,
      stackIndex,
      style: {
        top: `${topPct}%`,
        height: `${compactHeightPct}%`,
        left: `${gapPx}px`,
        width: `calc(100% - ${gapPx * 2}px)`,
      },
    });
  }

  return { items: placed, hiddenCount };
};

export const getTimedPosition = (start, end) => {
  const totalMinutes = getTotalGridMinutes();
  const snap = (mins) => Math.round(mins / SLOT_MINUTES) * SLOT_MINUTES;
  const clamp = (mins) => Math.max(0, Math.min(totalMinutes, mins));

  const startMins = clamp(snap((start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()));
  let endMins = clamp(snap((end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes()));
  if (endMins <= startMins) {
    endMins = Math.min(totalMinutes, startMins + DEFAULT_DURATION_MINUTES);
  }

  const topPct = (startMins / totalMinutes) * 100;
  const heightPct = Math.max(((endMins - startMins) / totalMinutes) * 100, (MIN_EVENT_HEIGHT_PX / getGridHeightPx()) * 100);

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
