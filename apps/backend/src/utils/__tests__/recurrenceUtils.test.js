import {
  appendRecurrenceToNotes,
  buildGoogleSerieKey,
  cleanDescriptionFromGoogleNotes,
  collectDueDatesFromTasks,
  inferRecurrenceFromGoogleNotes,
  ensureWeeklyByday,
  inferRruleFromDueDates,
  parseRecurrenceFromNotes,
  resolveRruleFromNotes,
  weekdayToRruleByday,
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

  test('cleanDescriptionFromGoogleNotes strips recurrence and subtareas', () => {
    const notes = `Mi nota real

Subtareas:
☐ Paso 1

Recurrencia:
RRULE:FREQ=WEEKLY;INTERVAL=1`;
    expect(cleanDescriptionFromGoogleNotes(notes)).toBe('Mi nota real');
    expect(resolveRruleFromNotes(notes)).toBe('FREQ=WEEKLY;INTERVAL=1');
  });

  test('resolveRruleFromNotes infers from Google-style text without RRULE block', () => {
    expect(resolveRruleFromNotes('Recordatorio\nSe repite cada semana')).toMatch(/FREQ=WEEKLY/i);
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
    expect(rrule).toMatch(/BYDAY=/i);
  });

  test('inferRruleFromDueDates adds BYDAY=WE for Wednesday-only dates', () => {
    const dates = [
      new Date(2026, 4, 6, 12, 0, 0),
      new Date(2026, 4, 13, 12, 0, 0),
      new Date(2026, 4, 20, 12, 0, 0),
    ];
    const rrule = inferRruleFromDueDates(dates);
    expect(rrule).toMatch(/BYDAY=WE/i);
  });

  test('weekdayToRruleByday maps Wednesday', () => {
    expect(weekdayToRruleByday(new Date(2026, 4, 13))).toBe('WE');
  });

  test('ensureWeeklyByday adds BYDAY from anchor date', () => {
    const wed = new Date(2026, 4, 13, 12, 0, 0);
    expect(ensureWeeklyByday('FREQ=WEEKLY;INTERVAL=1', wed)).toBe('FREQ=WEEKLY;INTERVAL=1;BYDAY=WE');
  });
});
