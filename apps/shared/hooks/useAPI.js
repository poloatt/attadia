import { useState, useEffect } from 'react';
import clienteAxios from '../config/axios';

// Cache simple
const dataCache = {};

export function useAPI(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { 
    cacheDuration = 60000, // 1 minuto por defecto
    dependencies = [],
    params = {},
    enableCache = true,
    forceRevalidate = false // Opción para forzar revalidación de caché
  } = options;
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      // Generar clave de caché basada en endpoint y parámetros
      const queryString = new URLSearchParams(params).toString();
      const cacheKey = `${endpoint}?${queryString}`;
      
      // Revisar caché si está habilitado
      if (enableCache) {
        const cachedData = dataCache[cacheKey];
        if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
          if (isMounted) {
            setData(cachedData.data);
            setLoading(false);
          }
          return;
        }
      }
      
      try {
        setLoading(true);
        
        // Configuración para la petición - Solo usar parámetros de URL para evitar problemas CORS
        const requestConfig = { 
          params: { ...params }
        };
        
        // Si forceRevalidate está activo, añadir parámetros para evitar caché
        if (forceRevalidate) {
          // Añadir timestamp aleatorio para evitar caché de cualquier tipo
          requestConfig.params = {
            ...requestConfig.params,
            _nocache: Date.now() + Math.random()
          };
        }
        
        const response = await clienteAxios.get(endpoint, requestConfig);
        
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          const responseData = response.data;
          
          // Guardar en caché si está habilitado
          if (enableCache) {
            dataCache[cacheKey] = {
              data: responseData,
              timestamp: Date.now()
            };
          }
          
          setData(responseData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          // No establecer error si fue una cancelación deliberada
          if (!err.message?.includes('cancelada')) {
            console.error(`Error en solicitud a ${endpoint}:`, err);
            setError(err);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Función de limpieza
    return () => {
      isMounted = false;
    };
  }, [endpoint, ...dependencies, JSON.stringify(params), enableCache, cacheDuration, forceRevalidate]);
  
  // Implementamos una verdadera función de refetch que limpia la caché y vuelve a solicitar los datos
  const refetch = async () => {
    // Limpiar la caché para este endpoint
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `${endpoint}?${queryString}`;
    if (enableCache && dataCache[cacheKey]) {
      delete dataCache[cacheKey];
    }
    
    // Indicar que estamos cargando
    setLoading(true);
    
    try {
      // Configuración para forzar datos frescos sin usar cabeceras (solo parámetros)
      const requestConfig = { 
        params: {
          ...params,
          _nocache: Date.now() + Math.random() // Parámetro para evitar caché
        }
      };
      
      // Hacer la solicitud directamente
      const response = await clienteAxios.get(endpoint, requestConfig);
      setData(response.data);
      setError(null);
      
      // Actualizar la caché
      if (enableCache) {
        dataCache[cacheKey] = {
          data: response.data,
          timestamp: Date.now()
        };
      }
    } catch (err) {
      if (!err.message?.includes('cancelada')) {
        console.error(`Error en solicitud a ${endpoint}:`, err);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, refetch };
} 