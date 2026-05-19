import { jest } from '@jest/globals';
import { buildVirtualTasksForRange } from '../calendarVirtualUtils.js';

describe('buildVirtualTasksForRange', () => {
  test('virtual occurrences keep serie dtstart wall-clock time', () => {
    const dtstart = new Date(2025, 4, 12, 9, 30, 0, 0);
    const series = [
      {
        _id: 'serie1',
        titulo: 'Weekly standup',
        usuario: 'u1',
        objetivo: 'obj1',
        activa: true,
        rrule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
        dtstart,
        googleTasksSync: { exportInstances: false, googleTaskListId: 'list1' },
      },
    ];

    const from = new Date(2025, 4, 1);
    const to = new Date(2025, 5, 1);

    const virtual = buildVirtualTasksForRange(series, from, to, []);

    expect(virtual.length).toBeGreaterThan(0);
    for (const v of virtual) {
      const start = v.fechaInicio instanceof Date ? v.fechaInicio : new Date(v.fechaInicio);
      expect(start.getHours()).toBe(9);
      expect(start.getMinutes()).toBe(30);
      expect(typeof v.fechaInicio).not.toBe('string');
    }
  });

  test('still expands virtual days when a Google anchor exists in range', () => {
    const dtstart = new Date(2026, 4, 14, 12, 0, 0, 0); // Wed 14 May 2026
    const series = [
      {
        _id: 'serie-we',
        titulo: 'ATTA weekly',
        usuario: 'u1',
        objetivo: 'obj-atta',
        activa: true,
        rrule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=WE',
        dtstart,
        googleTasksSync: { exportInstances: false, googleTaskListId: 'list-atta' },
      },
    ];

    const from = new Date(2026, 4, 1);
    const to = new Date(2026, 5, 1);
    const anchorDay = new Date(2026, 4, 21, 12, 0, 0, 0);

    const existingTasks = [
      {
        _id: 'anchor1',
        serieId: 'serie-we',
        fechaVencimiento: anchorDay,
        fechaInicio: anchorDay,
        googleTasksSync: { googleTaskId: 'gt-1' },
      },
    ];

    const virtual = buildVirtualTasksForRange(series, from, to, existingTasks);

    expect(virtual.length).toBeGreaterThan(0);
    for (const v of virtual) {
      expect(v.fechaVencimiento.getDay()).toBe(3);
    }
    expect(
      virtual.some((v) => v.fechaVencimiento.getDate() === anchorDay.getDate()),
    ).toBe(false);
  });
});
