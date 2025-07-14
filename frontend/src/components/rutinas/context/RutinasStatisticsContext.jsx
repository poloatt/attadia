import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { calculateCompletionPercentage, calculateSectionStats, calculateVisibleItems } from '../utils/rutinaCalculations.jsx';
import { useRutinasHistorical } from './RutinasHistoryContext';

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
  // Tratar de obtener el contexto histórico si está disponible
  const historicalContext = useRutinasHistorical();
  
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
      const percentage = calculateCompletionPercentage(rutinaData);
      
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
        const { visibleItems, completedItems, sectionStats } = calculateVisibleItems(rutinaData);
        
        controlledLog('manual_completion', 'Cálculo manual de completitud:', {
          rutinaId: rutinaData._id,
          fecha: rutinaData.fecha,
          esRutinaHoy,
          esRutinaPasada,
          totalItemsVisibles: visibleItems.length,
          completedItems: completedItems.length,
          percentage,
          sectionStats,
          itemsVisibles: visibleItems.length <= 10 ? visibleItems : `${visibleItems.length} items (primeros 10 mostrados)`,
          usoHistorico: historicalContext !== null
        });
      }
      
      return percentage;
    } catch (error) {
      console.error('[RutinasStatistics] Error en wrapper de cálculo de completitud:', error);
      return 0;
    }
  }, [controlledLog, historicalContext]);

  // Wrapper para estadísticas por sección
  const getSectionStats = useCallback((rutinaData) => {
    try {
      return calculateSectionStats(rutinaData);
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

  // Calcular estadísticas históricas por período
  const calculateHistoricalStats = useCallback((days = 7) => {
    if (!historicalContext || !historicalContext.historialRutinas) {
      controlledLog('history_missing', 'No hay contexto histórico disponible para calcular estadísticas');
      return {
        dias: days,
        totalRutinas: 0,
        promedioCompletitud: 0,
        tendencia: 'estable',
        mejorDia: null,
        peorDia: null,
        datosCompletitud: []
      };
    }

    try {
      const historial = historicalContext.historialRutinas;
      
      // Filtrar rutinas por el período solicitado
      const hoy = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() - days);
      
      const rutinasEnPeriodo = historial.filter(r => {
        const fechaRutina = new Date(r.fecha);
        return fechaRutina >= fechaLimite && fechaRutina <= hoy;
      });
      
      // Si no hay rutinas en el período, retornar datos vacíos
      if (rutinasEnPeriodo.length === 0) {
        return {
          dias: days,
          totalRutinas: 0,
          promedioCompletitud: 0,
          tendencia: 'estable',
          mejorDia: null,
          peorDia: null,
          datosCompletitud: []
        };
      }
      
      // Calcular completitud para cada rutina
      const rutinasConCompletitud = rutinasEnPeriodo.map(r => {
        // Usar nuestro wrapper que ya incluye validaciones y logs
        const completitud = getCompletionPercentage(r) / 100;
        
        return {
          ...r,
          completitudCalculada: completitud,
          fecha: new Date(r.fecha).toISOString().split('T')[0]
        };
      });
      
      // Ordenar por fecha
      rutinasConCompletitud.sort((a, b) => {
        return new Date(a.fecha) - new Date(b.fecha);
      });
      
      // Calcular mejor y peor día
      let mejorDia = rutinasConCompletitud[0];
      let peorDia = rutinasConCompletitud[0];
      
      rutinasConCompletitud.forEach(r => {
        if (r.completitudCalculada > mejorDia.completitudCalculada) {
          mejorDia = r;
        }
        if (r.completitudCalculada < peorDia.completitudCalculada) {
          peorDia = r;
        }
      });
      
      // Calcular promedio general
      const totalCompletitud = rutinasConCompletitud.reduce((sum, r) => sum + r.completitudCalculada, 0);
      const promedioCompletitud = totalCompletitud / rutinasConCompletitud.length;
      
      // Calcular tendencia (comparar primera mitad vs segunda mitad)
      const mitad = Math.floor(rutinasConCompletitud.length / 2);
      const primerasMitad = rutinasConCompletitud.slice(0, mitad);
      const segundasMitad = rutinasConCompletitud.slice(mitad);
      
      const promedioInicial = primerasMitad.reduce((sum, r) => sum + r.completitudCalculada, 0) / primerasMitad.length;
      const promedioFinal = segundasMitad.reduce((sum, r) => sum + r.completitudCalculada, 0) / segundasMitad.length;
      
      let tendencia = 'estable';
      if (promedioFinal > promedioInicial * 1.1) { // 10% de mejora
        tendencia = 'mejorando';
      } else if (promedioFinal < promedioInicial * 0.9) { // 10% de empeoramiento
        tendencia = 'empeorando';
      }
      
      // Preparar datos para gráficos
      const datosCompletitud = rutinasConCompletitud.map(r => ({
        fecha: r.fecha,
        completitud: Math.round(r.completitudCalculada * 100)
      }));
      
      return {
        dias: days,
        totalRutinas: rutinasConCompletitud.length,
        promedioCompletitud: Math.round(promedioCompletitud * 100),
        tendencia,
        mejorDia: {
          fecha: mejorDia.fecha,
          completitud: Math.round(mejorDia.completitudCalculada * 100)
        },
        peorDia: {
          fecha: peorDia.fecha,
          completitud: Math.round(peorDia.completitudCalculada * 100)
        },
        datosCompletitud
      };
    } catch (error) {
      console.error('[RutinasStatistics] Error calculando estadísticas históricas:', error);
      return {
        dias: days,
        totalRutinas: 0,
        promedioCompletitud: 0,
        tendencia: 'error',
        mejorDia: null,
        peorDia: null,
        datosCompletitud: [],
        error: error.message
      };
    }
  }, [historicalContext, getCompletionPercentage]);

  // Valores a exponer en el contexto
  const contextValue = {
    calculateCompletionPercentage: getCompletionPercentage,
    calculateSectionStats: getSectionStats,
    calculateHistoricalStats
  };

  return (
    <RutinasStatisticsContext.Provider value={contextValue}>
      {children}
    </RutinasStatisticsContext.Provider>
  );
};

export default RutinasStatisticsContext; 