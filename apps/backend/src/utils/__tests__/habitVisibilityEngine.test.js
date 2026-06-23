import {
  getCarouselAhoraItems,
  getCarouselLuegoItems,
  shouldShowInTracker,
} from '@shared/utils/habitVisibilityEngine.js';

const sectionIconsMap = {
  iconsMap: {
    ejercicio: { gym: () => null },
  },
  labelsMap: {
    ejercicio: { gym: 'Gym' },
  },
};

const habits = {
  ejercicio: [{ id: 'gym', label: 'Gym', icon: 'FitnessCenter', activo: true, orden: 0 }],
};

function buildRutina(overrides = {}) {
  return {
    _id: 'rutina-1',
    fecha: new Date().toISOString(),
    historial: { ejercicio: { gym: {} } },
    ejercicio: {},
    config: {
      ejercicio: {
        gym: {
          tipo: 'DIARIO',
          frecuencia: 1,
          activo: true,
          periodo: 'CADA_DIA',
          horarios: [],
        },
      },
    },
    ...overrides,
  };
}

describe('habitVisibilityEngine', () => {
  describe('getCarouselAhoraItems', () => {
    it('includes pending daily habits', () => {
      const items = getCarouselAhoraItems({
        rutinaHoy: buildRutina(),
        sectionIconsMap,
        habits,
        currentTimeOfDay: 'MAÑANA',
      });
      expect(items).toEqual([{ section: 'ejercicio', itemId: 'gym' }]);
    });

    it('excludes completed daily habits', () => {
      const rutinaHoy = buildRutina({
        ejercicio: { gym: true },
        historial: {
          ejercicio: {
            gym: { [new Date().toISOString().split('T')[0]]: true },
          },
        },
      });

      const items = getCarouselAhoraItems({
        rutinaHoy,
        sectionIconsMap,
        habits,
        currentTimeOfDay: 'MAÑANA',
      });

      expect(items).toEqual([]);
    });
  });

  describe('getCarouselLuegoItems', () => {
    it('includes weekly habits with pending quota', () => {
      const rutinaHoy = buildRutina({
        config: {
          ejercicio: {
            gym: {
              tipo: 'SEMANAL',
              frecuencia: 3,
              activo: true,
              periodo: 'CADA_SEMANA',
              diasSemana: [],
              horarios: [],
            },
          },
        },
      });

      const items = getCarouselLuegoItems({
        rutinaHoy,
        sectionIconsMap,
        habits,
        currentTimeOfDay: 'MAÑANA',
      });

      expect(items).toEqual([{ section: 'ejercicio', itemId: 'gym' }]);
    });

    it('excludes daily habits', () => {
      const items = getCarouselLuegoItems({
        rutinaHoy: buildRutina(),
        sectionIconsMap,
        habits,
        currentTimeOfDay: 'MAÑANA',
      });
      expect(items).toEqual([]);
    });
  });

  describe('shouldShowInTracker', () => {
    it('shows active habits in tracker', () => {
      expect(shouldShowInTracker('ejercicio', 'gym', buildRutina(), { activo: true })).toBe(true);
    });

    it('hides inactive habits in tracker', () => {
      expect(shouldShowInTracker('ejercicio', 'gym', buildRutina(), { activo: false })).toBe(false);
    });
  });
});
