import {
  appendRecurrenceToNotes,
  buildGoogleSerieKey,
  collectDueDatesFromTasks,
  inferRecurrenceFromGoogleNotes,
  inferRruleFromDueDates,
  parseRecurrenceFromNotes,
} from '../recurrenceUtils.js';

describe('recurrenceUtils', () => {
  test('parseRecurrenceFromNotes extracts RRULE block', () => {
    const notes = `Descripción

Recurrencia:
RRULE:FREQ=WEEKLY;INTERVAL=1

Subtareas:
☐ Una`;
    const { rrule, descripcionSinRecurrencia } = parseRecurrenceFromNotes(notes);
    expect(rrule).toBe('FREQ=WEEKLY;INTERVAL=1');
    expect(descripcionSinRecurrencia).toContain('Descripción');
    expect(descripcionSinRecurrencia).not.toContain('Recurrencia:');
  });

  test('appendRecurrenceToNotes replaces existing block', () => {
    const base = appendRecurrenceToNotes('Hola', 'FREQ=DAILY;INTERVAL=1');
    const next = appendRecurrenceToNotes(base, 'FREQ=WEEKLY;INTERVAL=1');
    expect(next).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1');
    expect(next.match(/Recurrencia:/g)).toHaveLength(1);
  });

  test('buildGoogleSerieKey is stable for same list and title', () => {
    const a = buildGoogleSerieKey('list1', '[Salud] Gym');
    const b = buildGoogleSerieKey('list1', 'gym');
    const c = buildGoogleSerieKey('list2', 'gym');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test('inferRecurrenceFromGoogleNotes detects weekly spanish', () => {
    expect(inferRecurrenceFromGoogleNotes('Se repite cada semana')).toMatch(/FREQ=WEEKLY/i);
  });

  test('collectDueDatesFromTasks merges googleDueHistory', () => {
    const dates = collectDueDatesFromTasks([
      {
        fechaVencimiento: new Date(2026, 4, 19, 12, 0, 0),
        googleDueHistory: [new Date(2026, 4, 12, 12, 0, 0)],
      },
    ]);
    expect(dates).toHaveLength(2);
  });

  test('inferRruleFromDueDates detects weekly pattern', () => {
    const dates = [
      new Date(2026, 4, 5, 12, 0, 0),
      new Date(2026, 4, 12, 12, 0, 0),
      new Date(2026, 4, 19, 12, 0, 0),
    ];
    const rrule = inferRruleFromDueDates(dates);
    expect(rrule).toBeTruthy();
    expect(rrule).toMatch(/FREQ=WEEKLY/i);
  });
});
