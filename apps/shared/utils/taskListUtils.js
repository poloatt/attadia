import { isTaskCompleted } from './agendaRules.js';

/**
 * Elimina filas duplicadas con el mismo _id (p. ej. paginación o sync).
 */
export function dedupeTasksById(tasks = []) {
  const seen = new Set();
  return (Array.isArray(tasks) ? tasks : []).filter((t) => {
    const id = String(t?._id ?? t?.id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function pickPreferredSerieTask(current, candidate) {
  if (candidate.googleTasksSync?.googleTaskId && !current.googleTasksSync?.googleTaskId) {
    return candidate;
  }
  if (current.googleTasksSync?.googleTaskId && !candidate.googleTasksSync?.googleTaskId) {
    return current;
  }
  if (isTaskCompleted(current) && !isTaskCompleted(candidate)) return candidate;
  if (!isTaskCompleted(current) && isTaskCompleted(candidate)) return current;
  return current;
}

/**
 * Una fila por serie en listas (ancla Google o la instancia más relevante).
 */
export function dedupeSerieTasksForList(tasks = []) {
  const list = dedupeTasksById(tasks);
  const bestBySerie = new Map();

  for (const t of list) {
    if (!t?.serieId) continue;
    const sid = String(t.serieId?._id ?? t.serieId);
    const current = bestBySerie.get(sid);
    bestBySerie.set(sid, current ? pickPreferredSerieTask(current, t) : t);
  }

  if (bestBySerie.size === 0) return list;

  const keepSerieIds = new Set(
    [...bestBySerie.values()].map((t) => String(t._id ?? t.id)),
  );

  return list.filter((t) => {
    if (!t?.serieId) return true;
    return keepSerieIds.has(String(t._id ?? t.id));
  });
}

export function normalizeTaskList(tasks = []) {
  return dedupeSerieTasksForList(dedupeTasksById(tasks));
}
