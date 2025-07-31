import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as rutinaCalculations from '../utils/rutinaCalculations';

// Crear el contexto
const RutinasStatisticsContext = createContext();

// Hook personalizado para usar el contexto
export const useRutinasStatistics = () => {
  const context = useContext(RutinasStatisticsContext);
  if (!context) {
    throw new Error('useRutinasStatistics debe usarse dentro de un RutinasStatisticsProvider');
  }
  return context;
};

// Provider del contexto
export const RutinasStatisticsProvider = ({ children }) => {
  // Optimización para evitar logs excesivos
  const logTimers = useRef({});
  const lastLogTimes = useRef({});

  // Función para controlar logs evitando spam
  const controlledLog = useCallback((id, message, data = null, level = 'log') => {
    const now = Date.now();
    const key = `${id}_${level}`;
    
    // Limitar logs del mismo tipo a cada 3 segundos
    if (!lastLogTimes.current[key] || now - lastLogTimes.current[key] > 3000) {
      if (data) {
        console[level](`[RutinasStatistics] ${message}`, data);
      } else {
        console[level](`[RutinasStatistics] ${message}`);
      }
      lastLogTimes.current[key] = now;
      
      // Limpiar timers antiguos
      if (logTimers.current[key]) {
        clearTimeout(logTimers.current[key]);
      }
    }
  }, []);

  // Wrapper para calcular el porcentaje de completitud con logs
  const getCompletionPercentage = useCallback((rutinaData) => {
    if (!rutinaData) {
      return 0;
    }
    
    try {
      // Obtener fecha de la rutina para logs
      const fechaRutina = new Date(rutinaData.fecha);
      const hoy = new Date();
      const esRutinaHoy = fechaRutina.toISOString().split('T')[0] === hoy.toISOString().split('T')[0];
      const esRutinaPasada = fechaRutina < hoy;
      
      // Log controlado para entender qué tipo de rutina estamos procesando
      controlledLog('rutina_tipo', 'Tipo de rutina a procesar:', {
        fecha: rutinaData.fecha,
        id: rutinaData._id,
        esRutinaHoy,
        esRutinaPasada
      });
      
      // Calcular el porcentaje usando la función separada
      const percentage = rutinaCalculations.calculateCompletionPercentage(rutinaData);
      
      // Log detallado para depuración
      if (typeof rutinaData.completitud === 'number') {
        controlledLog('backend_completion', 'Usando completitud calculada por backend:', { 
          value: rutinaData.completitud, 
          percentage, 
          rutinaId: rutinaData._id, 
          fecha: rutinaData.fecha 
        });
      } else {
        // Para cálculos manuales, obtener detalles
        const { visibleItems, completedItems, sectionStats } = rutinaCalculations.calculateVisibleItems(rutinaData);
        
        controlledLog('manual_completion', 'Cálculo manual de completitud:', {
          rutinaId: rutinaData._id,
          fecha: rutinaData.fecha,
          esRutinaHoy,
          esRutinaPasada,
          totalItemsVisibles: visibleItems.length,
          completedItems: completedItems.length,
          percentage,
          sectionStats,
          itemsVisibles: visibleItems.length <= 10 ? visibleItems : `${visibleItems.length} items (primeros 10 mostrados)`
        });
      }
      
      return percentage;
    } catch (error) {
      console.error('[RutinasStatistics] Error en wrapper de cálculo de completitud:', error);
      return 0;
    }
  }, [controlledLog]);

  // Wrapper para estadísticas por sección
  const getSectionStats = useCallback((rutinaData) => {
    try {
      return rutinaCalculations.calculateSectionStats(rutinaData);
    } catch (error) {
      console.error('[RutinasStatistics] Error en wrapper de estadísticas por sección:', error);
      return {
        bodyCare: { visible: 0, completed: 0, percentage: 0 },
        nutricion: { visible: 0, completed: 0, percentage: 0 },
        ejercicio: { visible: 0, completed: 0, percentage: 0 },
        cleaning: { visible: 0, completed: 0, percentage: 0 }
      };
    }
  }, []);

  // Función simplificada para estadísticas básicas (sin historial)
  const getBasicStats = useCallback((rutinaData) => {
    if (!rutinaData) {
      return {
        totalItems: 0,
        completedItems: 0,
        percentage: 0,
        sections: {
          bodyCare: { visible: 0, completed: 0, percentage: 0 },
          nutricion: { visible: 0, completed: 0, percentage: 0 },
          ejercicio: { visible: 0, completed: 0, percentage: 0 },
          cleaning: { visible: 0, completed: 0, percentage: 0 }
        }
      };
    }

    try {
      const percentage = getCompletionPercentage(rutinaData);
      const sectionStats = getSectionStats(rutinaData);
      
      // Calcular totales
      const totalVisible = Object.values(sectionStats).reduce((sum, section) => sum + section.visible, 0);
      const totalCompleted = Object.values(sectionStats).reduce((sum, section) => sum + section.completed, 0);

      return {
        totalItems: totalVisible,
        completedItems: totalCompleted,
        percentage,
        sections: sectionStats
      };
    } catch (error) {
      console.error('[RutinasStatistics] Error calculando estadísticas básicas:', error);
      return {
        totalItems: 0,
        completedItems: 0,
        percentage: 0,
        sections: {
          bodyCare: { visible: 0, completed: 0, percentage: 0 },
          nutricion: { visible: 0, completed: 0, percentage: 0 },
          ejercicio: { visible: 0, completed: 0, percentage: 0 },
          cleaning: { visible: 0, completed: 0, percentage: 0 }
        }
      };
    }
  }, [getCompletionPercentage, getSectionStats]);

  // Valores a exponer en el contexto
  const contextValue = {
    calculateCompletionPercentage: getCompletionPercentage,
    calculateSectionStats: getSectionStats,
    getBasicStats
  };

  return (
    <RutinasStatisticsContext.Provider value={contextValue}>
      {children}
    </RutinasStatisticsContext.Provider>
  );
};

export default RutinasStatisticsContext; 
