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
