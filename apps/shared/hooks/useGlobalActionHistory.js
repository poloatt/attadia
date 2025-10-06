import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useActionHistoryManager, useCRUDWithHistory } from './useActionHistory';
import { useActionHistoryRoutes } from '../context/ActionHistoryRoutesContext.jsx';

/**
 * Hook global que detecta automáticamente la entidad basada en la ruta
 * y proporciona funciones de CRUD con historial automático
 * @param {Function} fetchData
 * @param {Function} onError
 * @param {string} forcedPath - Si se pasa, fuerza la entidad/ruta a usar
 */
export function useGlobalActionHistory(fetchData, onError, forcedPath) {
  const location = useLocation();
  const currentPath = forcedPath || location.pathname;
  const { routesMap } = useActionHistoryRoutes();
  
  // Memoizar la configuración de la entidad para evitar re-creaciones
  const entityConfig = useMemo(() => {
    if (!routesMap) return undefined;
    // Búsqueda por prefijo más largo que coincida con currentPath
    const candidates = Object.keys(routesMap || {})
      .filter(base => currentPath.startsWith(base))
      .sort((a, b) => b.length - a.length);
    if (candidates.length > 0) return routesMap[candidates[0]];
    return undefined;
  }, [currentPath, routesMap]);
  
  if (!entityConfig) {
    // Si no hay configuración para esta ruta, retornar funciones vacías
    return useMemo(() => ({
      isSupported: false,
      entity: null,
      createWithHistory: null,
      updateWithHistory: null,
      deleteWithHistory: null,
      addCreateAction: null,
      addUpdateAction: null,
      addDeleteAction: null
    }), []);
  }

  const { entity, apiService } = entityConfig;
  
  // Usar los hooks específicos para esta entidad (sin autoListen para evitar duplicaciones)
  const { 
    addCreateAction, 
    addUpdateAction, 
    addDeleteAction 
  } = useActionHistoryManager(entity, { autoListen: false });

  const { 
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = useCRUDWithHistory(entity, apiService);

  return useMemo(() => ({
    isSupported: true,
    entity,
    createWithHistory,
    updateWithHistory,
    deleteWithHistory,
    addCreateAction,
    addUpdateAction,
    addDeleteAction
  }), [entity, createWithHistory, updateWithHistory, deleteWithHistory, addCreateAction, addUpdateAction, addDeleteAction]);
}

/**
 * Hook para manejar eventos de deshacer automáticamente
 * @param {Function} fetchData - Función para recargar datos después de revertir
 * @param {Function} onError - Función para manejar errores
 */
export function useAutoUndoHandler(fetchData, onError = console.error) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { routesMap } = useActionHistoryRoutes();
  const entityConfig = useMemo(() => {
    if (!routesMap) return undefined;
    const candidates = Object.keys(routesMap || {})
      .filter(base => currentPath.startsWith(base))
      .sort((a, b) => b.length - a.length);
    if (candidates.length > 0) return routesMap[candidates[0]];
    return undefined;
  }, [currentPath, routesMap]);
  const listenerRef = useRef(null);
  const processedActionsRef = useRef(new Set());

  useEffect(() => {
    if (!entityConfig) return;

    const { entity, apiService } = entityConfig;

    // Evitar múltiples listeners
    if (listenerRef.current) {
      window.removeEventListener('undoAction', listenerRef.current);
    }

    const handleUndoAction = async (event) => {
      const action = event.detail;
      
      // Solo procesar acciones de esta entidad
      if (action.entity !== entity) {
        return;
      }
      
      // Evitar procesar la misma acción múltiples veces
      if (processedActionsRef.current.has(action.id)) {
        return;
      }
      
      // Marcar la acción como procesada
      processedActionsRef.current.add(action.id);

      try {
        switch (action.type) {
          case 'CREATE':
            // Revertir creación = eliminar
            try {
              await apiService.delete(action.entityId);
            } catch (error) {
              if (error.response?.status === 404) {
                // La propiedad ya no existe, considerar el undo como exitoso
                return;
              }
              throw error;
            }
            break;
            
          case 'UPDATE':
            // Revertir actualización = restaurar datos originales
            try {
              // Para tareas, asegurarse de que las subtareas se manejen correctamente
              let dataToRestore = action.originalData;
              if (entity === 'tarea' && action.originalData) {
                // Asegurarse de que las subtareas se incluyan correctamente
                dataToRestore = {
                  ...action.originalData,
                  subtareas: action.originalData.subtareas || []
                };
                
                // Si hay subtareas en la actualización, asegurarse de que se restauren correctamente
                if (action.data && action.data.subtareas) {
                  dataToRestore.subtareas = action.originalData.subtareas || [];
                }
              }
              
              await apiService.update(action.entityId, dataToRestore);
            } catch (error) {
              if (error.response?.status === 404) {
                // La entidad no existe, considerar el undo como exitoso
                return;
              }
              throw error;
            }
            break;
            
          case 'DELETE':
            // Revertir eliminación = recrear
            // Limpiar datos para propiedades antes de recrear
            let cleanData = action.originalData;
            if (entity === 'propiedad') {
              // Extraer solo los IDs de los campos de referencia
              const monedaId = action.originalData.moneda?.id || action.originalData.moneda?.value || action.originalData.moneda?._id || action.originalData.moneda;
              const cuentaId = action.originalData.cuenta?.id || action.originalData.cuenta?.value || action.originalData.cuenta?._id || action.originalData.cuenta;
              
              cleanData = {
                titulo: action.originalData.titulo,
                descripcion: action.originalData.descripcion,
                direccion: action.originalData.direccion,
                ciudad: action.originalData.ciudad,
                tipo: action.originalData.tipo,
                estado: Array.isArray(action.originalData.estado) ? action.originalData.estado : [action.originalData.estado],
                montoMensual: action.originalData.montoMensual || 0,
                metrosCuadrados: action.originalData.metrosCuadrados || 0,
                moneda: monedaId,
                cuenta: cuentaId
                // No enviar usuario, el backend lo asigna automáticamente
              };
            }
            
            await apiService.create(cleanData);
            break;
            
          default:
            console.warn('Tipo de acción no soportado para revertir:', action.type);
            return;
        }
        
        // Recargar datos
        if (fetchData) {
          await fetchData();
        }
      } catch (error) {
        console.error('useAutoUndoHandler - Error reverting action:', error);
        onError(error);
      }
    };

    // Guardar referencia al listener
    listenerRef.current = handleUndoAction;
    
    // Escuchar eventos de undo (el filtro por entidad se hace dentro del handler)
    window.addEventListener('undoAction', handleUndoAction);
    
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('undoAction', listenerRef.current);
        listenerRef.current = null;
      }
      // Limpiar acciones procesadas al desmontar
      processedActionsRef.current.clear();
    };
  }, [currentPath, fetchData, onError, entityConfig]);
}

/**
 * Hook combinado que proporciona todo lo necesario para una página
 * @param {Function} fetchData - Función para recargar datos
 * @param {Function} onError - Función para manejar errores
 */
export function usePageWithHistory(fetchData, onError) {
  const historyUtils = useGlobalActionHistory();
  useAutoUndoHandler(fetchData, onError);
  
  // Memoizar el resultado para evitar re-renderizados innecesarios
  return useMemo(() => historyUtils, [historyUtils]);
} 