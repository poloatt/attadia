import { useState, useEffect } from 'react';
import clienteAxios from '../config/axios';

// Cache simple en memoria + dedup de requests en vuelo (stale-while-revalidate)
const dataCache = {};
const inFlight = {};

function buildCacheKey(endpoint, params) {
  const queryString = new URLSearchParams(params).toString();
  return `${endpoint}?${queryString}`;
}

/**
 * Hace el GET deduplicando peticiones idénticas en vuelo: si ya hay una request
 * para la misma clave, devuelve la misma promesa en vez de disparar otra.
 */
function fetchWithDedup(endpoint, params, { force = false } = {}) {
  const cacheKey = buildCacheKey(endpoint, params);
  if (!force && inFlight[cacheKey]) {
    return inFlight[cacheKey];
  }

  const requestConfig = { params: { ...params } };
  if (force) {
    requestConfig.params._nocache = Date.now() + Math.random();
  }

  const promise = clienteAxios
    .get(endpoint, requestConfig)
    .then((response) => {
      dataCache[cacheKey] = { data: response.data, timestamp: Date.now() };
      return response.data;
    })
    .finally(() => {
      delete inFlight[cacheKey];
    });

  inFlight[cacheKey] = promise;
  return promise;
}

export function useAPI(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    cacheDuration = 60000, // 1 minuto por defecto
    dependencies = [],
    params = {},
    enableCache = true,
    forceRevalidate = false,
  } = options;

  useEffect(() => {
    let isMounted = true;

    // Sin endpoint no hay nada que cargar (p. ej. id aún no disponible)
    if (!endpoint) {
      setData(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    const cacheKey = buildCacheKey(endpoint, params);
    const cached = enableCache ? dataCache[cacheKey] : null;
    const isFresh = cached
      && !forceRevalidate
      && (Date.now() - cached.timestamp < cacheDuration);

    // Stale-while-revalidate: servir cache al instante (aunque esté vieja)
    if (cached) {
      setData(cached.data);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Si la cache es fresca, no revalidamos
    if (isFresh) {
      return () => { isMounted = false; };
    }

    // Revalidar (en background si ya había cache; con spinner si no)
    fetchWithDedup(endpoint, params, { force: forceRevalidate })
      .then((responseData) => {
        if (!isMounted) return;
        setData(responseData);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!err.message?.includes('cancelada')) {
          console.error(`Error en solicitud a ${endpoint}:`, err);
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint, ...dependencies, JSON.stringify(params), enableCache, cacheDuration, forceRevalidate]);

  // refetch: invalida la cache de este endpoint y trae datos frescos
  const refetch = async () => {
    if (!endpoint) return;
    const cacheKey = buildCacheKey(endpoint, params);
    if (dataCache[cacheKey]) {
      delete dataCache[cacheKey];
    }

    setLoading(true);
    try {
      const responseData = await fetchWithDedup(endpoint, params, { force: true });
      setData(responseData);
      setError(null);
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
