import { timezoneUtils } from '../../models/BaseSchema.js';

describe('rutina fecha parsing (verify vs create alignment)', () => {
  const timezone = 'America/Santiago';

  it('normalizes YYYY-MM-DD string to UTC midnight without timezone skew', () => {
    const normalized = timezoneUtils.normalizeToStartOfDay('2026-06-30', timezone);
    expect(normalized.toISOString()).toBe('2026-06-30T00:00:00.000Z');
  });

  it('new Date(YYYY-MM-DD) can skew vs YMD string path', () => {
    const fromYmd = timezoneUtils.normalizeToStartOfDay('2026-06-30', timezone);
    const fromDateCtor = timezoneUtils.normalizeToStartOfDay(new Date('2026-06-30'), timezone);
    expect(fromYmd.toISOString()).toBe('2026-06-30T00:00:00.000Z');
    expect(fromDateCtor.toISOString()).not.toBe(fromYmd.toISOString());
  });

  it('create and verify paths agree when using isYMD fast-path', () => {
    const fecha = '2026-06-30';
    const isYMD = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
    const fechaRutina = isYMD ? fecha : new Date(fecha);
    const normalized = timezoneUtils.normalizeToStartOfDay(fechaRutina, timezone);
    expect(normalized.toISOString()).toBe('2026-06-30T00:00:00.000Z');
  });
});
