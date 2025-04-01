import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import rutinasService from '../services/rutinasService';

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
  
  // Función para generar datos simulados cuando el servidor falla
  const simulateHistorical = useCallback((dias = 30, fechaBase = new Date()) => {
    console.log(`[RutinasHistoricalContext] ⚠️ Generando datos simulados para los últimos ${dias} días`);
    
    // Normalizar fecha base
    const fechaReferencia = new Date(fechaBase);
    fechaReferencia.setHours(12, 0, 0, 0);
    
    const rutinasSimuladas = [];
    
    // Rutinas para los últimos días
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(fechaReferencia);
      fecha.setDate(fechaReferencia.getDate() - i);
      
      // Crear una rutina simulada con datos más realistas
      const rutina = {
        _id: `simulado_${fecha.toISOString().split('T')[0]}`,
        fecha: fecha.toISOString(),
        usuario: 'usuario_simulado',
        completitud: Math.random(),
        config: {
          bodyCare: generarConfigSimulada('DIARIO'),
          nutricion: generarConfigSimulada('DIARIO'),
          ejercicio: generarConfigSimulada('SEMANAL'),
          cleaning: generarConfigSimulada('SEMANAL')
        },
        bodyCare: generarCompletacionesSimuladas(),
        nutricion: generarCompletacionesSimuladas(),
        ejercicio: generarCompletacionesSimuladas(),
        cleaning: generarCompletacionesSimuladas()
      };
      
      rutinasSimuladas.push(rutina);
    }
    
    console.log(`[RutinasHistoricalContext] Datos simulados generados: ${rutinasSimuladas.length} registros`);
    setDatosSimulados(true);
    return rutinasSimuladas;
  }, []);

  // Función auxiliar para generar configuración simulada
  const generarConfigSimulada = (tipo = 'DIARIO') => {
    return {
      tipo,
      frecuencia: tipo === 'DIARIO' ? 1 : 3,
      periodo: tipo === 'DIARIO' ? 'CADA_DIA' : 'CADA_SEMANA',
      diasSemana: [],
      diasMes: [],
      activo: true,
      ultimaActualizacion: new Date().toISOString()
    };
  };

  // Función auxiliar para generar completaciones simuladas
  const generarCompletacionesSimuladas = () => {
    return {
      bath: Math.random() > 0.3,
      skinCareDay: Math.random() > 0.3,
      skinCareNight: Math.random() > 0.3,
      bodyCream: Math.random() > 0.3
    };
  };

  // Función para cargar el historial
  const cargarHistorial = useCallback(async (dias = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[RutinasHistoricalContext] Cargando historial de los últimos ${dias} días`);
      
      // Obtener fecha actual y normalizarla
      const ahora = new Date();
      ahora.setHours(12, 0, 0, 0);
      
      // Corregir año futuro si es necesario
      const añoActual = ahora.getFullYear();
      const añoMaximo = 2024; // Año máximo permitido
      const requiereCorreccion = añoActual > añoMaximo;
      
      if (requiereCorreccion) {
        console.log(`[RutinasHistoricalContext] ⚠️ Corrigiendo año futuro ${añoActual} a ${añoMaximo}`);
        ahora.setFullYear(añoMaximo);
      }
      
      // Calcular fecha de inicio
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - dias);
      
      // Usar el servicio para obtener el historial
      const historial = await rutinasService.obtenerHistorialCompletaciones(
        null, 
        null,
        fechaInicio,
        ahora
      );
      
      // Verificar si tenemos datos válidos
      if (Array.isArray(historial) && historial.length > 0) {
        setHistorialRutinas(historial);
        setDatosSimulados(false);
        console.log(`[RutinasHistoricalContext] Historial cargado: ${historial.length} registros`);
        
        // Procesar historial por ítem
        procesarHistorialPorItem(historial);
      } else {
        console.warn('[RutinasHistoricalContext] No se obtuvieron datos históricos reales, usando simulados');
        
        // Si no hay datos, generar datos simulados
        const simulados = simulateHistorical(dias, ahora);
        setHistorialRutinas(simulados);
        
        // Procesar historial simulado
        procesarHistorialPorItem(simulados);
      }
    } catch (error) {
      console.error('[RutinasHistoricalContext] Error al cargar historial:', error);
      setError('Error al cargar historial de rutinas');
      
      // En caso de error, generar datos simulados
      const simulados = simulateHistorical(dias);
      setHistorialRutinas(simulados);
      
      // Procesar historial simulado
      procesarHistorialPorItem(simulados);
    } finally {
      setLoading(false);
    }
  }, [simulateHistorical]);
  
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