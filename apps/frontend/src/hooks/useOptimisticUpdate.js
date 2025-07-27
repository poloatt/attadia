import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para manejar la actualización inmediata de UI con delay para APIs
 * Permite actualizar la UI inmediatamente mientras se procesa la actualización en el servidor
 * 
 * @param {Object} initialData - Datos iniciales
 * @param {Function} onUpdate - Función a llamar cuando se actualizan los datos
 * @returns {Object} - Objeto con datos locales, función para actualizar y función para toggle
 */
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

export default useOptimisticUpdate; 