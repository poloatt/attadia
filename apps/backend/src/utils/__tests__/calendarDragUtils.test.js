import { parseISO, startOfDay } from 'date-fns';
import {
  computeEventMove,
  deltaYToGridMinutes,
  parseDayDropId,
} from '../../../../foco/src/foco/calendar/dnd/calendarDragUtils.js';
import { getTimedPosition } from '../../../../foco/src/foco/calendar/taskCalendarUtils.js';
import {
  DAY_START_HOUR,
  getGridHeightPx,
  HALF_SLOT_HEIGHT_PX,
  SLOT_MINUTES,
} from '../../../../foco/src/foco/calendar/calendarLayout.js';

describe('calendar drag utils', () => {
  test('deltaYToGridMinutes snaps to 30 min slots', () => {
    const halfSlotPx = HALF_SLOT_HEIGHT_PX;
    expect(deltaYToGridMinutes(0)).toBe(0);
    expect(deltaYToGridMinutes(halfSlotPx)).toBe(SLOT_MINUTES);
    expect(deltaYToGridMinutes(halfSlotPx * 1.4)).toBe(SLOT_MINUTES);
    expect(deltaYToGridMinutes(halfSlotPx * 2)).toBe(SLOT_MINUTES * 2);
  });

  test('parseDayDropId reads day column ids', () => {
    expect(parseDayDropId('day:2026-05-18')).toEqual(startOfDay(parseISO('2026-05-18')));
    expect(parseDayDropId('ev:123')).toBeNull();
  });

  test('computeEventMove changes day and snaps time', () => {
    const event = {
      start: new Date(2026, 4, 12, 14, 0, 0),
      end: new Date(2026, 4, 12, 14, 30, 0),
    };
    const targetDay = startOfDay(parseISO('2026-05-14'));
    const { newStart, newEnd } = computeEventMove(event, targetDay, HALF_SLOT_HEIGHT_PX);
    expect(newStart.getFullYear()).toBe(2026);
    expect(newStart.getMonth()).toBe(4);
    expect(newStart.getDate()).toBe(14);
    expect(newStart.getHours()).toBe(14);
    expect(newStart.getMinutes()).toBe(30);
    expect(newEnd.getTime() - newStart.getTime()).toBe(30 * 60 * 1000);
  });
});

describe('getTimedPosition 30 min snap', () => {
  test('snaps start and end to 30 minute grid', () => {
    const start = new Date(2026, 4, 18, DAY_START_HOUR, 7, 0);
    const end = new Date(2026, 4, 18, DAY_START_HOUR, 38, 0);
    const pos = getTimedPosition(start, end);
    const gridHeight = getGridHeightPx();
    const topPx = (parseFloat(pos.top) / 100) * gridHeight;
    const heightPx = (parseFloat(pos.height) / 100) * gridHeight;
    expect(topPx).toBeCloseTo(0, 0);
    expect(heightPx).toBeCloseTo(HALF_SLOT_HEIGHT_PX, 0);
  });
});
