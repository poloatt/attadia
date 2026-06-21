import { isSameDay } from 'date-fns';
import { iconConfig, iconTooltips, getIconByName } from './iconConfig';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from './dateUtils';

export const HABIT_SECTIONS = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];

export const DEFAULT_HABIT_ITEM_CONFIG = {
  tipo: 'DIARIO',
  frecuencia: 1,
  activo: true,
  periodo: 'CADA_DIA',
};

/**
 * IDs de hábitos a mostrar en una sección (customHabits del usuario o legacy iconConfig).
 */
export function getHabitSectionItemIds(section, habits = {}) {
  const sectionHabits = Array.isArray(habits?.[section]) ? habits[section] : [];
  if (sectionHabits.length > 0) {
    return sectionHabits
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

  HABIT_SECTIONS.forEach((section) => {
    iconsMap[section] = {};
    labelsMap[section] = {};

    const legacy = iconConfig?.[section] || {};
    Object.entries(legacy).forEach(([itemId, Icon]) => {
      iconsMap[section][itemId] = Icon;
      labelsMap[section][itemId] = iconTooltips?.[section]?.[itemId] || itemId;
    });

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
        labelsMap[section][itemId] = habit.label || habit.name || itemId;
      });
  });

  return { iconsMap, labelsMap };
}

/**
 * IDs con icono resoluble para el carrusel (alineado con RutinaCard colapsado).
 */
export function getCarouselSectionItemIds(section, iconsMap = {}, habits = {}) {
  const sectionIcons = iconsMap?.[section] || {};
  const sectionHabits = Array.isArray(habits?.[section]) ? habits[section] : [];
  const activeCustom = sectionHabits
    .filter((h) => h?.activo !== false)
    .sort((a, b) => (a?.orden || 0) - (b?.orden || 0));

  if (activeCustom.length > 0) {
    return activeCustom
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
