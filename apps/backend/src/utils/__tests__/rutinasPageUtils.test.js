import {
  formatRutinaDayLabel,
  formatRutinaDaySubtitle,
  getRutinaDayMode,
  getRutinaCompletionStats,
  isRutinaHistorical,
  isRutinaToday,
  resolveRutinaNavigateTarget,
} from '@shared/utils/rutinasPageUtils.js';

const mockRutinas = [
  { _id: 'r3', fecha: '2026-06-22T00:00:00.000Z' },
  { _id: 'r2', fecha: '2026-06-21T00:00:00.000Z' },
  { _id: 'r1', fecha: '2026-06-20T00:00:00.000Z' },
];

describe('rutinasPageUtils', () => {
  describe('resolveRutinaNavigateTarget', () => {
    it('prev moves to more recent record', () => {
      const target = resolveRutinaNavigateTarget({
        direction: 'prev',
        rutinas: mockRutinas,
        activeRutinaId: 'r2',
      });
      expect(target).toEqual({ type: 'select', rutinaId: 'r3' });
    });

    it('next moves to older record', () => {
      const target = resolveRutinaNavigateTarget({
        direction: 'next',
        rutinas: mockRutinas,
        activeRutinaId: 'r2',
      });
      expect(target).toEqual({ type: 'select', rutinaId: 'r1' });
    });

    it('today selects existing record for date', () => {
      const target = resolveRutinaNavigateTarget({
        direction: 'today',
        date: '2026-06-21',
        rutinas: mockRutinas,
      });
      expect(target).toEqual({ type: 'select', rutinaId: 'r2' });
    });

    it('today without record opens create flow', () => {
      const target = resolveRutinaNavigateTarget({
        direction: 'today',
        date: '2026-06-19',
        rutinas: mockRutinas,
      });
      expect(target).toEqual({ type: 'create', date: '2026-06-19' });
    });
  });

  describe('day mode helpers', () => {
    const today = new Date('2026-06-22T12:00:00.000Z');

    it('detects today', () => {
      expect(isRutinaToday('2026-06-22T00:00:00.000Z', today)).toBe(true);
      expect(getRutinaDayMode('2026-06-22T00:00:00.000Z', today)).toBe('today');
    });

    it('detects historical', () => {
      expect(isRutinaHistorical('2026-06-20T00:00:00.000Z', today)).toBe(true);
      expect(getRutinaDayMode('2026-06-20T00:00:00.000Z', today)).toBe('historical');
    });
  });

  describe('formatRutinaDaySubtitle', () => {
    it('joins date, percentage and position', () => {
      const subtitle = formatRutinaDaySubtitle({
        fecha: '2026-06-22T00:00:00.000Z',
        percentage: 67,
        currentPage: 12,
        totalPages: 90,
      });
      expect(subtitle).toContain('67%');
      expect(subtitle).toContain('registro 12 de 90');
      expect(formatRutinaDayLabel('2026-06-22T00:00:00.000Z')).toBeTruthy();
    });
  });

  describe('getRutinaCompletionStats', () => {
    it('returns zero stats without rutina', () => {
      expect(getRutinaCompletionStats(null)).toEqual({
        percentage: 0,
        completed: 0,
        total: 0,
      });
    });
  });
});
