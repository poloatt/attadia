import { useMemo } from 'react';
import {
  HABIT_SECTIONS,
  DEFAULT_HABIT_ITEM_CONFIG,
  getCarouselSectionItemIds,
} from '@shared/utils/habitSectionIcons';
import { endOfMonth, endOfWeek, differenceInDays, getDay, getDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { contarCompletadosEnPeriodo, obtenerHistorialCompletados } from '@shared/utils/cadenciaUtils';
import { isHabitCompletedForHistorial } from '@shared/utils/habitCompletionUtils';

function buildAhoraItems(rutinaHoy, sectionIconsMap, habits) {
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

      const itemValue = rutinaHoy?.[section]?.[itemId];
      const completadoHoy = isHabitCompletedForHistorial(itemValue);
      const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
      const periodo = (itemConfig.periodo || 'CADA_DIA').toUpperCase();
      const frecuencia = Number(itemConfig.frecuencia || 1);

      const itemKey = `${section}.${itemId}`;
      if (itemsSet.has(itemKey)) return;

      if (tipo === 'DIARIO' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_DIA')) {
        items.push({ section, itemId });
        itemsSet.add(itemKey);
        return;
      }

      if (tipo === 'SEMANAL' || tipo === 'MENSUAL'
          || (tipo === 'PERSONALIZADO' && (periodo === 'CADA_SEMANA' || periodo === 'CADA_MES'))) {
        if (!rutinaHoy) return;

        const historial = obtenerHistorialCompletados(itemId, section, rutinaHoy);
        const hoy = new Date();
        let completadosEnPeriodo = 0;
        let diasRestantes = 0;

        if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
          const diasSemana = Array.isArray(itemConfig.diasSemana) ? itemConfig.diasSemana : [];

          const historialFiltrado = diasSemana.length > 0
            ? historial.filter((fecha) => {
              const diaSemana = getDay(fecha);
              return diasSemana.includes(diaSemana);
            })
            : historial;

          completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialFiltrado);

          if (completadoHoy) {
            const diaHoy = getDay(hoy);
            const hoyEsValido = diasSemana.length === 0 || diasSemana.includes(diaHoy);
            if (hoyEsValido) {
              const hoyStr = hoy.toISOString().split('T')[0];
              const yaEstaEnHistorial = historialFiltrado.some((fecha) => {
                const fechaStr = fecha.toISOString().split('T')[0];
                return fechaStr === hoyStr;
              });

              if (!yaEstaEnHistorial) {
                completadosEnPeriodo++;
              }
            }
          }

          if (diasSemana.length > 0) {
            const diaHoy = getDay(hoy);
            diasRestantes = diasSemana.filter((dia) => dia >= diaHoy).length;
          } else {
            const finSemana = endOfWeek(hoy, { locale: es });
            diasRestantes = Math.max(0, differenceInDays(finSemana, hoy) + 1);
          }
        } else if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
          const diasMes = Array.isArray(itemConfig.diasMes) ? itemConfig.diasMes : [];

          const historialFiltrado = diasMes.length > 0
            ? historial.filter((fecha) => {
              const diaMes = getDate(fecha);
              return diasMes.includes(diaMes);
            })
            : historial;

          completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialFiltrado);

          if (completadoHoy) {
            const diaHoy = getDate(hoy);
            const hoyEsValido = diasMes.length === 0 || diasMes.includes(diaHoy);
            if (hoyEsValido) {
              const hoyStr = hoy.toISOString().split('T')[0];
              const yaEstaEnHistorial = historialFiltrado.some((fecha) => {
                const fechaStr = fecha.toISOString().split('T')[0];
                return fechaStr === hoyStr;
              });

              if (!yaEstaEnHistorial) {
                completadosEnPeriodo++;
              }
            }
          }

          if (diasMes.length > 0) {
            const diaHoy = getDate(hoy);
            diasRestantes = diasMes.filter((dia) => dia >= diaHoy).length;
          } else {
            const finMes = endOfMonth(hoy);
            diasRestantes = Math.max(0, differenceInDays(finMes, hoy) + 1);
          }
        }

        const completadosFaltantes = frecuencia - completadosEnPeriodo;
        if (completadosFaltantes > 0 && diasRestantes > 0) {
          const completadosPorDiaNecesarios = completadosFaltantes / diasRestantes;
          if (completadosPorDiaNecesarios >= 1) {
            if (!itemsSet.has(itemKey)) {
              items.push({ section, itemId });
              itemsSet.add(itemKey);
            }
          }
        }
      }
    });
  });

  return items;
}

function buildLuegoItems(rutinaHoy, sectionIconsMap, habits) {
  const items = [];

  HABIT_SECTIONS.forEach((section) => {
    const sectionIcons = sectionIconsMap.iconsMap[section] || {};
    const sectionCfg = rutinaHoy?.config?.[section] || {};
    const itemIds = getCarouselSectionItemIds(section, sectionIconsMap.iconsMap, habits);

    itemIds.forEach((itemId) => {
      if (!sectionIcons[itemId]) return;

      const config = sectionCfg[itemId] || DEFAULT_HABIT_ITEM_CONFIG;
      if (config.activo === false) return;

      const tipo = (config.tipo || 'DIARIO').toUpperCase();
      const periodo = (config.periodo || 'CADA_DIA').toUpperCase();
      const frecuencia = Number(config.frecuencia || 1);

      if (tipo === 'DIARIO') return;
      if (tipo === 'PERSONALIZADO' && periodo === 'CADA_DIA') return;

      const esPeriodico = tipo === 'SEMANAL' || tipo === 'MENSUAL'
        || (tipo === 'PERSONALIZADO' && (periodo === 'CADA_SEMANA' || periodo === 'CADA_MES'));

      if (!esPeriodico) return;

      if (!rutinaHoy) {
        items.push({ section, itemId });
        return;
      }

      const completadoHoy = isHabitCompletedForHistorial(rutinaHoy?.[section]?.[itemId]);

      const historial = obtenerHistorialCompletados(itemId, section, rutinaHoy);
      const hoy = new Date();

      let historialParaContar = historial;
      let hoyEsValido = true;

      if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
        const diasSemana = Array.isArray(config.diasSemana) ? config.diasSemana : [];
        if (diasSemana.length > 0) {
          historialParaContar = historial.filter((fecha) => {
            const diaSemana = getDay(fecha);
            return diasSemana.includes(diaSemana);
          });

          const diaHoy = getDay(hoy);
          hoyEsValido = diasSemana.includes(diaHoy);
        }
      } else if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
        const diasMes = Array.isArray(config.diasMes) ? config.diasMes : [];
        if (diasMes.length > 0) {
          historialParaContar = historial.filter((fecha) => {
            const diaMes = getDate(fecha);
            return diasMes.includes(diaMes);
          });

          const diaHoy = getDate(hoy);
          hoyEsValido = diasMes.includes(diaHoy);
        }
      }

      let completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialParaContar);

      if (completadoHoy && hoyEsValido) {
        const hoyStr = hoy.toISOString().split('T')[0];
        const yaEstaEnHistorial = historialParaContar.some((fecha) => {
          const fechaStr = fecha.toISOString().split('T')[0];
          return fechaStr === hoyStr;
        });

        if (!yaEstaEnHistorial) {
          completadosEnPeriodo++;
        }
      }

      if (completadosEnPeriodo < frecuencia) {
        items.push({ section, itemId });
      }
    });
  });

  return items;
}

/**
 * Filtra items del carrusel según modo Ahora/Luego.
 * @param {'ahora'|'luego'} mode
 */
export default function useHabitCarouselItems(mode, {
  rutinaHoy,
  sectionIconsMap,
  habits,
  currentTimeOfDay,
}) {
  const pendingItems = useMemo(() => {
    if (mode === 'luego') {
      return buildLuegoItems(rutinaHoy, sectionIconsMap, habits);
    }
    return buildAhoraItems(rutinaHoy, sectionIconsMap, habits);
  }, mode === 'ahora'
    ? [mode, rutinaHoy, sectionIconsMap, habits, currentTimeOfDay]
    : [mode, rutinaHoy, sectionIconsMap, habits]);

  // Ahora: infinito desactivado; Luego: activo con >8 items
  const shouldUseInfiniteCarousel = mode === 'luego' && pendingItems.length > 8;
  const carouselItems = shouldUseInfiniteCarousel
    ? [...pendingItems, ...pendingItems, ...pendingItems]
    : pendingItems;

  return { pendingItems, carouselItems, shouldUseInfiniteCarousel };
}
