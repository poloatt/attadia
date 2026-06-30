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
import {
  hasCadenciaDebt,
  isScheduledCadenciaDay,
  obtenerHistorialCompletados,
} from './cadenciaUtils.js';
import { parseAPIDate } from './dateUtils.js';
import { RUTINA_DAY_GROUP_COPY } from '../copy/agendaTerminology.js';

/**
 * Orden fijo de hábitos en una sección: `orden` del usuario (vía getHabitSectionItemIds),
 * desempate alfabético por label y luego por itemId. No depende del estado completado.
 */
export function sortSectionHabitsByFixedOrder(entries, { section, habits = null } = {}) {
  const orderIndex = new Map(
    getHabitSectionItemIds(section, habits).map((id, index) => [id, index]),
  );

  return [...entries].sort((a, b) => {
    const indexA = orderIndex.get(a.itemId) ?? Number.MAX_SAFE_INTEGER;
    const indexB = orderIndex.get(b.itemId) ?? Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) return indexA - indexB;
    const labelCmp = (a.label || '').localeCompare(b.label || '', 'es');
    if (labelCmp !== 0) return labelCmp;
    return String(a.itemId || '').localeCompare(String(b.itemId || ''));
  });
}

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

    const fechaRutina = parseAPIDate(rutina.fecha) || new Date();
    const historialDates = [...obtenerHistorialCompletados(itemId, section, rutinaForVisibility)];
    if (isCompleted) {
      historialDates.push(fechaRutina);
    }
    const isCadenciaDebt = !isCompleted
      && hasCadenciaDebt(fechaRutina, config, historialDates)
      && !isScheduledCadenciaDay(fechaRutina, config);

    const entry = {
      section,
      itemId,
      label: getHabitDisplayLabel(section, itemId, habits),
      Icon: sectionIcons[itemId],
      config,
      itemValue,
      isCompleted,
      isScheduled,
      isCadenciaDebt,
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

/** Etiquetas de agrupación del tracker diario (registro del día). */
export const RUTINA_DAY_GROUP_LABELS = RUTINA_DAY_GROUP_COPY;

/**
 * Agrupa hábitos de una sección según si tocan hoy en el registro diario.
 * Dentro de cada grupo (Hoy / No toca hoy) el orden es fijo (no depende de completado).
 */
export function groupSectionHabitsByDaySchedule(params) {
  const { section, habits = null } = params;
  const { completed, incomplete, notScheduled } = categorizeSectionHabits(params);
  const sortOpts = { section, habits };

  const today = sortSectionHabitsByFixedOrder([...incomplete, ...completed], sortOpts);
  const notToday = sortSectionHabitsByFixedOrder(notScheduled, sortOpts);

  return {
    today,
    todayPending: today.filter((entry) => !entry.isCompleted),
    todayCompleted: today.filter((entry) => entry.isCompleted),
    notToday,
  };
}

/** Todos los hábitos activos de una sección para el carrusel (orden fijo por sección). */
export function getSectionCarouselItems({ section, rutina, habits = null, habitsPreferences = null }) {
  const { completed, incomplete, notScheduled } = categorizeSectionHabits({
    section,
    rutina,
    habits,
    habitsPreferences,
  });
  return sortSectionHabitsByFixedOrder(
    [...incomplete, ...completed, ...notScheduled],
    { section, habits },
  );
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
