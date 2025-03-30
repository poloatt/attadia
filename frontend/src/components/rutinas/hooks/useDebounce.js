import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * Retrasa la actualización de un valor hasta que pasa el tiempo especificado
 * 
 * @param {any} value - Valor a debounce
 * @param {number} delay - Tiempo de espera en ms
 * @returns {any} Valor después del tiempo de espera
 */
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

export default useDebounce; 