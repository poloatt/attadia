import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import rutinasService from '../services/rutinasService';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { getNormalizedToday, toISODateString } from '../utils/dateUtils';

// Crear el contexto
const RutinasHistoryContext = createContext();

// Exportar hook personalizado para usar el contexto
export const useRutinasHistorical = () => {
  const context = useContext(RutinasHistoryContext);
  if (!context) {
    throw new Error('useRutinasHistorical debe ser usado dentro de un RutinasHistoryProvider');
  }
  return context;
};

// Provider del contexto
export const RutinasHistoryProvider = ({ children }) => {
  const [historialRutinas, setHistorialRutinas] = useState([]);
  const [historicosPorItem, setHistoricosPorItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datosSimulados, setDatosSimulados] = useState(false);
  const [noHistoryAvailable, setNoHistoryAvailable] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  
  // Función para cargar el historial
  const cargarHistorial = useCallback(async (dias = 30) => {
    try {
      setLoading(true);
      setError(null);
      setNoHistoryAvailable(false);
      
      const ahora = getNormalizedToday();
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - dias);
      const historial = await rutinasService.getHistorialCompletaciones(
        null, 
        null,
        fechaInicio,
        ahora
      );
      if (historial && historial.completaciones && Array.isArray(historial.completaciones) && historial.completaciones.length > 0) {
        setHistorialRutinas(historial.completaciones);
        setDatosSimulados(false);
        procesarHistorialPorItem(historial.completaciones);
      } else {
        setHistorialRutinas([]);
        setHistoricosPorItem({});
        setNoHistoryAvailable(true);
      }
    } catch (error) {
      // No mostrar error si es por token expirado (se maneja automáticamente)
      if (error.response?.status === 401) {
        console.log('🔒 Token expirado en historial - se manejará automáticamente');
        setNoHistoryAvailable(true);
      } else {
        setError('Error al cargar historial de rutinas');
        enqueueSnackbar('Error al cargar historial de rutinas', { variant: 'error' });
      }
      setHistorialRutinas([]);
      setHistoricosPorItem({});
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);
  
  // Procesar el historial para generar datos por ítem
  const procesarHistorialPorItem = useCallback((rutinas) => {
    const historicos = {};
    rutinas.forEach(rutina => {
      if (!rutina?.fecha) return;
      const fechaRutina = new Date(rutina.fecha);
      fechaRutina.setHours(12, 0, 0, 0);
      ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
        if (!rutina[section]) return;
        Object.entries(rutina[section]).forEach(([itemId, completado]) => {
          if (!historicos[section]) historicos[section] = {};
          if (!historicos[section][itemId]) historicos[section][itemId] = {
            completados: [],
            configuraciones: []
          };
          if (completado === true) {
            historicos[section][itemId].completados.push({
              fecha: fechaRutina,
              rutinaId: rutina._id
            });
          }
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
    Object.keys(historicos).forEach(section => {
      Object.keys(historicos[section]).forEach(itemId => {
        historicos[section][itemId].completados.sort((a, b) => b.fecha - a.fecha);
        historicos[section][itemId].configuraciones.sort((a, b) => b.fecha - a.fecha);
      });
    });
    setHistoricosPorItem(historicos);
  }, []);
  
  const obtenerCompletadosItem = useCallback((section, itemId) => {
    return historicosPorItem?.[section]?.[itemId]?.completados || [];
  }, [historicosPorItem]);
  
  const obtenerConfiguracionesItem = useCallback((section, itemId) => {
    return historicosPorItem?.[section]?.[itemId]?.configuraciones || [];
  }, [historicosPorItem]);
  
  const obtenerUltimaConfiguracionItem = useCallback((section, itemId) => {
    const configuraciones = historicosPorItem?.[section]?.[itemId]?.configuraciones || [];
    return configuraciones.length > 0 ? configuraciones[0].config : null;
  }, [historicosPorItem]);
  
  const verificarCompletitudItem = useCallback((section, itemId, rutinaActual) => {
    if (!rutinaActual || !rutinaActual.config?.[section]?.[itemId]) {
      return { 
        completado: false, 
        deberiasMostrar: true, 
        razon: 'Sin configuración' 
      };
    }
    const config = rutinaActual.config[section][itemId];
    if (config.activo === false) {
      return { 
        completado: false, 
        deberiasMostrar: false, 
        razon: 'Ítem inactivo' 
      };
    }
    const completados = obtenerCompletadosItem(section, itemId).map(c => c.fecha);
    const tipo = (config.tipo || 'DIARIO').toUpperCase();
    const frecuencia = parseInt(config.frecuencia || 1);
    const fechaRutina = new Date(rutinaActual.fecha);
    const completadosEnPeriodoActual = completados.filter(fecha => {
      if (tipo === 'DIARIO') {
        return fecha.getDate() === fechaRutina.getDate() &&
               fecha.getMonth() === fechaRutina.getMonth() &&
               fecha.getFullYear() === fechaRutina.getFullYear();
      }
      if (tipo === 'SEMANAL') {
        const diffDays = Math.abs(fechaRutina - fecha) / (1000 * 60 * 60 * 24);
        const mismaFecha = fechaRutina.getDate() === fecha.getDate() &&
                           fechaRutina.getMonth() === fecha.getMonth() &&
                           fechaRutina.getFullYear() === fecha.getFullYear();
        return diffDays < 7 && !mismaFecha;
      }
      if (tipo === 'MENSUAL') {
        return fecha.getMonth() === fechaRutina.getMonth() &&
               fecha.getFullYear() === fechaRutina.getFullYear() &&
               fecha.getDate() !== fechaRutina.getDate();
      }
      return false;
    }).length;
    if (completadosEnPeriodoActual >= frecuencia) {
      return { 
        completado: true, 
        deberiasMostrar: false, 
        razon: `Ya completado ${completadosEnPeriodoActual}/${frecuencia} veces en este periodo`,
        completadosEnPeriodo: completadosEnPeriodoActual
      };
    }
    return { 
      completado: false, 
      deberiasMostrar: true, 
      razon: `Pendiente ${completadosEnPeriodoActual}/${frecuencia} completados en este periodo`,
      completadosEnPeriodo: completadosEnPeriodoActual
    };
  }, [obtenerCompletadosItem]);
  
  // Función para saber si hay historial para una sección, opcionalmente en un rango de fechas
  const hasSectionHistory = useCallback((section, fechaInicio = null, fechaFin = null) => {
    if (!historicosPorItem[section]) return false;
    return Object.values(historicosPorItem[section]).some(item => {
      if (!Array.isArray(item.completados) || item.completados.length === 0) return false;
      if (!fechaInicio && !fechaFin) return true;
      // Si se pasan fechas, filtrar por rango
      return item.completados.some(c => {
        const f = c.fecha instanceof Date ? c.fecha : new Date(c.fecha);
        if (fechaInicio && f < fechaInicio) return false;
        if (fechaFin && f > fechaFin) return false;
        return true;
      });
    });
  }, [historicosPorItem]);
  
  useEffect(() => {
    // Solo cargar si hay token válido
    const token = localStorage.getItem('token');
    if (token) {
      cargarHistorial();
    }
  }, [cargarHistorial]);
  
  const value = {
    historialRutinas,
    historicosPorItem,
    loading,
    error,
    datosSimulados,
    noHistoryAvailable,
    lastUpdate,
    hasSectionHistory,
    cargarHistorial,
    obtenerCompletadosItem,
    obtenerConfiguracionesItem,
    obtenerUltimaConfiguracionItem,
    verificarCompletitudItem
  };
  
  return (
    <RutinasHistoryContext.Provider
      value={{
        historialRutinas,
        historicosPorItem,
        loading,
        error,
        datosSimulados,
        noHistoryAvailable,
        lastUpdate,
        hasSectionHistory,
        cargarHistorial
      }}
    >
      {children}
    </RutinasHistoryContext.Provider>
  );
};

export default RutinasHistoryContext; 
