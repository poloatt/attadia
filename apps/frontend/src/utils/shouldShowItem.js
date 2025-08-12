import { debesMostrarHabitoEnFecha } from './cadenciaUtils';
import { parseAPIDate } from './dateUtils';

/**
 * Determina sincrónicamente si un ítem debe mostrarse para una rutina dada.
 * Usa una heurística basada en cadencia (sin llamadas async) para mantener la UI fluida.
 * Si se provee historial en additionalData, se considera para frecuencia/período.
 */
export default function shouldShowItem(section, itemId, rutina, additionalData = {}) {
  try {
    if (!section || !itemId || !rutina) return false;

    const config = rutina?.config?.[section]?.[itemId];
    if (!config || config.activo === false) return false;

    const fechaRutina = parseAPIDate(rutina.fecha) || new Date();

    // Historial opcional en formato: additionalData.historial[section][itemId] => { 'YYYY-MM-DD': true }
    let historial = [];
    const itemHist = additionalData?.historial?.[section]?.[itemId];
    if (itemHist && typeof itemHist === 'object') {
      historial = Object.entries(itemHist)
        .filter(([, completed]) => completed === true)
        .map(([dateStr]) => new Date(dateStr));
    }

    return debesMostrarHabitoEnFecha(fechaRutina, config, historial);
  } catch (error) {
    console.error('[shouldShowItem] Error evaluando visibilidad:', error);
    return true; // fallback amistoso
  }
}