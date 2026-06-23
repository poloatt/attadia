import {
  HABIT_SECTIONS,
  DEFAULT_HABIT_ITEM_CONFIG,
  getCarouselSectionItemIds,
} from './habitSectionIcons.js';
import { endOfMonth, endOfWeek, differenceInDays, getDay, getDate } from 'date-fns';
import { es } from './localeEs.js';
import {
  contarCompletadosEnPeriodo,
  obtenerHistorialCompletados,
} from './cadenciaUtils.js';
import { isHabitCompletedForHistorial, isHabitFullyCompletedToday } from './habitCompletionUtils.js';
import { getNormalizedToday, toISODateString } from './dateUtils.js';
import { shouldShowItemSync } from './visibilityUtils.js';
import {
  getDailyCarouselAhoraHorarios,
  getDailyCarouselLuegoHorarios,
  hasConfiguredHorarioPassed,
  shouldShowHabitForCurrentTime,
} from './habitTimeLogic.js';
import { getRutinaDayMode } from './rutinasPageUtils.js';

/**
 * Motor de visibilidad de hábitos en carrusel y tracker.
 * Glosario: @see agendaTerminology — habitSlot.* (diarios), habitPeriodic.flexible (Fase 5)
 */

function normalizeTipoPeriodo(itemConfig) {
  const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
  const periodo = (itemConfig.periodo || 'CADA_DIA').toUpperCase();
  return { tipo, periodo };
}

function isDailyTipo(tipo, periodo) {
  return tipo === 'DIARIO' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_DIA');
}

function isPeriodicTipo(tipo, periodo) {
  if (isDailyTipo(tipo, periodo)) return false;
  return (
    tipo === 'SEMANAL'
    || tipo === 'MENSUAL'
    || (tipo === 'PERSONALIZADO' && (periodo === 'CADA_SEMANA' || periodo === 'CADA_MES'))
  );
}

function getTodayDateStr() {
  return toISODateString(getNormalizedToday());
}

function countCompletionsInPeriod(itemId, section, rutinaHoy, itemConfig) {
  if (!rutinaHoy) return { completadosEnPeriodo: 0, diasRestantes: 0, hoyEsValido: true };

  const { tipo, periodo } = normalizeTipoPeriodo(itemConfig);
  const frecuencia = Number(itemConfig.frecuencia || 1);
  const completadoHoy = isHabitCompletedForHistorial(rutinaHoy?.[section]?.[itemId]);
  const historial = obtenerHistorialCompletados(itemId, section, rutinaHoy);
  const hoy = getNormalizedToday();
  const hoyStr = getTodayDateStr();

  let historialParaContar = historial;
  let diasRestantes = 0;
  let hoyEsValido = true;

  if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
    const diasSemana = Array.isArray(itemConfig.diasSemana) ? itemConfig.diasSemana : [];
    if (diasSemana.length > 0) {
      historialParaContar = historial.filter((fecha) => diasSemana.includes(getDay(fecha)));
      const diaHoy = getDay(hoy);
      hoyEsValido = diasSemana.includes(diaHoy);
      diasRestantes = diasSemana.filter((dia) => dia >= diaHoy).length;
    } else {
      const finSemana = endOfWeek(hoy, { locale: es });
      diasRestantes = Math.max(0, differenceInDays(finSemana, hoy) + 1);
    }
  } else if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
    const diasMes = Array.isArray(itemConfig.diasMes) ? itemConfig.diasMes : [];
    if (diasMes.length > 0) {
      historialParaContar = historial.filter((fecha) => diasMes.includes(getDate(fecha)));
      const diaHoy = getDate(hoy);
      hoyEsValido = diasMes.includes(diaHoy);
      diasRestantes = diasMes.filter((dia) => dia >= diaHoy).length;
    } else {
      const finMes = endOfMonth(hoy);
      diasRestantes = Math.max(0, differenceInDays(finMes, hoy) + 1);
    }
  }

  let completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialParaContar);

  if (completadoHoy && hoyEsValido) {
    const yaEstaEnHistorial = historialParaContar.some(
      (fecha) => toISODateString(fecha) === hoyStr,
    );
    if (!yaEstaEnHistorial) {
      completadosEnPeriodo += 1;
    }
  }

  return {
    completadosEnPeriodo,
    diasRestantes,
    hoyEsValido,
    frecuencia,
  };
}

/**
 * SEMANAL/MENSUAL sin diasSemana/diasMes: el usuario elige los días del período.
 * @see agendaTerminology — habitPeriodic.flexible
 */
export function isFlexiblePeriodic(itemConfig) {
  const { tipo, periodo } = normalizeTipoPeriodo(itemConfig);
  if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
    const diasSemana = Array.isArray(itemConfig.diasSemana) ? itemConfig.diasSemana : [];
    return diasSemana.length === 0;
  }
  if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
    const diasMes = Array.isArray(itemConfig.diasMes) ? itemConfig.diasMes : [];
    return diasMes.length === 0;
  }
  return false;
}

/**
 * Colocación en carrusel para hábitos periódicos: 'ahora' | 'luego' | null.
 * - frecuencia === 1: solo Luego salvo urgencia (últimos días del período) → Ahora en ventana activa.
 * - frecuencia > 1: se puede adelantar hoy → Ahora en ventana activa; Luego si pasó la ventana.
 */
export function getPeriodicCarouselMode(
  itemConfig,
  rutinaHoy,
  section,
  itemId,
  currentTimeOfDay,
) {
  const { completadosEnPeriodo, frecuencia } = countCompletionsInPeriod(
    itemId,
    section,
    rutinaHoy,
    itemConfig,
  );
  if (completadosEnPeriodo >= frecuencia) return null;

  const itemValue = rutinaHoy?.[section]?.[itemId];
  if (isHabitCompletedForHistorial(itemValue)) return null;

  const horarios = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
  const inWindow = horarios.length === 0
    || shouldShowHabitForCurrentTime(horarios, currentTimeOfDay, itemValue);
  const passedWindow = horarios.length > 0
    && hasConfiguredHorarioPassed(horarios, currentTimeOfDay);

  if (frecuencia === 1) {
    if (!isUrgentToday(itemId, section, rutinaHoy, itemConfig)) {
      return 'luego';
    }
    if (inWindow) return 'ahora';
    return 'luego';
  }

  if (inWindow) return 'ahora';
  if (passedWindow) return 'luego';

  if (horarios.length === 0) return 'ahora';

  const futureSlots = getDailyCarouselLuegoHorarios(horarios, currentTimeOfDay, itemValue);
  if (futureSlots.length > 0) return 'luego';

  return null;
}

/** @deprecated Usar getPeriodicCarouselMode */
export function getFlexiblePeriodicCarouselMode(
  itemConfig,
  rutinaHoy,
  section,
  itemId,
  currentTimeOfDay,
) {
  return getPeriodicCarouselMode(itemConfig, rutinaHoy, section, itemId, currentTimeOfDay);
}

function isUrgentToday(itemId, section, rutinaHoy, itemConfig) {
  const { completadosEnPeriodo, diasRestantes, frecuencia } = countCompletionsInPeriod(
    itemId,
    section,
    rutinaHoy,
    itemConfig,
  );
  const completadosFaltantes = frecuencia - completadosEnPeriodo;
  if (completadosFaltantes <= 0 || diasRestantes <= 0) return false;
  return completadosFaltantes / diasRestantes >= 1;
}

function shouldShowInCarouselBase(section, itemId, rutinaHoy, itemConfig, currentTimeOfDay) {
  if (!rutinaHoy) return true;
  return shouldShowItemSync(
    section,
    itemId,
    rutinaHoy,
    itemConfig,
    {},
    currentTimeOfDay,
  );
}

/**
 * Combina config de la rutina del día con preferencias del usuario (plantilla).
 * Preferencias ganan sobre la rutina; horarios vacíos en preferencias = sin franja explícita.
 */
export function resolveCarouselItemConfig(section, itemId, rutinaHoy, habitsPreferences = {}) {
  const rutinaCfg = rutinaHoy?.config?.[section]?.[itemId];
  const prefCfg = habitsPreferences?.[section]?.[itemId];
  const hasPref = prefCfg != null;

  const horarios = hasPref
    ? (Array.isArray(prefCfg.horarios) ? prefCfg.horarios : [])
    : (Array.isArray(rutinaCfg?.horarios) ? rutinaCfg.horarios : []);

  const merged = {
    ...DEFAULT_HABIT_ITEM_CONFIG,
    ...(rutinaCfg || {}),
    ...(hasPref ? prefCfg : {}),
    horarios,
  };

  merged.activo = rutinaCfg?.activo ?? prefCfg?.activo ?? true;

  return merged;
}

/**
 * Config efectiva para la UI de rutinas: en días históricos usa snapshot del día;
 * en hoy/futuro fusiona plantilla del usuario sobre rutina.config.
 */
export function resolveRutinaItemConfig(section, itemId, rutina, habitsPreferences = {}) {
  if (!section || !itemId) return { ...DEFAULT_HABIT_ITEM_CONFIG };
  if (rutina?.fecha && getRutinaDayMode(rutina.fecha) === 'historical') {
    return {
      ...DEFAULT_HABIT_ITEM_CONFIG,
      ...(rutina?.config?.[section]?.[itemId] || {}),
    };
  }
  return resolveCarouselItemConfig(section, itemId, rutina, habitsPreferences);
}

function buildCarouselEntry(section, itemId, horario = null) {
  return {
    section,
    itemId,
    ...(horario ? { horario } : {}),
  };
}

function appendDailyCarouselItems({
  mode,
  section,
  itemId,
  itemKey,
  horarios,
  itemValue,
  currentTimeOfDay,
  items,
  itemsSet,
}) {
  if (isHabitFullyCompletedToday(itemValue, horarios)) return;

  if (mode === 'ahora') {
    getDailyCarouselAhoraHorarios(horarios, currentTimeOfDay, itemValue).forEach((horario) => {
      const slotKey = horario ? `${itemKey}.${horario}` : itemKey;
      if (itemsSet.has(slotKey)) return;
      items.push(buildCarouselEntry(section, itemId, horario));
      itemsSet.add(slotKey);
    });
    return;
  }

  const luegoHorarios = getDailyCarouselLuegoHorarios(horarios, currentTimeOfDay, itemValue);
  if (luegoHorarios.length === 0) return;

  const horario = luegoHorarios[0];
  const slotKey = `${itemKey}.${horario}`;
  if (itemsSet.has(slotKey)) return;
  items.push(buildCarouselEntry(section, itemId, horario));
  itemsSet.add(slotKey);
}

function appendPeriodicCarouselItem({
  mode,
  section,
  itemId,
  itemKey,
  itemConfig,
  rutinaHoy,
  currentTimeOfDay,
  items,
  itemsSet,
}) {
  if (!rutinaHoy) return;
  if (mode === 'ahora' && !shouldShowInCarouselBase(section, itemId, rutinaHoy, itemConfig, currentTimeOfDay)) {
    return;
  }

  const placement = getPeriodicCarouselMode(
    itemConfig,
    rutinaHoy,
    section,
    itemId,
    currentTimeOfDay,
  );
  if (placement !== mode) return;
  if (itemsSet.has(itemKey)) return;

  items.push(buildCarouselEntry(section, itemId));
  itemsSet.add(itemKey);
}

function collectCarouselItems(mode, {
  rutinaHoy,
  sectionIconsMap,
  habits,
  currentTimeOfDay,
  habitsPreferences = {},
}) {
  const items = [];
  const itemsSet = new Set();

  HABIT_SECTIONS.forEach((section) => {
    const sectionIcons = sectionIconsMap.iconsMap[section] || {};
    const itemIds = getCarouselSectionItemIds(section, sectionIconsMap.iconsMap, habits);

    itemIds.forEach((itemId) => {
      if (!sectionIcons[itemId]) return;

      const itemConfig = resolveCarouselItemConfig(section, itemId, rutinaHoy, habitsPreferences);
      if (itemConfig.activo === false) return;

      const itemKey = `${section}.${itemId}`;
      const { tipo, periodo } = normalizeTipoPeriodo(itemConfig);
      const itemValue = rutinaHoy?.[section]?.[itemId];
      const horarios = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];

      if (isDailyTipo(tipo, periodo)) {
        appendDailyCarouselItems({
          mode,
          section,
          itemId,
          itemKey,
          horarios,
          itemValue,
          currentTimeOfDay,
          items,
          itemsSet,
        });
        return;
      }

      if (!isPeriodicTipo(tipo, periodo)) return;

      appendPeriodicCarouselItem({
        mode,
        section,
        itemId,
        itemKey,
        itemConfig,
        rutinaHoy,
        currentTimeOfDay,
        items,
        itemsSet,
      });
    });
  });

  return items;
}

/**
 * Hábitos pendientes para el carrusel "Ahora".
 * Diarios: franjas retrasadas + actual en Ahora; futuras en Luego. Periódicos: adelanto o urgencia.
 * @see agendaTerminology — habitSlot.ahora
 */
export function getCarouselAhoraItems(params) {
  return collectCarouselItems('ahora', params);
}

/**
 * Hábitos para el carrusel "Luego".
 * Diarios: franjas futuras hoy. Periódicos: backlog o ventana pasada.
 * @see agendaTerminology — habitSlot.luego
 */
export function getCarouselLuegoItems(params) {
  return collectCarouselItems('luego', params);
}

/**
 * Tracker: mostrar todos los hábitos activos (completados o no).
 */
export function shouldShowInTracker(section, itemId, rutina, config) {
  if (!section || !itemId) return false;
  const itemConfig = config || rutina?.config?.[section]?.[itemId];
  if (itemConfig?.activo === false) return false;
  return true;
}

export function getCarouselItemsForMode(mode, params) {
  if (mode === 'luego') {
    return getCarouselLuegoItems(params);
  }
  return getCarouselAhoraItems(params);
}
