import { Tareas, TareaSeries } from '../models/index.js';
import { expandSerie } from './recurrenceUtils.js';

function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function serieIdStr(serieId) {
  if (serieId == null) return '';
  return String(serieId._id ?? serieId);
}

/**
 * Una fila por serie y día: preferir ancla (googleTaskId) frente a instancias materializadas.
 */
export function dedupeSerieInstancesForAgenda(tasks = []) {
  const list = Array.isArray(tasks) ? tasks : [];
  const anchorBySerie = new Map();

  for (const t of list) {
    if (!t.serieId) continue;
    const sid = serieIdStr(t.serieId);
    if (sid && t.googleTasksSync?.googleTaskId) {
      anchorBySerie.set(sid, t);
    }
  }

  const keptPerSerieDay = new Set();

  return list.filter((t) => {
    if (!t.serieId) return true;

    const sid = serieIdStr(t.serieId);
    const anchor = anchorBySerie.get(sid);
    if (anchor && String(t._id) === String(anchor._id)) {
      return true;
    }
    if (anchor) {
      return false;
    }

    const raw = t.fechaVencimiento || t.fechaInicio;
    const key = `${sid}|${dayKey(raw)}`;
    if (keptPerSerieDay.has(key)) return false;
    keptPerSerieDay.set(key);
    return true;
  });
}

/**
 * Ocurrencias virtuales (no persistidas) para el calendario — modelo tipo Google Tasks.
 */
export function buildVirtualTasksForRange(series = [], rangeFrom, rangeTo, existingTasks = []) {
  const from = new Date(rangeFrom);
  const to = new Date(rangeTo);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const occupied = new Set();
  const anchorSerieIds = new Set();

  for (const t of existingTasks) {
    const sid = serieIdStr(t.serieId);
    if (!sid) continue;
    if (t.googleTasksSync?.googleTaskId) {
      anchorSerieIds.add(sid);
    }
    const d = t.fechaVencimiento || t.fechaInicio;
    if (d) occupied.add(`${sid}|${dayKey(d)}`);
  }

  const virtual = [];

  for (const serie of series) {
    if (!serie?.activa || !serie.rrule) continue;

    const sid = String(serie._id);
    const exportInstances = serie.googleTasksSync?.exportInstances === true;
    if (!exportInstances && anchorSerieIds.has(sid)) {
      continue;
    }

    const dtstart = new Date(serie.dtstart);
    if (Number.isNaN(dtstart.getTime())) continue;

    let occurrences;
    try {
      occurrences = expandSerie(serie.rrule, dtstart, from, to);
    } catch {
      continue;
    }

    for (const occ of occurrences) {
      const dk = dayKey(occ);
      const key = `${sid}|${dk}`;
      if (occupied.has(key)) continue;
      occupied.add(key);

      virtual.push({
        _id: `virtual:${serie._id}:${dk}`,
        titulo: serie.titulo,
        descripcion: serie.descripcion || '',
        usuario: serie.usuario,
        objetivo: serie.objetivo,
        serieId: serie._id,
        fechaInicio: dk,
        fechaVencimiento: dk,
        tipo: 'TAREA',
        estado: 'PENDIENTE',
        completada: false,
        virtual: true,
        esRecurrente: true,
        googleTasksSync: { enabled: false },
      });
    }
  }

  return virtual;
}

export async function loadSeriesForAgenda(userId) {
  return TareaSeries.find({
    usuario: userId,
    activa: true,
    rrule: { $exists: true, $ne: '' },
  })
    .populate('objetivo', 'nombre estado')
    .lean();
}
