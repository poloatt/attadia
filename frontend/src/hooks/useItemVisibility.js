/**
 * Hook para manejar la visibilidad de elementos de rutina basada en cadencia
 */

import { useState, useEffect, useCallback } from 'react';
import { cadenciaManager } from '../utils/cadenciaManager';

/**
 * Hook que maneja la visibilidad de elementos individuales
 * @param {string} section - Sección del elemento
 * @param {string} itemId - ID del elemento
 * @param {Object} rutina - Objeto rutina
 * @param {Object} config - Configuración del elemento
 * @returns {Object} Estado de visibilidad y métodos
 */
export const useItemVisibility = (section, itemId, rutina, config) => {
  const [visibility, setVisibility] = useState({
    shouldShow: true, // Por defecto mostrar
    state: 'pending',
    reason: 'Cargando...',
    progress: null,
    isLoading: true
  });

  const calculateVisibility = useCallback(async () => {
    if (!section || !itemId || !rutina) {
      setVisibility({
        shouldShow: true,
        state: 'pending',
        reason: 'Parámetros incompletos',
        progress: null,
        isLoading: false
      });
      return;
    }

    try {
      const result = await cadenciaManager.shouldShowItem(section, itemId, rutina, {
        historial: rutina.historial
      });

      setVisibility({
        shouldShow: result.shouldShow,
        state: result.state,
        reason: result.reason,
        progress: result.progress,
        nextAction: result.nextAction,
        isLoading: false
      });
    } catch (error) {
      console.error(`[useItemVisibility] Error calculando visibilidad para ${section}.${itemId}:`, error);
      setVisibility({
        shouldShow: true, // En caso de error, mostrar por defecto
        state: 'error',
        reason: `Error: ${error.message}`,
        progress: null,
        isLoading: false
      });
    }
  }, [section, itemId, rutina, config]);

  // Recalcular visibilidad cuando cambian los parámetros
  useEffect(() => {
    calculateVisibility();
  }, [calculateVisibility]);

  // Recalcular cuando cambia el estado de completitud
  useEffect(() => {
    if (rutina && rutina[section] && rutina[section][itemId] !== undefined) {
      calculateVisibility();
    }
  }, [rutina?.[section]?.[itemId], calculateVisibility]);

  const refresh = useCallback(() => {
    calculateVisibility();
  }, [calculateVisibility]);

  return {
    ...visibility,
    refresh,
    isVisible: visibility.shouldShow && !visibility.isLoading
  };
};

/**
 * Hook para manejar la visibilidad de múltiples elementos
 * @param {string} section - Sección
 * @param {Array} itemIds - Array de IDs de elementos
 * @param {Object} rutina - Objeto rutina
 * @param {Object} config - Configuración completa
 * @returns {Object} Estado de visibilidad para todos los elementos
 */
export const useMultipleItemVisibility = (section, itemIds, rutina, config) => {
  const [visibilityMap, setVisibilityMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const calculateAllVisibility = useCallback(async () => {
    if (!section || !itemIds || itemIds.length === 0) {
      setVisibilityMap({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const newVisibilityMap = {};

    try {
      // Calcular visibilidad para todos los elementos en paralelo
      const visibilityPromises = itemIds.map(async (itemId) => {
        try {
          const result = await cadenciaManager.shouldShowItem(section, itemId, rutina, {
            historial: rutina.historial
          });
          
          return {
            itemId,
            visibility: {
              shouldShow: result.shouldShow,
              state: result.state,
              reason: result.reason,
              progress: result.progress,
              nextAction: result.nextAction,
              isLoading: false
            }
          };
        } catch (error) {
          console.error(`[useMultipleItemVisibility] Error para ${section}.${itemId}:`, error);
          return {
            itemId,
            visibility: {
              shouldShow: true,
              state: 'error',
              reason: `Error: ${error.message}`,
              progress: null,
              isLoading: false
            }
          };
        }
      });

      const results = await Promise.all(visibilityPromises);
      
      results.forEach(({ itemId, visibility }) => {
        newVisibilityMap[itemId] = visibility;
      });

      setVisibilityMap(newVisibilityMap);
    } catch (error) {
      console.error('[useMultipleItemVisibility] Error general:', error);
      // En caso de error, inicializar con visibilidad por defecto
      itemIds.forEach(itemId => {
        newVisibilityMap[itemId] = {
          shouldShow: true,
          state: 'error',
          reason: 'Error general',
          progress: null,
          isLoading: false
        };
      });
      setVisibilityMap(newVisibilityMap);
    } finally {
      setIsLoading(false);
    }
  }, [section, itemIds, rutina, config]);

  // Recalcular cuando cambian los parámetros
  useEffect(() => {
    calculateAllVisibility();
  }, [calculateAllVisibility]);

  const refresh = useCallback(() => {
    calculateAllVisibility();
  }, [calculateAllVisibility]);

  const getVisibility = useCallback((itemId) => {
    return visibilityMap[itemId] || {
      shouldShow: true,
      state: 'loading',
      reason: 'Cargando...',
      progress: null,
      isLoading: true
    };
  }, [visibilityMap]);

  const getVisibleItems = useCallback(() => {
    return itemIds.filter(itemId => {
      const visibility = visibilityMap[itemId];
      return visibility && visibility.shouldShow && !visibility.isLoading;
    });
  }, [itemIds, visibilityMap]);

  return {
    visibilityMap,
    isLoading,
    refresh,
    getVisibility,
    getVisibleItems
  };
};

export default useItemVisibility; 