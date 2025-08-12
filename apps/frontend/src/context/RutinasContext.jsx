import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import clienteAxios from '../config/axios';
import { getNormalizedToday, toISODateString, parseAPIDate } from '../utils/dateUtils';
import { applyLocalChanges } from '../utils/localChanges';
import { useLocalPreservationState } from '../hooks/useLocalPreservationState';
import rutinasService from '../services/rutinasService';
import { useUISettings } from './UISettingsContext';
import { RutinasStatisticsProvider } from './RutinasStatisticsContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { reconcileRoutineProgressFromRecords } from '../utils/progressUtils';

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
  const { autoUpdateHabitPreferences } = useUISettings();
  // Cache simple de preferencias para esta sesión
  const userPrefsRef = useRef(null);

  const mergeProgressFromPrefs = useCallback((rutinaObj, prefs) => {
    try {
      if (!rutinaObj || !prefs) return rutinaObj;
      const fechaRutina = parseAPIDate(rutinaObj.fecha) || new Date();
      const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
      const merged = { ...rutinaObj, config: { ...(rutinaObj.config || {}) } };
      sections.forEach(section => {
        if (!merged.config[section]) merged.config[section] = {};
        const secPrefs = prefs[section] || {};

        // Asegurar que también consideramos ítems presentes solo en preferencias
        const itemIds = new Set([
          ...Object.keys(merged.config[section] || {}),
          ...Object.keys(secPrefs || {})
        ]);

        itemIds.forEach(itemId => {
          const itemCfg = merged.config[section][itemId] || {};
          const prefCfg = secPrefs[itemId] || {};

          // Normalizar base
          const baseCfg = {
            ...itemCfg,
            tipo: (itemCfg?.tipo || prefCfg?.tipo || 'DIARIO').toUpperCase(),
            frecuencia: Number(itemCfg?.frecuencia != null ? itemCfg.frecuencia : (prefCfg?.frecuencia != null ? prefCfg.frecuencia : 1)),
            periodo: itemCfg?.periodo || prefCfg?.periodo || 'CADA_DIA',
            activo: itemCfg?.activo !== false ? true : (prefCfg?.activo !== false)
          };

          // Determinar si el periodo de preferencias aplica para la fecha de esta rutina
          let withinPeriod = false;
          if (prefCfg?.ultimoPeriodo?.inicio && prefCfg?.ultimoPeriodo?.fin) {
            const inicio = new Date(prefCfg.ultimoPeriodo.inicio);
            const fin = new Date(prefCfg.ultimoPeriodo.fin);
            withinPeriod = inicio <= fechaRutina && fechaRutina <= fin;
          }

          merged.config[section][itemId] = {
            ...baseCfg,
            progresoActual: withinPeriod
              ? (prefCfg?.progresoActual != null ? Number(prefCfg.progresoActual) : (itemCfg?.progresoActual || 0))
              : (baseCfg.tipo === 'DIARIO' ? 0 : (itemCfg?.progresoActual || 0)),
            ultimoPeriodo: withinPeriod ? (prefCfg?.ultimoPeriodo || itemCfg?.ultimoPeriodo) : (itemCfg?.ultimoPeriodo || null)
          };
        });
      });
      return merged;
    } catch {
      return rutinaObj;
    }
  }, [parseAPIDate]);
  const recentlyCreatedRutinas = useRef(new Set());
  
  // Cambios locales preservados (centralizado en hook)
  const { pendingLocalChanges, registerLocalChange, clearLocalChanges } = useLocalPreservationState({}, {
    debug: false,
    enableStorage: true,
    storagePrefix: 'rutina_config_changes',
    preserveFields: ['tipo', 'frecuencia', 'periodo']
  });
  
  // Referencia para evitar loops
  const reloadCurrentRutinaRef = useRef(null);

  // Logs centralizados: usar utils/logger cuando sea necesario

  // Función centralizada para manejo de errores
  const handleError = useCallback((error, context, fallbackMessage) => {
    const message = error?.message || fallbackMessage;
    console.error(`[RutinasContext] ${context}:`, error);
    enqueueSnackbar(message, { variant: 'error' });
  }, [enqueueSnackbar]);

  // (control de logs propio eliminado para evitar duplicación)



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
      // Cargar preferencias una sola vez
      if (!userPrefsRef.current) {
        try {
          const resPrefs = await rutinasService.getUserHabitPreferences();
          userPrefsRef.current = resPrefs?.preferences || {};
        } catch {}
      }
      let rutinasConCambiosLocales = rutinasOrdenadas
        .filter(r => r && r._id)
        .map(r => applyLocalChanges(r, pendingLocalChanges))
        .map(r => mergeProgressFromPrefs(r, userPrefsRef.current || {}));

      // Reconciliar progreso real usando los registros del período
      rutinasConCambiosLocales = rutinasConCambiosLocales.map(r =>
        reconcileRoutineProgressFromRecords(r, rutinasOrdenadas)
      );
      
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
          updatedRutinas[index] = reconcileRoutineProgressFromRecords(
            mergeProgressFromPrefs(response, userPrefsRef.current || {}),
            updatedRutinas
          );
        }
        
        return updatedRutinas;
      });
      
      // Preservar la página actual y actualizar la rutina
      const mergedResponse = reconcileRoutineProgressFromRecords(
        mergeProgressFromPrefs(response, userPrefsRef.current || {}),
        rutinas
      );
      setRutina({
        ...mergedResponse,
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
        
        // Aplicar cambios locales, fusionar prefs y reconciliar con registros
        const rutinaConCambiosLocales = reconcileRoutineProgressFromRecords(
          mergeProgressFromPrefs(
            applyLocalChanges(rutinaData, pendingLocalChanges),
            userPrefsRef.current || {}
          ),
          rutinas
        );
        
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
        
        // Aplicar cambios locales, fusionar progreso desde prefs y reconciliar con registros
        const rutinaConCambios = reconcileRoutineProgressFromRecords(
          mergeProgressFromPrefs(
            applyLocalChanges(rutinaAnterior, pendingLocalChanges),
            userPrefsRef.current || {}
          ),
          rutinas
        );
        
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
        
        // Aplicar cambios locales, fusionar progreso desde prefs y reconciliar con registros
        const rutinaConCambios = reconcileRoutineProgressFromRecords(
          mergeProgressFromPrefs(
            applyLocalChanges(rutinaSiguiente, pendingLocalChanges),
            userPrefsRef.current || {}
          ),
          rutinas
        );
        
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
      
      // Obtener estado previo antes del optimistic update
      const prevRoutine = rutinas.find(r => r._id === rutinaId) || rutina;
      const [changeItemId, changeCompleted] = Object.entries(data)[0];
      const prevCompleted = Boolean(prevRoutine?.[section]?.[changeItemId]);
      
      // Optimistic update: actualizar UI inmediatamente
      updateLocalRutina(rutinaId, section, data);

      // Actualizar progreso de cadencia en config (progresoActual y ultimoPeriodo)
      // Usar la fecha del registro (no "ahora") para que el progreso pertenezca al período correcto
      const refDate = parseAPIDate(prevRoutine?.fecha) || new Date();
      const updateProgressForItem = (cfg) => {
        const tipo = (cfg?.tipo || 'DIARIO').toUpperCase();
        // Determinar límites del período del registro
        let inicio, fin;
        if (tipo === 'SEMANAL') {
          inicio = startOfWeek(refDate, { weekStartsOn: 1 });
          fin = endOfWeek(refDate, { weekStartsOn: 1 });
        } else if (tipo === 'MENSUAL') {
          inicio = startOfMonth(refDate);
          fin = endOfMonth(refDate);
        } else {
          // DIARIO por defecto
          inicio = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
          fin = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
        }
        const dentroPeriodo = cfg?.ultimoPeriodo?.inicio && cfg?.ultimoPeriodo?.fin
          ? (new Date(cfg.ultimoPeriodo.inicio) <= refDate && refDate <= new Date(cfg.ultimoPeriodo.fin))
          : false;
        let progresoActual = dentroPeriodo ? Number(cfg?.progresoActual || 0) : 0;
        // Delta según transición del día actual
        const delta = (!prevCompleted && isCompleted) ? 1 : ((prevCompleted && !isCompleted) ? -1 : 0);
        progresoActual = Math.max(0, progresoActual + delta);
        return {
          ...cfg,
          progresoActual,
          ultimoPeriodo: { inicio: inicio.toISOString(), fin: fin.toISOString() }
        };
      };

      // Aplicar en estado local de config
      setRutinas(prev => {
        const arr = [...prev];
        const idx = arr.findIndex(r => r._id === rutinaId);
        if (idx !== -1) {
          const r = { ...arr[idx] };
          const cfg = r.config?.[section]?.[itemId] || {};
          const newCfg = updateProgressForItem(cfg);
          r.config = r.config || {};
          r.config[section] = { ...(r.config[section] || {}), [itemId]: newCfg };
          arr[idx] = r;
        }
        return arr;
      });

      if (rutina && rutina._id === rutinaId) {
        setRutina(prev => {
          if (!prev) return prev;
          const cfg = prev.config?.[section]?.[itemId] || {};
          const newCfg = updateProgressForItem(cfg);
          const newConfig = {
            ...(prev.config || {}),
            [section]: {
              ...(prev.config?.[section] || {}),
              [itemId]: newCfg
            }
          };
          return { ...prev, config: newConfig };
        });
      }

      // Intentar reflejar el progreso en preferencias del usuario (para continuidad entre días)
      try {
        const currentCfg = (prevRoutine?.config?.[section]?.[itemId]) || {};
        const updatedCfg = updateProgressForItem(currentCfg);
        const result = await rutinasService.updateUserHabitPreference(section, itemId, {
          tipo: currentCfg.tipo,
          frecuencia: currentCfg.frecuencia,
          periodo: currentCfg.periodo,
          activo: currentCfg.activo !== false,
          progresoActual: updatedCfg.progresoActual,
          ultimoPeriodo: updatedCfg.ultimoPeriodo
        });
        // Sincronizar caché en memoria para que próximas cargas/navegaciones apliquen acumulado
        if (result && result.preferences) {
          userPrefsRef.current = result.preferences;
        }
      } catch (e) {
        // Silencioso: fallback local ya mantiene UX
      }
      
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

  // Función unificada para actualizar configuración de ítems
  const updateItemConfiguration = useCallback(async (section, itemId, config, options = {}) => {
    // isGlobal decidido por setting de UI
    const { isLocal = false, isGlobal = autoUpdateHabitPreferences, rutinaId = null } = options;
    
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
      console.log(`[RutinasContext] 📝 Actualizando configuración para ${section}.${itemId}:`, config);
      
      // Normalizar configuración
    const normalizedConfig = {
      tipo: (config.tipo || 'DIARIO').toUpperCase(),
      frecuencia: Number(config.frecuencia || 1),
      activo: config.activo !== undefined ? Boolean(config.activo) : true,
      periodo: config.periodo || 'CADA_DIA',
      esPreferenciaUsuario: config.esPreferenciaUsuario !== undefined ? Boolean(config.esPreferenciaUsuario) : true,
        ultimaActualizacion: new Date().toISOString()
      };

      // Aplicar cambios locales si es necesario
      if (isLocal) {
        registerLocalChange(section, itemId, normalizedConfig);
        console.log(`[RutinasContext] 🔐 Cambios locales registrados para ${section}.${itemId}`);
      }

      // Actualizar estado local de la rutina
      setRutina(prevRutina => {
        if (!prevRutina || prevRutina._id !== targetRutinaId) return prevRutina;
        
        const newConfig = { ...(prevRutina.config || {}) };
        if (!newConfig[section]) newConfig[section] = {};
        
        // ✅ CORREGIDO: Preservar TODA la configuración existente de la sección
        newConfig[section] = {
          ...(newConfig[section] || {}), // Preservar TODOS los ítems existentes
              [itemId]: {
            ...(newConfig[section][itemId] || {}), // Preservar configuración existente del ítem
            ...normalizedConfig, // Aplicar solo los cambios nuevos
            _timestamp: Date.now() // Forzar actualización en componentes
          }
        };
        
        console.log(`[RutinasContext] 🔄 Configuración actualizada para ${section}.${itemId}:`, {
          configuracionAnterior: prevRutina.config?.[section]?.[itemId],
          configuracionNueva: newConfig[section][itemId],
          todosLosItemsEnSeccion: Object.keys(newConfig[section])
        });
        
        return {
          ...prevRutina,
          config: newConfig,
          _uiRefreshTimestamp: Date.now(),
          _expandedSections: prevRutina._expandedSections || {}
        };
      });

      // Actualizar preferencias globales (por defecto true)
      if (isGlobal) {
        try {
          const result = await rutinasService.updateUserHabitPreference(section, itemId, normalizedConfig);
          if (result.updated && result.global) {
            console.log(`[RutinasContext] ✅ Preferencia global actualizada para ${section}.${itemId}`);
            // Feedback sutil para no saturar al usuario en cada cambio
            // enqueueSnackbar('Preferencia global actualizada', { variant: 'success' });
          } else if (result.fallback) {
            console.log(`[RutinasContext] ⚠️ ${result.fallback}`);
            enqueueSnackbar(result.fallback, { variant: 'warning' });
          }
        } catch (prefError) {
          console.error(`[RutinasContext] ❌ Error al actualizar preferencia global:`, prefError);
        }
      }

      // Enviar al servidor
      try {
        // ✅ Enviar la configuración COMPLETA de la sección para evitar
        // que el backend sobreescriba y pierda otros ítems
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
        console.log(`[RutinasContext] ✅ Configuración guardada en servidor para ${section}.${itemId}`);
        
        enqueueSnackbar("Configuración guardada", { variant: "success" });
        return { updated: true, config: normalizedConfig };
        
      } catch (serverError) {
        console.error(`[RutinasContext] ❌ Error al guardar en servidor:`, serverError);
        handleError(serverError, 'updateItemConfiguration', 'Error al guardar en servidor');
        return { updated: false, error: serverError.message };
      }

    } catch (error) {
      handleError(error, 'updateItemConfiguration', 'Error inesperado al actualizar configuración');
      return { updated: false, error: error.message };
    }
  }, [rutina, enqueueSnackbar, registerLocalChange, handleError, autoUpdateHabitPreferences]);

  // Función para actualizar el estado de expansión de las secciones
  const updateSectionExpandedState = useCallback((section, isExpanded) => {
    if (!rutina) return;
    
    setRutina(prevRutina => {
      const updatedRutina = {...prevRutina};
      if (!updatedRutina._expandedSections) {
        updatedRutina._expandedSections = {};
      }
      updatedRutina._expandedSections[section] = isExpanded;
      return updatedRutina;
    });
  }, [rutina]);

  // Carga inicial simplificada
  useEffect(() => {
    if (!loading && rutinas.length === 0) {
      fetchRutinas();
    }
  }, [loading, rutinas.length, fetchRutinas]);

  // Manejo inicial de la rutina cuando se cargan las rutinas
  useEffect(() => {
    if (rutinas.length > 0 && !rutina && !loading) {
      console.log("Inicializando rutina después de cargar rutinas");
      getRutinaById(rutinas[0]._id);
    }
  }, [rutinas, rutina, loading, getRutinaById]);
  
  // Escuchar eventos personalizados para el estado de expansión
  useEffect(() => {
    const handleSectionExpanded = (event) => {
      const { section, isExpanded, rutinaId } = event.detail;
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
    updateItemConfiguration,
    pendingLocalChanges,
    deleteRutina,
    syncRutinaWithGlobal,
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
