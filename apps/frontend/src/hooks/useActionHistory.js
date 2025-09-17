import { useCallback, useEffect, useMemo } from 'react';
import { useActionHistory, ACTION_TYPES, ENTITY_TYPES } from '../context/ActionHistoryContext';

/**
 * Hook personalizado para manejar el historial de acciones
 * @param {string} entityType - Tipo de entidad (ej: 'proyecto', 'tarea', etc.)
 * @param {object} options - Opciones de configuración
 * @returns {object} Funciones y estado del historial
 */
export function useActionHistoryManager(entityType, options = {}) {
  const { 
    addAction, 
    getActionsByEntity, 
    getActionsByType,
    canUndo 
  } = useActionHistory();

  const {
    maxActions = 10, // Máximo número de acciones a mostrar
    autoListen = true // Escuchar automáticamente eventos de deshacer
  } = options;

  // Función para agregar una acción de creación
  const addCreateAction = useCallback((data, description) => {
    return addAction({
      type: ACTION_TYPES.CREATE,
      entity: entityType,
      data: data,
      description: description || `Crear ${entityType}`,
      originalData: null, // No hay datos originales para crear
      entityId: data._id || data.id // Guardar el ID de la entidad creada
    });
  }, [addAction, entityType]);

  // Función para agregar una acción de actualización
  const addUpdateAction = useCallback((newData, originalData, description) => {
    return addAction({
      type: ACTION_TYPES.UPDATE,
      entity: entityType,
      data: newData,
      originalData: originalData,
      description: description || `Actualizar ${entityType}`,
      entityId: newData._id || newData.id
    });
  }, [addAction, entityType]);

  // Función para agregar una acción de eliminación
  const addDeleteAction = useCallback((deletedData, description) => {
    return addAction({
      type: ACTION_TYPES.DELETE,
      entity: entityType,
      data: null,
      originalData: deletedData,
      description: description || `Eliminar ${entityType}`,
      entityId: deletedData._id || deletedData.id
    });
  }, [addAction, entityType]);

  // Función para agregar una acción de movimiento
  const addMoveAction = useCallback((movedData, fromPosition, toPosition, description) => {
    return addAction({
      type: ACTION_TYPES.MOVE,
      entity: entityType,
      data: { ...movedData, position: toPosition },
      originalData: { ...movedData, position: fromPosition },
      description: description || `Mover ${entityType}`,
      entityId: movedData._id || movedData.id,
      moveData: { from: fromPosition, to: toPosition }
    });
  }, [addAction, entityType]);

  // Función para agregar una acción personalizada
  const addCustomAction = useCallback((type, data, originalData, description) => {
    return addAction({
      type: type,
      entity: entityType,
      data: data,
      originalData: originalData,
      description: description,
      entityId: data?._id || data?.id
    });
  }, [addAction, entityType]);

  // Obtener acciones de esta entidad
  const getCommonActions = useCallback(() => {
    return getActionsByEntity(entityType).slice(0, maxActions);
  }, [getActionsByEntity, entityType, maxActions]);

  // Obtener acciones por tipo
  const getCommonActionsByType = useCallback((actionType) => {
    return getActionsByType(actionType).filter(action => action.entity === entityType);
  }, [getActionsByType, entityType]);

  // Escuchar eventos de deshacer (solo si autoListen está habilitado)
  useEffect(() => {
    if (!autoListen) return;

    const handleUndoAction = (event) => {
      const action = event.detail;
      
      // Solo procesar acciones de esta entidad
      if (action.entity !== entityType) return;

      // Disparar evento específico para que el componente maneje la reversión
      window.dispatchEvent(new CustomEvent(`undoAction_${entityType}`, {
        detail: action
      }));
    };

    window.addEventListener('undoAction', handleUndoAction);
    
    return () => {
      window.removeEventListener('undoAction', handleUndoAction);
    };
  }, [entityType, autoListen]);

  return useMemo(() => ({
    // Funciones para agregar acciones
    addCreateAction,
    addUpdateAction,
    addDeleteAction,
    addMoveAction,
    addCustomAction,
    
    // Funciones para obtener acciones
    getCommonActions,
    getCommonActionsByType,
    
    // Estado
    canUndo: canUndo(),
    
    // Constantes
    ACTION_TYPES,
    ENTITY_TYPES
  }), [addCreateAction, addUpdateAction, addDeleteAction, addMoveAction, addCustomAction, getCommonActions, getCommonActionsByType, canUndo]);
}

/**
 * Hook para manejar acciones específicas de CRUD
 * @param {string} entityType - Tipo de entidad
 * @param {object} apiService - Servicio de API para la entidad
 * @returns {object} Funciones de CRUD con historial automático
 */
export function useCRUDWithHistory(entityType, apiService) {
  const {
    addCreateAction,
    addUpdateAction,
    addDeleteAction
  } = useActionHistoryManager(entityType);

  // Crear con historial
  const createWithHistory = useCallback(async (data) => {
    try {
      const result = await apiService.create(data);
      addCreateAction(result, `Crear ${entityType} "${result.nombre || result.titulo || result._id}"`);
      return result;
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      throw error;
    }
  }, [apiService, addCreateAction, entityType]);

  // Actualizar con historial
  const updateWithHistory = useCallback(async (id, updates, originalData) => {
    try {
      const result = await apiService.update(id, updates);
      
      // Limpiar datos originales para propiedades antes de guardar en historial
      let cleanOriginalData = originalData;
      if (entityType === 'propiedad' && originalData) {
        // Extraer solo los IDs de los campos de referencia
        const monedaId = originalData.moneda?.id || originalData.moneda?.value || originalData.moneda?._id || originalData.moneda;
        const cuentaId = originalData.cuenta?.id || originalData.cuenta?.value || originalData.cuenta?._id || originalData.cuenta;
        
        cleanOriginalData = {
          titulo: originalData.titulo,
          descripcion: originalData.descripcion,
          direccion: originalData.direccion,
          ciudad: originalData.ciudad,
          tipo: originalData.tipo,
          estado: Array.isArray(originalData.estado) ? originalData.estado : [originalData.estado],
          montoMensual: originalData.montoMensual || 0,
          metrosCuadrados: originalData.metrosCuadrados || 0,
          moneda: monedaId,
          cuenta: cuentaId
          // No guardar usuario en el historial
        };
      }
      
      // Para tareas, asegurar que las subtareas se preserven correctamente
      if (entityType === 'tarea' && originalData) {
        cleanOriginalData = {
          ...originalData,
          subtareas: originalData.subtareas || []
        };
      }
      
      addUpdateAction(result, cleanOriginalData, `Actualizar ${entityType} "${result.nombre || result.titulo || result._id}"`);
      return result;
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
      throw error;
    }
  }, [apiService, addUpdateAction, entityType]);

  // Eliminar con historial
  const deleteWithHistory = useCallback(async (id) => {
    try {
      const originalData = await apiService.getById(id);
      const result = await apiService.delete(id);
      
      // Limpiar datos para propiedades antes de guardar en historial
      let cleanOriginalData = originalData;
      if (entityType === 'propiedad') {
        // Extraer solo los IDs de los campos de referencia
        const monedaId = originalData.moneda?.id || originalData.moneda?.value || originalData.moneda?._id || originalData.moneda;
        const cuentaId = originalData.cuenta?.id || originalData.cuenta?.value || originalData.cuenta?._id || originalData.cuenta;
        
        cleanOriginalData = {
          titulo: originalData.titulo,
          descripcion: originalData.descripcion,
          direccion: originalData.direccion,
          ciudad: originalData.ciudad,
          tipo: originalData.tipo,
          estado: Array.isArray(originalData.estado) ? originalData.estado : [originalData.estado],
          montoMensual: originalData.montoMensual || 0,
          metrosCuadrados: originalData.metrosCuadrados || 0,
          moneda: monedaId,
          cuenta: cuentaId
          // No guardar usuario en el historial
        };
      }
      
      addDeleteAction(cleanOriginalData, `Eliminar ${entityType} "${originalData.nombre || originalData.titulo || originalData._id}"`);
      return result;
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      throw error;
    }
  }, [apiService, addDeleteAction, entityType]);

  return useMemo(() => ({
    createWithHistory,
    updateWithHistory,
    deleteWithHistory
  }), [createWithHistory, updateWithHistory, deleteWithHistory]);
} 