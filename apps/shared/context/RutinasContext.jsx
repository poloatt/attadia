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
        // Importante: merge para soportar updates parciales (ej. { [itemId]: true/false })
        // sin pisar el resto de ítems ya marcados en esa sección.
        const prevSection = (r && r[section] && typeof r[section] === 'object') ? r[section] : {};
        return { ...r, [section]: { ...prevSection, ...(nextSectionData || {}) } };
      });
      // Recalcular historial para PERSONALIZADO y coherencia de completion
      const { rutinasWithHist } = attachHistorial(updated);
      return rutinasWithHist;
    });

    setRutina(prev => {
      if (!prev || prev._id !== rutinaId) return prev;
      const prevSection = (prev && prev[section] && typeof prev[section] === 'object') ? prev[section] : {};
      return { ...prev, [section]: { ...prevSection, ...(nextSectionData || {}) } };
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

      // Importante: el backend puede actualizar MÁS cosas que el checkmark (ej. contadores de progreso en config).
      // Si solo parcheamos `{ [itemId]: boolean }`, la lógica de visibilidad (cadencia) puede quedar desincronizada
      // hasta el próximo fetch. Por eso, integramos `response` en rutina + lista y recalculamos historial.
      if (response && typeof response === 'object') {
        setRutinas(prevList => {
          if (!Array.isArray(prevList)) return prevList;
          const updated = prevList.map(r => (r && r._id === rutinaId ? { ...r, ...response } : r));
          const { rutinasWithHist } = attachHistorial(updated);
          return rutinasWithHist;
        });

        setRutina(prev => {
          if (!prev || prev._id !== rutinaId) return prev;
          // Mantener paginación si existía
          const next = { ...prev, ...response };
          if (prev._page !== undefined) next._page = prev._page;
          if (prev._totalPages !== undefined) next._totalPages = prev._totalPages;
          // Mantener historial existente si no vino en response (attachHistorial lo recalcula en la lista)
          if (!next.historial && prev.historial) next.historial = prev.historial;
          return next;
        });
      } else {
        // Fallback: al menos reflejar el cambio de checkmarks localmente
        patchRutinaSection(rutinaId, section, data);
      }
      
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
    if (!rutinaId || !section || !itemId || !nextConfig) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:390',message:'patchRutinaItemConfig: missing params',data:{rutinaId,section,itemId,hasNextConfig:!!nextConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'sync'})}).catch(()=>{});
      // #endregion
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:393',message:'patchRutinaItemConfig called',data:{rutinaId,section,itemId,hasRutina:!!rutina?._id,rutinaMatches:rutina?._id===rutinaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'sync'})}).catch(()=>{});
    // #endregion

    // 1) Rutina seleccionada - CRÍTICO: Crear nuevo objeto para forzar re-render
    setRutina(prev => {
      if (!prev || prev._id !== rutinaId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:400',message:'patchRutinaItemConfig: rutina no match',data:{rutinaId,prevId:prev?._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'sync'})}).catch(()=>{});
        // #endregion
        return prev;
      }
      const prevConfig = prev.config || {};
      const prevSection = prevConfig[section] || {};
      const updated = {
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:420',message:'patchRutinaItemConfig: updating rutina',data:{rutinaId,section,itemId,configUpdated:!!updated.config[section]?.[itemId],configValue:JSON.stringify(updated.config[section]?.[itemId]).substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'sync'})}).catch(()=>{});
      // #endregion
      return updated;
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

  // Actualizar preferencia de hábito del usuario (preferencias globales + rutina actual)
  // IMPORTANTE: Esta función debe definirse ANTES de updateItemConfiguration porque updateItemConfiguration la usa
  const updateUserHabitPreference = useCallback(async (section, itemId, config, applyToCurrentRutina = true) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:439',message:'updateUserHabitPreference called',data:{section,itemId,config,applyToCurrentRutina,hasRutina:!!rutina?._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      // Normalizar configuración
      const normalizedConfig = {
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(config.frecuencia || 1),
        activo: config.activo !== undefined ? Boolean(config.activo) : true,
        periodo: config.periodo || 'CADA_DIA',
        diasSemana: Array.isArray(config.diasSemana) ? [...config.diasSemana] : [],
        diasMes: Array.isArray(config.diasMes) ? [...config.diasMes] : [],
        esPreferenciaUsuario: true,
        ultimaActualizacion: new Date().toISOString()
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:454',message:'Before API call to update preferences',data:{section,itemId,normalizedConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Actualizar preferencias globales del usuario
      await clienteAxios.put('/api/users/preferences/habits', {
        habits: {
          [section]: {
            [itemId]: normalizedConfig
          }
        }
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:463',message:'After API call, before patchRutinaItemConfig',data:{section,itemId,applyToCurrentRutina,hasRutina:!!rutina?._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Si hay una rutina actual y se solicita aplicar a la rutina actual, actualizarla también
      if (applyToCurrentRutina && rutina?._id) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:474',message:'Calling patchRutinaItemConfig',data:{rutinaId:rutina._id,section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'sync'})}).catch(()=>{});
        // #endregion
        // CRÍTICO: Actualizar la rutina en el contexto para que RutinaTable y RutinaCard se actualicen automáticamente
        patchRutinaItemConfig(rutina._id, section, itemId, normalizedConfig);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:478',message:'patchRutinaItemConfig called, rutina should update',data:{rutinaId:rutina._id,section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'sync'})}).catch(()=>{});
        // #endregion
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:467',message:'updateUserHabitPreference success',data:{section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return { updated: true, config: normalizedConfig };
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:469',message:'updateUserHabitPreference error',data:{section,itemId,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[RutinasContext] Error al actualizar preferencia de hábito:', error);
      enqueueSnackbar('Error al actualizar preferencia', { variant: 'error' });
      return { updated: false, error: error.message };
    }
  }, [rutina, enqueueSnackbar, patchRutinaItemConfig]);

  // Actualizar configuración de ítems
  const updateItemConfiguration = useCallback(async (section, itemId, config, options = {}) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:518',message:'updateItemConfiguration called',data:{section,itemId,options,hasRutina:!!rutina?._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
    // #endregion
    const { isGlobal = autoUpdateHabitPreferences, rutinaId = null } = options;
    
    if (!section || !itemId || !config) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:523',message:'updateItemConfiguration: missing params',data:{section,itemId,hasConfig:!!config},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion
      handleError(new Error('Datos incompletos para actualizar configuración'), 'updateItemConfiguration', 'Datos incompletos');
      return { updated: false, error: "Datos incompletos" };
    }

    const targetRutinaId = rutinaId || rutina?._id;
    if (!targetRutinaId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:529',message:'updateItemConfiguration: no rutina',data:{rutinaId,targetRutinaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion
      handleError(new Error('No hay rutina para actualizar'), 'updateItemConfiguration', 'No hay rutina actual');
      return { updated: false, error: "No hay rutina actual" };
    }

    try {
      // Normalizar configuración - incluir todos los campos necesarios
      const normalizedConfig = {
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(config.frecuencia || 1),
        activo: config.activo !== undefined ? Boolean(config.activo) : true,
        periodo: config.periodo || 'CADA_DIA',
        diasSemana: Array.isArray(config.diasSemana) ? [...config.diasSemana] : [],
        diasMes: Array.isArray(config.diasMes) ? [...config.diasMes] : [],
        esPreferenciaUsuario: config.esPreferenciaUsuario !== undefined ? Boolean(config.esPreferenciaUsuario) : true,
        ultimaActualizacion: new Date().toISOString()
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:545',message:'updateItemConfiguration: before updateUserHabitPreference',data:{section,itemId,isGlobal,normalizedConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion

      // Actualizar preferencias globales si es necesario
      // NOTA: updateUserHabitPreference ya actualiza la rutina actual, así que no necesitamos hacerlo dos veces
      // Pero aquí solo actualizamos preferencias, la rutina se actualiza después
      if (isGlobal) {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:551',message:'updateItemConfiguration: calling updateUserHabitPreference',data:{section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
          // #endregion
          // Usar la función del contexto que actualiza preferencias y rutina actual
          const prefResult = await updateUserHabitPreference(section, itemId, normalizedConfig, true);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:555',message:'updateItemConfiguration: updateUserHabitPreference result',data:{section,itemId,prefResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
          // #endregion
          if (!prefResult || !prefResult.updated) {
            console.warn(`[RutinasContext] updateUserHabitPreference no completó correctamente para ${section}.${itemId}`);
          }
        } catch (prefError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:560',message:'updateItemConfiguration: updateUserHabitPreference error',data:{section,itemId,error:prefError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
          // #endregion
          console.error(`[RutinasContext] Error al actualizar preferencia global:`, prefError);
        }
      }

      // Enviar al servidor - IMPORTANTE: Solo si NO es global o si necesitamos actualizar la rutina específica
      // Si isGlobal es true, updateUserHabitPreference ya actualizó las preferencias y la rutina actual
      // Pero aún necesitamos actualizar la rutina específica en el backend para persistencia
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:590',message:'updateItemConfiguration: updating rutina in backend',data:{targetRutinaId,section,itemId,isGlobal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion

      await clienteAxios.put(`/api/rutinas/${targetRutinaId}`, updateData);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:600',message:'updateItemConfiguration: backend updated, calling patchRutinaItemConfig',data:{targetRutinaId,section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion
      
      // Reflejar inmediatamente el cambio en UI (sin refresh completo)
      // NOTA: Si isGlobal es true, patchRutinaItemConfig ya fue llamado por updateUserHabitPreference
      // Pero lo llamamos de nuevo para asegurar que la UI se actualiza
      patchRutinaItemConfig(targetRutinaId, section, itemId, normalizedConfig);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasContext.jsx:608',message:'updateItemConfiguration: success',data:{section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion
      
      enqueueSnackbar("Configuración guardada", { variant: "success" });
      return { updated: true, config: normalizedConfig };
        
    } catch (error) {
      handleError(error, 'updateItemConfiguration', 'Error inesperado al actualizar configuración');
      return { updated: false, error: error.message };
    }
  }, [rutina, enqueueSnackbar, handleError, autoUpdateHabitPreferences, patchRutinaItemConfig, updateUserHabitPreference]);

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
    syncRutinaWithGlobal,
    updateUserHabitPreference
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
    syncRutinaWithGlobal,
    updateUserHabitPreference
  ]);

  return (
    <RutinasContext.Provider value={contextValue}>
      {children}
    </RutinasContext.Provider>
  );
};

export default RutinasContext;