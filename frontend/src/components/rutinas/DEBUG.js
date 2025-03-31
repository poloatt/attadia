/**
 * Utilidades de depuración para el módulo de rutinas
 * Este archivo contiene funciones para ayudar a depurar el flujo de datos
 * y el estado de los componentes.
 */

/**
 * Muestra los cambios entre dos objetos en la consola
 * @param {Object} prevObj - Objeto anterior
 * @param {Object} newObj - Objeto nuevo
 * @param {String} label - Etiqueta para identificar el log
 */
export const logObjectChanges = (prevObj, newObj, label = "Cambios detectados") => {
  if (!prevObj || !newObj) {
    console.log(`[DEBUG] ${label} - Uno de los objetos es nulo o indefinido`, { prevObj, newObj });
    return;
  }
  
  try {
    const changes = {};
    let hasChanges = false;
    
    // Compara propiedades en ambos objetos
    const allKeys = [...new Set([...Object.keys(prevObj), ...Object.keys(newObj)])];
    
    allKeys.forEach(key => {
      const prevValue = prevObj[key];
      const newValue = newObj[key];
      
      if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          prev: prevValue,
          new: newValue
        };
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      console.log(`[DEBUG] ${label}:`, changes);
    } else {
      console.log(`[DEBUG] ${label}: Sin cambios`);
    }
  } catch (error) {
    console.error(`[DEBUG] Error al comparar objetos:`, error);
  }
};

/**
 * Registra el estado de un componente React en cada renderizado
 * @param {String} componentName - Nombre del componente
 * @param {Object} props - Propiedades del componente
 * @param {Object} state - Estado del componente
 */
export const logComponentState = (componentName, props, state) => {
  console.log(`[DEBUG] ${componentName} - Props:`, JSON.stringify(props));
  console.log(`[DEBUG] ${componentName} - State:`, JSON.stringify(state));
};

/**
 * Registra cuando se realiza una operación de guardado
 * @param {String} component - Nombre del componente
 * @param {String} itemId - ID del elemento
 * @param {Object} data - Datos que se están guardando
 */
export const logSaveOperation = (component, itemId, data) => {
  console.log(`[DEBUG-SAVE] ${component} está guardando ${itemId}:`, JSON.stringify(data));
  
  // Registrar la pila de llamadas para ver desde dónde se llama
  console.log(`[DEBUG-SAVE] Pila de llamadas:`, new Error().stack);
  
  // Timestamp para rastrear el tiempo
  console.log(`[DEBUG-SAVE] Timestamp:`, new Date().toISOString());
};

/**
 * Inserta esta función en useEffect para rastrear cuándo y por qué se ejecuta
 * @param {String} componentName - Nombre del componente
 * @param {Array} dependencies - El array de dependencias del useEffect
 */
export const logEffectTrigger = (componentName, dependencies) => {
  console.log(`[DEBUG-EFFECT] ${componentName} useEffect se ha disparado con dependencias:`, dependencies);
};

/**
 * Limpia todas las entradas de localStorage relacionadas con rutinas y configuración
 * Esta función puede ser llamada desde la consola del navegador para resolver problemas:
 * import { cleanLocalStorage } from "./components/rutinas/DEBUG.js";
 * cleanLocalStorage();
 */
export const cleanLocalStorage = () => {
  try {
    console.log('[DEBUG-RESET] 🧹 Iniciando limpieza de localStorage...');
    
    // Buscar todas las claves que contengan estos términos
    const termsToClear = ['rutina', 'config', 'cambios', 'local', 'persisted'];
    
    // Obtener todas las claves de localStorage
    const allKeys = Object.keys(localStorage);
    
    // Filtrar las claves relacionadas con rutinas
    const keysToRemove = allKeys.filter(key => 
      termsToClear.some(term => key.toLowerCase().includes(term))
    );
    
    // Mostrar las claves que se van a eliminar
    console.log(`[DEBUG-RESET] 📝 Se eliminarán ${keysToRemove.length} entradas:`, keysToRemove);
    
    // Eliminar cada clave
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[DEBUG-RESET] 🗑️ Eliminada: ${key}`);
    });
    
    console.log('[DEBUG-RESET] ✅ Limpieza completada. Recarga la página para aplicar los cambios.');
    
    return {
      success: true,
      removedKeys: keysToRemove
    };
  } catch (error) {
    console.error('[DEBUG-RESET] ❌ Error durante la limpieza:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Realiza un diagnóstico completo de problemas de sincronización
 * @param {string} componentName - Nombre del componente para incluir en los logs
 * @param {Object} state - Estado actual del componente
 */
export const diagnoseSync = (componentName, state) => {
  console.group(`[DEBUG-DIAGNÓSTICO] 🔍 Diagnóstico de sincronización para ${componentName}`);
  
  try {
    // Revisar localStorage
    console.log('📦 Entradas de localStorage relacionadas:');
    const localStorageEntries = {};
    Object.keys(localStorage).forEach(key => {
      if (key.includes('rutina') || key.includes('config')) {
        try {
          localStorageEntries[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          localStorageEntries[key] = `[Error al parsear: ${e.message}]`;
        }
      }
    });
    console.log(localStorageEntries);
    
    // Analizar el estado actual
    console.log('🔄 Estado actual:', state);
    
    // Verificar inconsistencias típicas
    if (state?.rutina?.config) {
      const configItems = [];
      
      Object.entries(state.rutina.config).forEach(([section, items]) => {
        Object.entries(items).forEach(([itemId, config]) => {
          // Verificar si hay problemas con los tipos de datos
          const frecuenciaType = typeof config.frecuencia;
          const problemas = [];
          
          if (frecuenciaType !== 'number') {
            problemas.push(`frecuencia no es un número (${frecuenciaType})`);
          }
          
          if (!config.tipo) {
            problemas.push('tipo indefinido');
          }
          
          if (config.tipo === 'PERSONALIZADO' && !config.periodo) {
            problemas.push('falta periodo en tipo PERSONALIZADO');
          }
          
          if (problemas.length > 0) {
            configItems.push({
              path: `${section}.${itemId}`,
              config,
              problemas
            });
          }
        });
      });
      
      if (configItems.length > 0) {
        console.warn('⚠️ Se encontraron problemas potenciales en la configuración:', configItems);
      } else {
        console.log('✅ No se encontraron problemas obvios en la configuración');
      }
    }
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
  
  console.groupEnd();
};

/**
 * Función para probar llamadas al API directamente desde la consola del navegador
 * Esta función puede ser utilizada para probar problemas con el guardado de configuraciones
 * Ejemplo de uso: debugApiCall('/api/rutinas/123456', 'PUT', {config: {...}})
 * 
 * @param {String} url - URL del endpoint a probar
 * @param {String} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} data - Datos a enviar (para POST, PUT)
 */
export const debugApiCall = async (url, method = 'GET', data = null) => {
  console.group(`[DEBUG-API] 🔍 Probando llamada API`);
  
  try {
    // Cargar axios dinámicamente
    const axios = (await import('axios')).default;
    
    // Detectar base URL
    const baseURL = window.location.origin.includes('localhost') 
      ? 'http://localhost:5000' 
      : window.location.origin;
    
    // Crear cliente axios con timeout largo
    const client = axios.create({
      baseURL,
      timeout: 20000,
      withCredentials: true
    });
    
    console.log(`[DEBUG-API] 📡 Llamando a ${method} ${url}`);
    console.log(`[DEBUG-API] 📦 Datos:`, data);
    
    // Ejecutar llamada con el método apropiado
    let response;
    if (method === 'GET') {
      response = await client.get(url, { params: data });
    } else if (method === 'POST') {
      response = await client.post(url, data);
    } else if (method === 'PUT') {
      response = await client.put(url, data);
    } else if (method === 'DELETE') {
      response = await client.delete(url, { data });
    }
    
    console.log(`[DEBUG-API] ✅ Respuesta exitosa (${response.status}):`);
    console.log(response.data);
    
    console.groupEnd();
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.log(`[DEBUG-API] ❌ Error (${error.response?.status || 'desconocido'}):`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No se recibió respuesta:', error.request);
    } else {
      console.log('Error en la configuración:', error.message);
    }
    
    console.groupEnd();
    return {
      success: false,
      error: error.message,
      response: error.response?.data
    };
  }
};

/**
 * Recupera una rutina específica directamente desde el servidor
 * Útil para comparar estado local vs servidor
 * 
 * @param {String} rutinaId - ID de la rutina a recuperar
 */
export const fetchRutinaFromServer = async (rutinaId) => {
  if (!rutinaId) {
    console.error('[DEBUG-API] ❌ Se requiere ID de rutina');
    return null;
  }
  
  const result = await debugApiCall(`/api/rutinas/${rutinaId}`, 'GET');
  return result.success ? result.data : null;
};
