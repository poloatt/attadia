import { computeCarouselToggleValue, computeFranjaToggleValue } from '@shared/utils/habitToggleUtils.js';

describe('habitToggleUtils', () => {
  describe('computeCarouselToggleValue', () => {
    it('toggles boolean daily habit', () => {
      expect(computeCarouselToggleValue({
        itemValue: false,
        horariosConfig: [],
        normalizedHorario: null,
      })).toBe(true);

      expect(computeCarouselToggleValue({
        itemValue: true,
        horariosConfig: [],
        normalizedHorario: null,
      })).toBe(false);
    });

    it('toggles specific horario in object format', () => {
      const result = computeCarouselToggleValue({
        itemValue: { MAÑANA: false, TARDE: false },
        horariosConfig: ['MAÑANA', 'TARDE'],
        normalizedHorario: 'MAÑANA',
      });

      expect(result).toEqual({ MAÑANA: true, TARDE: false });
    });

    it('toggles overdue MAÑANA franja when explicitly passed', () => {
      const result = computeCarouselToggleValue({
        itemValue: { MAÑANA: false, NOCHE: false },
        horariosConfig: ['MAÑANA', 'NOCHE'],
        normalizedHorario: 'MAÑANA',
      });

      expect(result).toEqual({ MAÑANA: true, NOCHE: false });
    });

    it('does not reset other franjas when toggling one in object format', () => {
      const result = computeFranjaToggleValue({
        itemValue: { MAÑANA: true, NOCHE: false },
        horariosConfig: ['MAÑANA', 'NOCHE'],
        normalizedHorario: 'NOCHE',
      });

      expect(result).toEqual({ MAÑANA: true, NOCHE: true });
    });

    it('preserves other franjas when uncompleting one from legacy true', () => {
      const result = computeFranjaToggleValue({
        itemValue: true,
        horariosConfig: ['MAÑANA', 'NOCHE'],
        normalizedHorario: 'MAÑANA',
      });

      expect(result).toEqual({ MAÑANA: false, NOCHE: true });
    });
  });
});
