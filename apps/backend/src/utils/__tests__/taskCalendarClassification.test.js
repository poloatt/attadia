import { isAllDayTask, taskToCalendarEvent, layoutTimedEventsForDay } from '../../../../shared/utils/calendar/agendaCalendarUtils.js';

describe('task calendar classification', () => {
  test('Google date-only task without timed schedule is all-day', () => {
    const task = {
      tipo: 'TAREA',
      titulo: 'Due Google',
      fechaVencimiento: new Date(2026, 5, 16, 12, 0, 0, 0),
      fechaInicio: new Date(2026, 5, 16, 12, 0, 0, 0),
      googleTasksSync: { googleTaskId: 'gt-1' },
    };
    expect(isAllDayTask(task)).toBe(true);
    const ev = taskToCalendarEvent(task, []);
    expect(ev.allDay).toBe(true);
  });

  test('task with hasTimedSchedule is not all-day', () => {
    const start = new Date(2026, 5, 16, 14, 0, 0, 0);
    const end = new Date(2026, 5, 16, 15, 0, 0, 0);
    const task = {
      tipo: 'TAREA',
      titulo: 'Timed',
      fechaInicio: start,
      fechaFin: end,
      fechaVencimiento: end,
      googleTasksSync: { googleTaskId: 'gt-2', hasTimedSchedule: true },
    };
    expect(isAllDayTask(task)).toBe(false);
    const ev = taskToCalendarEvent(task, []);
    expect(ev.allDay).toBe(false);
  });

  test('Google task with wall-clock time infers timed grid placement', () => {
    const start = new Date(2026, 5, 16, 7, 45, 0, 0);
    const end = new Date(2026, 5, 16, 8, 15, 0, 0);
    const task = {
      tipo: 'TAREA',
      titulo: 'Morning task',
      fechaInicio: start,
      fechaVencimiento: end,
      googleTasksSync: { googleTaskId: 'gt-3' },
    };
    expect(isAllDayTask(task)).toBe(false);
    const ev = taskToCalendarEvent(task, []);
    expect(ev.allDay).toBe(false);
    expect(ev.start.getHours()).toBe(7);
  });

  test('Google task without due date is excluded from calendar', () => {
    const task = {
      tipo: 'TAREA',
      titulo: 'Inbox',
      googleTasksSync: { googleTaskId: 'gt-4' },
    };
    expect(taskToCalendarEvent(task, [])).toBeNull();
  });

  test('layoutTimedEventsForDay uses full-width compact bars for tasks', () => {
    const start = new Date(2026, 5, 16, 14, 0, 0, 0);
    const end = new Date(2026, 5, 16, 14, 30, 0, 0);
    const events = [
      { task: { tipo: 'TAREA', _id: 'a' }, start, end, allDay: false },
      { task: { tipo: 'TAREA', _id: 'b' }, start, end, allDay: false },
    ];
    const { items } = layoutTimedEventsForDay(events);
    expect(items).toHaveLength(2);
    expect(items[0].style.width).toContain('100%');
    expect(items[1].style.width).toContain('100%');
  });
});
