import clienteAxios from '../../../config/axios';
import { startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearSemana } from '../utils/cadenciaUtils';

/**
 * Función para obtener la configuración de autenticación
 * @returns {Object} Configuración para las peticiones autenticadas
 */
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  };
};

/**
 * Servicio para manejar operaciones relacionadas con rutinas
 */
class RutinasService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  getCacheKey(section, itemId, fechaInicio, fechaFin) {
    return `${section}_${itemId}_${fechaInicio}_${fechaFin}`;
  }

  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[RutinasService] ✅ Usando datos en caché para ${cacheKey}`);
      return cached.data;
    }
    return null;
  }

  setInCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  isItemCompletado(section, itemId) {
    // Verificar en el caché local si el ítem está marcado como completado
    const cacheKey = `${section}_${itemId}_completado`;
    const estadoCache = this.cache.get(cacheKey);
    
    if (estadoCache !== undefined) {
      return estadoCache;
    }
    
    return false;
  }

  async obtenerHistorialCompletaciones(section, itemId, fechaInicio, fechaFin) {
    try {
      // Validar parámetros
      if (!fechaInicio || !fechaFin) {
        console.error('[RutinasService] ❌ Fechas requeridas:', { fechaInicio, fechaFin });
        return [];
      }

      // Normalizar fechas
      const fechaInicioObj = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
      const fechaFinObj = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

      // Validar que las fechas son válidas
      if (isNaN(fechaInicioObj.getTime()) || isNaN(fechaFinObj.getTime())) {
        console.error('[RutinasService] ❌ Fechas inválidas:', { fechaInicio, fechaFin });
        return [];
      }

      // Normalizar año si es necesario
      const maxYear = 2024;
      if (fechaInicioObj.getFullYear() > maxYear) {
        console.warn(`[RutinasService] ⚠️ Corrigiendo año futuro ${fechaInicioObj.getFullYear()} a ${maxYear}`);
        fechaInicioObj.setFullYear(maxYear);
      }
      if (fechaFinObj.getFullYear() > maxYear) {
        console.warn(`[RutinasService] ⚠️ Corrigiendo año futuro ${fechaFinObj.getFullYear()} a ${maxYear}`);
        fechaFinObj.setFullYear(maxYear);
      }

      // Verificar el orden de las fechas
      if (fechaInicioObj > fechaFinObj) {
        console.warn('[RutinasService] ⚠️ Fechas en orden incorrecto, intercambiando');
        [fechaInicioObj, fechaFinObj] = [fechaFinObj, fechaInicioObj];
      }

      const cacheKey = this.getCacheKey(section, itemId, fechaInicioObj.toISOString(), fechaFinObj.toISOString());
      const cachedData = this.getFromCache(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      console.log(`[RutinasService] Obteniendo historial para ${section}.${itemId}`);
      
      const params = { 
        fechaInicio: fechaInicioObj.toISOString(),
        fechaFin: fechaFinObj.toISOString()
      };

      const response = await clienteAxios.get(`/api/rutinas/historial-completaciones/${section}/${itemId}`, { params });
      
      if (response.data) {
        const historial = Array.isArray(response.data) ? response.data : 
                         Array.isArray(response.data.completaciones) ? response.data.completaciones : [];
        
        this.setInCache(cacheKey, historial);
        return historial;
      }

      return [];
    } catch (error) {
      console.error(`[RutinasService] Error al obtener historial de completaciones:`, error);
      return [];
    }
  }

  /**
   * Obtener todas las rutinas
   * @param {Object} options - Opciones de consulta
   * @returns {Promise} Respuesta con las rutinas
   */
  async getRutinas(options = {}) {
    const timestamp = Date.now();
    const params = { _t: timestamp, ...options };
    
    try {
      const response = await clienteAxios.get('/api/rutinas', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      throw error;
    }
  }

  /**
   * Obtener una rutina específica por ID
   * @param {string} id - ID de la rutina
   * @returns {Promise} Respuesta con la rutina
   */
  async getRutinaById(id) {
    const timestamp = Date.now();
    
    try {
      const response = await clienteAxios.get(`/api/rutinas/${id}`, { 
        params: { _t: timestamp } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener rutina ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva rutina
   * @param {Object} rutina - Datos de la rutina a crear
   * @returns {Promise} Respuesta con la rutina creada
   */
  async createRutina(rutina) {
    try {
      const response = await clienteAxios.post('/api/rutinas', rutina);
      return response.data;
    } catch (error) {
      console.error('Error al crear rutina:', error);
      throw error;
    }
  }

  /**
   * Actualizar una rutina existente
   * @param {string} id - ID de la rutina
   * @param {Object} rutina - Datos actualizados de la rutina
   * @returns {Promise} Respuesta con la rutina actualizada
   */
  async updateRutina(id, rutina) {
    try {
      const response = await clienteAxios.put(`/api/rutinas/${id}`, rutina);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar rutina ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una rutina
   * @param {string} id - ID de la rutina a eliminar
   * @returns {Promise} Respuesta de la operación
   */
  async deleteRutina(id) {
    try {
      const response = await clienteAxios.delete(`/api/rutinas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar rutina ${id}:`, error);
      throw error;
    }
  }

  /**
   * Marcar un ítem como completado/no completado
   * @param {string} id - ID de la rutina
   * @param {string} section - Sección del ítem (bodyCare, mental, etc.)
   * @param {Object} data - Datos actualizados de la sección
   * @returns {Promise} Respuesta con la rutina actualizada
   */
  async markComplete(id, section, data) {
    try {
      // Validar entrada
      if (!id || typeof id !== 'string') {
        throw new Error(`ID inválido: ${id}`);
      }
      
      if (!section || typeof section !== 'string') {
        throw new Error(`Sección inválida: ${section}`);
      }
      
      if (!data || typeof data !== 'object') {
        throw new Error(`Datos inválidos: ${JSON.stringify(data)}`);
      }
      
      // Extrae itemId y estado
      const itemId = Object.keys(data)[0];
      if (!itemId || typeof itemId !== 'string') {
        throw new Error(`No se proporcionó un ID de ítem válido: ${itemId}`);
      }
      
      // Asegurar que es un booleano explícito
      const isCompleted = data[itemId] === true;
      
      // Preparar datos correctamente formateados solo con la sección necesaria
      // Esta estructura simplificada evita problemas con propiedades anidadas
      const updateData = {};
      updateData[section] = {};
      updateData[section][itemId] = isCompleted;
      
      // Log detallado para depuración
      console.log(`[rutinasService] Enviando actualización a /api/rutinas/${id}:`, JSON.stringify(updateData));
      console.log(`[rutinasService] Tipo de datos: section=${typeof section} (${section}), itemId=${typeof itemId} (${itemId}), isCompleted=${typeof isCompleted} (${isCompleted})`);
      console.log(`[rutinasService] Estructura de datos enviada:`, updateData);
      
      // Asegurarnos de que la petición es lo más simple posible
      try {
        const response = await clienteAxios.put(`/api/rutinas/${id}`, updateData);
        console.log(`[rutinasService] Actualización exitosa para ${section}.${itemId}:`, response.status);
        return response.data;
      } catch (httpError) {
        // Log detallado del error para diagnóstico
        console.error(`[rutinasService] Error HTTP al actualizar ${section}.${itemId}:`, {
          status: httpError.response?.status,
          statusText: httpError.response?.statusText,
          data: httpError.response?.data,
          message: httpError.message
        });
        
        throw httpError;
      }
    } catch (error) {
      console.error(`[rutinasService] Error al actualizar sección ${section} de rutina ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtener las preferencias de hábitos del usuario
   * @returns {Promise} Respuesta con las preferencias
   */
  async getUserHabitPreferences() {
    try {
      const response = await clienteAxios.get('/api/users/preferences/habits');
      console.log('[rutinasService] Preferencias de hábitos obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('[rutinasService] Error al obtener preferencias de hábitos:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza la preferencia de un hábito para el usuario actual
   * @param {string} section - Sección del hábito (bodyCare, nutricion, ejercicio, cleaning)
   * @param {string} itemId - Identificador único del hábito
   * @param {Object} config - Configuración del hábito
   * @returns {Promise<Object>} - Resultado de la operación con las preferencias actualizadas
   */
  async updateUserHabitPreference(section, itemId, config) {
    console.log(`[rutinasService] 📤 Enviando preferencia para ${section}.${itemId}:`, config);
    
    try {
      // Preparar los datos para enviar al backend
      const habitConfig = {
        ...config,
        // Asegurar tipo en mayúsculas
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        // Validar frecuencia como número entero positivo
        frecuencia: Math.max(1, parseInt(config.frecuencia || 1)),
        // Asegurar estado activo
        activo: config.activo !== undefined ? Boolean(config.activo) : true,
        // Marcar como preferencia de usuario
        esPreferenciaUsuario: true,
        // Timestamp de actualización
        ultimaActualizacion: new Date().toISOString()
      };
      
      // Estructurar el objeto habits correctamente según lo requiere el backend
      const requestData = {
        habits: {
          [section]: {
            [itemId]: habitConfig
          }
        }
      };
      
      // Reducir logs en producción
      if (process.env.NODE_ENV !== 'production') {
        const timestamp = new Date().toISOString();
        console.log(`[rutinasService] [${timestamp}] Enviando a API:`, JSON.stringify(requestData, null, 2));
      }
      
      // Usar la nueva ruta específica para preferencias de hábitos
      const response = await clienteAxios.put(
        '/api/users/preferences/habits',
        requestData,
        getAuthConfig()
      );
      
      if (response.status === 200 && response.data) {
        // Solo log condensado en producción
        console.log(`[rutinasService] ✅ Preferencia actualizada para ${section}.${itemId}`);
        
        // Verificar estructura de respuesta
        if (!response.data.preferences) {
          console.warn('[rutinasService] ⚠️ Respuesta sin estructura de preferencias esperada');
          // Adaptar respuesta para compatibilidad
          return {
            updated: true,
            preferences: response.data.user?.preferences || response.data
          };
        }
        
        return {
          updated: true,
          preferences: response.data.preferences
        };
      } else {
        console.warn(`[rutinasService] ⚠️ Respuesta inesperada:`, response);
        // Intentar extraer datos útiles de la respuesta
        const adaptedResponse = response.data?.user?.preferences || 
                               response.data?.preferences || 
                               response.data;
        
        return {
          updated: Boolean(adaptedResponse),
          preferences: adaptedResponse || {},
          warning: "Estructura de respuesta inesperada"
        };
      }
    } catch (error) {
      // Mejor manejo de errores con información detallada
      const errorDetail = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : null
      };
      
      console.error(`[rutinasService] ❌ Error al actualizar preferencia ${section}.${itemId}:`, errorDetail);
      
      // Mejor información de error para la UI
      return {
        updated: false,
        error: error.response?.data?.message || 
               error.response?.data?.error || 
               error.message || 
               "Error de comunicación con el servidor",
        detail: errorDetail
      };
    }
  }
  
  /**
   * Sincronizar la configuración de rutina con las preferencias del usuario
   * @param {string} rutinaId - ID de la rutina
   * @returns {Promise} Respuesta con el resultado de la sincronización
   */
  async syncRutinaWithUserPreferences(rutinaId) {
    try {
      console.log(`[RutinasService] Sincronizando rutina ${rutinaId} con preferencias de usuario`);
      const response = await clienteAxios.post(`/api/rutinas/${rutinaId}/sync-with-preferences`);
      return response.data;
    } catch (error) {
      console.error('[RutinasService] Error al sincronizar con preferencias:', error);
      throw error;
    }
  }

  /**
   * Sincronizar la configuración de rutina con la configuración global
   * @param {string} rutinaId - ID de la rutina
   * @returns {Promise} Respuesta con el resultado de la sincronización
   */
  async syncRutinaWithGlobal(rutinaId) {
    try {
      console.log(`[RutinasService] Sincronizando rutina ${rutinaId} con configuración global`);
      const response = await clienteAxios.post(`/api/rutinas/${rutinaId}/sync-with-global`);
      return response.data;
    } catch (error) {
      console.error('[RutinasService] Error al sincronizar con global:', error);
      throw error;
    }
  }

  // Actualizar la configuración de un ítem en una rutina
  async updateItemConfig(rutinaId, seccion, itemId, configData) {
    try {
      console.log(`[RutinasService] Actualizando configuración de ${seccion}.${itemId} en rutina ${rutinaId}`);
      
      // Clonar la configuración para evitar cambios inesperados
      const configToSend = JSON.parse(JSON.stringify(configData));
      
      // Añadir timestamp para evitar cacheo
      configToSend._timestamp = Date.now();
      
      // Preparar opciones avanzadas para la petición
      const requestOptions = { 
        timeout: 15000, // 15 segundos para dar tiempo a procesamiento en backend
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // Función para reintentar en caso de error de red
        validateStatus: (status) => {
          return status >= 200 && status < 300; // Solo aceptar respuestas exitosas
        }
      };
      
      // Realizar petición al backend con opciones avanzadas
      try {
        // Usar la ruta correcta con los parámetros en la URL
        const url = `/api/rutinas/${rutinaId}/config/${seccion}/${itemId}`;
        console.log(`[RutinasService] Enviando petición a ${url}`, configToSend);
        
        const response = await clienteAxios.put(url, configToSend, requestOptions);
        
        // Forzar recarga completa de la rutina con timeout para evitar cacheo
        setTimeout(async () => {
          try {
            console.log(`[RutinasService] Recargando rutina completa después de actualizar configuración`);
            // Usar un timestamp aleatorio para evitar cacheo
            const randomParam = Math.floor(Math.random() * 1000000);
            await clienteAxios.get(`/api/rutinas/${rutinaId}?_=${Date.now()}&r=${randomParam}`, {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
          } catch (reloadError) {
            console.error(`[RutinasService] Error al recargar rutina:`, reloadError);
            // No propagamos este error ya que es solo para actualizar la cache
          }
        }, 800);
        
        return response.data;
      } catch (apiError) {
        // Formatear mejor el mensaje de error
        const errorMsg = apiError.response?.data?.message || 
                         apiError.response?.data?.error || 
                         apiError.message || 
                         'Error de conexión';
        
        console.error(`[RutinasService] Error en API updateItemConfig:`, errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`[RutinasService] Error en updateItemConfig:`, error);
      throw error;
    }
  }

  /**
   * Obtener rutinas históricas para un rango de fechas, asegurando que sean fechas válidas del pasado
   * @param {number} days - Número de días hacia atrás para obtener rutinas
   * @returns {Promise<Array>} - Lista de rutinas históricas
   */
  async getRutinasHistoricas(days = 30) {
    try {
      console.log('[RutinasService] Obteniendo historial de rutinas para los últimos', days, 'días');
      
      // Obtener fecha actual
      const ahora = new Date();
      
      // Ya no corregimos el año, usamos el año actual del sistema
      const añoActual = ahora.getFullYear();
      const requiereCorreccion = false;
      
      // Crear fecha de fin (hoy)
      const fechaFin = new Date(ahora);
      
      // Calcular fecha de inicio (días hacia atrás desde fecha fin)
      const fechaInicio = new Date(fechaFin);
      fechaInicio.setDate(fechaFin.getDate() - days);
      
      // Formatear fechas para la API (YYYY-MM-DD)
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      const fechaFinStr = fechaFin.toISOString().split('T')[0];
      
      // Agregar logs detallados
      console.log('[RutinasService] Rango de fechas para historial:');
      console.log('  - Desde:', fechaInicioStr);
      console.log('  - Hasta:', fechaFinStr);
      console.log('  - Fecha actual del sistema:', ahora.toISOString());
      console.log('  - Año actual:', añoActual);
      
      // Configurar parámetros para la consulta, evitando cacheo
      const params = { 
        fechaInicio: fechaInicioStr, 
        fechaFin: fechaFinStr,
        _t: Date.now() // Timestamp para evitar caché
      };
      
      // Configurar opciones avanzadas para la petición
      const options = {
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 8000 // 8 segundos máximo
      };
      
      // Intentar obtener historial con reintentos
      let intentos = 0;
      let error = null;
      while (intentos < 2) {
        try {
          const response = await clienteAxios.get('/api/rutinas/historial', options);
          
          if (response.data) {
            console.log(`[RutinasService] Historial obtenido: ${response.data.length} registros`);
            return response.data;
          }
          
          console.warn('[RutinasService] Respuesta vacía del servidor');
          return [];
        } catch (err) {
          error = err;
          console.warn(`[RutinasService] Error en intento ${intentos + 1}/2:`, err.message);
          intentos++;
          
          // Esperar 1 segundo antes de reintentar
          if (intentos < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Cambiar timestamp para evitar cacheo
            options.params._t = Date.now();
          }
        }
      }
      
      // Si llegamos aquí, fallaron los intentos
      console.error('[RutinasService] Error al obtener historial después de reintentos:', error);
      return [];
    } catch (error) {
      console.error('[RutinasService] Error al obtener historial de rutinas:', error);
      // Retornar array vacío para evitar errores en cascada
      return [];
    }
  }

  /**
<<<<<<< HEAD
   * Obtiene la configuración de un ítem específico
   * @param {string} section - Sección del ítem
   * @param {string} itemId - ID del ítem
   * @returns {Promise<Object>} Configuración del ítem
   */
  async obtenerConfiguracionItem(section, itemId) {
    try {
      // Intentar obtener del caché primero
      const cacheKey = `config_${section}_${itemId}`;
      const cachedConfig = this.getFromCache(cacheKey);
      
      if (cachedConfig) {
        return cachedConfig;
      }

      // Si no está en caché, obtener del servidor
      const response = await clienteAxios.get(`/api/rutinas/config/${section}/${itemId}`);
      
      if (response.data) {
        this.setInCache(cacheKey, response.data);
        return response.data;
      }

      // Si no hay datos, retornar configuración por defecto
      return {
        tipo: 'DIARIO',
        periodo: 'CADA_DIA',
        frecuencia: 1,
        diasSemana: [],
        diasMes: [],
        activo: true
      };
    } catch (error) {
      console.error(`[RutinasService] Error al obtener configuración de ${section}.${itemId}:`, error);
      // Retornar configuración por defecto en caso de error
      return {
        tipo: 'DIARIO',
        periodo: 'CADA_DIA',
        frecuencia: 1,
        diasSemana: [],
        diasMes: [],
        activo: true
      };
=======
   * Obtiene el historial de completaciones para un ítem específico
   * @param {string} section - Sección del ítem (bodyCare, nutricion, etc)
   * @param {string} itemId - ID del ítem dentro de la sección
   * @param {Date} fechaInicio - Fecha de inicio para la consulta
   * @param {Date} fechaFin - Fecha de fin para la consulta
   * @returns {Promise<Object>} - Objeto con la información del historial de completaciones
   */
  async getHistorialCompletaciones(section, itemId, fechaInicio, fechaFin) {
    try {
      if (!section || !itemId) {
        console.log(`[rutinasService] Obteniendo historial completo de todas las rutinas`);
      } else {
        console.log(`[rutinasService] Obteniendo historial para ${section}.${itemId}`);
      }
      
      // Normalizar fechas
      const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
      const fin = fechaFin ? new Date(fechaFin) : new Date();
      
      // Verificar que no sean fechas en el futuro
      const ahora = new Date();
      if (inicio > ahora) {
        console.warn(`[rutinasService] Fecha de inicio en el futuro: ${inicio.toISOString()}. Ajustando al año actual.`);
        inicio.setFullYear(ahora.getFullYear());
      }
      if (fin > ahora) {
        console.warn(`[rutinasService] Fecha de fin en el futuro: ${fin.toISOString()}. Ajustando al año actual.`);
        fin.setFullYear(ahora.getFullYear());
      }
      
      // Formatear fechas para log
      const inicioStr = inicio.toLocaleDateString('es-ES');
      const finStr = fin.toLocaleDateString('es-ES');
      
      console.log(`[rutinasService] Rango de fechas para consulta: {inicio: '${inicioStr}', fin: '${finStr}'}`);
      
      // Convertir a formato ISO para la API
      const fechaInicioISO = inicio.toISOString();
      const fechaFinISO = fin.toISOString();
      
      // Construir URL con parámetros
      let url;
      if (!section || !itemId) {
        // Si no se especifican section e itemId, obtener todas las rutinas en ese rango
        url = `/api/rutinas?fechaInicio=${fechaInicioISO}&fechaFin=${fechaFinISO}`;
      } else {
        url = `/api/rutinas/historial-completaciones/${section}/${itemId}?fechaInicio=${fechaInicioISO}&fechaFin=${fechaFinISO}`;
      }
      
      console.log(`[rutinasService] URL de consulta: ${url}`);
      
      const response = await clienteAxios.get(url);
      
      // Procesar respuesta
      if (response.data && response.data.completaciones) {
        const completaciones = response.data.completaciones;
        console.log(`[rutinasService] Recibidas ${completaciones.length} completaciones`);
        
        // Log de fechas
        if (completaciones.length > 0) {
          console.log(`[rutinasService] Fechas encontradas (ordenadas):`);
          completaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .forEach((comp, idx) => {
              console.log(`[rutinasService]   ${idx + 1}. ${comp.fecha.split('T')[0]} [${comp.rutinaId}]`);
            });
          
          // Agrupar por semana usando el nuevo formateador
          console.log(`[rutinasService] Completaciones por semana:`);
          
          // Agrupar completaciones por semana
          const completacionesPorSemana = completaciones.reduce((acc, comp) => {
            const fechaComp = new Date(comp.fecha);
            const keyDeSemana = formatearSemana(fechaComp);
            
            if (!acc[keyDeSemana]) {
              acc[keyDeSemana] = {
                fechas: [],
                ids: []
              };
            }
            
            acc[keyDeSemana].fechas.push(comp.fecha.split('T')[0]);
            acc[keyDeSemana].ids.push(comp.rutinaId);
            
            return acc;
          }, {});
          
          // Registrar completaciones agrupadas
          Object.entries(completacionesPorSemana).forEach(([semana, datos]) => {
            console.log(`[rutinasService]   - ${semana}: ${datos.fechas.length} completaciones (${datos.fechas.join(', ')})`);
          });
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`[rutinasService] Error obteniendo historial para ${section}.${itemId}:`, error);
      // Devolver objeto vacío para evitar errores en cascada
      return { completaciones: [] };
>>>>>>> develop
    }
  }
}

// Exportar una instancia única del servicio
const rutinasService = new RutinasService();

// Asegurarnos de que todos los métodos necesarios estén disponibles
Object.assign(rutinasService, {
  obtenerConfiguracionItem: rutinasService.obtenerConfiguracionItem.bind(rutinasService),
  obtenerHistorialCompletaciones: rutinasService.obtenerHistorialCompletaciones.bind(rutinasService),
  // ... otros métodos que necesiten estar disponibles
});

export default rutinasService; 