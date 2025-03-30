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
  const simulateHistorical = useCallback((dias = 30) => {
    console.log(`[RutinasHistoricalContext] ⚠️ Generando datos simulados para los últimos ${dias} días`);
    
    // Crear fechas para el rango
    const hoy = new Date();
    const rutinasSimuladas = [];
    
    // Rutinas para los últimos días
    for (let i = 0; i < dias; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() - i);
      
      // Crear una rutina simulada
      const rutina = {
        _id: `simulado_${fecha.toISOString().split('T')[0]}`,
        fecha: fecha.toISOString().split('T')[0] + 'T00:00:00.000Z',
        usuario: 'usuario_simulado',
        bodyCare: {
          bath: Math.random() > 0.3,
          skinCareDay: Math.random() > 0.3,
          skinCareNight: Math.random() > 0.3,
          bodyCream: Math.random() > 0.3
        },
        nutricion: {
          cocinar: Math.random() > 0.3,
          agua: Math.random() > 0.3,
          protein: Math.random() > 0.3,
          meds: Math.random() > 0.3
        },
        ejercicio: {
          meditate: Math.random() > 0.5,
          stretching: Math.random() > 0.5,
          gym: Math.random() > 0.7,
          cardio: Math.random() > 0.6
        },
        cleaning: {
          bed: Math.random() > 0.4,
          platos: Math.random() > 0.4,
          piso: Math.random() > 0.7,
          ropa: Math.random() > 0.7
        },
        config: {
          bodyCare: {
            bath: {
              tipo: 'SEMANAL',
              periodo: 'CADA_SEMANA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            skinCareDay: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            skinCareNight: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            bodyCream: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            }
          },
          nutricion: {
            cocinar: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            agua: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            protein: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            meds: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            }
          },
          ejercicio: {
            meditate: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            stretching: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            gym: {
              tipo: 'SEMANAL',
              periodo: 'CADA_SEMANA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 3,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            cardio: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            }
          },
          cleaning: {
            bed: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            platos: {
              tipo: 'DIARIO',
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            piso: {
              tipo: 'SEMANAL',
              periodo: 'CADA_SEMANA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            },
            ropa: {
              tipo: 'SEMANAL',
              periodo: 'CADA_SEMANA',
              diasSemana: [],
              diasMes: [],
              frecuencia: 1,
              activo: true,
              ultimaCompletacion: Math.random() > 0.5 ? fecha.toISOString() : null
            }
          }
        },
        completitud: Math.random()
      };
      
      rutinasSimuladas.push(rutina);
    }
    
    console.log(`[RutinasHistoricalContext] Datos simulados generados: ${rutinasSimuladas.length} registros`);
    setDatosSimulados(true);
    return rutinasSimuladas;
  }, []);

  // Función para cargar el historial
  const cargarHistorial = useCallback(async (dias = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[RutinasHistoricalContext] Cargando historial de los últimos ${dias} días`);
      
      // Usar el servicio para obtener el historial
      const historial = await rutinasService.getRutinasHistoricas(dias);
      
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
        const simulados = simulateHistorical(dias);
        setHistorialRutinas(simulados);
        
        // Procesar historial simulado
        procesarHistorialPorItem(simulados);
      }
    } catch (error) {
      console.error('[RutinasHistoricalContext] Error al cargar historial:', error);
      setError('Error al cargar historial de rutinas');
      
      // En caso de error, generar datos simulados para que la app siga funcionando
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