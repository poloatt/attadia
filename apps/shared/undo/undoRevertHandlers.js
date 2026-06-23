import { ACTION_TYPES } from '../constants/actionHistoryTypes';
import clienteAxios from '../config/axios';
import { runWithoutUndoRecording } from './undoSuppress';

/**
 * Limpia datos de propiedad para revertir DELETE → CREATE.
 */
function cleanPropiedadData(originalData) {
  const monedaId = originalData.moneda?.id || originalData.moneda?.value || originalData.moneda?._id || originalData.moneda;
  const cuentaId = originalData.cuenta?.id || originalData.cuenta?.value || originalData.cuenta?._id || originalData.cuenta;

  return {
    titulo: originalData.titulo,
    descripcion: originalData.descripcion,
    direccion: originalData.direccion,
    ciudad: originalData.ciudad,
    tipo: originalData.tipo,
    estado: Array.isArray(originalData.estado) ? originalData.estado : [originalData.estado],
    montoMensual: originalData.montoMensual || 0,
    metrosCuadrados: originalData.metrosCuadrados || 0,
    moneda: monedaId,
    cuenta: cuentaId,
  };
}

function cleanTareaData(originalData) {
  if (!originalData) return originalData;
  return {
    ...originalData,
    subtareas: originalData.subtareas || [],
  };
}

/**
 * Revierte CREATE → DELETE vía apiService.
 */
export async function revertCreate(action, apiService) {
  try {
    await apiService.delete(action.entityId);
  } catch (error) {
    if (error.response?.status === 404) return;
    throw error;
  }
}

/**
 * Revierte UPDATE → restaurar originalData vía apiService.
 */
export async function revertUpdate(action, apiService, entity) {
  try {
    let dataToRestore = action.originalData;

    if (entity === 'tarea' && action.originalData) {
      dataToRestore = cleanTareaData(action.originalData);
      if (action.data?.subtareas) {
        dataToRestore.subtareas = action.originalData.subtareas || [];
      }
    }

    await apiService.update(action.entityId, dataToRestore);
  } catch (error) {
    if (error.response?.status === 404) return;
    throw error;
  }
}

/**
 * Revierte DELETE → recrear vía apiService.
 */
export async function revertDelete(action, apiService, entity) {
  let cleanData = action.originalData;

  if (entity === 'propiedad' && action.originalData) {
    cleanData = cleanPropiedadData(action.originalData);
  }

  await apiService.create(cleanData);
}

/**
 * Revierte un toggle de sección de rutina (completitud).
 */
export async function revertRutinaSectionUpdate(action, deps = {}) {
  const { markItemComplete, patchRutinaSection } = deps;
  const original = action.originalData || {};
  const { rutinaId, section, itemId, value } = original;

  if (!rutinaId || !section || !itemId) {
    throw new Error('Datos incompletos para revertir rutina_section');
  }

  const itemData = value === undefined ? { [itemId]: undefined } : { [itemId]: value };

  if (patchRutinaSection) {
    patchRutinaSection(rutinaId, section, itemData);
  }

  if (markItemComplete) {
    await markItemComplete(rutinaId, section, itemData);
  }
}

/**
 * Revierte un cambio de configuración de ítem en rutina.
 */
export async function revertRutinaConfigUpdate(action, deps = {}) {
  const { updateItemConfiguration } = deps;
  const original = action.originalData || {};
  const { section, itemId, config, rutinaId, isGlobal } = original;

  if (!section || !itemId || !config) {
    throw new Error('Datos incompletos para revertir rutina_config');
  }

  if (updateItemConfiguration) {
    await updateItemConfiguration(section, itemId, config, {
      isGlobal: isGlobal ?? false,
      rutinaId: rutinaId || action.entityId,
    });
  }
}

/**
 * Revierte CRUD de hábitos vía API de usuarios.
 */
export async function revertHabitAction(action) {
  const section = action.data?.section || action.originalData?.section;
  const habitId = action.entityId || action.originalData?.id;

  switch (action.type) {
    case ACTION_TYPES.CREATE:
      if (habitId && section) {
        await clienteAxios.delete(`/api/users/habits/${habitId}`, { data: { section } });
      }
      break;
    case ACTION_TYPES.UPDATE: {
      const original = action.originalData || {};
      const originalSection = original.section || section;
      const { section: _omit, ...habitPayload } = original;
      await clienteAxios.put(`/api/users/habits/${habitId}`, {
        section: originalSection,
        habit: habitPayload,
      });
      break;
    }
    case ACTION_TYPES.DELETE: {
      const original = action.originalData || {};
      const originalSection = original.section || section;
      const { section: _omit, ...habitPayload } = original;
      await clienteAxios.post('/api/users/habits', {
        section: originalSection,
        habit: habitPayload,
      });
      break;
    }
    default:
      break;
  }
}

/**
 * Dispatcher central de reversión por entidad.
 */
export async function revertAction(action, { apiServices = {}, deps = {} } = {}) {
  return runWithoutUndoRecording(async () => {
    const entity = action.entity;

    if (entity === 'habit') {
      return revertHabitAction(action);
    }

    const apiService = apiServices[entity];

    switch (action.type) {
      case ACTION_TYPES.CREATE:
        if (!apiService) throw new Error(`No apiService for entity: ${entity}`);
        return revertCreate(action, apiService);

      case ACTION_TYPES.UPDATE:
        if (entity === 'rutina_section') {
          return revertRutinaSectionUpdate(action, deps);
        }
        if (entity === 'rutina_config') {
          return revertRutinaConfigUpdate(action, deps);
        }
        if (!apiService) throw new Error(`No apiService for entity: ${entity}`);
        return revertUpdate(action, apiService, entity);

      case ACTION_TYPES.DELETE:
        if (!apiService) throw new Error(`No apiService for entity: ${entity}`);
        return revertDelete(action, apiService, entity);

      default:
        console.warn('Tipo de acción no soportado para revertir:', action.type);
    }
  });
}
