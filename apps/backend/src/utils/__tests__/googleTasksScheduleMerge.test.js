import { mergeGoogleDueWithLocalSchedule } from '../googleTasksScheduleMerge.js';

describe('mergeGoogleDueWithLocalSchedule', () => {
  test('preserves local wall-clock when Google due day changes', () => {
    const tarea = {
      fechaInicio: new Date(2026, 5, 10, 7, 45, 0, 0),
      fechaVencimiento: new Date(2026, 5, 10, 8, 15, 0, 0),
      googleTasksSync: { hasTimedSchedule: true },
    };

    mergeGoogleDueWithLocalSchedule(tarea, '2026-06-16T00:00:00.000Z');

    expect(tarea.fechaInicio.getDate()).toBe(16);
    expect(tarea.fechaInicio.getHours()).toBe(7);
    expect(tarea.fechaInicio.getMinutes()).toBe(45);
    expect(tarea.googleTasksSync.hasTimedSchedule).toBe(true);
  });

  test('date-only Google due sets noon local start/end', () => {
    const tarea = {
      fechaInicio: null,
      fechaVencimiento: null,
      googleTasksSync: {},
    };

    mergeGoogleDueWithLocalSchedule(tarea, '2026-06-16T00:00:00.000Z');

    expect(tarea.fechaInicio.getHours()).toBe(12);
    expect(tarea.fechaVencimiento.getHours()).toBe(12);
    expect(tarea.googleTasksSync.hasTimedSchedule).toBeFalsy();
  });
});
