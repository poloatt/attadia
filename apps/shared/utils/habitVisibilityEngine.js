import {
  HABIT_SECTIONS,
  DEFAULT_HABIT_ITEM_CONFIG,
  getCarouselSectionItemIds,
} from './habitSectionIcons';
import { endOfMonth, endOfWeek, differenceInDays, getDay, getDate } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  contarCompletadosEnPeriodo,
  obtenerHistorialCompletados,
} from './cadenciaUtils';
import { isHabitCompletedForHistorial } from './habitCompletionUtils';
import { getNormalizedToday, toISODateString } from './dateUtils';
import { shouldShowItemSync } from './visibilityUtils';

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
 * Hábitos pendientes para el carrusel "Ahora": visibles según cadencia/horario y urgentes si son periódicos.
 */
export function getCarouselAhoraItems({
  rutinaHoy,
  sectionIconsMap,
  habits,
  currentTimeOfDay,
}) {
  const items = [];
  const itemsSet = new Set();

  HABIT_SECTIONS.forEach((section) => {
    const sectionIcons = sectionIconsMap.iconsMap[section] || {};
    const sectionCfg = rutinaHoy?.config?.[section] || {};
    const itemIds = getCarouselSectionItemIds(section, sectionIconsMap.iconsMap, habits);

    itemIds.forEach((itemId) => {
      if (!sectionIcons[itemId]) return;

      const itemConfig = sectionCfg[itemId] || DEFAULT_HABIT_ITEM_CONFIG;
      if (itemConfig.activo === false) return;

      const itemKey = `${section}.${itemId}`;
      if (itemsSet.has(itemKey)) return;

      if (!shouldShowInCarouselBase(section, itemId, rutinaHoy, itemConfig, currentTimeOfDay)) {
        return;
      }

      const { tipo, periodo } = normalizeTipoPeriodo(itemConfig);

      if (isDailyTipo(tipo, periodo)) {
        items.push({ section, itemId });
        itemsSet.add(itemKey);
        return;
      }

      if (isPeriodicTipo(tipo, periodo) && isUrgentToday(itemId, section, rutinaHoy, itemConfig)) {
        items.push({ section, itemId });
        itemsSet.add(itemKey);
      }
    });
  });

  return items;
}

/**
 * Hábitos periódicos con cuota pendiente para el carrusel "Luego" (sin filtro de urgencia).
 */
export function getCarouselLuegoItems({
  rutinaHoy,
  sectionIconsMap,
  habits,
  currentTimeOfDay,
}) {
  const items = [];
  const itemsSet = new Set();

  HABIT_SECTIONS.forEach((section) => {
    const sectionIcons = sectionIconsMap.iconsMap[section] || {};
    const sectionCfg = rutinaHoy?.config?.[section] || {};
    const itemIds = getCarouselSectionItemIds(section, sectionIconsMap.iconsMap, habits);

    itemIds.forEach((itemId) => {
      if (!sectionIcons[itemId]) return;

      const itemConfig = sectionCfg[itemId] || DEFAULT_HABIT_ITEM_CONFIG;
      if (itemConfig.activo === false) return;

      const { tipo, periodo } = normalizeTipoPeriodo(itemConfig);
      if (!isPeriodicTipo(tipo, periodo)) return;

      const itemKey = `${section}.${itemId}`;
      if (itemsSet.has(itemKey)) return;

      if (!rutinaHoy) {
        items.push({ section, itemId });
        itemsSet.add(itemKey);
        return;
      }

      if (!shouldShowInCarouselBase(section, itemId, rutinaHoy, itemConfig, currentTimeOfDay)) {
        return;
      }

      const { completadosEnPeriodo, frecuencia } = countCompletionsInPeriod(
        itemId,
        section,
        rutinaHoy,
        itemConfig,
      );

      if (completadosEnPeriodo < frecuencia) {
        items.push({ section, itemId });
        itemsSet.add(itemKey);
      }
    });
  });

  return items;
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
