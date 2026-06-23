import { isSameDay } from 'date-fns';
import { iconConfig, iconTooltips, getIconByName } from './iconConfig.js';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from './dateUtils.js';

export const HABIT_SECTIONS = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];

export const DEFAULT_HABIT_ITEM_CONFIG = {
  tipo: 'DIARIO',
  frecuencia: 1,
  activo: true,
  periodo: 'CADA_DIA',
};

function hasCustomHabitsStructure(habits) {
  return habits && HABIT_SECTIONS.some((section) => Array.isArray(habits[section]));
}

/**
 * Label visible de un hábito: customHabits del usuario > iconTooltips legacy > itemId.
 */
export function getHabitDisplayLabel(section, itemId, habits = null) {
  if (!section || !itemId) return '';

  const sectionHabits = Array.isArray(habits?.[section]) ? habits[section] : [];
  const custom = sectionHabits.find((h) => (h.id || h._id) === itemId);
  if (custom?.label) return custom.label;
  if (custom?.name) return custom.name;

  return iconTooltips?.[section]?.[itemId] || itemId;
}

/** Hábito personalizado del usuario (para acciones de edición). */
export function findUserHabit(section, itemId, habits = null) {
  if (!section || !itemId || !habits) return null;
  const sectionHabits = Array.isArray(habits[section]) ? habits[section] : [];
  return sectionHabits.find((h) => (h.id || h._id) === itemId) || null;
}

/**
 * IDs de hábitos a mostrar en una sección (customHabits del usuario o legacy iconConfig).
 */
export function getHabitSectionItemIds(section, habits = null) {
  if (hasCustomHabitsStructure(habits)) {
    return (habits[section] || [])
      .filter((h) => h?.activo !== false)
      .sort((a, b) => (a?.orden || 0) - (b?.orden || 0))
      .map((h) => h.id || h._id)
      .filter(Boolean);
  }
  return Object.keys(iconConfig?.[section] || {});
}

/**
 * Mapa de iconos/labels por sección: legacy iconConfig + hábitos personalizados (override).
 */
export function buildHabitSectionIconsMap(habits = {}) {
  const iconsMap = {};
  const labelsMap = {};
  const useCustomOnly = hasCustomHabitsStructure(habits);

  HABIT_SECTIONS.forEach((section) => {
    iconsMap[section] = {};
    labelsMap[section] = {};

    if (!useCustomOnly) {
      const legacy = iconConfig?.[section] || {};
      Object.entries(legacy).forEach(([itemId, Icon]) => {
        iconsMap[section][itemId] = Icon;
        labelsMap[section][itemId] = iconTooltips?.[section]?.[itemId] || itemId;
      });
    }

    const sectionHabits = Array.isArray(habits?.[section]) ? habits[section] : [];
    sectionHabits
      .filter((h) => h?.activo !== false)
      .sort((a, b) => (a?.orden || 0) - (b?.orden || 0))
      .forEach((habit) => {
        const itemId = habit.id || habit._id;
        if (!itemId) return;
        const Icon = getIconByName(habit.icon);
        if (!Icon) return;
        iconsMap[section][itemId] = Icon;
        labelsMap[section][itemId] = getHabitDisplayLabel(section, itemId, habits);
      });
  });

  return { iconsMap, labelsMap };
}

/**
 * IDs con icono resoluble para el carrusel (alineado con RutinaCard colapsado).
 */
export function getCarouselSectionItemIds(section, iconsMap = {}, habits = null) {
  const sectionIcons = iconsMap?.[section] || {};

  if (hasCustomHabitsStructure(habits)) {
    return (habits[section] || [])
      .filter((h) => h?.activo !== false)
      .sort((a, b) => (a?.orden || 0) - (b?.orden || 0))
      .map((h) => h.id || h._id)
      .filter((itemId) => itemId && sectionIcons[itemId]);
  }

  return Object.keys(sectionIcons);
}

/**
 * Busca la rutina del día en contexto con comparación de fecha robusta.
 */
export function resolveRutinaForDate({ rutina, rutinas, targetDate }) {
  const resolvedTargetDate = targetDate || getNormalizedToday();
  const targetDateStr = formatDateForAPI(resolvedTargetDate);
  const isTargetToday = isSameDay(resolvedTargetDate, getNormalizedToday());

  const sameDay = (r) => {
    if (!r?.fecha) return false;
    try {
      return formatDateForAPI(parseAPIDate(r.fecha)) === targetDateStr;
    } catch {
      return String(r.fecha).startsWith(targetDateStr);
    }
  };

  if (rutina && sameDay(rutina)) return rutina;

  const list = Array.isArray(rutinas) ? rutinas : [];
  const found = list.find(sameDay);
  if (found) return found;

  if (isTargetToday && rutina?._id) return rutina;

  return null;
}
