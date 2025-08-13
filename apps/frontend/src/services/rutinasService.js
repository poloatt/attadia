import clienteAxios from '../config/axios';
import axios from 'axios';
import { getNormalizedToday, toISODateString, normalizeDate } from '../utils/dateUtils';
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
    this.LOCAL_PREFS_KEY = 'rutina_user_preferences';
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

  // --- Preferencias locales (fallback/caché) ---
  getLocalUserPreferences() {
    try {
      const raw = localStorage.getItem(this.LOCAL_PREFS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  setLocalUserPreferences(preferences = {}) {
    try {
      localStorage.setItem(this.LOCAL_PREFS_KEY, JSON.stringify(preferences));
    } catch (_) {
      // noop
    }
  }

  mergeLocalUserPreference(section, itemId, config) {
    const prefs = this.getLocalUserPreferences();
    if (!prefs[section]) prefs[section] = {};
    prefs[section][itemId] = {
      ...prefs[section][itemId],
      ...config,
      tipo: (config?.tipo || 'DIARIO').toUpperCase(),
      frecuencia: Number(config?.frecuencia || 1),
      periodo: config?.periodo || 'CADA_DIA',
      activo: config?.activo !== false
    };
    this.setLocalUserPreferences(prefs);
    return prefs;
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

  // Nota: usar getHistorialCompletaciones (único método soportado)

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
    
      } else {

      }
      
      // CORRECCIÓN: Usar UTC puro en lugar de formatDateForAPI
      // Normalizar fechas y crear rangos UTC
      const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
      const fin = fechaFin ? new Date(fechaFin) : new Date();
      
      // Crear fechas UTC para el rango completo del día
      const fechaInicioUTC = new Date(Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), 0, 0, 0, 0));
      const fechaFinUTC = new Date(Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate(), 23, 59, 59, 999));
      

      
      // Construir URL con parámetros
      const params = new URLSearchParams({
        fechaInicio: fechaInicioUTC.toISOString(),
        fechaFin: fechaFinUTC.toISOString()
      });

      const response = await clienteAxios.get(`/api/rutinas/historial-completaciones/${section}/${itemId}?${params}`);
      return response.data;
      
    } catch (error) {
      console.error('[rutinasService] Error al obtener historial:', error);
      throw error;
    }
  }

  async getRutinasHistoricas(days = 30) {
    try {

      
      // Calcular rango de fechas
      const fechaFin = new Date();
      const fechaInicio = new Date(fechaFin);
      fechaInicio.setDate(fechaFin.getDate() - days);
      
      // CORRECCIÓN: Usar UTC puro en lugar de formatDateForAPI
      // Crear fechas UTC para el rango completo del día
      const fechaInicioUTC = new Date(Date.UTC(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate(), 0, 0, 0, 0));
      const fechaFinUTC = new Date(Date.UTC(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate(), 23, 59, 59, 999));
      
      // Formatear fechas para la API
      const params = new URLSearchParams({
        fechaInicio: fechaInicioUTC.toISOString(),
        fechaFin: fechaFinUTC.toISOString(),
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

  /**
   * Obtener las preferencias globales de hábitos del usuario
   * @returns {Promise} Respuesta con las preferencias del usuario
   */
  async getUserHabitPreferences() {
    try {
      // Respetar ventana de deshabilitación si hubo errores previos prolongados
      const now = Date.now();
      let disabledUntil = 0;
      try { disabledUntil = Number(localStorage.getItem('rutina_user_prefs_disabled_until') || '0'); } catch (_) {}
      if (disabledUntil && now < disabledUntil) {
        const localPrefs = this.getLocalUserPreferences();
        return {
          preferences: localPrefs,
          updated: false,
          global: false,
          fallback: 'Endpoint deshabilitado temporalmente por errores previos'
        };
      }

      // Evitar reintentos agresivos tras un error reciente
      // reutilizar el timestamp calculado arriba para evitar redeclaración
      // y mantener coherencia en la ventana de backoff
      // const now2 = Date.now(); // no necesario
      let lastErrorAt = 0;
      try { lastErrorAt = Number(localStorage.getItem('rutina_user_prefs_last_error') || '0'); } catch (_) {}
      if (lastErrorAt && (now - lastErrorAt) < 60_000) { // 60s de backoff
        const localPrefsQuick = this.getLocalUserPreferences();
        return {
          preferences: localPrefsQuick,
          updated: false,
          global: false,
          fallback: 'Backoff activo tras error reciente. Usando preferencias locales'
        };
      }

      // Deduplicar solicitudes concurrentes
      if (!this.pendingRequests) {
        this.pendingRequests = new Map();
      }
      if (this.pendingRequests.has('user-prefs')) {
        return await this.pendingRequests.get('user-prefs');
      }

      const requestPromise = (async () => {
        const response = await clienteAxios.get('/api/rutinas/user-preferences');
        const prefs = response.data || {};
        // Cache local para inicialización rápida
        this.setLocalUserPreferences(prefs);
        return {
          preferences: prefs,
          updated: true,
          global: true
        };
      })();

      this.pendingRequests.set('user-prefs', requestPromise);
      const result = await requestPromise;
      this.pendingRequests.delete('user-prefs');
      return result;
    } catch (error) {
      // Evitar ruido en consola y reintentos constantes: degradar silenciosamente a configuración local
      const status = error?.response?.status;
      const errMsg = error?.message || 'Error al obtener preferencias';
      // No volver a intentar inmediatamente hasta que se refresque la página
      // Guardar un timestamp para evitar múltiples llamadas fallidas seguidas
      try { localStorage.setItem('rutina_user_prefs_last_error', String(Date.now())); } catch (_) {}
      if (this.pendingRequests) {
        this.pendingRequests.delete('user-prefs');
      }
      // Si el servidor devuelve 404 o 5xx, deshabilitar por 12h para evitar 500 en consola
      if (!status || status === 404 || status >= 500) {
        try {
          const twelveHours = 12 * 60 * 60 * 1000;
          localStorage.setItem('rutina_user_prefs_disabled_until', String(Date.now() + twelveHours));
        } catch (_) {}
      }
      // Intentar usar caché local
      const localPrefs = this.getLocalUserPreferences();
      if (Object.keys(localPrefs).length > 0) {
        return {
          preferences: localPrefs,
          updated: false,
          global: false,
          error: errMsg,
          fallback: 'Usando preferencias locales en caché'
        };
      }
      if (status === 404) {
        return { 
          preferences: {}, 
          updated: false, 
          global: false, 
          error: 'Endpoint de preferencias globales no disponible',
          fallback: 'Usando configuración local'
        };
      }
      if (status >= 500) {
        return {
          preferences: localPrefs || {},
          updated: false,
          global: false,
          error: errMsg,
          fallback: 'Preferencias no disponibles (servidor). Usando configuración local'
        };
      }
      
      // Otros errores (degradar a local)
      return {
        preferences: localPrefs || {},
        updated: false,
        global: false,
        error: errMsg,
        fallback: 'Usando configuración local'
      };
    }
  }

  /**
   * Actualizar las preferencias globales de hábitos del usuario
   * @param {string} section - Sección del hábito (bodyCare, nutricion, etc.)
   * @param {string} itemId - ID del ítem específico
   * @param {Object} config - Configuración del hábito
   * @returns {Promise} Respuesta con el estado de la actualización
   */
  async updateUserHabitPreference(section, itemId, config) {
    try {
      const response = await clienteAxios.put('/api/rutinas/user-preferences', {
        section,
        itemId,
        config: {
          ...config,
          esPreferenciaUsuario: true,
          ultimaActualizacion: new Date().toISOString()
        }
      });
      // Actualizar caché local también
      this.mergeLocalUserPreference(section, itemId, config);
      return { 
        updated: true, 
        global: true, 
        preferences: response.data || this.getLocalUserPreferences(),
        message: 'Preferencia global actualizada correctamente'
      };
    } catch (error) {
      console.error('[rutinasService] Error al actualizar preferencia de usuario:', error);
      
      // Si no hay endpoint, retornar estado honesto
      if (error.response?.status === 404) {
        // Guardar localmente para mantener UX
        const localPrefs = this.mergeLocalUserPreference(section, itemId, config);
        return { 
          updated: false, 
          global: false, 
          error: 'Endpoint de preferencias globales no disponible',
          fallback: 'Cambios guardados solo localmente',
          preferences: localPrefs
        };
      }
      
      // Otros errores
      const localPrefs = this.mergeLocalUserPreference(section, itemId, config);
      return { 
        updated: false, 
        global: false, 
        error: error.message || 'Error al actualizar preferencias globales',
        fallback: 'Cambios guardados localmente',
        preferences: localPrefs
      };
    }
  }
}

export default new RutinasService(); 