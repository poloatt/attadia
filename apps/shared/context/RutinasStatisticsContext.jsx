import React, { createContext, useContext, useState, useCallback } from 'react';
import * as rutinaCalculations from '../utils/rutinaCalculations';
import logger from '../utils/logger';

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
  // Usar logger centralizado
  const statsLog = useCallback((message, data = null) => {
    if (data) {
      logger.log('RutinasStatistics', message, data);
    } else {
      logger.log('RutinasStatistics', message);
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
      
      // Log eliminado para mejor rendimiento
      
      // Calcular el porcentaje usando la función separada
      const percentage = rutinaCalculations.calculateCompletionPercentage(rutinaData);
      
      // Logs eliminados para mejor rendimiento
      if (typeof rutinaData.completitud === 'number') {
        // Usar valor del backend sin logging
      } else {
        // Cálculo manual sin logging excesivo
        const { visibleItems, completedItems, sectionStats } = rutinaCalculations.calculateVisibleItems(rutinaData);
      }
      
      return percentage;
    } catch (error) {
      console.error('[RutinasStatistics] Error en wrapper de cálculo de completitud:', error);
      return 0;
    }
  }, [statsLog]);

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
