/**
 * Herramienta de solución de problemas para el módulo de rutinas
 * Este archivo contiene funciones para diagnosticar y resolver problemas comunes
 */

/**
 * Limpia todos los datos de localStorage relacionados con rutinas
 * @returns {Boolean} - true si se completó con éxito
 */
export const resetLocalStorage = () => {
  try {
    console.log('🔄 Limpiando datos locales de rutinas...');
    
    // Identificar y eliminar todas las entradas relacionadas con rutinas
    Object.keys(localStorage).forEach(key => {
      if (key.includes('rutina') || key.includes('config')) {
        console.log(`Eliminando: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Datos locales eliminados correctamente');
    
    // Mostrar mensaje de instrucciones para el usuario
    console.log('⚠️ Recarga la página para aplicar los cambios');
    
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar datos locales:', error);
    return false;
  }
};

/**
 * Normaliza la configuración de una rutina
 * @param {Object} config - Configuración a normalizar
 * @returns {Object} - Configuración normalizada
 */
export const normalizeConfig = (config) => {
  if (!config) return null;
  
  console.log('🔄 Normalizando configuración...');
  
  try {
    // Crear una copia profunda
    const normalized = JSON.parse(JSON.stringify(config));
    
    Object.entries(normalized).forEach(([section, items]) => {
      if (typeof items !== 'object') return;
      
      Object.entries(items).forEach(([itemId, itemConfig]) => {
        if (typeof itemConfig !== 'object') return;
        
        // Normalizar cada campo
        normalized[section][itemId] = {
          ...itemConfig,
          tipo: (itemConfig.tipo || 'DIARIO').toUpperCase(),
          frecuencia: Number(itemConfig.frecuencia || 1),
          activo: itemConfig.activo !== undefined ? Boolean(itemConfig.activo) : true,
          diasSemana: Array.isArray(itemConfig.diasSemana) ? itemConfig.diasSemana : [],
          diasMes: Array.isArray(itemConfig.diasMes) ? itemConfig.diasMes : [],
          periodo: itemConfig.periodo || 'CADA_DIA'
        };
      });
    });
    
    console.log('✅ Configuración normalizada correctamente');
    return normalized;
  } catch (error) {
    console.error('❌ Error al normalizar configuración:', error);
    return config;
  }
};

/**
 * Analiza una rutina en busca de problemas comunes
 * @param {Object} rutina - Rutina a analizar
 * @returns {Object} - Resultados del diagnóstico
 */
export const diagnosticarRutina = (rutina) => {
  if (!rutina) return { status: 'error', message: 'No hay rutina para diagnosticar' };
  
  console.log('🔍 Diagnosticando rutina:', rutina._id);
  
  const problemas = [];
  
  // Verificar estructura básica
  if (!rutina._id) {
    problemas.push('La rutina no tiene ID');
  }
  
  if (!rutina.fecha) {
    problemas.push('La rutina no tiene fecha');
  }
  
  // Verificar configuración
  if (rutina.config) {
    Object.entries(rutina.config).forEach(([section, items]) => {
      if (typeof items !== 'object') {
        problemas.push(`La sección ${section} no es un objeto`);
        return;
      }
      
      Object.entries(items).forEach(([itemId, config]) => {
        if (typeof config !== 'object') {
          problemas.push(`La configuración para ${section}.${itemId} no es un objeto`);
          return;
        }
        
        // Verificar campos básicos
        if (!config.tipo) {
          problemas.push(`Falta el tipo en ${section}.${itemId}`);
        }
        
        if (config.frecuencia === undefined) {
          problemas.push(`Falta la frecuencia en ${section}.${itemId}`);
        } else if (typeof config.frecuencia !== 'number') {
          problemas.push(`La frecuencia de ${section}.${itemId} no es un número: ${typeof config.frecuencia}`);
        }
        
        if (config.tipo === 'PERSONALIZADO' && !config.periodo) {
          problemas.push(`Falta el periodo en ${section}.${itemId} (tipo PERSONALIZADO)`);
        }
      });
    });
  }
  
  // Mostrar resultados
  if (problemas.length === 0) {
    console.log('✅ No se encontraron problemas en la rutina');
    return {
      status: 'ok',
      message: 'No se encontraron problemas'
    };
  } else {
    console.warn('⚠️ Se encontraron problemas:', problemas);
    return {
      status: 'warning',
      problemas,
      message: `Se encontraron ${problemas.length} problemas`
    };
  }
};

/**
 * Corrige problemas comunes en una rutina
 * @param {Object} rutina - Rutina a corregir
 * @returns {Object} - Rutina corregida
 */
export const corregirRutina = (rutina) => {
  if (!rutina) return null;
  
  console.log('🔧 Corrigiendo rutina:', rutina._id);
  
  try {
    // Crear una copia profunda
    const corregida = JSON.parse(JSON.stringify(rutina));
    
    // Normalizar configuración
    if (corregida.config) {
      corregida.config = normalizeConfig(corregida.config);
    }
    
    console.log('✅ Rutina corregida correctamente');
    return corregida;
  } catch (error) {
    console.error('❌ Error al corregir rutina:', error);
    return rutina;
  }
};

/**
 * Muestra un resumen del estado actual para depuración
 * @param {Object} state - Estado actual del componente
 */
export const mostrarEstado = (state) => {
  console.group('📊 Estado actual:');
  
  if (state.rutina) {
    console.log('ID de la rutina:', state.rutina._id);
    console.log('Fecha de la rutina:', state.rutina.fecha);
    console.log('Configuración:', state.rutina.config);
  } else {
    console.log('No hay rutina activa');
  }
  
  console.log('Total de rutinas:', state.rutinas.length);
  console.log('Página actual:', state.currentPage);
  console.log('Total de páginas:', state.totalPages);
  console.log('Cargando:', state.loading);
  
  console.groupEnd();
};

/**
 * Fuerza la actualización de la configuración al servidor
 * @param {String} rutinaId - ID de la rutina a actualizar
 * @param {Object} rutina - Objeto de rutina completo
 * @returns {Promise} - Promesa con el resultado de la operación
 */
export const forceServerUpdate = async (rutinaId, rutina) => {
  if (!rutinaId || !rutina) {
    console.error('❌ Se requiere ID de rutina y datos de rutina');
    return { success: false, error: 'Datos insuficientes' };
  }

  try {
    // Importar axios si es necesario (asumiendo que está disponible en clienteAxios)
    const axios = await import('axios').then(module => module.default);
    const BASE_URL = window.location.origin.includes('localhost') 
      ? 'http://localhost:5000' 
      : window.location.origin;
    
    const client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      withCredentials: true
    });
    
    console.log('🔄 Forzando actualización al servidor para rutina:', rutinaId);
    
    // Extraer solo la configuración
    const configData = {
      _id: rutinaId,
      _force_update: true,
      config: rutina.config || {}
    };
    
    console.log('📦 Datos a enviar:', configData);
    
    // Enviar petición al servidor
    const response = await client.put(`/api/rutinas/${rutinaId}`, configData);
    
    console.log('✅ Servidor actualizó correctamente:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al forzar actualización:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido',
      details: error.response?.data
    };
  }
};

/**
 * Verifica si hay cambios pendientes por sincronizar
 * @returns {Boolean} - true si hay cambios pendientes
 */
export const hasPendingChanges = () => {
  try {
    // Verificar cambios en localStorage
    const localChanges = localStorage.getItem('rutina_cambios_locales');
    if (!localChanges) return false;
    
    const changes = JSON.parse(localChanges);
    
    // Verificar si hay rutinas con cambios
    return Object.keys(changes).length > 0;
  } catch (error) {
    console.error('Error al verificar cambios pendientes:', error);
    return false;
  }
};

export default {
  resetLocalStorage,
  normalizeConfig,
  diagnosticarRutina,
  corregirRutina,
  mostrarEstado,
  forceServerUpdate,
  hasPendingChanges
};