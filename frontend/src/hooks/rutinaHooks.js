import { useState, useEffect, useCallback } from 'react';

// Hook personalizado para debounce
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Hook personalizado para manejar la actualización inmediata de UI con delay para APIs
export const useOptimisticUpdate = (initialData = {}, onUpdate) => {
  const [localData, setLocalData] = useState(initialData);
  
  // Actualizar estado local cuando cambian los datos iniciales
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);
  
  // Función para toggle con actualización optimista
  const toggleItem = useCallback((itemId) => {
    const isCompleted = !!localData[itemId];
    const newData = {
      ...localData,
      [itemId]: !isCompleted
    };
    
    // Actualizar UI inmediatamente
    setLocalData(newData);
    
    // Notificar al padre con delay mínimo para evitar bloqueo de UI
    setTimeout(() => {
      if (typeof onUpdate === 'function') {
        onUpdate(newData);
      }
    }, 0);
    
    return newData;
  }, [localData, onUpdate]);
  
  return {
    localData,
    setLocalData,
    toggleItem
  };
};

// Hook para preservar cambios locales cuando llegan actualizaciones del servidor
export const useLocalPreservationState = (initialState = {}, options = {}) => {
  // Valores por defecto de las opciones
  const {
    preserveFields = ['tipo', 'frecuencia', 'periodo'],
    debug = false,
    storagePrefix = 'rutina_config_changes',
    enableStorage = true
  } = options;
  
  // Estado principal
  const [state, setState] = useState(initialState);
  
  // Almacena los cambios locales pendientes de ser preservados
  const [pendingLocalChanges, setPendingLocalChanges] = useState({});

  // Cargar cambios guardados desde localStorage al iniciar
  useEffect(() => {
    if (!enableStorage) return;
    
    try {
      const savedChanges = localStorage.getItem(storagePrefix);
      if (savedChanges) {
        const parsedChanges = JSON.parse(savedChanges);
        if (debug) console.log('🔄 Cargando cambios guardados desde localStorage:', parsedChanges);
        setPendingLocalChanges(parsedChanges);
      }
    } catch (error) {
      console.error('❌ Error al cargar cambios desde localStorage:', error);
    }
  }, [debug, enableStorage, storagePrefix]);
  
  // Guardar cambios en localStorage cada vez que se actualicen
  useEffect(() => {
    if (!enableStorage || Object.keys(pendingLocalChanges).length === 0) return;
    
    try {
      localStorage.setItem(storagePrefix, JSON.stringify(pendingLocalChanges));
      if (debug) console.log('💾 Guardando cambios en localStorage:', pendingLocalChanges);
    } catch (error) {
      console.error('❌ Error al guardar cambios en localStorage:', error);
    }
  }, [pendingLocalChanges, debug, enableStorage, storagePrefix]);
  
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

      // Si hay localStorage disponible, guardar inmediatamente
      if (enableStorage) {
        try {
          localStorage.setItem(storagePrefix, JSON.stringify(newPending));
          if (debug) console.log('💾 Guardando cambios en localStorage de forma sincrónica:', newPending);
        } catch (error) {
          console.error('❌ Error al guardar cambios en localStorage:', error);
        }
      }
      
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
  }, [debug, preserveFields, enableStorage, storagePrefix]);
  
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
      if (!section) return {};
      
      const newPending = { ...prev };
      
      // Si no hay itemId especificado, limpiar toda la sección
      if (!itemId) {
        delete newPending[section];
        return newPending;
      }
      
      // Limpiar solo el item específico
      if (newPending[section]) {
        delete newPending[section][itemId];
        
        // Si la sección quedó vacía, eliminarla
        if (Object.keys(newPending[section]).length === 0) {
          delete newPending[section];
        }
      }
      
      return newPending;
    });
  }, [debug]);
  
  // Devolver las funciones y estados del hook
  return {
    state,
    updateState,
    registerLocalChange,
    clearLocalChanges,
    pendingLocalChanges
  };
}; 