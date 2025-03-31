import shouldShowItem from './shouldShowItem.jsx';

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
          // Siempre considerar los ítems como visibles para el cálculo de completitud
          // Esto corrige el problema de mostrar 0% al inicio en la rutina de hoy
          // También permite la actualización correcta del porcentaje en rutinas pasadas
          const visible = true;
          
          if (visible) {
            // Agregar a la lista de ítems visibles
            visibleItems.push({ section, itemId, isCompleted });
            sectionStats[section].visible++;
            
            // Si está completado, agregarlo a la lista de completados
            if (isCompleted) {
              completedItems.push({ section, itemId });
              sectionStats[section].completed++;
            }
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
  // Si el backend ya calculó la completitud y estamos viendo una rutina histórica, usar ese valor
  const esHoy = new Date(rutina?.fecha).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  
  // Para rutinas históricas, calculamos siempre el valor en el frontend para permitir actualizaciones
  // en tiempo real al marcar/desmarcar ítems
  if (typeof rutina?.completitud === 'number' && !esHoy) {
    // Calculamos el porcentaje para todos los casos para permitir actualizaciones en tiempo real
    const { visibleItems, completedItems } = calculateVisibleItems(rutina);
    const totalVisible = visibleItems.length;
    const totalCompleted = completedItems.length;
    
    return Math.round((totalCompleted / totalVisible) * 100);
  }

  try {
    // Calcular ítems visibles y completados
    const { visibleItems, completedItems } = calculateVisibleItems(rutina);
    
    // Calcular el porcentaje
    const totalVisible = visibleItems.length;
    const totalCompleted = completedItems.length;
    
    // Si no hay ítems visibles, retornar 0%
    if (totalVisible === 0) return 0;
    
    // Calcular y redondear el porcentaje
    return Math.round((totalCompleted / totalVisible) * 100);
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