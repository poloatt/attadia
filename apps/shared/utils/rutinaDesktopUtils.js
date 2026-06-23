import {
  HABIT_SECTIONS,
  buildHabitSectionIconsMap,
  getHabitSectionItemIds,
  getHabitDisplayLabel,
  findUserHabit,
} from './habitSectionIcons.js';
import shouldShowItem from './shouldShowItem.js';
import { isHabitCompletedForHistorial } from './habitCompletionUtils.js';
import { getIconByName } from './iconConfig.js';
import { resolveRutinaItemConfig } from './habitVisibilityEngine.js';
import { getRutinaDayMode } from './rutinasPageUtils.js';

/** Títulos legibles por sección de rutina. */
export const RUTINA_SECTION_LABELS = {
  bodyCare: 'Cuidado Personal',
  nutricion: 'Nutrición',
  ejercicio: 'Ejercicio',
  cleaning: 'Limpieza',
};

export { HABIT_SECTIONS };

/**
 * Categoriza hábitos de una sección para el panel desktop.
 * @returns {{ completed, incomplete, notScheduled }}
 */
export function categorizeSectionHabits({
  section,
  rutina,
  habits = null,
  habitsPreferences = null,
  localData = {},
}) {
  const empty = { completed: [], incomplete: [], notScheduled: [] };
  if (!section || !rutina) return empty;

  const prefs = habitsPreferences ?? {};
  const isHistorical = rutina?.fecha && getRutinaDayMode(rutina.fecha) === 'historical';
  const { iconsMap } = buildHabitSectionIconsMap(habits);
  const sectionIcons = iconsMap[section] || {};
  const itemIds = getHabitSectionItemIds(section, habits).filter((id) => sectionIcons[id]);

  const rutinaForVisibility = isHistorical
    ? rutina
    : {
      ...rutina,
      config: {
        ...(rutina.config || {}),
        [section]: Object.fromEntries(
          itemIds.map((itemId) => [
            itemId,
            resolveRutinaItemConfig(section, itemId, rutina, prefs),
          ]),
        ),
      },
    };

  const completed = [];
  const incomplete = [];
  const notScheduled = [];

  itemIds.forEach((itemId) => {
    const config = resolveRutinaItemConfig(section, itemId, rutina, prefs);
    if (config.activo === false) return;

    const fromLocal = localData?.[itemId];
    const fromRutina = rutina?.[section]?.[itemId];
    const itemValue = fromLocal !== undefined ? fromLocal : fromRutina;
    const isCompleted = isHabitCompletedForHistorial(itemValue);
    // Cadencia del día (no ventana horaria): un hábito de MAÑANA no completado
    // sigue siendo "pendiente" en TARDE, no "no programado hoy".
    const isScheduled = shouldShowItem(section, itemId, rutinaForVisibility, {
      skipHorarioFilter: true,
    });

    const entry = {
      section,
      itemId,
      label: getHabitDisplayLabel(section, itemId, habits),
      Icon: sectionIcons[itemId],
      config,
      itemValue,
      isCompleted,
      isScheduled,
      userHabit: findUserHabit(section, itemId, habits),
    };

    if (isCompleted) {
      completed.push(entry);
    } else if (isScheduled) {
      incomplete.push(entry);
    } else {
      notScheduled.push(entry);
    }
  });

  return { completed, incomplete, notScheduled };
}

/** Todos los hábitos activos de una sección para el carrusel (pendientes → completados → no programados). */
export function getSectionCarouselItems({ section, rutina, habits = null, habitsPreferences = null }) {
  const { completed, incomplete, notScheduled } = categorizeSectionHabits({
    section,
    rutina,
    habits,
    habitsPreferences,
  });
  return [...incomplete, ...completed, ...notScheduled];
}

/**
 * Primera sección con hábitos incompletos programados, o bodyCare por defecto.
 */
export function getDefaultSelectedSection(rutina, habits = null, habitsPreferences = null) {
  for (const section of HABIT_SECTIONS) {
    const { incomplete } = categorizeSectionHabits({ section, rutina, habits, habitsPreferences });
    if (incomplete.length > 0) return section;
  }
  return HABIT_SECTIONS[0];
}

/**
 * Resuelve icono MUI para un hábito personalizado.
 */
export function resolveHabitIcon(habits, section, itemId) {
  const { iconsMap } = buildHabitSectionIconsMap(habits);
  const Icon = iconsMap[section]?.[itemId];
  if (Icon) return Icon;

  const habit = (habits?.[section] || []).find(
    (h) => (h.id || h._id) === itemId,
  );
  return habit?.icon ? getIconByName(habit.icon) : null;
}
