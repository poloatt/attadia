import shouldShowItemUtil from './shouldShowItem';
import { parseAPIDate } from './dateUtils';
import { getCurrentTimeOfDay } from './timeOfDayUtils';

// Construye una rutina simulada coherente para evaluar visibilidad
const buildRutinaForCheck = (rutina, section, itemId, config, localData = {}) => {
  const fecha = parseAPIDate(rutina?.fecha) || new Date();
  const completadoHoy = Boolean(localData[itemId]) || Boolean(rutina?.[section]?.[itemId]);

  // Merge config actual con el ítem a evaluar
  const mergedConfig = {
    ...(rutina?.config || {}),
    [section]: {
      ...(rutina?.config?.[section] || {}),
      [itemId]: config
    }
  };

  return {
    ...rutina,
    fecha: fecha.toISOString(),
    config: mergedConfig,
    // Incluir estado de completado local y/o actual
    [section]: {
      ...(rutina?.[section] || {}),
      [itemId]: completadoHoy
    },
    // Incluir historial si está disponible
    historial: rutina?.historial || {}
  };
};

// API síncrona para decidir si un ítem debe mostrarse
export const shouldShowItemSync = (section, itemId, rutina, config, localData = {}, currentTimeOfDay = null) => {
  try {
    if (!section || !itemId || !rutina) return true;
    const rutinaCheck = buildRutinaForCheck(rutina, section, itemId, config, localData);
    const timeOfDay = currentTimeOfDay || getCurrentTimeOfDay();
    
    // Determinar si el hábito está completado hoy
    const isCompleted = Boolean(localData[itemId]) || Boolean(rutina?.[section]?.[itemId]);
    
    return shouldShowItemUtil(section, itemId, rutinaCheck, { 
      historial: rutina?.historial || {},
      currentTimeOfDay: timeOfDay,
      isCompleted: isCompleted
    });
  } catch (e) {
    console.error('[visibilityUtils] Error en shouldShowItemSync:', e);
    return true;
  }
};

// Filtra y devuelve los itemIds visibles de una sección
export const getVisibleItemIds = (sectionIcons, section, rutina, config, localData = {}, currentTimeOfDay = null) => {
  const itemIds = Object.keys(sectionIcons || {});
  return itemIds.filter(itemId => {
    const itemConfig = config?.[itemId];
    if (!itemConfig || itemConfig.activo === false) return false;
    return shouldShowItemSync(section, itemId, rutina, itemConfig, localData, currentTimeOfDay);
  });
};


