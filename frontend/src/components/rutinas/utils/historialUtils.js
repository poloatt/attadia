import { startOfWeek, endOfWeek, parseISO, isSameWeek, isToday, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import rutinasService from '../../../services/rutinasService';

// Cache para almacenar resultados de historial y evitar múltiples peticiones
const historialCache = {};

/**
 * Obtiene el historial de completaciones para una semana específica
 * @param {string} section - Sección del ítem (bodyCare, ejercicio, etc)
 * @param {string} itemId - Identificador del ítem
 * @param {Date} fechaRutina - Fecha de la rutina para la que se busca el historial
 * @returns {Promise<number>} - Promesa con el número de completaciones acumuladas hasta esa fecha
 */
export async function obtenerHistorialCompletacionesSemana(section, itemId, fechaRutina) {
  // Normalizar la fecha de rutina
  const fechaRutinaObj = typeof fechaRutina === 'string' ? parseISO(fechaRutina) : fechaRutina;
  
  // Obtener el inicio y fin de la semana de la fecha específica
  const inicioSemana = startOfWeek(fechaRutinaObj, { locale: es });
  const finSemana = endOfWeek(fechaRutinaObj, { locale: es });
  
  // Crear una clave única para el caché
  const fechaRutinaStr = fechaRutinaObj.toISOString().split('T')[0];
  const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];
  const cacheKey = `${section}_${itemId}_${inicioSemanaStr}`;
  
  console.log(`[historialUtils] Obteniendo historial para ${section}.${itemId} en semana de ${inicioSemanaStr}`);
  
  // Verificar si ya tenemos estos datos en caché
  if (historialCache[cacheKey] && historialCache[cacheKey].timestamp > Date.now() - 5 * 60 * 1000) {
    console.log(`[historialUtils] Usando datos de caché para ${cacheKey}`);
    const datos = historialCache[cacheKey].datos;
    
    // Filtrar completaciones hasta la fecha de la rutina
    return filtrarCompletacionesHastaFecha(datos, fechaRutinaObj);
  }
  
  try {
    // Usar el endpoint existente para obtener completaciones históricas
    const historial = await rutinasService.getHistorialCompletaciones(
      section,
      itemId,
      inicioSemana,
      finSemana
    );
    
    // Guardar en caché para futuras consultas
    historialCache[cacheKey] = {
      datos: historial,
      timestamp: Date.now()
    };
    
    console.log(`[historialUtils] Recibidas ${historial?.completaciones?.length || 0} completaciones del backend`);
    
    // Verificar si tenemos datos de completaciones para esa semana específica
    if (historial && historial.completaciones) {
      // Filtrar completaciones hasta la fecha específica
      return filtrarCompletacionesHastaFecha(historial, fechaRutinaObj);
    }
    
    return 0; // Si no hay datos, devolver 0
  } catch (error) {
    console.error(`[historialUtils] Error obteniendo historial acumulado: ${error.message}`);
    return 0; // En caso de error, devolver 0
  }
}

/**
 * Filtra las completaciones que ocurrieron hasta (e incluyendo) una fecha específica
 * @param {Object} historial - Datos de historial recibidos del backend
 * @param {Date} fechaLimite - Fecha límite hasta la que contar completaciones
 * @returns {number} - Número de completaciones hasta la fecha límite
 */
function filtrarCompletacionesHastaFecha(historial, fechaLimite) {
  if (!historial || !historial.completaciones || !Array.isArray(historial.completaciones)) {
    return 0;
  }
  
  const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
  console.log(`[historialUtils] Filtrando completaciones hasta fecha ${fechaLimiteStr}`);
  
  // Filtrar completaciones que ocurrieron hasta (e incluyendo) la fecha límite
  const completacionesHastaFecha = historial.completaciones.filter(comp => {
    const fechaComp = new Date(comp.fecha);
    const fechaCompStr = fechaComp.toISOString().split('T')[0];
    
    // Verificar si la fecha de completación es anterior o igual a la fecha límite
    const esAnteriorOIgual = fechaCompStr <= fechaLimiteStr;
    
    if (esAnteriorOIgual) {
      console.log(`[historialUtils] ✅ Contabilizando completación: ${fechaCompStr}`);
    }
    
    return esAnteriorOIgual;
  });
  
  console.log(`[historialUtils] Total acumulado: ${completacionesHastaFecha.length}`);
  return completacionesHastaFecha.length;
}

/**
 * Determina si una rutina es histórica (anterior a hoy)
 * @param {Object} rutina - Objeto de rutina
 * @returns {boolean} - Verdadero si la rutina es histórica
 */
export function esRutinaHistorica(rutina) {
  if (!rutina || !rutina.fecha) {
    return false;
  }
  
  const fechaRutina = typeof rutina.fecha === 'string' ? parseISO(rutina.fecha) : rutina.fecha;
  const fechaHoy = new Date();
  
  return fechaRutina.getTime() < startOfDay(fechaHoy).getTime();
}

/**
 * Verifica si un ítem está completado en una rutina
 * @param {Object} rutina - Objeto de rutina
 * @param {string} section - Sección del ítem
 * @param {string} itemId - Identificador del ítem
 * @returns {boolean} - Verdadero si el ítem está completado
 */
export function isItemCompletado(rutina, section, itemId) {
  if (!rutina || !section || !itemId) {
    return false;
  }
  
  return !!rutina[section]?.[itemId];
} 