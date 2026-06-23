import { computeCarouselToggleValue } from '@shared/utils/habitToggleUtils.js';

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
  });
});
