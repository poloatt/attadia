import { useCallback, useMemo, useRef, useEffect } from 'react';
import logger from '../utils/logger.js';

// Hook para optimizar performance y evitar re-renders innecesarios
export function usePerformanceOptimizer() {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  // Contador de renders para debugging
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    logger.perf('Render', `Component rendered ${renderCount.current} times, ${timeSinceLastRender}ms since last render`);
  });

  // Memoización optimizada para objetos
  const memoizeObject = useCallback((obj, deps) => {
    return useMemo(() => obj, deps);
  }, []);

  // Memoización optimizada para funciones
  const memoizeFunction = useCallback((fn, deps) => {
    return useCallback(fn, deps);
  }, []);

  // Debounce optimizado
  const useDebounce = useCallback((value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }, []);

  // Throttle optimizado
  const useThrottle = useCallback((value, delay) => {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastExecuted = useRef(Date.now());

    useEffect(() => {
      const now = Date.now();
      if (now - lastExecuted.current >= delay) {
        setThrottledValue(value);
        lastExecuted.current = now;
      }
    }, [value, delay]);

    return throttledValue;
  }, []);

  return {
    renderCount: renderCount.current,
    memoizeObject,
    memoizeFunction,
    useDebounce,
    useThrottle
  };
}

// Hook específico para optimizar listas
export function useListOptimizer(items, keyExtractor) {
  const memoizedItems = useMemo(() => {
    logger.perf('ListOptimizer', `Processing ${items.length} items`);
    return items.map(item => ({
      ...item,
      key: keyExtractor ? keyExtractor(item) : item.id || item._id
    }));
  }, [items, keyExtractor]);

  return memoizedItems;
}

// Hook para optimizar filtros
export function useFilterOptimizer(items, filterFn, deps) {
  const memoizedFilteredItems = useMemo(() => {
    const startTime = Date.now();
    const filtered = items.filter(filterFn);
    const duration = Date.now() - startTime;
    
    logger.perf('FilterOptimizer', `Filtered ${items.length} items to ${filtered.length} in ${duration}ms`);
    
    return filtered;
  }, [items, filterFn, ...deps]);

  return memoizedFilteredItems;
}

// Hook para optimizar búsquedas
export function useSearchOptimizer(items, searchTerm, searchFields) {
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm) return items;
    
    const startTime = Date.now();
    const results = items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (!value) return false;
        return value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      });
    });
    
    const duration = Date.now() - startTime;
    logger.perf('SearchOptimizer', `Searched ${items.length} items in ${duration}ms, found ${results.length} results`);
    
    return results;
  }, [items, debouncedSearchTerm, searchFields]);

  return searchResults;
}

// Función para importar useState si no está disponible
function useState(initialValue) {
  const [state, setState] = React.useState(initialValue);
  return [state, setState];
}

// Función para importar useDebounce si no está disponible
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 