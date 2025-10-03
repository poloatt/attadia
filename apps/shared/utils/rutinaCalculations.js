import shouldShowItem from './shouldShowItem.js';
import { parseAPIDate } from './dateUtils.js';

/**
 * Calcula los ítems visibles y completados para una rutina
 * @param {Object} rutina - Objeto de rutina completo
 * @returns {Object} - { visibleItems, completedItems, sectionStats }
 */
export const calculateVisibleItems = (rutina) => {
  if (!rutina) {
    return {
      visibleItems: [],
      completedItems: [],
      sectionStats: {
        bodyCare: { visible: 0, completed: 0 },
        nutricion: { visible: 0, completed: 0 },
        ejercicio: { visible: 0, completed: 0 },
        cleaning: { visible: 0, completed: 0 }
      }
    };
  }

  const visibleItems = [];
  const completedItems = [];
  const sectionStats = {
    bodyCare: { visible: 0, completed: 0 },
    nutricion: { visible: 0, completed: 0 },
    ejercicio: { visible: 0, completed: 0 },
    cleaning: { visible: 0, completed: 0 }
  };

  // Fecha de la rutina para los logs
  const fechaRutina = new Date(rutina.fecha);
  const esHoy = new Date().toISOString().split('T')[0] === fechaRutina.toISOString().split('T')[0];
  const logPrefix = esHoy ? "[HOY]" : `[${fechaRutina.toISOString().split('T')[0]}]`;

  // Iterar por todas las secciones
  ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
    if (rutina[section]) {
      // Obtener todos los items de la sección
      Object.entries(rutina[section]).forEach(([itemId, isCompleted]) => {
        try {
          // Usar shouldShowItem para visibilidad coherente con UX (útiles)
          const visible = shouldShowItem(section, itemId, {
            ...rutina,
            fecha: parseAPIDate(rutina.fecha)?.toISOString() || rutina.fecha
          }, { historial: rutina?.historial || {} });
          
          if (visible) {
            // Agregar a la lista de ítems visibles
            visibleItems.push({ section, itemId, isCompleted });
            sectionStats[section].visible++;
            
            // Si está completado, agregarlo a la lista de completados
            if (isCompleted) {
              completedItems.push({ section, itemId });
              sectionStats[section].completed++;
            }
            // Debug eliminado para mejor rendimiento
          }
        } catch (error) {
          console.error(`${logPrefix} Error evaluando visibilidad del ítem ${section}.${itemId}:`, error);
        }
      });
    }
  });

  return { visibleItems, completedItems, sectionStats };
};

/**
 * Calcula el porcentaje de completitud para una rutina
 * @param {Object} rutina - Objeto de rutina completo
 * @returns {number} - Porcentaje de completitud (0-100)
 */
export const calculateCompletionPercentage = (rutina) => {
  if (!rutina) return 0;

  try {
    // Calcular ítems visibles y completados
    const { visibleItems, completedItems } = calculateVisibleItems(rutina);
    
    // Calcular el porcentaje
    const totalVisible = visibleItems.length;
    const totalCompleted = completedItems.length;
    
    // Si no hay ítems visibles, retornar 0%
    if (totalVisible === 0) return 0;
    
    // Si ya tenemos un valor de completitud del backend, lo usamos como referencia
    // pero recalculamos para asegurar consistencia
    let percentage = Math.round((totalCompleted / totalVisible) * 100);
    
    // Logs eliminados para mejor rendimiento
    
    return percentage;
  } catch (error) {
    console.error('Error calculando porcentaje de completitud:', error);
    return 0;
  }
};

/**
 * Calcula estadísticas detalladas por sección
 * @param {Object} rutina - Objeto de rutina completo
 * @returns {Object} - Estadísticas por sección
 */
export const calculateSectionStats = (rutina) => {
  try {
    const { sectionStats } = calculateVisibleItems(rutina);
    
    // Calcular porcentajes para cada sección
    Object.keys(sectionStats).forEach(section => {
      sectionStats[section].percentage = sectionStats[section].visible > 0
        ? Math.round((sectionStats[section].completed / sectionStats[section].visible) * 100)
        : 0;
    });
    
    return sectionStats;
  } catch (error) {
    console.error('Error calculando estadísticas por sección:', error);
    return {
      bodyCare: { visible: 0, completed: 0, percentage: 0 },
      nutricion: { visible: 0, completed: 0, percentage: 0 },
      ejercicio: { visible: 0, completed: 0, percentage: 0 },
      cleaning: { visible: 0, completed: 0, percentage: 0 }
    };
  }
}; 