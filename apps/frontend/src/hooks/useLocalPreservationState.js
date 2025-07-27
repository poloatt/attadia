import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para preservar cambios locales cuando llegan actualizaciones del servidor
 * 
 * @param {Object} initialState - Estado inicial
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estado para manejar cambios locales
 */
export const useLocalPreservationState = (initialState = {}, options = {}) => {
  // Valores por defecto de las opciones
  const {
    preserveFields = ['tipo', 'frecuencia', 'periodo'],
    debug = false,
    storagePrefix = 'rutina_config_changes',
    enableStorage = true,
    debounceMs = 500 // Tiempo de debounce para guardar en localStorage
  } = options;
  
  // Estado principal
  const [state, setState] = useState(initialState);
  
  // Almacena los cambios locales pendientes de ser preservados
  const [pendingLocalChanges, setPendingLocalChanges] = useState({});
  
  // Ref para el timer de debounce
  const debounceTimerRef = useRef(null);
  
  // Ref para evitar múltiples cargas iniciales
  const isLoadedRef = useRef(false);

  // Función para guardar en localStorage con debounce
  const debouncedSaveToStorage = useCallback((changes) => {
    if (!enableStorage) return;
    
    // Limpiar el timer anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Establecer un nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storagePrefix, JSON.stringify(changes));
        if (debug) console.log('💾 Guardando cambios en localStorage:', changes);
      } catch (error) {
        console.error('❌ Error al guardar cambios en localStorage:', error);
      }
    }, debounceMs);
  }, [debug, enableStorage, storagePrefix, debounceMs]);

  // Cargar cambios guardados desde localStorage al iniciar
  useEffect(() => {
    if (!enableStorage || isLoadedRef.current) return;
    
    try {
      const savedChanges = localStorage.getItem(storagePrefix);
      if (savedChanges) {
        const parsedChanges = JSON.parse(savedChanges);
        if (debug) console.log('🔄 Cargando cambios guardados desde localStorage:', parsedChanges);
        setPendingLocalChanges(parsedChanges);
      }
      
      // Marcar como cargado para evitar múltiples cargas
      isLoadedRef.current = true;
    } catch (error) {
      console.error('❌ Error al cargar cambios desde localStorage:', error);
    }
  }, [debug, enableStorage, storagePrefix]);
  
  // Guardar cambios en localStorage cada vez que se actualicen
  useEffect(() => {
    if (!enableStorage || Object.keys(pendingLocalChanges).length === 0) return;
    
    // Usar la función de debounce para guardar
    debouncedSaveToStorage(pendingLocalChanges);
    
    // Limpiar el timer al desmontar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pendingLocalChanges, debouncedSaveToStorage, enableStorage]);
  
  // Actualiza el estado manteniendo los cambios locales
  const updateState = useCallback((newState, shouldPreserveChanges = false) => {
    if (debug) console.log('📥 Recibiendo actualización de estado:', newState);
    
    if (!shouldPreserveChanges) {
      // Actualización normal sin preservar cambios locales
      if (debug) console.log('🔄 Actualizando estado sin preservar cambios');
      setState(newState);
      return;
    }
    
    // Actualización preservando cambios locales
    setState(prevState => {
      if (debug) console.log('🛡️ Preservando cambios locales durante actualización');
      
      // Deep copy para evitar referencias compartidas
      const mergedState = JSON.parse(JSON.stringify(newState));
      
      // Si tenemos cambios locales pendientes, aplicarlos
      if (pendingLocalChanges && Object.keys(pendingLocalChanges).length > 0) {
        if (debug) console.log('🔍 Aplicando cambios locales pendientes:', pendingLocalChanges);
        
        // Para cada sección y campo que debe preservarse
        Object.entries(pendingLocalChanges).forEach(([section, items]) => {
          if (!mergedState.config || !mergedState.config[section]) return;
          
          Object.entries(items).forEach(([itemId, values]) => {
            if (!mergedState.config[section][itemId]) return;
            
            // Preservar solo los campos especificados
            preserveFields.forEach(field => {
              if (values[field] !== undefined) {
                if (debug) console.log(`✅ Preservando ${field} para ${section}.${itemId}: ${values[field]}`);
                mergedState.config[section][itemId][field] = values[field];
              }
            });
          });
        });
      }
      
      return mergedState;
    });
  }, [debug, pendingLocalChanges, preserveFields]);
  
  // Registra cambios locales que deben preservarse
  const registerLocalChange = useCallback((section, itemId, values) => {
    if (debug) console.log(`📝 Registrando cambio local para ${section}.${itemId}:`, values);
    
    setPendingLocalChanges(prev => {
      const newPending = { ...prev };
      if (!newPending[section]) newPending[section] = {};
      if (!newPending[section][itemId]) newPending[section][itemId] = {};
      
      // Guardar solo los campos que queremos preservar, asegurando tipos correctos
      preserveFields.forEach(field => {
        if (values[field] !== undefined) {
          // Para valores numéricos, asegurar que se guardan como Number
          if (field === 'frecuencia') {
            newPending[section][itemId][field] = Number(values[field]);
          } else {
            newPending[section][itemId][field] = values[field];
          }
        }
      });
      
      return newPending;
    });
    
    // También aplicar el cambio inmediatamente al estado actual
    setState(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      
      // Asegurar que existe la estructura necesaria
      if (!newState.config) newState.config = {};
      if (!newState.config[section]) newState.config[section] = {};
      if (!newState.config[section][itemId]) newState.config[section][itemId] = {};
      
      // Aplicar cambios manteniendo tipos correctos
      preserveFields.forEach(field => {
        if (values[field] !== undefined) {
          // Para valores numéricos, asegurar que se aplican como Number
          if (field === 'frecuencia') {
            newState.config[section][itemId][field] = Number(values[field]);
          } else {
            newState.config[section][itemId][field] = values[field];
          }
        }
      });
      
      return newState;
    });
  }, [debug, preserveFields]);
  
  // Limpia los cambios locales para una sección/item específico
  const clearLocalChanges = useCallback((section = null, itemId = null) => {
    if (debug) {
      if (section && itemId) {
        console.log(`🧹 Limpiando cambios locales para ${section}.${itemId}`);
      } else if (section) {
        console.log(`🧹 Limpiando cambios locales para sección ${section}`);
      } else {
        console.log('🧹 Limpiando todos los cambios locales');
      }
    }
    
    setPendingLocalChanges(prev => {
      // Si no hay sección especificada, limpiar todos los cambios
      if (!section) {
        if (enableStorage) {
          localStorage.removeItem(storagePrefix);
        }
        return {};
      }
      
      const newPending = { ...prev };
      
      // Si no hay itemId especificado, limpiar toda la sección
      if (!itemId) {
        delete newPending[section];
      } else {
        // Limpiar solo el item específico
        if (newPending[section]) {
          delete newPending[section][itemId];
          
          // Si la sección quedó vacía, eliminarla
          if (Object.keys(newPending[section]).length === 0) {
            delete newPending[section];
          }
        }
      }
      
      // Guardar los cambios actualizados
      if (enableStorage) {
        debouncedSaveToStorage(newPending);
      }
      
      return newPending;
    });
  }, [debug, enableStorage, storagePrefix, debouncedSaveToStorage]);
  
  // Devolver las funciones y estados del hook
  return {
    state,
    updateState,
    registerLocalChange,
    clearLocalChanges,
    pendingLocalChanges
  };
};

export default useLocalPreservationState; 