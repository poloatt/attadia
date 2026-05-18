import { Tareas } from '../models/index.js';
import {
  buildVirtualTasksForRange,
  dedupeSerieInstancesForAgenda,
  loadSeriesForAgenda,
} from './calendarVirtualUtils.js';

function buildOverlapQuery(userId, from, to) {
  return {
    usuario: userId,
    $or: [
      { fechaVencimiento: { $gte: from, $lte: to } },
      { fechaInicio: { $gte: from, $lte: to } },
      {
        fechaInicio: { $lte: to },
        fechaVencimiento: { $gte: from },
      },
      {
        fechaInicio: { $lte: to },
        fechaVencimiento: { $exists: false },
      },
      {
        fechaInicio: { $lte: to },
        fechaVencimiento: null,
      },
    ],
  };
}

/**
 * Tareas para calendario: anclas reales + ocurrencias virtuales (sin materializar en BD).
 */
export async function getTareasForAgendaRange(userId, rangeFrom, rangeTo) {
  const from = new Date(rangeFrom);
  const to = new Date(rangeTo);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const series = await loadSeriesForAgenda(userId);

  const realDocs = await Tareas.find(buildOverlapQuery(userId, from, to))
    .populate('objetivo', 'nombre estado')
    .populate('subtareas', 'titulo completada orden')
    .sort({ fechaInicio: 1 })
    .lean({ virtuals: true });

  const deduped = dedupeSerieInstancesForAgenda(realDocs);
  const virtual = buildVirtualTasksForRange(series, from, to, deduped);
  const seenIds = new Set();
  const merged = [];
  for (const doc of [...deduped, ...virtual]) {
    const id = String(doc._id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    merged.push(doc);
  }

  return merged.map((doc) => {
    const objetivoRef = doc.objetivo?._id ?? doc.objetivo;
    const objetivo =
      objetivoRef != null
        ? {
            ...(typeof doc.objetivo === 'object' && doc.objetivo !== null ? doc.objetivo : {}),
            id: String(objetivoRef),
          }
        : null;

    return {
      ...doc,
      id: String(doc._id),
      esRecurrente: Boolean(doc.esRecurrente || doc.virtual),
      objetivo,
      isGoogleTasksEnabled: doc.googleTasksSync?.enabled || false,
      googleTasksSyncStatus: doc.googleTasksSync?.syncStatus || null,
    };
  });
}

export { buildOverlapQuery };
