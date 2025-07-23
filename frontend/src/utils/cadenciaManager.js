/**
 * CadenciaManager - Sistema unificado para gestión de cadencia y periodicidad
 */

import { 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  isSameWeek, isSameMonth, isSameDay, isToday,
  format
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getUserTimezone } from './dateUtils';

/**
 * Estados posibles de un elemento de rutina
 */
export const ITEM_STATES = {
  PENDING: 'pending',
  COMPLETED_TODAY: 'completed_today',
  QUOTA_FULFILLED: 'quota_fulfilled',
  INACTIVE: 'inactive'
};

/**
 * Tipos de cadencia soportados
 */
export const CADENCE_TYPES = {
  DAILY: 'DIARIO',
  WEEKLY: 'SEMANAL', 
  MONTHLY: 'MENSUAL',
  CUSTOM: 'PERSONALIZADO'
};

class CadenciaManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.CACHE_TTL = 5000; // 5 segundos
    this.setupCacheInvalidation();
  }

  setupCacheInvalidation() {
    if (typeof window !== 'undefined') {
      window.addEventListener('rutina-updated', () => {
        this.clearCache();
      });
      
      window.addEventListener('item-toggled', (event) => {
        const { section, itemId } = event.detail;
        this.invalidateCacheForItem(section, itemId);
      });
    }
  }

  /**
   * Función principal: determina si un elemento debe mostrarse
   */
  async shouldShowItem(section, itemId, rutina, additionalData = {}) {
    const cacheKey = this.generateCacheKey(section, itemId, rutina);
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.calculateItemState(section, itemId, rutina, additionalData);
    this.saveToCache(cacheKey, result);
    
    return result;
  }

  /**
   * Calcula el estado completo de un elemento
   */
  async calculateItemState(section, itemId, rutina, additionalData) {
    try {
      // 1. Validaciones básicas
      const validation = this.validateInput(section, itemId, rutina);
      if (!validation.isValid) {
        return {
          shouldShow: false,
          state: ITEM_STATES.INACTIVE,
          reason: validation.reason,
          progress: { completed: 0, required: 0, percentage: 0 }
        };
      }

      // 2. Obtener configuración
      const config = rutina.config?.[section]?.[itemId];
      if (!config || config.activo === false) {
        return {
          shouldShow: false,
          state: ITEM_STATES.INACTIVE,
          reason: 'Elemento inactivo',
          progress: { completed: 0, required: 0, percentage: 0 }
        };
      }

      // 3. Si está completado hoy, SIEMPRE mostrar
      const isCompletedToday = this.isCompletedToday(section, itemId, rutina);
      if (isCompletedToday) {
        return {
          shouldShow: true,
          state: ITEM_STATES.COMPLETED_TODAY,
          reason: 'Completado hoy',
          progress: await this.calculateProgress(section, itemId, rutina, config, additionalData)
        };
      }

      // 4. Calcular progreso y aplicar lógica de cadencia
      const progress = await this.calculateProgress(section, itemId, rutina, config, additionalData);
      const cadenceResult = this.applyCadenceLogic(config, progress, rutina);
      
      return {
        shouldShow: cadenceResult.shouldShow,
        state: cadenceResult.state,
        reason: cadenceResult.reason,
        progress,
        nextAction: cadenceResult.nextAction
      };

    } catch (error) {
      console.error(`[CadenciaManager] Error calculando estado para ${section}.${itemId}:`, error);
      return {
        shouldShow: true,
        state: ITEM_STATES.PENDING,
        reason: 'Error - mostrando por defecto',
        progress: { completed: 0, required: 1, percentage: 0 }
      };
    }
  }

  validateInput(section, itemId, rutina) {
    if (!section || !itemId) {
      return { isValid: false, reason: 'Parámetros faltantes' };
    }
    if (!rutina) {
      return { isValid: false, reason: 'Rutina faltante' };
    }
    return { isValid: true };
  }

  isCompletedToday(section, itemId, rutina) {
    const currentState = rutina[section]?.[itemId];
    const isRutinaToday = this.isRutinaFromToday(rutina);
    return Boolean(currentState) && isRutinaToday;
  }

  isRutinaFromToday(rutina) {
    if (!rutina.fecha) return false;
    
    try {
      const rutinaDate = new Date(rutina.fecha);
      const today = new Date();
      const timezone = getUserTimezone();
      
      const rutinaFormatted = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      }).format(rutinaDate);
      
      const todayFormatted = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(today);
      
      return rutinaFormatted === todayFormatted;
    } catch (error) {
      console.error('[CadenciaManager] Error verificando fecha:', error);
      return false;
    }
  }

  async calculateProgress(section, itemId, rutina, config, additionalData) {
    const cadenceType = config.tipo?.toUpperCase() || CADENCE_TYPES.DAILY;
    const required = parseInt(config.frecuencia) || 1;
    
    const completions = await this.getCompletionsInCurrentPeriod(
      section, itemId, rutina, cadenceType, additionalData
    );
    
    const completed = completions.length;
    const percentage = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0;
    
    return {
      completed,
      required,
      percentage,
      completions,
      period: this.getCurrentPeriodInfo(cadenceType),
      isQuotaFulfilled: completed >= required
    };
  }

  async getCompletionsInCurrentPeriod(section, itemId, rutina, cadenceType, additionalData) {
    const completions = [];
    
    try {
      // 1. Incluir completación de hoy si existe
      if (this.isCompletedToday(section, itemId, rutina)) {
        completions.push({
          fecha: new Date(rutina.fecha),
          source: 'current_rutina'
        });
      }
      
      // 2. Procesar historial si está disponible
      if (additionalData.historial) {
        const periodInfo = this.getCurrentPeriodInfo(cadenceType);
        const historialCompletions = this.extractHistorialCompletions(
          additionalData.historial, section, itemId, periodInfo
        );
        completions.push(...historialCompletions);
      }
      
      return this.removeDuplicatesByDate(completions);
      
    } catch (error) {
      console.error('[CadenciaManager] Error obteniendo completaciones:', error);
      return completions;
    }
  }

  getCurrentPeriodInfo(cadenceType) {
    const now = new Date();
    const timezone = getUserTimezone();
    const nowInUserTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    switch (cadenceType) {
      case CADENCE_TYPES.DAILY:
        return {
          type: 'day',
          start: new Date(nowInUserTz.getFullYear(), nowInUserTz.getMonth(), nowInUserTz.getDate()),
          end: new Date(nowInUserTz.getFullYear(), nowInUserTz.getMonth(), nowInUserTz.getDate(), 23, 59, 59),
          label: 'Hoy'
        };
        
      case CADENCE_TYPES.WEEKLY:
        const weekStart = startOfWeek(nowInUserTz, { locale: es });
        const weekEnd = endOfWeek(nowInUserTz, { locale: es });
        return {
          type: 'week',
          start: weekStart,
          end: weekEnd,
          label: `Semana del ${format(weekStart, 'd MMM', { locale: es })}`
        };
        
      case CADENCE_TYPES.MONTHLY:
        const monthStart = startOfMonth(nowInUserTz);
        const monthEnd = endOfMonth(nowInUserTz);
        return {
          type: 'month',
          start: monthStart,
          end: monthEnd,
          label: format(nowInUserTz, 'MMMM yyyy', { locale: es })
        };
        
      default:
        return this.getCurrentPeriodInfo(CADENCE_TYPES.DAILY);
    }
  }

  applyCadenceLogic(config, progress, rutina) {
    const cadenceType = config.tipo?.toUpperCase() || CADENCE_TYPES.DAILY;
    
    switch (cadenceType) {
      case CADENCE_TYPES.DAILY:
        return {
          shouldShow: true,
          state: ITEM_STATES.PENDING,
          reason: 'Elemento diario pendiente',
          nextAction: 'Completar hoy'
        };
        
      case CADENCE_TYPES.WEEKLY:
        if (progress.isQuotaFulfilled) {
          return {
            shouldShow: false,
            state: ITEM_STATES.QUOTA_FULFILLED,
            reason: `Cuota semanal cumplida (${progress.completed}/${progress.required})`,
            nextAction: 'Esperar próxima semana'
          };
        }
        return {
          shouldShow: true,
          state: ITEM_STATES.PENDING,
          reason: `Progreso semanal: ${progress.completed}/${progress.required}`,
          nextAction: `Completar ${progress.required - progress.completed} vez(es) más`
        };
        
      case CADENCE_TYPES.MONTHLY:
        if (progress.isQuotaFulfilled) {
          return {
            shouldShow: false,
            state: ITEM_STATES.QUOTA_FULFILLED,
            reason: `Cuota mensual cumplida (${progress.completed}/${progress.required})`,
            nextAction: 'Esperar próximo mes'
          };
        }
        return {
          shouldShow: true,
          state: ITEM_STATES.PENDING,
          reason: `Progreso mensual: ${progress.completed}/${progress.required}`,
          nextAction: `Completar ${progress.required - progress.completed} vez(es) más`
        };
        
      default:
        return {
          shouldShow: true,
          state: ITEM_STATES.PENDING,
          reason: 'Tipo desconocido',
          nextAction: 'Completar cuando sea necesario'
        };
    }
  }

  extractHistorialCompletions(historial, section, itemId, periodInfo) {
    const completions = [];
    
    try {
      if (historial[section] && historial[section][itemId]) {
        const itemHistorial = historial[section][itemId];
        
        Object.entries(itemHistorial).forEach(([fecha, completed]) => {
          if (completed === true) {
            const completionDate = new Date(fecha);
            
            if (completionDate >= periodInfo.start && completionDate <= periodInfo.end) {
              completions.push({
                fecha: completionDate,
                source: 'historial_local'
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('[CadenciaManager] Error extrayendo historial:', error);
    }
    
    return completions;
  }

  removeDuplicatesByDate(completions) {
    const uniqueByDate = new Map();
    
    completions.forEach(completion => {
      const dateKey = format(completion.fecha, 'yyyy-MM-dd');
      if (!uniqueByDate.has(dateKey)) {
        uniqueByDate.set(dateKey, completion);
      }
    });
    
    return Array.from(uniqueByDate.values());
  }

  // Métodos de caché
  generateCacheKey(section, itemId, rutina) {
    const rutinaDate = rutina.fecha ? format(new Date(rutina.fecha), 'yyyy-MM-dd') : 'no-date';
    const itemState = rutina[section]?.[itemId] ? 'completed' : 'pending';
    return `${section}_${itemId}_${rutinaDate}_${itemState}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);
    
    if (!cached || !timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }
    
    return cached;
  }

  saveToCache(key, value) {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  invalidateCacheForItem(section, itemId) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${section}_${itemId}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });
  }
}

// Exportar instancia singleton
export const cadenciaManager = new CadenciaManager();

export const shouldShowItem = (section, itemId, rutina, additionalData) => 
  cadenciaManager.shouldShowItem(section, itemId, rutina, additionalData);

export default cadenciaManager; 