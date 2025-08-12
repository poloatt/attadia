import { useState, useEffect, useCallback } from 'react';
// Reexportar la versión canónica del hook para evitar duplicación
export { useLocalPreservationState } from './useLocalPreservationState';

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
