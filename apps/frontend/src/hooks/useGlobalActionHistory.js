import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useActionHistoryManager, useCRUDWithHistory } from './useActionHistory';
import clienteAxios from '../config/axios';

// Mapeo de rutas a entidades y servicios de API
const ROUTE_ENTITY_MAP = {
  '/tiempo/proyectos': {
    entity: 'proyecto',
    apiService: {
      create: (data) => clienteAxios.post('/api/proyectos', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/proyectos/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/proyectos/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/proyectos/${id}`).then(res => res.data)
    }
  },
  '/tiempo/tareas': {
    entity: 'tarea',
    apiService: {
      create: (data) => clienteAxios.post('/api/tareas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/tareas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/tareas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/tareas/${id}`).then(res => res.data)
    }
  },
  '/tiempo/archivo': {
    entity: 'tarea',
    apiService: {
      create: (data) => clienteAxios.post('/api/tareas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/tareas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/tareas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/tareas/${id}`).then(res => res.data)
    }
  },
  '/proyectos': {
    entity: 'proyecto',
    apiService: {
      create: (data) => clienteAxios.post('/api/proyectos', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/proyectos/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/proyectos/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/proyectos/${id}`).then(res => res.data)
    }
  },
  '/tareas': {
    entity: 'tarea',
    apiService: {
      create: (data) => clienteAxios.post('/api/tareas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/tareas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/tareas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/tareas/${id}`).then(res => res.data)
    }
  },
  '/propiedades': {
    entity: 'propiedad',
    apiService: {
      create: (data) => clienteAxios.post('/api/propiedades', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/propiedades/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/propiedades/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/propiedades/${id}`).then(res => res.data)
    }
  },
  '/transacciones': {
    entity: 'transaccion',
    apiService: {
      create: (data) => clienteAxios.post('/api/transacciones', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/transacciones/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/transacciones/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/transacciones/${id}`).then(res => res.data)
    }
  },
  '/cuentas': {
    entity: 'cuenta',
    apiService: {
      create: (data) => clienteAxios.post('/api/cuentas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/cuentas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/cuentas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/cuentas/${id}`).then(res => res.data)
    }
  },
  '/monedas': {
    entity: 'moneda',
    apiService: {
      create: (data) => clienteAxios.post('/api/monedas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/monedas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/monedas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/monedas/${id}`).then(res => res.data)
    }
  },
  '/rutinas': {
    entity: 'rutina',
    apiService: {
      create: (data) => clienteAxios.post('/api/rutinas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/rutinas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/rutinas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/rutinas/${id}`).then(res => res.data)
    }
  },
  '/inquilinos': {
    entity: 'inquilino',
    apiService: {
      create: (data) => clienteAxios.post('/api/inquilinos', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/inquilinos/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/inquilinos/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/inquilinos/${id}`).then(res => res.data)
    }
  },
  '/contratos': {
    entity: 'contrato',
    apiService: {
      create: (data) => clienteAxios.post('/api/contratos', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/contratos/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/contratos/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/contratos/${id}`).then(res => res.data)
    }
  },
  '/habitaciones': {
    entity: 'habitacion',
    apiService: {
      create: (data) => clienteAxios.post('/api/habitaciones', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/habitaciones/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/habitaciones/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/habitaciones/${id}`).then(res => res.data)
    }
  },
  '/inventario': {
    entity: 'inventario',
    apiService: {
      create: (data) => clienteAxios.post('/api/inventarios', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/inventarios/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/inventarios/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/inventarios/${id}`).then(res => res.data)
    }
  },
  '/recurrente': {
    entity: 'transaccion_recurrente',
    apiService: {
      create: (data) => clienteAxios.post('/api/transaccion-recurrente', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/transaccion-recurrente/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/transaccion-recurrente/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/transaccion-recurrente/${id}`).then(res => res.data)
    }
  }
};

export const SUPPORTED_ROUTES = Object.keys(ROUTE_ENTITY_MAP);

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
  
  // Memoizar la configuración de la entidad para evitar re-creaciones
  const entityConfig = useMemo(() => {
    return ROUTE_ENTITY_MAP[currentPath];
  }, [currentPath]);
  
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
  const entityConfig = ROUTE_ENTITY_MAP[currentPath];
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