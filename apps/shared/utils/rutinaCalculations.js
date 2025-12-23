import { iconConfig, getIconByName } from './iconConfig.js';

/**
 * Calcula los ítems visibles y completados para una rutina
 * @param {Object} rutina - Objeto de rutina completo
 * @param {Object} localDataBySection - (opcional) estado local por sección para reflejar checks inmediatos
 * @param {Object} customHabits - (opcional) hábitos personalizados del usuario { bodyCare: [...], nutricion: [...], ... }
 * @returns {Object} - { visibleItems, completedItems, sectionStats }
 */
export const calculateVisibleItems = (rutina, localDataBySection = {}, customHabits = null) => {
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

  // Función helper para obtener los IDs de hábitos de una sección
  const getSectionItemIds = (section) => {
    // Si hay hábitos personalizados, usarlos
    if (customHabits && customHabits[section] && Array.isArray(customHabits[section]) && customHabits[section].length > 0) {
      return customHabits[section]
        .filter(h => h.activo !== false)
        .map(h => h.id || h._id)
        .filter(Boolean);
    }
    
    // Fallback a iconConfig
    return Object.keys(iconConfig?.[section] || {});
  };

  // Iterar por todas las secciones
  ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
    try {
      // IMPORTANT: la UI renderiza ítems por hábitos personalizados o `iconConfig`, no por las keys presentes en `rutina[section]`.
      // Si usamos `Object.entries(rutina[section])` el % queda mal cuando faltan keys (p.ej. ítems no completados).
      const sectionItemIds = getSectionItemIds(section);
      const sectionConfig = rutina?.config?.[section] || {};
      const localData = localDataBySection?.[section] || {};

      // Fuente de verdad de "qué se muestra" para el %:
      // en la vista expandida (RutinaCard) se muestran TODOS los ítems activos (y si falta config, se muestran por defecto).
      // No se ocultan por cadencia ni por estar ya completados hoy.
      const visibleIds = sectionItemIds.filter((itemId) => {
        const cfg = sectionConfig?.[itemId];
        if (!cfg) return true; // sin config, se muestra
        if (cfg.activo === false) return false;
        return true;
      });
      sectionStats[section].visible = visibleIds.length;

      visibleIds.forEach((itemId) => {
        const fromLocal = localData?.[itemId];
        const fromRutina = rutina?.[section]?.[itemId];
        const isCompleted = (fromLocal !== undefined ? fromLocal : fromRutina) === true;

        visibleItems.push({ section, itemId, isCompleted });
        if (isCompleted) {
          completedItems.push({ section, itemId });
          sectionStats[section].completed++;
        }
      });
    } catch (error) {
      console.error(`[rutinaCalculations] Error evaluando visibilidad/completitud en ${section}:`, error);
    }
  });

  return { visibleItems, completedItems, sectionStats };
};

/**
 * Calcula el porcentaje de completitud para una rutina
 * @param {Object} rutina - Objeto de rutina completo
 * @param {Object} customHabits - (opcional) hábitos personalizados del usuario
 * @returns {number} - Porcentaje de completitud (0-100)
 */
export const calculateCompletionPercentage = (rutina, customHabits = null) => {
  if (!rutina) return 0;

  try {
    // Calcular ítems visibles y completados
    const { visibleItems, completedItems } = calculateVisibleItems(rutina, {}, customHabits);
    
    // Calcular el porcentaje
    const totalVisible = visibleItems.length;
    const totalCompleted = completedItems.length;
    
    // Si no hay ítems visibles, retornar 0%
    if (totalVisible === 0) return 0;
    
    // Si ya tenemos un valor de completitud del backend, lo usamos como referencia
    // pero recalculamos para asegurar consistencia
    let percentage = Math.round((totalCompleted / totalVisible) * 100);
    if (!Number.isFinite(percentage)) percentage = 0;
    // Clamp defensivo
    percentage = Math.min(100, Math.max(0, percentage));
    
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
 * @param {Object} customHabits - (opcional) hábitos personalizados del usuario
 * @returns {Object} - Estadísticas por sección
 */
export const calculateSectionStats = (rutina, customHabits = null) => {
  try {
    const { sectionStats } = calculateVisibleItems(rutina, {}, customHabits);
    
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