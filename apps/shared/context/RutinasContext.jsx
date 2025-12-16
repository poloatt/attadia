import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { getNormalizedToday, toISODateString, parseAPIDate } from '../utils/dateUtils';
import rutinasService from '../services/rutinasService';
import { UISettingsContext } from './UISettingsContext';
import { calculateCompletionPercentage } from '../utils/rutinaCalculations';

// Construye historial de completaciones por sección/ítem a partir del logger por día
// Forma: historial[section][itemId][YYYY-MM-DD] = true
const buildHistorialFromRutinas = (rutinasList = []) => {
  const historial = {
    bodyCare: {},
    nutricion: {},
    ejercicio: {},
    cleaning: {}
  };

  const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
  rutinasList.forEach(r => {
    let dateStr = null;
    try {
      dateStr = toISODateString(parseAPIDate(r.fecha));
    } catch {
      dateStr = null;
    }
    if (!dateStr) return;

    sections.forEach(section => {
      const sec = r?.[section];
      if (!sec || typeof sec !== 'object') return;
      Object.entries(sec).forEach(([itemId, completed]) => {
        if (completed !== true) return;
        if (!historial[section][itemId]) historial[section][itemId] = {};
        historial[section][itemId][dateStr] = true;
      });
    });
  });

  return historial;
};

const attachHistorial = (rutinasList = []) => {
  const historial = buildHistorialFromRutinas(rutinasList);
  const rutinasWithHist = rutinasList.map(r => ({ ...r, historial }));
  return { historial, rutinasWithHist };
};

// Crear el contexto
const RutinasContext = createContext();

/**
 * Hook personalizado para usar el contexto de rutinas
 */
export const useRutinas = () => {
  const context = useContext(RutinasContext);
  if (!context) {
    throw new Error('useRutinas debe usarse dentro de un RutinasProvider');
  }
  return context;
};

// Provider del contexto
export const RutinasProvider = ({ children }) => {
  // Estados básicos
  const [rutina, setRutina] = useState(null);
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { enqueueSnackbar } = useSnackbar();
  const uiContext = React.useContext(UISettingsContext);
  const autoUpdateHabitPreferences = uiContext?.autoUpdateHabitPreferences || (() => {});

  // Mantener una referencia estable al array de rutinas para evitar dependencias reactivas
  const rutinasRef = React.useRef([]);
  const ensureTodayAttemptedRef = React.useRef(false);
  useEffect(() => {
    rutinasRef.current = rutinas;
  }, [rutinas]);

  // Función para manejo de errores
  const handleError = useCallback((error, context, fallbackMessage) => {
    const message = error?.message || fallbackMessage;
    console.error(`[RutinasContext] ${context}:`, error);
    enqueueSnackbar(message, { variant: 'error' });
  }, [enqueueSnackbar]);

  // Cargar rutinas
  const fetchRutinas = useCallback(async (forceReload = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await rutinasService.getRutinas();
      const rutinaList = Array.isArray(data) ? data : (data.docs || []);
      
      if (!Array.isArray(rutinaList)) {
        setError('Formato de datos incorrecto');
        return;
      }
      
      // Ordenar rutinas por fecha (más reciente primero)
      const rutinasOrdenadas = [...rutinaList].sort((a, b) => {
        const da = parseAPIDate(a.fecha);
        const db = parseAPIDate(b.fecha);
        return db - da;
      });

      const { historial, rutinasWithHist } = attachHistorial(rutinasOrdenadas);
      
      const totalRutinas = rutinasWithHist.length;
      setTotalPages(totalRutinas);
      setRutinas(rutinasWithHist);
      
      // Auto-crear rutina de hoy si no existe (una vez por sesión, para evitar loops)
      const todayStr = toISODateString(getNormalizedToday());
      const hasToday = rutinasWithHist.some(r => {
        try {
          return toISODateString(parseAPIDate(r.fecha)) === todayStr;
        } catch {
          return false;
        }
      });

      if (!hasToday && !ensureTodayAttemptedRef.current) {
        ensureTodayAttemptedRef.current = true;
        try {
          const created = await rutinasService.createRutina({ fecha: todayStr, useGlobalConfig: true });
          // Refrescar lista y seleccionar la rutina creada
          const merged = [created, ...rutinasWithHist];
          const { historial: newHist, rutinasWithHist: mergedWithHist } = attachHistorial(merged);
          setRutinas(mergedWithHist);
          setTotalPages(mergedWithHist.length);
          setRutina({
            ...created,
            historial: newHist,
            _page: 1,
            _totalPages: mergedWithHist.length
          });
          setCurrentPage(1);
          return; // ya seleccionamos hoy
        } catch (e) {
          const status = e?.response?.status;
          const rutinaId = e?.response?.data?.rutinaId;
          if (status === 409 && rutinaId) {
            // Ya existe: cargarla y seleccionarla
            await getRutinaById(rutinaId);
            return;
          }
          // Si falla, no bloquear UX: se seguirá comportando como antes (sin rutina de hoy)
        }
      }

      // Seleccionar rutina de hoy o la más reciente
      if (rutinasWithHist.length > 0) {
        const indexToday = rutinasWithHist.findIndex(r => {
          try {
            return toISODateString(parseAPIDate(r.fecha)) === todayStr;
          } catch {
            return false;
          }
        });
        const selectedIndex = indexToday >= 0 ? indexToday : 0;
        const selected = rutinasWithHist[selectedIndex];
        setRutina({
          ...selected,
          historial,
          _page: selectedIndex + 1,
          _totalPages: totalRutinas
        });
        setCurrentPage(selectedIndex + 1);
      } else {
        setRutina(null);
        setCurrentPage(1);
      }
      
    } catch (error) {
      console.error('[RutinasContext] Error al cargar rutinas:', error);
      if (!error.cancelado) {
        setError('No se pudieron cargar las rutinas');
        enqueueSnackbar('Error al cargar las rutinas', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Cargar una rutina específica por ID
  const getRutinaById = useCallback(async (rutinaId) => {
    try {
      if (!rutinaId) {
        console.error('[RutinasContext] ID de rutina no proporcionado');
        enqueueSnackbar('Error: ID de rutina no proporcionado', { variant: 'error' });
        return null;
      }

      setLoading(true);
      
      // Verificar si ya tenemos esta rutina en nuestro array (usando ref estable)
      const rutinaEnCache = rutinasRef.current.find(r => r._id === rutinaId);
      
      let rutinaData;
      if (rutinaEnCache) {
        rutinaData = rutinaEnCache;
      } else {
        // Si no está en caché, hacer petición al servidor
        const response = await rutinasService.getRutinaById(rutinaId);
        rutinaData = response;

        // Actualizar el array de rutinas y recalcular historial
        const base = Array.isArray(rutinasRef.current) ? rutinasRef.current : [];
        const newRutinas = [...base];
        const existingIndex = newRutinas.findIndex(r => r._id === rutinaData._id);
        if (existingIndex >= 0) newRutinas[existingIndex] = rutinaData;
        else newRutinas.push(rutinaData);

        newRutinas.sort((a, b) => {
          const da = parseAPIDate(a.fecha);
          const db = parseAPIDate(b.fecha);
          return db - da;
        });

        const { historial, rutinasWithHist } = attachHistorial(newRutinas);
        setRutinas(rutinasWithHist);
        rutinaData = { ...rutinaData, historial };
      }
      
      // Encontrar índice para calcular la página (usando ref estable)
      const index = (rutinasRef.current || []).findIndex(r => r._id === rutinaId);
      const page = index >= 0 ? index + 1 : 1;
      
      // Actualizar la rutina actual
      const rutinaActualizada = {
        ...rutinaData,
        _page: page,
        _totalPages: (rutinasRef.current?.length || 1)
      };
      
      setRutina(rutinaActualizada);
      setCurrentPage(page);
      
      return rutinaActualizada;
    } catch (error) {
      console.error(`[RutinasContext] Error al cargar rutina con ID ${rutinaId}:`, error);
      enqueueSnackbar(`Error al cargar rutina: ${error.message}`, { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Navegación entre rutinas
  const handlePrevious = useCallback(() => {
    if (currentPage > 1 && !loading) {
      const newPage = currentPage - 1;
      const index = newPage - 1;
      const targetRutina = rutinas[index];
      
      if (targetRutina && targetRutina._id) {
        setRutina({
          ...targetRutina,
          _page: newPage,
          _totalPages: totalPages
        });
        setCurrentPage(newPage);
      }
    } else {
      enqueueSnackbar('Ya estás en la rutina más reciente', { variant: 'info' });
    }
  }, [currentPage, totalPages, loading, rutinas, enqueueSnackbar]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages && !loading) {
      const newPage = currentPage + 1;
      const index = newPage - 1;
      const targetRutina = rutinas[index];
      
      if (targetRutina && targetRutina._id) {
        setRutina({
          ...targetRutina,
          _page: newPage,
          _totalPages: totalPages
        });
        setCurrentPage(newPage);
      }
    } else {
      enqueueSnackbar('Ya estás en la rutina más antigua', { variant: 'info' });
    }
  }, [currentPage, totalPages, loading, rutinas, enqueueSnackbar]);

  // Parche local de sección (checkmarks) para que la navegación (% y contadores) se actualice sin refresh global
  const patchRutinaSection = useCallback((rutinaId, section, nextSectionData) => {
    if (!rutinaId || !section || !nextSectionData) return;

    setRutinas(prevList => {
      if (!Array.isArray(prevList)) return prevList;
      const updated = prevList.map(r => {
        if (!r || r._id !== rutinaId) return r;
        return { ...r, [section]: { ...(nextSectionData || {}) } };
      });
      // Recalcular historial para PERSONALIZADO y coherencia de completion
      const { rutinasWithHist } = attachHistorial(updated);
      return rutinasWithHist;
    });

    setRutina(prev => {
      if (!prev || prev._id !== rutinaId) return prev;
      return { ...prev, [section]: { ...(nextSectionData || {}) } };
    });
  }, []);

  // Marcar un ítem como completado
  const markItemComplete = useCallback(async (rutinaId, section, data) => {
    if (!rutinaId || !section || !data) {
      console.error('[RutinasContext] Datos incompletos para marcar ítem');
      return;
    }
    
    try {
      // Actualizar en el servidor
      const response = await rutinasService.markComplete(rutinaId, section, data);

      // Reflejar el cambio de checkmarks localmente (para que RutinaNavigation recalcule %)
      patchRutinaSection(rutinaId, section, data);
      
      // Actualizar completitud localmente
      const index = rutinas.findIndex(r => r._id === rutinaId);
      if (index !== -1) {
        const rutinaActual = rutinas[index];
        const porcentaje = calculateCompletionPercentage(rutinaActual);
        const completitudDecimal = porcentaje / 100;
        
        setRutinas(prev => {
          const nuevasRutinas = [...prev];
          nuevasRutinas[index] = {
            ...nuevasRutinas[index],
            completitud: completitudDecimal
          };
          const { rutinasWithHist } = attachHistorial(nuevasRutinas);
          return rutinasWithHist;
        });
        
        if (rutina && rutina._id === rutinaId) {
          setRutina(prev => ({
            ...prev,
            completitud: completitudDecimal
          }));
        }
      }
      
      return response;
    } catch (error) {
      console.error('[RutinasContext] Error al marcar ítem:', error);
      enqueueSnackbar('Error al marcar ítem', { variant: 'error' });
      throw error;
    }
  }, [rutinas, rutina, enqueueSnackbar, patchRutinaSection]);

  // Parche local de config para un ítem (refresca SOLO lo necesario sin recargar toda la página)
  const patchRutinaItemConfig = useCallback((rutinaId, section, itemId, nextConfig) => {
    if (!rutinaId || !section || !itemId || !nextConfig) return;

    // 1) Rutina seleccionada
    setRutina(prev => {
      if (!prev || prev._id !== rutinaId) return prev;
      const prevConfig = prev.config || {};
      const prevSection = prevConfig[section] || {};
      return {
        ...prev,
        config: {
          ...prevConfig,
          [section]: {
            ...prevSection,
            [itemId]: {
              ...(prevSection[itemId] || {}),
              ...nextConfig
            }
          }
        }
      };
    });

    // 2) Lista de rutinas (para que navegación muestre el cambio sin fetch)
    setRutinas(prevList => {
      if (!Array.isArray(prevList) || prevList.length === 0) return prevList;
      return prevList.map(r => {
        if (!r || r._id !== rutinaId) return r;
        const rConfig = r.config || {};
        const rSection = rConfig[section] || {};
        return {
          ...r,
          config: {
            ...rConfig,
            [section]: {
              ...rSection,
              [itemId]: {
                ...(rSection[itemId] || {}),
                ...nextConfig
              }
            }
          }
        };
      });
    });
  }, []);

  // Actualizar configuración de ítems
  const updateItemConfiguration = useCallback(async (section, itemId, config, options = {}) => {
    const { isGlobal = autoUpdateHabitPreferences, rutinaId = null } = options;
    
    if (!section || !itemId || !config) {
      handleError(new Error('Datos incompletos para actualizar configuración'), 'updateItemConfiguration', 'Datos incompletos');
      return { updated: false, error: "Datos incompletos" };
    }

    const targetRutinaId = rutinaId || rutina?._id;
    if (!targetRutinaId) {
      handleError(new Error('No hay rutina para actualizar'), 'updateItemConfiguration', 'No hay rutina actual');
      return { updated: false, error: "No hay rutina actual" };
    }

    try {
      // Normalizar configuración
      const normalizedConfig = {
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(config.frecuencia || 1),
        activo: config.activo !== undefined ? Boolean(config.activo) : true,
        periodo: config.periodo || 'CADA_DIA',
        esPreferenciaUsuario: config.esPreferenciaUsuario !== undefined ? Boolean(config.esPreferenciaUsuario) : true,
        ultimaActualizacion: new Date().toISOString()
      };

      // Actualizar preferencias globales si es necesario
      if (isGlobal) {
        try {
          const result = await rutinasService.updateUserHabitPreference(section, itemId, normalizedConfig);
          if (result.fallback) {
            enqueueSnackbar(result.fallback, { variant: 'warning' });
          }
        } catch (prefError) {
          console.error(`[RutinasContext] Error al actualizar preferencia global:`, prefError);
        }
      }

      // Enviar al servidor
      const currentSectionConfig = (rutina?.config?.[section]) || {};
      const mergedSectionConfig = {
        ...currentSectionConfig,
        [itemId]: normalizedConfig
      };

      const updateData = {
        _id: targetRutinaId,
        config: {
          [section]: mergedSectionConfig
        }
      };

      await clienteAxios.put(`/api/rutinas/${targetRutinaId}`, updateData);
      // Reflejar inmediatamente el cambio en UI (sin refresh completo)
      patchRutinaItemConfig(targetRutinaId, section, itemId, normalizedConfig);
      enqueueSnackbar("Configuración guardada", { variant: "success" });
      return { updated: true, config: normalizedConfig };
        
    } catch (error) {
      handleError(error, 'updateItemConfiguration', 'Error inesperado al actualizar configuración');
      return { updated: false, error: error.message };
    }
  }, [rutina, enqueueSnackbar, handleError, autoUpdateHabitPreferences, patchRutinaItemConfig]);

  // Eliminar una rutina
  const deleteRutina = useCallback(async (rutinaId) => {
    if (!rutinaId) {
      console.warn('[RutinasContext] ID de rutina no proporcionado para eliminar');
      return false;
    }
    try {
      setLoading(true);
      await rutinasService.deleteRutina(rutinaId);
      setRutinas(prevRutinas => {
        const newRutinas = prevRutinas.filter(r => r._id !== rutinaId);
        const { rutinasWithHist } = attachHistorial(newRutinas);
        if (rutina && rutina._id === rutinaId) {
          if (rutinasWithHist.length > 0) {
            setRutina({
              ...rutinasWithHist[0],
              _page: 1,
              _totalPages: rutinasWithHist.length
            });
            setCurrentPage(1);
          } else {
            setRutina(null);
            setCurrentPage(1);
          }
        }
        setTotalPages(rutinasWithHist.length);
        return rutinasWithHist;
      });
      enqueueSnackbar('Rutina eliminada correctamente', { variant: 'success' });
      return true;
    } catch (error) {
      console.error(`[RutinasContext] Error al eliminar rutina:`, error);
      enqueueSnackbar(`Error al eliminar rutina: ${error.message}`, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [rutina, enqueueSnackbar]);

  // Sincronizar rutina con configuración global
  const syncRutinaWithGlobal = useCallback(async (rutinaId) => {
    if (!rutinaId || rutinaId === 'new') {
      console.warn('[RutinasContext] No se puede sincronizar una rutina sin ID');
      return Promise.reject(new Error('ID de rutina inválido'));
    }
    
    try {
      setLoading(true);
      const resultado = await rutinasService.syncRutinaWithGlobal(rutinaId);
      
      if (resultado.updated) {
        enqueueSnackbar('Rutina sincronizada correctamente con configuración global', { variant: 'success' });
        if (rutina && rutina._id === rutinaId) {
          getRutinaById(rutinaId);
        }
      } else {
        enqueueSnackbar('No fue necesario sincronizar la rutina', { variant: 'info' });
      }
      
      return resultado;
    } catch (error) {
      console.error(`[RutinasContext] Error sincronizando rutina:`, error);
      enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' });
      return { updated: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, rutina, getRutinaById]);

  // La rutina inicial ya se establece en fetchRutinas; evitamos re-ejecuciones aquí para no duplicar llamadas
  // y reducir renders redundantes en desarrollo con React.StrictMode

  // Valores a exponer en el contexto
  const contextValue = useMemo(() => ({
    rutina,
    rutinas,
    loading,
    error,
    currentPage,
    totalPages,
    setRutina,
    fetchRutinas,
    getRutinaById,
    markItemComplete,
    handlePrevious,
    handleNext,
    updateItemConfiguration,
    patchRutinaItemConfig,
    patchRutinaSection,
    deleteRutina,
    syncRutinaWithGlobal
  }), [
    rutina,
    rutinas,
    loading,
    error,
    currentPage,
    totalPages,
    setRutina,
    fetchRutinas,
    getRutinaById,
    markItemComplete,
    handlePrevious,
    handleNext,
    updateItemConfiguration,
    patchRutinaItemConfig,
    patchRutinaSection,
    deleteRutina,
    syncRutinaWithGlobal
  ]);

  return (
    <RutinasContext.Provider value={contextValue}>
      {children}
    </RutinasContext.Provider>
  );
};

export default RutinasContext;