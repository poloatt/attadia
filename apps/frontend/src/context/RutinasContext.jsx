import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import clienteAxios from '../config/axios';
import { getNormalizedToday, toISODateString } from '../utils/dateUtils';
import { applyLocalChanges } from '../utils/localChanges';
import { useLocalPreservationState } from '../hooks/useLocalPreservationState';
import rutinasService from '../services/rutinasService';
import shouldShowItem from '../utils/shouldShowItem';
import { RutinasStatisticsProvider } from './RutinasStatisticsContext';

// Crear el contexto
const RutinasContext = createContext();

/**
 * Hook personalizado para usar el contexto de rutinas
 * NOTA: Este hook es el principal para la gestión de rutinas en la aplicación
 * y es diferente del hook useRutinasCRUD en src/hooks/useRutinas.js que maneja
 * solo operaciones CRUD básicas
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
  // Estados
  const [rutina, setRutina] = useState(null);
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { enqueueSnackbar } = useSnackbar();
  const recentlyCreatedRutinas = useRef(new Set());
  // Cambios locales preservados (centralizado en hook)
  const { pendingLocalChanges, registerLocalChange, clearLocalChanges } = useLocalPreservationState({}, {
    debug: false,
    enableStorage: true,
    storagePrefix: 'rutina_config_changes',
    preserveFields: ['tipo', 'frecuencia', 'periodo']
  });
  const [processingSubmit, setProcessingSubmit] = useState(false);
  // Referencia para evitar loops
  const isInitialMount = useRef(true);
  
  // Estado para rastrear las IDs de rutinas que han cambiado
  const [dirtyRutinasIds, setDirtyRutinasIds] = useState(new Set());

  // Marcar una rutina como modificada
  const markRutinaAsDirty = useCallback((id) => {
    setDirtyRutinasIds(prev => new Set([...prev, id]));
  }, []);

  // Declarar primero la función reloadCurrentRutina como una referencia
  const reloadCurrentRutinaRef = useRef(null);

  // Optimización para evitar logs excesivos
  const logTimers = useRef({});
  const lastLogTimes = useRef({});

  // Función para controlar logs evitando spam
  const controlledLog = useCallback((id, message, data = null, level = 'log') => {
    const now = Date.now();
    const key = `${id}_${level}`;
    
    // Limitar logs del mismo tipo a cada 3 segundos
    if (!lastLogTimes.current[key] || now - lastLogTimes.current[key] > 3000) {
      if (data) {
        console[level](`[RutinasContext] ${message}`, data);
      } else {
        console[level](`[RutinasContext] ${message}`);
      }
      lastLogTimes.current[key] = now;
      
      // Limpiar timers antiguos
      if (logTimers.current[key]) {
        clearTimeout(logTimers.current[key]);
      }
    }
  }, []);



  // Cargar rutinas
  const fetchRutinas = useCallback(async (forceReload = false) => {
    try {
      // Si ya estamos cargando, no iniciar otra petición
      if (loading) {
        console.log('[RutinasContext] Ya hay una operación de carga en curso, cancelando fetchRutinas');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Usar el servicio para obtener las rutinas
      const data = await rutinasService.getRutinas();
      
      // Extraer el array docs del objeto paginado si existe
      const rutinaList = Array.isArray(data) 
        ? data 
        : (data.docs || []);
      
      // Asegurarnos de trabajar con un array
      if (!Array.isArray(rutinaList)) {
        console.error('[RutinasContext] La respuesta no contiene un array de rutinas válido:', rutinaList);
        setError('Formato de datos incorrecto');
        setLoading(false);
        return;
      }
      
      // Ordenar rutinas por fecha (más reciente primero)
      const rutinasOrdenadas = [...rutinaList].sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
      });
      
      console.log('[RutinasContext] Rutinas ordenadas por fecha:', 
        rutinasOrdenadas.filter(r => r && r._id).map(r => ({id: r._id, fecha: new Date(r.fecha).toISOString().split('T')[0]}))
      );
      
      // Aplicar cambios locales a cada rutina antes de actualizar el estado
      const rutinasConCambiosLocales = rutinasOrdenadas.filter(r => r && r._id).map(r => applyLocalChanges(r, pendingLocalChanges));
      
      // Actualizar el total de páginas según la cantidad de rutinas
      const totalRutinas = rutinasConCambiosLocales.length;
      setTotalPages(totalRutinas);
      
      setRutinas(rutinasConCambiosLocales);
      
      // Selección simple: primero intentar la rutina de hoy, si no existe usar la más reciente
      if (rutinasConCambiosLocales.length > 0) {
        const todayStr = toISODateString(getNormalizedToday());
        const indexToday = rutinasConCambiosLocales.findIndex(r => {
          try {
            return new Date(r.fecha).toISOString().split('T')[0] === todayStr;
          } catch {
            return false;
          }
        });
        const selectedIndex = indexToday >= 0 ? indexToday : 0;
        const selected = rutinasConCambiosLocales[selectedIndex];
        setRutina({
          ...selected,
          _page: selectedIndex + 1,
          _totalPages: totalRutinas
        });
        setCurrentPage(selectedIndex + 1);
        console.log(`[RutinasContext] Seleccionada rutina inicial: posición ${selectedIndex + 1}/${totalRutinas}`);
      } else {
        setRutina(null);
        setCurrentPage(1);
      }
      
    } catch (error) {
      console.error('[RutinasContext] Error al cargar rutinas:', error);
      // Solo mostrar error si no fue cancelada deliberadamente 
      if (!error.cancelado) {
        setError('No se pudieron cargar las rutinas');
        enqueueSnackbar('Error al cargar las rutinas', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [loading, enqueueSnackbar]);

  // Función para recargar la rutina actual - definirla antes de usarla
  const reloadCurrentRutina = useCallback(async () => {
    try {
      if (!rutina || !rutina._id) {
        console.warn("[RutinasContext] No hay rutina actual para recargar");
        return;
      }
      
      console.log(`[RutinasContext] 🔄 Recargando rutina actual: ${rutina._id}`);
      
      // Forzar recarga desde el servidor con timestamp para evitar cacheo
      const response = await rutinasService.getRutinaById(rutina._id, true);
      
      if (!response) {
        throw new Error("No se pudo recargar la rutina");
      }
      
      // Actualizar la rutina en el estado y en la lista
      setRutinas(prevRutinas => {
        const updatedRutinas = [...prevRutinas];
        const index = updatedRutinas.findIndex(r => r._id === rutina._id);
        
        if (index >= 0) {
          updatedRutinas[index] = response;
        }
        
        return updatedRutinas;
      });
      
      // Preservar la página actual y actualizar la rutina
      setRutina({
        ...response,
        _page: currentPage,
        _totalPages: totalPages,
        _refreshTimestamp: Date.now() // Añadir timestamp para forzar re-renderizado
      });
      
      console.log(`[RutinasContext] ✅ Rutina recargada exitosamente`);
      
      return true;
    } catch (error) {
      console.error(`[RutinasContext] ❌ Error al recargar rutina:`, error);
      return false;
    }
  }, [rutina, currentPage, totalPages]);
  
  // Asignar la función a la referencia para usarla posteriormente
  useEffect(() => {
    reloadCurrentRutinaRef.current = reloadCurrentRutina;
  }, [reloadCurrentRutina]);

  // Cargar una rutina específica por ID
  const getRutinaById = useCallback(async (rutinaId) => {
    try {
      if (rutinaId) {
        setLoading(true);
        console.log(`[RutinasContext] Cargando rutina específica con ID: ${rutinaId}`);
        
        // Primero, verificar si ya tenemos esta rutina en nuestro array
        const rutinaEnCache = rutinas.find(r => r._id === rutinaId);
        
        let rutinaData;
        if (rutinaEnCache) {
          console.log(`[RutinasContext] Rutina encontrada en caché local`);
          rutinaData = rutinaEnCache;
        } else {
          // Si no está en caché, hacer petición al servidor
          console.log(`[RutinasContext] Rutina no encontrada en caché, solicitando al servidor`);
          const response = await rutinasService.getRutinaById(rutinaId);
          rutinaData = response;
          
          // Actualizar el array de rutinas si la rutina no estaba en caché
          setRutinas(prevRutinas => {
            const newRutinas = [...prevRutinas];
            const existingIndex = newRutinas.findIndex(r => r._id === rutinaData._id);
            
            if (existingIndex >= 0) {
              newRutinas[existingIndex] = rutinaData;
            } else {
              newRutinas.push(rutinaData);
            }
            
            return newRutinas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          });
        }
        
        // Encontrar índice para calcular la página
        const index = rutinas.findIndex(r => r._id === rutinaId);
        const page = index >= 0 ? index + 1 : 1;
        
        console.log(`[RutinasContext] Rutina encontrada en posición ${page} de ${rutinas.length}`);
        
        // Aplicar cambios locales a la rutina
        const rutinaConCambiosLocales = applyLocalChanges(rutinaData, pendingLocalChanges);
        
        // Actualizar la rutina actual
        const rutinaActualizada = {
          ...rutinaConCambiosLocales,
          _page: page,
          _totalPages: rutinas.length || 1
        };
        
        setRutina(rutinaActualizada);
        setCurrentPage(page);
        
        return rutinaActualizada;
      } else {
        console.error('[RutinasContext] Se intentó cargar una rutina sin proporcionar ID');
        enqueueSnackbar('Error: ID de rutina no proporcionado', { variant: 'error' });
        return null;
      }
    } catch (error) {
      console.error(`[RutinasContext] Error al cargar rutina con ID ${rutinaId}:`, error);
      enqueueSnackbar(`Error al cargar rutina: ${error.message}`, { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [rutinas, enqueueSnackbar]);

  // Escuchar eventos del sistema para la rutina de "hoy"
  useEffect(() => {
    const handleNavigateEvent = (event) => {
      const { direction, date } = event.detail || {};
      
      if (direction === 'today') {
        // Implementar navegación a la rutina de hoy
        console.log("[RutinasContext] 🔄 Navegando a la rutina de hoy...");
        
        // Si se proporcionó una fecha específica, buscarla
        if (date) {
          console.log("[RutinasContext] Buscando rutina para fecha específica:", date);
          
          // Buscar rutina con la fecha de hoy
          const todayRutina = rutinas.find(r => {
            const rutinaDate = new Date(r.fecha).toISOString().split('T')[0];
            return rutinaDate === date;
          });
          
          if (todayRutina) {
            console.log("[RutinasContext] ✅ Rutina encontrada para la fecha actual:", todayRutina._id);
            // Encontrar el índice para actualizar la página correctamente
            const todayIndex = rutinas.findIndex(r => r._id === todayRutina._id);
            if (todayIndex !== -1) {
              const todayPage = todayIndex + 1;
              setCurrentPage(todayPage);
              getRutinaById(todayRutina._id);
              return;
            }
          } else {
            console.log("[RutinasContext] ⚠️ No se encontró rutina para la fecha actual");
            enqueueSnackbar('No hay rutina para la fecha actual', { variant: 'info' });
          }
        }
        
        // Si no se encuentra rutina específica para hoy, ir a la primera página
        console.log("[RutinasContext] Navegando a la primera rutina disponible");
        if (rutinas.length > 0) {
          setCurrentPage(1);
          getRutinaById(rutinas[0]._id);
        }
      }
    };
    
    // Agregar evento de escucha
    window.addEventListener('navigate', handleNavigateEvent);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('navigate', handleNavigateEvent);
    };
  }, [rutinas, getRutinaById, enqueueSnackbar]);
  
  // Escuchar eventos de actualización de rutinas (crear/editar)
  useEffect(() => {
    const handleRutinaUpdated = (event) => {
      const { rutina: updatedRutina, action } = event.detail || {};
      
      console.log(`[RutinasContext] 🔄 Evento rutina-updated recibido. Acción: ${action}`);
      
      if (!updatedRutina || !updatedRutina._id) {
        console.warn('[RutinasContext] Datos de rutina incompletos en evento rutina-updated');
        return;
      }
      
      // Recargar todas las rutinas para asegurar que tenemos los datos actualizados
      if (action === 'create') {
        console.log('[RutinasContext] Nueva rutina creada, recargando datos...');
        
        // Force-reload para obtener todas las rutinas actualizadas
        fetchRutinas(true).then(() => {
          // Navegar a la rutina recién creada
          setTimeout(() => {
            getRutinaById(updatedRutina._id);
          }, 300);
        });
      } else if (action === 'update') {
        console.log('[RutinasContext] Rutina actualizada, recargando datos...');
        
        // Si es la rutina actual, recargarla específicamente
        if (rutina && rutina._id === updatedRutina._id) {
          if (reloadCurrentRutinaRef.current) {
            reloadCurrentRutinaRef.current();
          }
        } else {
          // Actualizar la lista de rutinas
          fetchRutinas(true);
        }
      }
    };
    
    // Registrar el evento
    window.addEventListener('rutina-updated', handleRutinaUpdated);
    
    return () => {
      window.removeEventListener('rutina-updated', handleRutinaUpdated);
    };
  }, [rutina, fetchRutinas, getRutinaById]);
  
  // Navegación entre rutinas mejorada
  const handlePrevious = useCallback(async () => {
    if (currentPage > 1 && !loading) {
      try {
        console.log('[RutinasContext] 🔄 Navegando hacia atrás desde registro', currentPage, 'de', totalPages);
        
        // Calcular el índice correcto del array para la rutina anterior
        const newPage = currentPage - 1;
        console.log(`[RutinasContext] Calculada nueva posición: ${newPage}`);
        
        // Verificar que el índice es válido
        if (newPage <= 0 || newPage > rutinas.length) {
          console.error(`[RutinasContext] ⚠️ Índice de rutina inválido: ${newPage}`);
          return;
        }
        
        // Verificar que la rutina existe en el array
        const index = newPage - 1;
        const rutinaAnterior = rutinas[index];
        
        if (!rutinaAnterior || !rutinaAnterior._id) {
          console.error(`[RutinasContext] ⚠️ No se encontró rutina en la posición ${index}:`, rutinaAnterior);
          return;
        }
        
        console.log(`[RutinasContext] Navegando a rutina anterior: ${rutinaAnterior._id} (${rutinaAnterior.fecha})`);
        
        // Aplicar cambios locales a la rutina
        const rutinaConCambios = applyLocalChanges(rutinaAnterior, pendingLocalChanges);
        
        // Actualizar el estado con la rutina anterior
        setRutina({
          ...rutinaConCambios,
          _page: newPage,
          _totalPages: totalPages
        });
        
        // Actualizar la página actual
        setCurrentPage(newPage);
        
        console.log(`[RutinasContext] ✅ Navegación a registro anterior completada: ${newPage}/${totalPages}`);
      } catch (error) {
        console.error('[RutinasContext] ❌ Error navegando a la rutina anterior:', error);
        enqueueSnackbar('Error al navegar a la rutina anterior', { variant: 'error' });
      }
    } else {
      console.log('[RutinasContext] ⚠️ No se puede navegar hacia atrás', { currentPage, loading });
      if (currentPage <= 1) {
        enqueueSnackbar('Ya estás en la rutina más reciente', { variant: 'info' });
      }
    }
  }, [currentPage, totalPages, loading, rutinas, enqueueSnackbar, pendingLocalChanges]);

  const handleNext = useCallback(async () => {
    if (currentPage < totalPages && !loading) {
      try {
        console.log('[RutinasContext] 🔄 Navegando hacia adelante desde registro', currentPage, 'de', totalPages);
        
        // Calcular el índice correcto del array para la rutina siguiente
        const newPage = currentPage + 1;
        console.log(`[RutinasContext] Calculada nueva posición: ${newPage}`);
        
        // Verificar que el índice es válido
        if (newPage <= 0 || newPage > rutinas.length) {
          console.error(`[RutinasContext] ⚠️ Índice de rutina inválido: ${newPage}`);
          return;
        }
        
        // Verificar que la rutina existe en el array
        const index = newPage - 1;
        const rutinaSiguiente = rutinas[index];
        
        if (!rutinaSiguiente || !rutinaSiguiente._id) {
          console.error(`[RutinasContext] ⚠️ No se encontró rutina en la posición ${index}:`, rutinaSiguiente);
          return;
        }
        
        console.log(`[RutinasContext] Navegando a rutina siguiente: ${rutinaSiguiente._id} (${rutinaSiguiente.fecha})`);
        
        // Aplicar cambios locales a la rutina
        const rutinaConCambios = applyLocalChanges(rutinaSiguiente, pendingLocalChanges);
        
        // Actualizar el estado con la rutina siguiente
        setRutina({
          ...rutinaConCambios,
          _page: newPage,
          _totalPages: totalPages
        });
        
        // Actualizar la página actual
        setCurrentPage(newPage);
        
        console.log(`[RutinasContext] ✅ Navegación a registro siguiente completada: ${newPage}/${totalPages}`);
      } catch (error) {
        console.error('[RutinasContext] ❌ Error navegando a la rutina siguiente:', error);
        enqueueSnackbar('Error al navegar a la rutina siguiente', { variant: 'error' });
      }
    } else {
      console.log('[RutinasContext] ⚠️ No se puede navegar hacia adelante', { currentPage, totalPages, loading });
      if (currentPage >= totalPages) {
        enqueueSnackbar('Ya estás en la rutina más antigua', { variant: 'info' });
      }
    }
  }, [currentPage, totalPages, loading, rutinas, enqueueSnackbar, pendingLocalChanges]);

  // Actualizar la completitud de una rutina después de marcar un ítem
  const actualizarCompletitudRutina = (rutinaId, responseData) => {
    // Buscar la rutina en el array
    const index = rutinas.findIndex(r => r._id === rutinaId);
    if (index === -1) return;

    // Si el backend proporciona un valor de completitud, usarlo
    if (responseData && typeof responseData.completitud === 'number') {
      const completitudDecimal = responseData.completitud;
      const completitudPorcentaje = Math.round(completitudDecimal * 100);
      
      console.log(`[RutinasContext] Actualizando completitud con valor del servidor: ${completitudDecimal} (${completitudPorcentaje}%)`);
      
      // Actualizar la rutina con la completitud proporcionada por el servidor
      setRutinas(prev => {
        const nuevasRutinas = [...prev];
        nuevasRutinas[index] = {
          ...nuevasRutinas[index],
          completitud: completitudDecimal
        };
        return nuevasRutinas;
      });
      
      // Actualizar la rutina actual si es la misma
      if (rutina && rutina._id === rutinaId) {
        setRutina(prev => ({
          ...prev,
          completitud: completitudDecimal
        }));
      }
    } else {
      // Si no hay valor del servidor, recalcular
      import("../utils/rutinaCalculations.js").then(({ calculateCompletionPercentage }) => {
        const rutinaActual = rutinas[index];
        const porcentaje = calculateCompletionPercentage(rutinaActual);
        const completitudDecimal = porcentaje / 100;
        
        console.log(`[RutinasContext] Recalculando completitud localmente: ${completitudDecimal} (${porcentaje}%)`);
        
        // Actualizar la rutina con el valor calculado
        setRutinas(prev => {
          const nuevasRutinas = [...prev];
          nuevasRutinas[index] = {
            ...nuevasRutinas[index],
            completitud: completitudDecimal
          };
          return nuevasRutinas;
        });
        
        // Actualizar la rutina actual si es la misma
        if (rutina && rutina._id === rutinaId) {
          setRutina(prev => ({
            ...prev,
            completitud: completitudDecimal
          }));
        }
      });
    }
  };

  /**
   * Actualiza localmente una rutina (optimistic update)
   * @param {string} rutinaId - ID de la rutina
   * @param {string} section - Sección del ítem
   * @param {object} data - Datos a actualizar
   */
  const updateLocalRutina = useCallback((rutinaId, section, data) => {
    // Actualizar en el array de rutinas
    setRutinas(prev => {
      return prev.map(r => {
        if (r._id === rutinaId) {
          return {
            ...r,
            [section]: {
              ...r[section],
              ...data
            }
          };
        }
        return r;
      });
    });
    
    // Actualizar la rutina actual si es la misma
    if (rutina && rutina._id === rutinaId) {
      setRutina(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          ...data
        }
      }));
    }
  }, [rutina]);

  /**
   * Marca un ítem como completado o no completado en la rutina
   * @param {string} rutinaId - ID de la rutina
   * @param {string} section - Sección del ítem (bodyCare, ejercicio, etc)
   * @param {object} data - Objeto con el estado de completado (ej: {gym: true})
   * @returns {Promise<any>} - Promesa con el resultado
   */
  const markItemComplete = useCallback(async (rutinaId, section, data) => {
    // Validación básica
    if (!rutinaId || !section || !data) {
      console.error('[RutinasContext] Datos incompletos para marcar ítem');
      return;
    }
    
    try {
      console.log(`[RutinasContext] Marcando ítem en rutina ${rutinaId}, sección ${section}:`, data);
      
      // Extraer el primer ítem del objeto (solo actualizamos uno a la vez)
      const [itemId, isCompleted] = Object.entries(data)[0];
      console.log(`[RutinasContext] Item: ${itemId}, Completado: ${isCompleted}`);
      
      // Optimistic update: actualizar UI inmediatamente
      updateLocalRutina(rutinaId, section, data);
      
      // Actualizar en el servidor
      const response = await rutinasService.markComplete(rutinaId, section, data);
      console.log(`[RutinasContext] ✅ Actualización exitosa para ${section}.${itemId}`);
      
      // Actualizar UI con los datos del servidor
      const index = rutinas.findIndex(r => r._id === rutinaId);
      if (index !== -1) {
        console.log(`[RutinasContext] Actualizando UI para rutina ${rutinaId} en posición ${index + 1}`);
        
        // Usar la nueva función para actualizar la completitud
        actualizarCompletitudRutina(rutinaId, response);
        
        console.log(`[RutinasContext] UI actualizada con datos del servidor para rutina ${rutinaId}`);
      }
      
      return response;
    } catch (error) {
      console.error('[RutinasContext] Error al marcar ítem:', error);
      enqueueSnackbar('Error al marcar ítem', { variant: 'error' });
      throw error;
    }
  }, [rutinas, enqueueSnackbar, updateLocalRutina]);

  // Guardar cambios locales para una rutina
  const saveLocalChangesForRutina = useCallback((rutinaId, section, itemId, config) => {
    console.log(`[RutinasContext] 🔐 Guardando cambios locales para ${rutinaId}, ${section}.${itemId}:`, JSON.stringify(config));
    
    // Normalizar explícitamente los tipos de datos para asegurar consistencia
    const normalizedConfig = {
      ...config,
      tipo: (config.tipo || 'DIARIO').toUpperCase(),
      frecuencia: Number(config.frecuencia || 1),
      activo: config.activo !== undefined ? Boolean(config.activo) : true,
      diasSemana: config.diasSemana || [],
      diasMes: config.diasMes || [],
      periodo: config.periodo || 'CADA_DIA',
      // Nuevos campos normalizados
      esPreferenciaUsuario: config.esPreferenciaUsuario !== undefined ? Boolean(config.esPreferenciaUsuario) : true,
      ultimaActualizacion: config.ultimaActualizacion || new Date().toISOString(),
      diasCompletados: Number(config.diasCompletados || 0),
      diasConsecutivos: Number(config.diasConsecutivos || 0)
    };
    // Registrar cambios locales preservables mediante el hook centralizado
    registerLocalChange(section, itemId, normalizedConfig);
    
    // Marcar la rutina como modificada
    markRutinaAsDirty(rutinaId);
    
    // Aplicar cambios a la rutina actual si corresponde
    if (rutina && rutina._id === rutinaId) {
      setRutina(prevRutina => {
        // Crear copia profunda para evitar modificaciones no deseadas
        const updatedRutina = {...prevRutina};
        
        // Asegurar que la estructura existe
        if (!updatedRutina.config) updatedRutina.config = {};
        if (!updatedRutina.config[section]) updatedRutina.config[section] = {};
        
        // Actualizar la configuración
        updatedRutina.config[section][itemId] = {...normalizedConfig};
        
        console.log(`[RutinasContext] 🔄 Actualizando rutina actual con nueva configuración para ${section}.${itemId}`);
        return updatedRutina;
      });
      
      // Enviar cambios directamente al servidor
      console.log(`[RutinasContext] 📡 Enviando actualización al servidor para rutina ${rutinaId}, sección ${section}, item ${itemId}`);
      
      // Datos para enviar al servidor
      const updateData = {
        _id: rutinaId,
        config: {
          [section]: {
            [itemId]: normalizedConfig
          }
        }
      };
      
      // También actualizar las preferencias de usuario si está marcado como preferencia
      if (normalizedConfig.esPreferenciaUsuario) {
        // Crear estructura para actualizar las preferencias de usuario
        updateData.userPreferences = {
          habits: {
            [section]: {
              [itemId]: {
                ...normalizedConfig,
                lastSyncedWithRutina: rutinaId // Guardar referencia de qué rutina generó esta preferencia
              }
            }
          }
        };
        
        console.log(`[RutinasContext] 🔄 También actualizando preferencias de usuario para ${section}.${itemId}`);
      }
      
      // Enviar cambios al servidor
      clienteAxios.put(`/api/rutinas/${rutinaId}`, updateData)
        .then(response => {
          console.log(`[RutinasContext] ✅ Servidor actualizó configuración correctamente para ${section}.${itemId}:`, 
            JSON.stringify(response.data?.config?.[section]?.[itemId] || "Sin datos de respuesta"));
          
          // Si se actualizaron también las preferencias de usuario, mostrar confirmación
          if (normalizedConfig.esPreferenciaUsuario && response.data?.userPreferences?.updated) {
            console.log(`[RutinasContext] ✅ Preferencias de usuario también actualizadas`);
            enqueueSnackbar('Preferencias de hábito guardadas correctamente', { variant: 'success' });
          }
        })
        .catch(error => {
          console.error(`[RutinasContext] ❌ Error al actualizar ${section}.${itemId} en servidor:`, error.message);
          console.error(`[RutinasContext] Detalles del error:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          
          // Mostrar notificación de error
          enqueueSnackbar(`Error al guardar: ${error.response?.data?.message || error.message}`, { variant: 'error' });
        });
    } else {
      console.log(`[RutinasContext] ℹ️ No se actualizó el servidor porque la rutina actual (${rutina?._id}) no es la misma que se modificó (${rutinaId})`);
    }
    
    return pendingLocalChanges;
  }, [markRutinaAsDirty, rutina, enqueueSnackbar, registerLocalChange, pendingLocalChanges]);

  // Carga inicial simplificada: si no hay datos, cargar automáticamente una vez
  useEffect(() => {
    if (!loading && rutinas.length === 0) {
      fetchRutinas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejo inicial de la rutina cuando se cargan las rutinas
  useEffect(() => {
    if (rutinas.length > 0 && !rutina && !loading) {
      console.log("Inicializando rutina después de cargar rutinas");
      getRutinaById(rutinas[0]._id);
    }
  }, [rutinas, rutina, loading, getRutinaById]);

  // Cargar preferencias de hábitos del usuario
  const fetchUserHabitPreferences = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[RutinasContext] Cargando preferencias de hábitos del usuario');
      
      const preferencias = await rutinasService.getUserHabitPreferences();
      console.log('[RutinasContext] Preferencias cargadas:', preferencias);
      
      return preferencias;
    } catch (error) {
      console.error('[RutinasContext] Error al cargar preferencias:', error);
      enqueueSnackbar('Error al cargar preferencias de hábitos', { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);
  
  // Aplicar preferencias de usuario a una rutina específica
  const applyUserPreferencesToRutina = useCallback(async (rutinaId) => {
    try {
      if (!rutinaId || rutinaId === 'new') {
        console.warn('[RutinasContext] No se puede aplicar preferencias a una rutina sin ID');
        return null;
      }
      
      setLoading(true);
      console.log(`[RutinasContext] Aplicando preferencias de usuario a rutina ${rutinaId}`);
      
      const resultado = await rutinasService.syncRutinaWithUserPreferences(rutinaId);
      
      // Refrescar la rutina con los cambios aplicados
      if (resultado.updated) {
        await getRutinaById(rutinaId);
        enqueueSnackbar('Preferencias de usuario aplicadas', { variant: 'success' });
      }
      
      return resultado;
    } catch (error) {
      console.error('[RutinasContext] Error al aplicar preferencias:', error);
      enqueueSnackbar('Error al aplicar preferencias de usuario', { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, getRutinaById]);
  
  // Actualizar preferencia de usuario para un hábito
  const updateUserHabitPreference = useCallback(async (section, itemId, config) => {
    if (!section || !itemId || !config) {
      controlledLog('preference_error', 'Datos incompletos para actualizar preferencia', 
        { section, itemId }, 'warn');
      return { updated: false, error: "Datos incompletos" };
    }
    
    try {
      setLoading(true);
      controlledLog('preference_update', `Actualizando preferencia para ${section}.${itemId}`, config);
      
      // Actualizar el estado de la rutina con los nuevos datos
      const updatedConfig = {
        ...config,
        esPreferenciaUsuario: true,
        ultimaActualizacion: new Date().toISOString()
      };
      
      // Usar el método renombrado del servicio y mejorar manejo de respuesta
      const response = await rutinasService.updateUserHabitPreference(
        section, 
        itemId, 
        updatedConfig
      );
      
      // Mejor manejo de respuesta
      if (response.updated) {
        controlledLog('preference_success', `Preferencia ${section}.${itemId} actualizada correctamente`);
        
        // Verificar si tenemos una advertencia pero se pudo actualizar
        if (response.warning) {
          console.warn(`[RutinasContext] ⚠️ Advertencia al actualizar preferencia:`, response.warning);
          enqueueSnackbar('Preferencia actualizada con advertencia', { variant: 'warning' });
        }
        
        setLoading(false);
        return { updated: true, preferences: response.preferences };
      } else {
        controlledLog('preference_warning', `Respuesta inesperada al actualizar preferencia:`, 
          response, 'warn');
        
        setLoading(false);
        
        // Mostrar error amigable en la UI
        const errorMessage = response.error || "Respuesta vacía o inesperada del servidor";
        enqueueSnackbar(errorMessage, { variant: 'warning' });
        
        return { 
          updated: false, 
          error: errorMessage,
          detail: response.detail || null
        };
      }
    } catch (error) {
      controlledLog('preference_error', `Error al actualizar preferencia de usuario:`, 
        error, 'error');
        
      setError(error.message || "Error al guardar preferencia");
      setLoading(false);
      
      // Mostrar error en la UI
      enqueueSnackbar(`Error: ${error.message || "Error desconocido"}`, { variant: 'error' });
      
      return { 
        updated: false, 
        error: error.message || "Error desconocido",
        detail: error
      };
    }
  }, [rutina, setRutina, setLoading, setError, controlledLog, enqueueSnackbar]);

  // Función para actualizar el estado de expansión de las secciones
  const updateSectionExpandedState = useCallback((section, isExpanded) => {
    if (!rutina) return;
    
    setRutina(prevRutina => {
      // Crear copia de la rutina para no mutar el estado
      const updatedRutina = {...prevRutina};
      
      // Asegurar que existe la estructura para el estado de UI
      if (!updatedRutina._expandedSections) {
        updatedRutina._expandedSections = {};
      }
      
      // Actualizar el estado de expansión para esta sección
      updatedRutina._expandedSections[section] = isExpanded;
      
      return updatedRutina;
    });
  }, [rutina]);
  
  // Escuchar eventos personalizados para el estado de expansión
  useEffect(() => {
    const handleSectionExpanded = (event) => {
      const { section, isExpanded, rutinaId } = event.detail;
      
      // Solo actualizar si la rutina coincide
      if (rutinaId === rutina?._id) {
        updateSectionExpandedState(section, isExpanded);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('sectionExpanded', handleSectionExpanded);
      
      return () => {
        window.removeEventListener('sectionExpanded', handleSectionExpanded);
      };
    }
  }, [rutina, updateSectionExpandedState]);

  // Implementar función de actualización de config para un ítem concreto
  const updateItemConfig = useCallback(async (seccion, itemId, config) => {
    if (!rutina || !rutina._id) {
      console.warn("[RutinasContext] No hay rutina actual para actualizar configuración");
      enqueueSnackbar("No hay rutina actual para guardar la configuración", { variant: "warning" });
      return false;
    }
    
    try {
      // Mostrar indicador de carga sutil sin bloquear la interfaz
      // setLoading(true); // Comentamos esto para evitar bloquear la UI
      
      console.log(`[RutinasContext] 📝 Actualizando configuración para ${seccion}.${itemId}:`, config);
      
      // Guardar el estado de expansión actual
      const previousRutinaState = {...rutina};
      
      // Aplicar el cambio localmente para mejor UX
      setRutina(prevRutina => {
        if (!prevRutina) return prevRutina;
        
        // Crear estructura de configuración si no existe
        const newConfig = { ...(prevRutina.config || {}) };
        if (!newConfig[seccion]) newConfig[seccion] = {};
        
        // Actualizar la configuración específica
        newConfig[seccion] = {
          ...(newConfig[seccion] || {}),
          [itemId]: {
            ...config,
            _timestamp: Date.now() // Forzar actualización en componentes
          }
        };
        
        // Retornar la rutina actualizada con timestamp para forzar re-renderizado
        return {
          ...prevRutina,
          config: newConfig,
          _uiRefreshTimestamp: Date.now(),
          // Mantener cualquier otro estado como la expansión
          _expandedSections: prevRutina._expandedSections || {}
        };
      });
      
      try {
        // Guardar en el backend
        const result = await rutinasService.updateItemConfig(
          rutina._id, 
          seccion, 
          itemId, 
          config
        );
        
        // Recargar de forma silenciosa sin actualizar toda la UI
        setTimeout(async () => {
          try {
            // Obtener los nuevos datos
            const updatedRutina = await rutinasService.getRutinaById(rutina._id, true);
            
            // Actualizar solo los datos sin afectar el estado de UI
            if (updatedRutina) {
              setRutina(prevRutina => {
                // Combinar los datos nuevos con el estado de UI actual
                return {
                  ...updatedRutina,
                  _page: prevRutina._page,
                  _totalPages: prevRutina._totalPages,
                  _refreshTimestamp: Date.now(),
                  // Preservar el estado de expansión
                  _expandedSections: prevRutina._expandedSections || {}
                };
              });
            }
          } catch (reloadError) {
            console.error(`[RutinasContext] Error en la recarga silenciosa:`, reloadError);
            // No mostrar error al usuario porque la actualización principal ya funcionó
          }
        }, 800);
        
        console.log(`[RutinasContext] ✅ Configuración guardada exitosamente`);
        enqueueSnackbar("Configuración guardada", { variant: "success" });
        
        return true;
      } catch (error) {
        console.error(`[RutinasContext] ❌ Error al enviar configuración al servidor:`, error);
        
        // Restaurar estado previo en caso de error
        setRutina(previousRutinaState);
        
        enqueueSnackbar(`Error al guardar la configuración: ${error.message}`, { variant: "error" });
        return false;
      }
    } catch (error) {
      console.error(`[RutinasContext] ❌ Error al actualizar configuración:`, error);
      enqueueSnackbar(`Error al guardar la configuración: ${error.message}`, { variant: "error" });
      return false;
    } finally {
      // setLoading(false); // Comentamos esto para evitar bloquear la UI
    }
  }, [rutina, enqueueSnackbar]);

  // Función para eliminar una rutina
  const deleteRutina = useCallback(async (rutinaId) => {
    if (!rutinaId) {
      console.warn('[RutinasContext] ID de rutina no proporcionado para eliminar');
      return false;
    }
    try {
      setLoading(true);
      console.log(`[RutinasContext] Eliminando rutina ${rutinaId}...`);
      await rutinasService.deleteRutina(rutinaId);
      setRutinas(prevRutinas => {
        const newRutinas = prevRutinas.filter(r => r._id !== rutinaId);
        // Si la rutina eliminada era la seleccionada, seleccionar la siguiente más reciente
        if (rutina && rutina._id === rutinaId) {
          if (newRutinas.length > 0) {
            setRutina({
              ...newRutinas[0],
              _page: 1,
              _totalPages: newRutinas.length
            });
            setCurrentPage(1);
          } else {
            setRutina(null);
            setCurrentPage(1);
          }
        }
        setTotalPages(newRutinas.length);
        return newRutinas;
      });
      console.log(`[RutinasContext] ✅ Rutina eliminada exitosamente`);
      enqueueSnackbar('Rutina eliminada correctamente', { variant: 'success' });
      return true;
    } catch (error) {
      console.error(`[RutinasContext] ❌ Error al eliminar rutina:`, error);
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
      console.log(`[RutinasContext] Sincronizando rutina ${rutinaId} con configuración global...`);
      
      // Llamar al servicio para sincronizar
      const resultado = await rutinasService.syncRutinaWithGlobal(rutinaId);
      
      if (resultado.updated) {
        enqueueSnackbar('Rutina sincronizada correctamente con configuración global', { variant: 'success' });
        
        // Recargar la rutina para mostrar los cambios
        if (rutina && rutina._id === rutinaId && reloadCurrentRutinaRef.current) {
          await reloadCurrentRutinaRef.current();
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
  }, [enqueueSnackbar, rutina]);

  // Valores a exponer en el contexto
  const contextValue = {
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
    saveLocalChangesForRutina,
    pendingLocalChanges,
    deleteRutina,
    syncRutinaWithGlobal,
    applyUserPreferencesToRutina,
    updateUserHabitPreference,
    updateItemConfig,
    reloadCurrentRutina,
    updateSectionExpandedState
  };

  return (
    <RutinasContext.Provider value={contextValue}>
      <RutinasStatisticsProvider>
        {children}
      </RutinasStatisticsProvider>
    </RutinasContext.Provider>
  );
};

export default RutinasContext; 
