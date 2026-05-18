import { getNormalizedToday, toISODateString, parseAPIDate } from './dateUtils.js';
import rutinasService from '../services/rutinasService.js';

/** True si la rutina es de un día anterior al actual. */
export function esRutinaHistorica(rutina) {
  if (!rutina?.fecha) return false;
  try {
    const rutinaDate = toISODateString(parseAPIDate(rutina.fecha));
    const today = toISODateString(getNormalizedToday());
    return rutinaDate < today;
  } catch {
    return false;
  }
}

/** Historial acumulado de completaciones hasta la fecha indicada. */
export async function obtenerHistorialCompletaciones(section, itemId, fechaRutina) {
  return rutinasService.getHistorialCompletaciones(section, itemId, fechaRutina, fechaRutina);
}
