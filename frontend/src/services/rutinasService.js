import clienteAxios from '../config/axios';
import axios from 'axios';
import { getNormalizedToday, toISODateString, normalizeDate } from '../components/rutinas/utils/dateUtils';
import { formatDateForAPI, getWeekRange, getMonthRange, parseAPIDate } from '../utils/dateUtils';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Servicio para manejar operaciones relacionadas con rutinas
 */
class RutinasService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    this.pendingRequests = new Map();
  }

  async retryOperation(operation, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Intento ${i + 1} fallido, reintentando en ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY * (i + 1));
      }
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
   * Obtiene el progreso actual de un ítem para el período actual
   * @param {Object} rutina - Rutina actual
   * @param {string} section - Sección del ítem
   * @param {string} itemId - ID del ítem
   * @returns {Object} Objeto con el progreso actual
   */
  obtenerProgresoItem(rutina, section, itemId) {
    try {
      const config = rutina?.config?.[section]?.[itemId];
      if (!config) return null;

      const ahora = new Date();
      const tipo = config.tipo || 'DIARIO';
      const frecuencia = config.frecuencia || 1;
      const progresoActual = config.progresoActual || 0;
      const ultimoPeriodo = config.ultimoPeriodo || {};

      // Verificar si estamos en un nuevo período
      const inicioPeriodo = this.calcularInicioPeriodo(tipo, ahora);
      const finPeriodo = this.calcularFinPeriodo(tipo, ahora);
      const enNuevoPeriodo = !ultimoPeriodo.inicio || new Date(ultimoPeriodo.inicio) < inicioPeriodo;

      // Obtener completaciones del período actual
      const completacionesPeriodo = config.completacionesPeriodo || [];
      const completacionesValidas = completacionesPeriodo.filter(c => 
        new Date(c.fecha) >= inicioPeriodo && new Date(c.fecha) <= finPeriodo
      );

      return {
        tipo,
        frecuencia,
        progresoActual: enNuevoPeriodo ? 0 : progresoActual,
        completacionesPeriodo: completacionesValidas,
        periodo: {
          inicio: inicioPeriodo,
          fin: finPeriodo
        },
        cumplido: progresoActual >= frecuencia,
        porcentaje: Math.min(100, (progresoActual / frecuencia) * 100)
      };
    } catch (error) {
      console.error('[RutinasService] Error al obtener progreso:', error);
      return null;
    }
  }

  /**
   * Calcula el inicio del período actual según el tipo
   * @param {string} tipo - Tipo de período (DIARIO, SEMANAL, MENSUAL)
   * @param {Date} fecha - Fecha de referencia
   * @returns {Date} Fecha de inicio del período
   */
  calcularInicioPeriodo(tipo, fecha) {
    const inicio = new Date(fecha);
    
    switch (tipo) {
      case 'SEMANAL':
        inicio.setDate(inicio.getDate() - inicio.getDay());
        break;
      case 'MENSUAL':
        inicio.setDate(1);
        break;
      default: // DIARIO
        inicio.setHours(0, 0, 0, 0);
    }
    
    return inicio;
  }

  /**
   * Calcula el fin del período actual según el tipo
   * @param {string} tipo - Tipo de período (DIARIO, SEMANAL, MENSUAL)
   * @param {Date} fecha - Fecha de referencia
   * @returns {Date} Fecha de fin del período
   */
  calcularFinPeriodo(tipo, fecha) {
    const fin = new Date(fecha);
    
    switch (tipo) {
      case 'SEMANAL':
        fin.setDate(fin.getDate() - fin.getDay() + 6);
        fin.setHours(23, 59, 59, 999);
        break;
      case 'MENSUAL':
        fin.setMonth(fin.getMonth() + 1);
        fin.setDate(0);
        fin.setHours(23, 59, 59, 999);
        break;
      default: // DIARIO
        fin.setHours(23, 59, 59, 999);
    }
    
    return fin;
  }

  /**
   * Verifica si un ítem está completado actualmente
   * @param {string} section - Sección del ítem
   * @param {string} itemId - ID del ítem
   * @returns {boolean} - true si el ítem está completado
   */
  isItemCompletado(section, itemId) {
    // Verificar en el caché local si el ítem está marcado como completado
    const cacheKey = `${section}_${itemId}_completado`;
    const estadoCache = this.cache.get(cacheKey);
    
    if (estadoCache !== undefined) {
      return estadoCache;
    }
    
    return false;
  }

  /**
   * Versión mejorada de markComplete que maneja el progreso
   */
  async markComplete(id, section, data) {
    try {
      if (!id || !section || !data) {
        throw new Error('Parámetros inválidos');
      }

      const itemId = Object.keys(data)[0];
      if (!itemId) throw new Error('No se proporcionó ID de ítem');
      
      const isCompleted = data[itemId] === true;
      
      // Actualizar caché local inmediatamente
      const cacheKey = `${section}_${itemId}_completado`;
      this.cache.set(cacheKey, isCompleted);
      
      // Estructura para actualizar
      const payload = {
        [section]: {
          [itemId]: isCompleted
        },
        historial: {
          [section]: {
            [new Date().toISOString()]: {
              [itemId]: isCompleted
            }
          }
        },
        _metadata: {
          timestamp: new Date().toISOString(),
          action: isCompleted ? 'COMPLETE' : 'UNCOMPLETE'
        }
      };

      console.log(`[RutinasService] 🔄 Actualizando ${section}.${itemId} a ${isCompleted}`);
      
      const response = await clienteAxios.put(`/api/rutinas/${id}`, payload);
      
      if (response.data) {
        // Invalidar caché de historial
        this.invalidateCache(section, itemId);
        
        console.log(`[RutinasService] ✅ Actualización exitosa de ${section}.${itemId}`);
        return response.data;
      }

      throw new Error('No se recibió respuesta del servidor');
    } catch (error) {
      // En caso de error, revertir el caché local
      const cacheKey = `${section}_${itemId}_completado`;
      this.cache.delete(cacheKey);
      
      console.error(`[RutinasService] ❌ Error al marcar completación:`, error);
      throw error;
    }
  }

  /**
   * Invalida la caché para una sección y ítem específicos
   */
  invalidateCache(section, itemId) {
    const keysToRemove = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${section}_${itemId}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtiene el historial de completaciones para un ítem específico
   * @param {string} section - Sección del ítem (bodyCare, nutricion, etc)
   * @param {string} itemId - Identificador del ítem
   * @param {Date|string} fechaInicio - Fecha de inicio para la consulta
   * @param {Date|string} fechaFin - Fecha de fin para la consulta
   * @returns {Promise} Promesa con el resultado de la consulta
   */
  async obtenerHistorialCompletaciones(section, itemId, fechaInicio, fechaFin) {
    try {
      // Validación básica de parámetros
      if (!section || !itemId) {
        console.error('[RutinasService] ❌ Sección o itemId no proporcionados');
        return [];
      }

      // Normalizar fechas con manejo de errores mejorado
      let inicio, fin;
      try {
        // Obtener fecha actual y año máximo permitido
        const ahora = new Date();
        const añoMaximo = 2024; // Año máximo permitido

        // Procesar fecha de inicio
        if (!fechaInicio) {
          inicio = new Date(ahora);
          inicio.setDate(inicio.getDate() - 30); // Por defecto, últimos 30 días
        } else {
          inicio = fechaInicio instanceof Date ? new Date(fechaInicio) : new Date(fechaInicio);
        }

        // Procesar fecha de fin
        if (!fechaFin) {
          fin = new Date(ahora);
        } else {
          fin = fechaFin instanceof Date ? new Date(fechaFin) : new Date(fechaFin);
        }

        // Corregir años futuros
        if (inicio.getFullYear() > añoMaximo) {
          console.log(`[RutinasService] ⚠️ Corrigiendo año futuro ${inicio.getFullYear()} a ${añoMaximo} en fecha inicio`);
          inicio.setFullYear(añoMaximo);
        }
        if (fin.getFullYear() > añoMaximo) {
          console.log(`[RutinasService] ⚠️ Corrigiendo año futuro ${fin.getFullYear()} a ${añoMaximo} en fecha fin`);
          fin.setFullYear(añoMaximo);
        }

        // Verificar que las fechas sean válidas
        if (isNaN(inicio.getTime())) {
          console.error('[RutinasService] ❌ Fecha de inicio inválida:', fechaInicio);
          throw new Error(`Fecha de inicio inválida: ${fechaInicio}`);
        }

        if (isNaN(fin.getTime())) {
          console.error('[RutinasService] ❌ Fecha de fin inválida:', fechaFin);
          throw new Error(`Fecha de fin inválida: ${fechaFin}`);
        }

        // Normalizar horas
        inicio.setUTCHours(0, 0, 0, 0);
        fin.setUTCHours(23, 59, 59, 999);

        // Verificar que inicio no sea posterior a fin
        if (inicio > fin) {
          console.error('[RutinasService] ❌ Fecha de inicio posterior a fecha fin');
          throw new Error('La fecha de inicio no puede ser posterior a la fecha fin');
        }

        // Log detallado del rango de fechas
        console.log('[RutinasService] 📅 Rango de fechas procesado:', {
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          section,
          itemId
        });

      } catch (error) {
        console.error('[RutinasService] ❌ Error al procesar fechas:', error);
        return [];
      }

      // Generar clave de caché
      const cacheKey = `${section}_${itemId}_${inicio.toISOString()}_${fin.toISOString()}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`[RutinasService] ✅ Usando datos en caché para ${cacheKey}`);
        return cachedData;
      }

      // Configurar parámetros para la consulta
      const params = { 
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString()
      };

      // Realizar la petición al backend
      const response = await clienteAxios.get(`/api/rutinas/historial-completaciones/${section}/${itemId}`, { params });
      
      if (response.data) {
        this.setInCache(cacheKey, response.data);
        console.log(`[RutinasService] ✅ Datos obtenidos y guardados en caché para ${section}.${itemId}`);
        return response.data;
      }

      return [];
    } catch (error) {
      console.error(`[RutinasService] ❌ Error al obtener historial de completaciones:`, error);
      return [];
    }
  }

  getCacheKey(section, itemId, fechaInicio, fechaFin) {
    // Implementa la lógica para generar una clave única para la caché basada en los parámetros
    return `${section}_${itemId}_${fechaInicio}_${fechaFin}`;
  }

  getFromCache(key) {
    // Implementa la lógica para obtener datos de la caché
    return this.cache.get(key);
  }

  setInCache(key, data) {
    // Implementa la lógica para almacenar datos en la caché
    this.cache.set(key, data);
  }

  async obtenerHistorial(dias = 7) {
    try {
      const ahora = getNormalizedToday();
      const inicio = new Date(ahora);
      inicio.setDate(inicio.getDate() - dias);
      inicio.setHours(0, 0, 0, 0);

      const response = await clienteAxios.get('/api/rutinas/historial', {
        params: {
          inicio: toISODateString(inicio),
          fin: toISODateString(ahora)
        }
      });

      return response.data;
    } catch (error) {
      console.error('[rutinasService] Error al obtener historial:', error);
      throw error;
    }
  }

  async registrarCompletacion(rutinaId, seccion, itemId, completado = true) {
    try {
      const response = await clienteAxios.post(`/api/rutinas/${rutinaId}/completar`, {
        seccion,
        itemId,
        completado,
        timestamp: toISODateString(getNormalizedToday())
      });

      return response.data;
    } catch (error) {
      console.error('[rutinasService] Error al registrar completación:', error);
      throw error;
    }
  }

  async getHistorialCompletaciones(section, itemId, fechaInicio, fechaFin) {
    try {
      if (!section || !itemId) {
        console.log(`[rutinasService] Obteniendo historial completo de todas las rutinas`);
      } else {
        console.log(`[rutinasService] Obteniendo historial para ${section}.${itemId}`);
      }
      
      // Formatear fechas para la API
      const fechaInicioStr = formatDateForAPI(fechaInicio);
      const fechaFinStr = formatDateForAPI(fechaFin);
      
      console.log(`[rutinasService] Rango de fechas para consulta:`, {
        inicio: fechaInicioStr,
        fin: fechaFinStr
      });
      
      // Construir URL con parámetros
      const params = new URLSearchParams({
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr
      });

      const response = await clienteAxios.get(`/api/rutinas/historial?${params}`);
      return response.data;
      
    } catch (error) {
      console.error('[rutinasService] Error al obtener historial:', error);
      throw error;
    }
  }

  async getRutinasHistoricas(days = 30) {
    try {
      console.log('[rutinasService] Obteniendo historial de rutinas para los últimos', days, 'días');
      
      // Calcular rango de fechas
      const fechaFin = new Date();
      const fechaInicio = new Date(fechaFin);
      fechaInicio.setDate(fechaFin.getDate() - days);
      
      // Formatear fechas para la API
      const params = new URLSearchParams({
        fechaInicio: formatDateForAPI(fechaInicio),
        fechaFin: formatDateForAPI(fechaFin),
        _t: Date.now() // Evitar caché
      });
      
      const response = await clienteAxios.get(`/api/rutinas?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Parsear fechas en la respuesta
      return response.data.map(rutina => ({
        ...rutina,
        fecha: parseAPIDate(rutina.fecha)
      }));
      
    } catch (error) {
      console.error('[rutinasService] Error al obtener rutinas históricas:', error);
      throw error;
    }
  }
}

export default new RutinasService(); 