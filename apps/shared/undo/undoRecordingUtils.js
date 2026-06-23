import { ACTION_TYPES } from '../constants/actionHistoryTypes';
import { isUndoRecordingSuppressed } from './undoSuppress';

function canRecord(recorder) {
  return recorder?.addScopedAction && !isUndoRecordingSuppressed();
}

/**
 * Registra cambios diff entre dos estados de sección.
 */
export function recordRutinaSectionDiff(recorder, rutinaId, section, beforeSection = {}, afterSection = {}) {
  if (!canRecord(recorder) || !rutinaId || !section) return;

  const keys = new Set([
    ...Object.keys(beforeSection || {}),
    ...Object.keys(afterSection || {}),
  ]);

  keys.forEach((itemId) => {
    const previousValue = beforeSection?.[itemId];
    const newValue = afterSection?.[itemId];
    if (previousValue === newValue) return;

    recordRutinaSectionAction(recorder, {
      rutinaId,
      section,
      itemId,
      newValue,
      previousValue,
    });
  });
}

/**
 * Registra un toggle de sección de rutina en el historial scoped.
 */
export function recordRutinaSectionAction(recorder, {
  rutinaId,
  section,
  itemId,
  newValue,
  previousValue,
}) {
  if (!canRecord(recorder) || !rutinaId || !section || !itemId) return;

  recorder.addScopedAction({
    type: ACTION_TYPES.UPDATE,
    entity: 'rutina_section',
    entityId: rutinaId,
    data: { rutinaId, section, itemId, value: newValue },
    originalData: { rutinaId, section, itemId, value: previousValue },
    description: `Actualizar hábito ${itemId}`,
  });
}

/**
 * Registra un cambio de configuración de ítem en rutina.
 */
export function recordRutinaConfigAction(recorder, {
  rutinaId,
  section,
  itemId,
  newConfig,
  originalConfig,
  isGlobal = false,
}) {
  if (!canRecord(recorder) || !section || !itemId) return;

  recorder.addScopedAction({
    type: ACTION_TYPES.UPDATE,
    entity: 'rutina_config',
    entityId: rutinaId,
    data: { section, itemId, config: newConfig, rutinaId, isGlobal },
    originalData: { section, itemId, config: originalConfig, rutinaId, isGlobal },
    description: `Configurar hábito ${itemId}`,
  });
}

/**
 * Registra CRUD de rutina.
 */
export function recordRutinaCrudAction(recorder, type, rutinaData, originalData = null) {
  if (!canRecord(recorder)) return;

  const source = type === ACTION_TYPES.DELETE ? originalData : rutinaData;
  if (!source) return;

  const entityId = source._id || source.id;
  const label = source.fecha || entityId || 'rutina';

  recorder.addScopedAction({
    type,
    entity: 'rutina',
    entityId,
    data: type === ACTION_TYPES.DELETE ? null : rutinaData,
    originalData: type === ACTION_TYPES.CREATE ? null : originalData,
    description: `${type} rutina ${label}`,
  });
}

/**
 * Registra CRUD de hábito/plantilla.
 */
export function recordHabitCrudAction(recorder, type, habitData, originalData = null, section = null) {
  if (!canRecord(recorder)) return;

  const source = type === ACTION_TYPES.DELETE ? originalData : habitData;
  if (!source) return;

  const entityId = source._id || source.id || source.itemId;
  const resolvedSection = section || source.section;

  recorder.addScopedAction({
    type,
    entity: 'habit',
    entityId,
    data: type === ACTION_TYPES.DELETE ? null : { ...habitData, section: resolvedSection },
    originalData: type === ACTION_TYPES.CREATE ? null : { ...originalData, section: resolvedSection },
    description: `${type} hábito ${source.nombre || source.title || entityId || ''}`.trim(),
  });
}
