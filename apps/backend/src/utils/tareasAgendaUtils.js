import { Tareas } from '../models/index.js';
import {
  buildVirtualTasksForRange,
  dedupeSerieInstancesForAgenda,
  loadSeriesForAgenda,
} from './calendarVirtualUtils.js';

const LIST_VIRTUAL_LOOKBACK_DAYS = parseInt(
  process.env.GTASKS_LIST_VIRTUAL_LOOKBACK_DAYS || '14',
  10,
);
const LIST_VIRTUAL_HORIZON_DAYS = parseInt(
  process.env.GTASKS_LIST_VIRTUAL_HORIZON_DAYS || '120',
  10,
);

function buildOverlapQuery(userId, from, to) {
  return {
    usuario: userId,
    $or: [
      { fechaVencimiento: { $gte: from, $lte: to } },
      { fechaInicio: { $gte: from, $lte: to } },
      {
        tipo: 'EVENTO',
        fechaInicio: { $lte: to },
        fechaFin: { $gte: from },
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

/**
 * Añade ocurrencias virtuales de series activas a la lista de tareas (/tareas).
 */
export async function appendVirtualRecurrenceTasks(userId, realDocs = []) {
  const list = Array.isArray(realDocs) ? realDocs : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - LIST_VIRTUAL_LOOKBACK_DAYS);
  const to = new Date(today);
  to.setDate(to.getDate() + LIST_VIRTUAL_HORIZON_DAYS);
  to.setHours(23, 59, 59, 999);

  const series = await loadSeriesForAgenda(userId);
  const deduped = dedupeSerieInstancesForAgenda(list);
  const virtual = buildVirtualTasksForRange(series, from, to, deduped);

  const seenIds = new Set(list.map((d) => String(d._id)));
  const merged = [...list];
  for (const v of virtual) {
    const id = String(v._id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    merged.push(v);
  }
  return merged;
}

export { buildOverlapQuery };
