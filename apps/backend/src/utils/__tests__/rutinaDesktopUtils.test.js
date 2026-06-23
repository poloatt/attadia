import {
  categorizeSectionHabits,
  getDefaultSelectedSection,
  RUTINA_SECTION_LABELS,
  HABIT_SECTIONS,
} from '@shared/utils/rutinaDesktopUtils.js';
import { getHabitDisplayLabel } from '@shared/utils/habitSectionIcons.js';
import { getNormalizedToday } from '@shared/utils/dateUtils.js';

function makeRutina(overrides = {}) {
  return {
    _id: 'r1',
    fecha: '2026-06-22T00:00:00.000Z',
    bodyCare: {},
    nutricion: {},
    ejercicio: {},
    cleaning: {},
    config: {
      bodyCare: {
        shower: { tipo: 'DIARIO', frecuencia: 1, activo: true },
        weekly: { tipo: 'SEMANAL', frecuencia: 1, activo: true, diasSemana: [1] },
      },
      nutricion: {
        water: { tipo: 'DIARIO', frecuencia: 1, activo: true },
      },
    },
    ...overrides,
  };
}

const mockHabits = {
  bodyCare: [
    { id: 'shower', label: 'Ducha', icon: 'Shower', activo: true, orden: 0 },
    { id: 'weekly', label: 'Semanal', icon: 'Spa', activo: true, orden: 1 },
  ],
  nutricion: [
    { id: 'water', label: 'Agua', icon: 'WaterDrop', activo: true, orden: 0 },
  ],
  ejercicio: [],
  cleaning: [],
};

describe('rutinaDesktopUtils', () => {
  describe('categorizeSectionHabits', () => {
    it('places completed daily habit in completed bucket', () => {
      const rutina = makeRutina({
        bodyCare: { shower: true },
      });
      const { completed, incomplete, notScheduled } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina,
        habits: mockHabits,
      });
      expect(completed.map((h) => h.itemId)).toContain('shower');
      expect(incomplete.map((h) => h.itemId)).not.toContain('shower');
      expect(notScheduled).toHaveLength(0);
    });

    it('uses user-edited label on categorized entries', () => {
      const habits = {
        ...mockHabits,
        bodyCare: [
          { id: 'shower', label: 'Mi ducha personalizada', icon: 'Shower', activo: true, orden: 0 },
        ],
      };
      const { incomplete } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina: makeRutina(),
        habits,
      });
      expect(incomplete.find((h) => h.itemId === 'shower')?.label).toBe('Mi ducha personalizada');
    });

    it('places incomplete scheduled habit in incomplete bucket', () => {
      const rutina = makeRutina();
      const { incomplete } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina,
        habits: mockHabits,
      });
      expect(incomplete.map((h) => h.itemId)).toContain('shower');
    });

    it('places extra completed habit in completed even if not scheduled', () => {
      const rutina = makeRutina({
        bodyCare: { weekly: true },
      });
      const { completed, notScheduled } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina,
        habits: mockHabits,
      });
      expect(completed.map((h) => h.itemId)).toContain('weekly');
      expect(notScheduled.map((h) => h.itemId)).not.toContain('weekly');
    });

    it('places overdue morning habit in pendientes, not no programados hoy', () => {
      const rutina = makeRutina({
        fecha: getNormalizedToday().toISOString(),
        config: {
          bodyCare: {
            shower: {
              tipo: 'DIARIO',
              frecuencia: 1,
              activo: true,
              horarios: ['MAÑANA'],
            },
            weekly: { tipo: 'SEMANAL', frecuencia: 1, activo: true, diasSemana: [1] },
          },
          nutricion: {
            water: { tipo: 'DIARIO', frecuencia: 1, activo: true },
          },
        },
      });
      const { incomplete, notScheduled } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina,
        habits: mockHabits,
      });
      expect(incomplete.map((h) => h.itemId)).toContain('shower');
      expect(notScheduled.map((h) => h.itemId)).not.toContain('shower');
    });

    it('places habit with passed slot pending in pendientes when between configured franjas', () => {
      const rutina = makeRutina({
        fecha: getNormalizedToday().toISOString(),
        bodyCare: { shower: { MAÑANA: false } },
        config: {
          bodyCare: {
            shower: {
              tipo: 'DIARIO',
              frecuencia: 1,
              activo: true,
              horarios: ['MAÑANA', 'NOCHE'],
            },
            weekly: { tipo: 'SEMANAL', frecuencia: 1, activo: true, diasSemana: [1] },
          },
          nutricion: {
            water: { tipo: 'DIARIO', frecuencia: 1, activo: true },
          },
        },
      });
      const { incomplete, notScheduled } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina,
        habits: mockHabits,
      });
      expect(incomplete.map((h) => h.itemId)).toContain('shower');
      expect(notScheduled.map((h) => h.itemId)).not.toContain('shower');
    });

    it('marks weekly Monday carry-over as isCadenciaDebt on Tuesday', () => {
      const tuesday = new Date(2026, 5, 23, 12, 0, 0, 0);
      const rutina = makeRutina({
        fecha: tuesday.toISOString(),
        historial: { bodyCare: { weekly: {} } },
      });
      const { incomplete, notScheduled } = categorizeSectionHabits({
        section: 'bodyCare',
        rutina,
        habits: mockHabits,
      });
      const weekly = incomplete.find((h) => h.itemId === 'weekly');
      expect(weekly).toBeTruthy();
      expect(weekly.isCadenciaDebt).toBe(true);
      expect(notScheduled.map((h) => h.itemId)).not.toContain('weekly');
    });
  });

  describe('getDefaultSelectedSection', () => {
    it('returns first section with incomplete items', () => {
      const rutina = makeRutina();
      expect(getDefaultSelectedSection(rutina, mockHabits)).toBe('bodyCare');
    });

    it('falls back to bodyCare when all complete', () => {
      const rutina = makeRutina({
        bodyCare: { shower: true, weekly: true },
        nutricion: { water: true },
      });
      expect(getDefaultSelectedSection(rutina, mockHabits)).toBe('bodyCare');
    });
  });

  describe('getHabitDisplayLabel', () => {
    it('uses user-edited label over legacy tooltip', () => {
      const habits = {
        ...mockHabits,
        bodyCare: [
          { id: 'bath', label: 'Mi ducha personalizada', icon: 'Bathtub', activo: true, orden: 0 },
        ],
      };
      expect(getHabitDisplayLabel('bodyCare', 'bath', habits)).toBe('Mi ducha personalizada');
    });
  });

  describe('RUTINA_SECTION_LABELS', () => {
    it('has labels for all sections', () => {
      HABIT_SECTIONS.forEach((section) => {
        expect(RUTINA_SECTION_LABELS[section]).toBeTruthy();
      });
    });
  });
});
