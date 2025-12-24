import { debesMostrarHabitoEnFecha } from './cadenciaUtils';
import { parseAPIDate, toISODateString, getNormalizedToday } from './dateUtils';
import { getCurrentTimeOfDay } from './timeOfDayUtils';
import { shouldShowHabitForCurrentTime } from './habitTimeLogic';

/**
 * Determina sincrónicamente si un ítem debe mostrarse para una rutina dada.
 * Usa una heurística basada en cadencia (sin llamadas async) para mantener la UI fluida.
 * Si se provee historial en additionalData, se considera para frecuencia/período.
 * Si se provee currentTimeOfDay en additionalData, se filtra por horario configurado.
 */
export default function shouldShowItem(section, itemId, rutina, additionalData = {}) {
  try {
    if (!section || !itemId || !rutina) return false;

    const config = rutina?.config?.[section]?.[itemId];
    // Alinear con el backend: si falta configuración, por seguridad mostramos el ítem
    // (evita que migraciones/parciales rompan la UI y los cálculos de completitud).
    if (!config) return true;
    if (config.activo === false) return false;

    // Normalizar fecha de rutina
    const fechaRutina = parseAPIDate(rutina.fecha) || new Date();

    // Filtrar por horario si está configurado (antes de evaluar cadencia) usando lógica mejorada
    // Para hábitos diarios con múltiples repeticiones: mostrar último horario no completado del día de hoy
    if (config.horarios && Array.isArray(config.horarios) && config.horarios.length > 0) {
      const currentTimeOfDay = additionalData.currentTimeOfDay || getCurrentTimeOfDay();
      
      // Verificar si la rutina es de hoy (solo aplicar lógica mejorada para el día de hoy)
      const hoy = getNormalizedToday();
      const esHoy = toISODateString(fechaRutina) === toISODateString(hoy);
      
      // Solo aplicar lógica mejorada si es el día de hoy
      if (esHoy) {
        // Verificar si el hábito está completado hoy
        // Puede ser boolean (legacy) u objeto con horarios (nuevo formato)
        const itemValue = rutina?.[section]?.[itemId];
        const isCompletedToday = itemValue !== undefined ? itemValue : (additionalData.isCompleted || false);
        
        // Obtener tipo y frecuencia para la lógica mejorada
        const tipo = (config.tipo || 'DIARIO').toUpperCase();
        const frecuencia = Number(config.frecuencia || 1);
        
        if (!shouldShowHabitForCurrentTime(config.horarios, currentTimeOfDay, isCompletedToday, tipo, frecuencia)) {
          return false; // No mostrar según lógica de horarios
      }
      } else {
        // Para días que no son hoy, usar lógica simple: solo mostrar si el horario actual está configurado
        if (!shouldShowHabitForCurrentTime(config.horarios, currentTimeOfDay, false, 'DIARIO', 1)) {
          return false;
        }
      }
    }

    // 1) Preferir contadores/períodos embebidos en la config (sin historial)
    const tipo = (config.tipo || 'DIARIO').toUpperCase();
    const frecuencia = Number(config.frecuencia || 1);
    const progresoActual = Number(config.progresoActual || config.progress || 0);
    const ultimoPeriodo = config.ultimoPeriodo; // { inicio, fin } opcional

    if (ultimoPeriodo && ultimoPeriodo.inicio && ultimoPeriodo.fin) {
      const inicio = new Date(ultimoPeriodo.inicio);
      const fin = new Date(ultimoPeriodo.fin);
      if (fechaRutina >= inicio && fechaRutina <= fin) {
        // Si el contador del período actual alcanza la frecuencia, ocultar
        if (progresoActual >= frecuencia) {
          return false;
        }
      }
    } else if (progresoActual >= frecuencia) {
      // Si no hay información de período pero el progreso satisface la cuota, aplicar lógica mínima por tipo
      if (tipo === 'DIARIO') {
        return false;
      }
      // Para SEMANAL/MENSUAL sin período explícito, no podemos afirmar con certeza -> continuar a heurística
    }

    // 2) Historial: combinar diferentes formas de estructura (si existe)
    // 1) additionalData.historial[section][itemId] => { 'YYYY-MM-DD': true }
    // 2) additionalData.historial[section] => { 'YYYY-MM-DD': { [itemId]: true } }
    let historial = [];
    const sectionHist = additionalData?.historial?.[section];
    const itemHist = sectionHist?.[itemId];
    if (Array.isArray(itemHist)) {
      historial = itemHist.map(d => new Date(d));
    } else if (itemHist && typeof itemHist === 'object') {
      historial = Object.entries(itemHist)
        .filter(([, completed]) => completed === true)
        .map(([dateStr]) => new Date(dateStr));
    } else if (sectionHist && typeof sectionHist === 'object') {
      // Forma por fecha -> items
      historial = Object.entries(sectionHist)
        .filter(([, items]) => items && items[itemId] === true)
        .map(([dateStr]) => new Date(dateStr));
    }
    // Incluir completación de hoy si la rutina marca el item como completado
    if (rutina?.[section]?.[itemId] === true) {
      historial.push(fechaRutina);
    }

    return debesMostrarHabitoEnFecha(fechaRutina, config, historial);
  } catch (error) {
    console.error('[shouldShowItem] Error evaluando visibilidad:', error);
    return true; // fallback amistoso
  }
}