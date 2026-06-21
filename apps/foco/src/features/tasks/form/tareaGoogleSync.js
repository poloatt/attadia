import clienteAxios from '@shared/config/axios';

/**
 * Sincroniza una tarea guardada con Google Tasks si tiene sync habilitado.
 */
export async function syncTareaToGoogleAfterSave(tareaOrId) {
  const tarea = typeof tareaOrId === 'object' ? tareaOrId : null;
  const id = typeof tareaOrId === 'string' ? tareaOrId : (tarea?._id || tarea?.id);
  const sync = tarea?.googleTasksSync || {};
  const shouldSync = sync.enabled || sync.needsSync;

  if (!id || !shouldSync) {
    return { synced: false };
  }

  await clienteAxios.post(`/api/google-tasks/sync/task/${id}`);
  return { synced: true };
}

/**
 * Versión no bloqueante: dispara la sync con Google en background tras guardar,
 * para no retrasar el cierre del formulario ni el refetch. Notifica por callbacks.
 */
export function syncTareaToGoogleInBackground(tareaOrId, { onSynced, onError } = {}) {
  syncTareaToGoogleAfterSave(tareaOrId)
    .then((result) => {
      if (result?.synced && typeof onSynced === 'function') {
        onSynced(result);
      }
    })
    .catch((err) => {
      if (typeof onError === 'function') {
        onError(err);
      }
    });
}
