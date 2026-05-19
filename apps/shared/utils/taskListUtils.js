function dayKeyFromTaskDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

/**
 * Dedup de instancias materializadas por serie (ancla Google o una por día).
 * Las ocurrencias virtuales (una por día desde el backend) no se colapsan.
 */
export function dedupeSerieTasksForList(tasks = []) {
  const list = dedupeTasksById(tasks);
  const anchorBySerie = new Map();
  const keptPerSerieDay = new Set();

  for (const t of list) {
    if (t?.virtual) continue;
    if (!t?.serieId) continue;
    const sid = String(t.serieId?._id ?? t.serieId);
    if (t.googleTasksSync?.googleTaskId) {
      anchorBySerie.set(sid, t);
    }
  }

  return list.filter((t) => {
    if (t?.virtual) return true;
    if (!t?.serieId) return true;

    const sid = String(t.serieId?._id ?? t.serieId);
    const anchor = anchorBySerie.get(sid);
    const id = String(t._id ?? t.id ?? '');

    if (anchor && id === String(anchor._id ?? anchor.id)) {
      return true;
    }
    if (anchor) {
      return false;
    }

    const dk = dayKeyFromTaskDate(t.fechaVencimiento || t.fechaInicio);
    const key = `${sid}|${dk}`;
    if (keptPerSerieDay.has(key)) return false;
    keptPerSerieDay.add(key);
    return true;
  });
}

export function normalizeTaskList(tasks = []) {
  return dedupeSerieTasksForList(dedupeTasksById(tasks));
}
