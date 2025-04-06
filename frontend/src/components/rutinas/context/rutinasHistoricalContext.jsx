import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import rutinasService from '../services/rutinasService';
import { useSnackbar } from 'notistack';

// Crear el contexto
const RutinasHistoricalContext = createContext();

// Exportar hook personalizado para usar el contexto
export const useRutinasHistorical = () => {
  return RutinasHistoricalContext;
};

// Provider del contexto
export const RutinasHistoricalProvider = ({ children }) => {
  const [historialRutinas, setHistorialRutinas] = useState([]);
  const [historicosPorItem, setHistoricosPorItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datosSimulados, setDatosSimulados] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  // Función para cargar el historial
  const cargarHistorial = useCallback(async (dias = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[RutinasHistoricalContext] Cargando historial de los últimos ${dias} días`);
      
      // Obtener fecha actual y normalizarla
      const ahora = new Date();
      ahora.setHours(12, 0, 0, 0);
      
      // Calcular fecha de inicio
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - dias);
      
      // Usar el servicio para obtener el historial
      const historial = await rutinasService.getHistorialCompletaciones(
        null, 
        null,
        fechaInicio,
        ahora
      );
      
      // Verificar si tenemos datos válidos
      if (historial && historial.completaciones && Array.isArray(historial.completaciones) && historial.completaciones.length > 0) {
        setHistorialRutinas(historial.completaciones);
        setDatosSimulados(false);
        console.log(`[RutinasHistoricalContext] Historial cargado: ${historial.completaciones.length} registros`);
        
        // Procesar historial por ítem
        procesarHistorialPorItem(historial.completaciones);
      } else {
        console.warn('[RutinasHistoricalContext] No se obtuvieron datos históricos');
        setHistorialRutinas([]);
        setHistoricosPorItem({});
        enqueueSnackbar('No hay datos históricos disponibles', { variant: 'info' });
      }
    } catch (error) {
      console.error('[RutinasHistoricalContext] Error al cargar historial:', error);
      setError('Error al cargar historial de rutinas');
      enqueueSnackbar('Error al cargar historial de rutinas', { variant: 'error' });
      setHistorialRutinas([]);
      setHistoricosPorItem({});
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);
  
  // Procesar el historial para generar datos por ítem
  const procesarHistorialPorItem = useCallback((rutinas) => {
    const historicos = {};
    
    // Recorrer todas las rutinas
    rutinas.forEach(rutina => {
      // Solo procesar rutinas con fecha válida
      if (!rutina?.fecha) return;
      
      const fechaRutina = new Date(rutina.fecha);
      fechaRutina.setHours(12, 0, 0, 0); // Normalizar hora
      
      // Procesar cada sección
      ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
        if (!rutina[section]) return;
        
        // Procesar cada ítem en la sección
        Object.entries(rutina[section]).forEach(([itemId, completado]) => {
          // Inicializar registro del ítem si no existe
          if (!historicos[section]) historicos[section] = {};
          if (!historicos[section][itemId]) historicos[section][itemId] = {
            completados: [],
            configuraciones: []
          };
          
          // Registrar completado si es true
          if (completado === true) {
            historicos[section][itemId].completados.push({
              fecha: fechaRutina,
              rutinaId: rutina._id
            });
          }
          
          // Registrar configuración si existe
          if (rutina.config?.[section]?.[itemId]) {
            historicos[section][itemId].configuraciones.push({
              fecha: fechaRutina,
              config: { ...rutina.config[section][itemId] },
              rutinaId: rutina._id
            });
          }
        });
      });
    });
    
    // Ordenar arrays de completados y configuraciones por fecha (más reciente primero)
    Object.keys(historicos).forEach(section => {
      Object.keys(historicos[section]).forEach(itemId => {
        historicos[section][itemId].completados.sort((a, b) => b.fecha - a.fecha);
        historicos[section][itemId].configuraciones.sort((a, b) => b.fecha - a.fecha);
      });
    });
    
    console.log('[RutinasHistoricalContext] Históricos procesados por ítem:', historicos);
    setHistoricosPorItem(historicos);
  }, []);
  
  // Obtener fechas de completado para un ítem específico
  const obtenerCompletadosItem = useCallback((section, itemId) => {
    return historicosPorItem?.[section]?.[itemId]?.completados || [];
  }, [historicosPorItem]);
  
  // Obtener historial de configuraciones para un ítem específico
  const obtenerConfiguracionesItem = useCallback((section, itemId) => {
    return historicosPorItem?.[section]?.[itemId]?.configuraciones || [];
  }, [historicosPorItem]);
  
  // Obtener la última configuración para un ítem específico
  const obtenerUltimaConfiguracionItem = useCallback((section, itemId) => {
    const configuraciones = historicosPorItem?.[section]?.[itemId]?.configuraciones || [];
    return configuraciones.length > 0 ? configuraciones[0].config : null;
  }, [historicosPorItem]);
  
  // Verificar si un ítem ya ha completado su frecuencia requerida en el periodo
  const verificarCompletitudItem = useCallback((section, itemId, rutinaActual) => {
    if (!rutinaActual || !rutinaActual.config?.[section]?.[itemId]) {
      return { 
        completado: false, 
        deberiasMostrar: true, 
        razon: 'Sin configuración' 
      };
    }
    
    const config = rutinaActual.config[section][itemId];
    
    // Si no está activo, no debería mostrarse
    if (config.activo === false) {
      return { 
        completado: false, 
        deberiasMostrar: false, 
        razon: 'Ítem inactivo' 
      };
    }
    
    // Obtener todas las fechas donde este ítem fue completado
    const completados = obtenerCompletadosItem(section, itemId)
      .map(c => c.fecha);
    
    // Verificar si ya se alcanzó la frecuencia para el periodo actual
    const tipo = (config.tipo || 'DIARIO').toUpperCase();
    const frecuencia = parseInt(config.frecuencia || 1);
    const fechaRutina = new Date(rutinaActual.fecha);
    
    // Simplificación - en una implementación real habría que considerar
    // periodos de tiempo y contar completados en ese rango
    const completadosEnPeriodoActual = completados.filter(fecha => {
      // Para diario, solo contar el mismo día
      if (tipo === 'DIARIO') {
        return fecha.getDate() === fechaRutina.getDate() &&
               fecha.getMonth() === fechaRutina.getMonth() &&
               fecha.getFullYear() === fechaRutina.getFullYear();
      }
      
      // Para semanal, contar dentro de la misma semana
      if (tipo === 'SEMANAL') {
        const diffDays = Math.abs(fechaRutina - fecha) / (1000 * 60 * 60 * 24);
        const mismaFecha = fechaRutina.getDate() === fecha.getDate() &&
                           fechaRutina.getMonth() === fecha.getMonth() &&
                           fechaRutina.getFullYear() === fecha.getFullYear();
        return diffDays < 7 && !mismaFecha; // Dentro de 7 días, pero no el mismo día
      }
      
      // Para mensual, contar dentro del mismo mes
      if (tipo === 'MENSUAL') {
        return fecha.getMonth() === fechaRutina.getMonth() &&
               fecha.getFullYear() === fechaRutina.getFullYear() &&
               fecha.getDate() !== fechaRutina.getDate(); // No el mismo día
      }
      
      return false;
    }).length;
    
    // Si ya completó la frecuencia requerida, no debería mostrarse más
    if (completadosEnPeriodoActual >= frecuencia) {
      return { 
        completado: true, 
        deberiasMostrar: false, 
        razon: `Ya completado ${completadosEnPeriodoActual}/${frecuencia} veces en este periodo`,
        completadosEnPeriodo: completadosEnPeriodoActual
      };
    }
    
    // Si no ha completado la frecuencia, debería mostrarse
    return { 
      completado: false, 
      deberiasMostrar: true, 
      razon: `Pendiente ${completadosEnPeriodoActual}/${frecuencia} completados en este periodo`,
      completadosEnPeriodo: completadosEnPeriodoActual
    };
  }, [obtenerCompletadosItem]);
  
  // Cargar el historial inicialmente
  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);
  
  // Valores expuestos en el contexto
  const value = {
    historialRutinas,
    historicosPorItem,
    loading,
    error,
    datosSimulados,
    cargarHistorial,
    obtenerCompletadosItem,
    obtenerConfiguracionesItem,
    obtenerUltimaConfiguracionItem,
    verificarCompletitudItem
  };
  
  return (
    <RutinasHistoricalContext.Provider value={value}>
      {children}
    </RutinasHistoricalContext.Provider>
  );
};

export default RutinasHistoricalContext; 