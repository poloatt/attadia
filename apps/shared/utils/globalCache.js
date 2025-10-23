/**
 * Sistema de caché global compartido para evitar llamadas duplicadas
 * entre múltiples instancias de componentes
 */

class GlobalCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Obtiene datos del caché o ejecuta la función si no están en caché
   * @param {string} key - Clave única para el caché
   * @param {Function} fetchFn - Función que devuelve una promesa con los datos
   * @param {number} timeout - Tiempo de vida del caché en ms (default: 60000)
   * @returns {Promise} - Promesa con los datos
   */
  async get(key, fetchFn, timeout = 60000) {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    // Si tenemos datos válidos en caché, devolverlos
    if (cached && (now - cached.timestamp) < timeout) {
      console.log(`[GlobalCache] Usando caché válido para ${key}`);
      return cached.data;
    }
    
    // Si ya hay una petición en curso, esperar a que termine
    if (this.pendingRequests.has(key)) {
      console.log(`[GlobalCache] Esperando petición en curso para ${key}`);
      return await this.pendingRequests.get(key);
    }
    
    // Ejecutar la función de fetch
    const requestPromise = (async () => {
      try {
        console.log(`[GlobalCache] Ejecutando fetch para ${key}`);
        const data = await fetchFn();
        
        // Guardar en caché
        this.cache.set(key, {
          data,
          timestamp: now
        });
        
        return data;
      } catch (error) {
        console.error(`[GlobalCache] Error en fetch para ${key}:`, error);
        throw error;
      } finally {
        // Limpiar petición pendiente
        this.pendingRequests.delete(key);
      }
    })();
    
    // Registrar petición pendiente
    this.pendingRequests.set(key, requestPromise);
    
    return await requestPromise;
  }

  /**
   * Invalida el caché para una clave específica
   * @param {string} key - Clave a invalidar
   */
  invalidate(key) {
    this.cache.delete(key);
    console.log(`[GlobalCache] Caché invalidado para ${key}`);
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('[GlobalCache] Caché limpiado completamente');
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancia global compartida
const globalCache = new GlobalCache();

export default globalCache;
