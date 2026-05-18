import { Tareas, TareaSeries } from '../models/index.js';
import logger from '../utils/logger.js';
import {
  appendRecurrenceToNotes,
  buildGoogleSerieKey,
  collectDueDatesFromTasks,
  expandSerie,
  inferRecurrenceFromGoogleNotes,
  inferRruleFromDueDates,
  parseRecurrenceFromNotes,
  sameCalendarDay,
  weekdayToRruleByday,
} from '../utils/recurrenceUtils.js';

const HORIZON_DAYS = parseInt(process.env.GTASKS_SERIES_HORIZON_DAYS || '90', 10);
const EXPAND_LOOKBACK_DAYS = parseInt(process.env.GTASKS_SERIES_LOOKBACK_DAYS || '14', 10);
/** Por defecto true: Google solo devuelve 1 fila por tarea recurrente en la API. */
const ASSUME_GOOGLE_RECURRING_SINGLE =
  process.env.GTASKS_ASSUME_GOOGLE_RECURRING_SINGLE !== 'false';

/**
 * Reconcilia tareas importadas de una TaskList en series recurrentes.
 */
export async function reconcileSeriesFromGoogle(userId, objetivoId, taskListId, googleMainTasks = []) {
  const stats = { seriesCreated: 0, seriesUpdated: 0, instancesLinked: 0 };

  const googleDuesByKey = new Map();
  const normalizeGoogleTitle = (title) =>
    String(title || '')
      .replace(/^\s*(\[[^\]]+\]\s*)+/g, '')
      .replace(/\s+(\[[^\]]+\])\s+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

  for (const gt of googleMainTasks) {
    if (gt?.parent) continue;
    const key = buildGoogleSerieKey(taskListId, normalizeGoogleTitle(gt.title));
    const due = Tareas.parseGoogleDueDate(gt.due);
    if (!due) continue;
    if (!googleDuesByKey.has(key)) googleDuesByKey.set(key, []);
    googleDuesByKey.get(key).push(due);
  }

  const tareas = await Tareas.find({
    usuario: userId,
    objetivo: objetivoId,
    'googleTasksSync.googleTaskListId': taskListId,
    esExcepcionSerie: { $ne: true },
  });

  const groups = new Map();
  for (const tarea of tareas) {
    const key = buildGoogleSerieKey(taskListId, tarea.titulo);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tarea);
  }

  for (const [googleSerieKey, group] of groups) {
    let rruleFromNotes = null;
    let rruleFromGoogleNotes = null;

    for (const t of group) {
      const parsed = parseRecurrenceFromNotes(t.descripcion || '');
      if (parsed.rrule) rruleFromNotes = parsed.rrule;
      const googleHint = inferRecurrenceFromGoogleNotes(t.descripcion || '');
      if (googleHint) rruleFromGoogleNotes = googleHint;
    }

    let dueDates = collectDueDatesFromTasks(group);
    const extraGoogleDues = googleDuesByKey.get(googleSerieKey) || [];
    if (extraGoogleDues.length) {
      dueDates = collectDueDatesFromTasks([
        ...group,
        ...extraGoogleDues.map((d) => ({ fechaVencimiento: d })),
      ]);
    }
    const inferred = inferRruleFromDueDates(dueDates);
    let rrule = rruleFromNotes || rruleFromGoogleNotes || inferred;

    if (
      !rrule
      && ASSUME_GOOGLE_RECURRING_SINGLE
      && group.length === 1
      && group[0].googleTasksSync?.googleTaskId
      && (group[0].fechaVencimiento || group[0].fechaInicio)
    ) {
      const anchor = group[0].fechaVencimiento || group[0].fechaInicio;
      const anchorDate = anchor instanceof Date ? anchor : new Date(anchor);
      const byday = weekdayToRruleByday(anchorDate);
      if (byday) {
        rrule = `FREQ=WEEKLY;INTERVAL=1;BYDAY=${byday}`;
      }
    }

    if (!rrule) continue;

    const titulo = group[0].titulo;
    const dtstart = dueDates.length
      ? new Date(Math.min(...dueDates.map((d) => d.getTime())))
      : group[0].fechaInicio || new Date();

    let serie = await TareaSeries.findOne({ usuario: userId, googleSerieKey });

    if (!serie) {
      serie = new TareaSeries({
        titulo,
        descripcion: parseRecurrenceFromNotes(group[0].descripcion || '').descripcionSinRecurrencia,
        usuario: userId,
        objetivo: objetivoId,
        rrule,
        dtstart,
        googleSerieKey,
        googleTasksSync: {
          enabled: true,
          googleTaskListId: taskListId,
          exportInstances: false,
          lastSyncDate: new Date(),
        },
      });
      await serie.save();
      stats.seriesCreated++;
    } else {
      serie.rrule = rrule;
      serie.dtstart = dtstart;
      serie.titulo = titulo;
      serie.googleTasksSync = serie.googleTasksSync || {};
      serie.googleTasksSync.googleTaskListId = taskListId;
      serie.googleTasksSync.exportInstances = false;
      serie.googleTasksSync.lastSyncDate = new Date();
      await serie.save();
      stats.seriesUpdated++;
    }

    for (const t of group) {
      if (String(t.serieId) !== String(serie._id)) {
        t.serieId = serie._id;
        const parsed = parseRecurrenceFromNotes(t.descripcion || '');
        t.descripcion = parsed.descripcionSinRecurrencia;
        if (t.googleTasksSync?.enabled && serie.googleTasksSync?.exportInstances === true) {
          t.googleTasksSync.needsSync = true;
        }
        await t.save();
        stats.instancesLinked++;
      }
    }
  }

  logger.sync?.(
    `🔁 Series reconciliadas (list=${taskListId}): +${stats.seriesCreated} nuevas, ${stats.seriesUpdated} actualizadas, ${stats.instancesLinked} instancias`,
  );

  return stats;
}

/**
 * Expande una serie en instancias locales (calendario) y opcionalmente las exporta a Google.
 * @param {{ horizonDays?: number, syncToGoogle?: boolean, rangeFrom?: Date, rangeTo?: Date }} options
 */
export async function expandAndSyncSeries(googleTasksService, userId, serie, options = {}) {
  const horizonDays = options.horizonDays ?? HORIZON_DAYS;
  const syncToGoogle = options.syncToGoogle !== false;
  const exportInstances = serie?.googleTasksSync?.exportInstances === true;
  const stats = { instancesCreated: 0, instancesSynced: 0, errors: [] };

  if (!serie?.activa || !serie.rrule) return stats;
  if (!exportInstances) return stats;

  let from;
  let to;
  if (options.rangeFrom && options.rangeTo) {
    from = new Date(options.rangeFrom);
    to = new Date(options.rangeTo);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    from = new Date(today);
    from.setDate(from.getDate() - EXPAND_LOOKBACK_DAYS);
    const dtstart = new Date(serie.dtstart);
    if (!isNaN(dtstart.getTime()) && dtstart < from) {
      from.setTime(dtstart.getTime());
      from.setHours(0, 0, 0, 0);
    }
    to = new Date(today);
    to.setDate(to.getDate() + horizonDays);
  }

  const occurrences = expandSerie(serie.rrule, new Date(serie.dtstart), from, to);

  for (const occDate of occurrences) {
    try {
      const dayStart = new Date(occDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(occDate);
      dayEnd.setHours(23, 59, 59, 999);

      let tarea = await Tareas.findOne({
        usuario: userId,
        serieId: serie._id,
        esExcepcionSerie: { $ne: true },
        $or: [
          { fechaInicio: { $gte: dayStart, $lte: dayEnd } },
          { fechaVencimiento: { $gte: dayStart, $lte: dayEnd } },
        ],
      });

      if (!tarea) {
        const occMidday = new Date(occDate);
        occMidday.setHours(12, 0, 0, 0);
        tarea = new Tareas({
          titulo: serie.titulo,
          descripcion: appendRecurrenceToNotes(serie.descripcion || '', serie.rrule),
          usuario: userId,
          objetivo: serie.objetivo,
          serieId: serie._id,
          fechaInicio: occMidday,
          fechaVencimiento: occMidday,
          prioridad: 'BAJA',
          googleTasksSync: {
            enabled: exportInstances && serie.googleTasksSync?.enabled !== false,
            syncStatus: exportInstances ? 'pending' : 'synced',
            needsSync: exportInstances,
            googleTaskListId: serie.googleTasksSync?.googleTaskListId,
          },
        });
        await tarea.save();
        stats.instancesCreated++;
      } else if (!tarea.descripcion?.includes('Recurrencia:')) {
        tarea.descripcion = appendRecurrenceToNotes(tarea.descripcion || '', serie.rrule);
        if (exportInstances) {
          tarea.googleTasksSync = tarea.googleTasksSync || {};
          tarea.googleTasksSync.needsSync = true;
        }
        await tarea.save();
      }

      if (
        syncToGoogle
        && exportInstances
        && googleTasksService
        && tarea.googleTasksSync?.enabled
        && tarea.objetivo
      ) {
        await googleTasksService.syncTaskToGoogle(tarea._id, userId);
        stats.instancesSynced++;
      }
    } catch (err) {
      stats.errors.push(`${serie.titulo}@${occDate.toISOString()}: ${err.message}`);
    }
  }

  return stats;
}

export async function reconcileAllSeriesForUser(userId) {
  const series = await TareaSeries.find({ usuario: userId, activa: true });
  const totals = { seriesCreated: 0, seriesUpdated: 0, instancesLinked: 0 };

  const lists = new Set();
  for (const s of series) {
    if (s.googleTasksSync?.googleTaskListId) {
      lists.add(`${s.objetivo}|${s.googleTasksSync.googleTaskListId}`);
    }
  }

  const tareas = await Tareas.find({
    usuario: userId,
    'googleTasksSync.googleTaskListId': { $exists: true, $ne: null },
  });

  for (const t of tareas) {
    if (t.objetivo && t.googleTasksSync?.googleTaskListId) {
      lists.add(`${t.objetivo}|${t.googleTasksSync.googleTaskListId}`);
    }
  }

  for (const key of lists) {
    const [objetivoId, taskListId] = key.split('|');
    const r = await reconcileSeriesFromGoogle(userId, objetivoId, taskListId);
    totals.seriesCreated += r.seriesCreated;
    totals.seriesUpdated += r.seriesUpdated;
    totals.instancesLinked += r.instancesLinked;
  }

  return totals;
}

export async function expandAllSeriesForUser(googleTasksService, userId, options = {}) {
  const series = await TareaSeries.find({
    usuario: userId,
    activa: true,
    'googleTasksSync.enabled': { $ne: false },
    'googleTasksSync.exportInstances': true,
  });

  const totals = { instancesCreated: 0, instancesSynced: 0, errors: [] };

  for (const serie of series) {
    const r = await expandAndSyncSeries(googleTasksService, userId, serie, options);
    totals.instancesCreated += r.instancesCreated;
    totals.instancesSynced += r.instancesSynced;
    totals.errors.push(...r.errors);
  }

  return totals;
}

/**
 * Tras completar una instancia, genera la siguiente ocurrencia local y la exporta.
 */
export async function generateNextSerieInstance(googleTasksService, tarea, userId) {
  if (!tarea?.serieId || tarea.esExcepcionSerie) return null;

  const serie = await TareaSeries.findOne({ _id: tarea.serieId, usuario: userId, activa: true });
  if (!serie?.rrule) return null;

  const exportInstances = serie.googleTasksSync?.exportInstances === true;

  const completedRaw = tarea.fechaVencimiento || tarea.fechaInicio || new Date();
  const from = new Date(completedRaw);
  from.setDate(from.getDate() + 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + HORIZON_DAYS);

  const upcoming = expandSerie(serie.rrule, new Date(serie.dtstart), from, to);
  if (!upcoming.length) return null;

  const nextDate = upcoming[0];
  const nextDue = new Date(nextDate);
  nextDue.setHours(12, 0, 0, 0);

  if (!exportInstances) {
    let anchor = tarea.googleTasksSync?.googleTaskId ? tarea : null;
    if (!anchor) {
      anchor = await Tareas.findOne({
        usuario: userId,
        serieId: serie._id,
        esExcepcionSerie: { $ne: true },
        'googleTasksSync.googleTaskId': { $exists: true, $ne: null },
      });
    }
    if (!anchor) {
      anchor = await Tareas.findOne({
        usuario: userId,
        serieId: serie._id,
        esExcepcionSerie: { $ne: true },
      }).sort({ 'googleTasksSync.googleTaskId': -1, fechaVencimiento: 1 });
    }
    if (!anchor) return null;

    anchor.fechaInicio = nextDue;
    anchor.fechaVencimiento = nextDue;
    anchor.estado = 'PENDIENTE';
    anchor.completada = false;
    await anchor.save();

    if (googleTasksService && anchor.googleTasksSync?.enabled) {
      try {
        await googleTasksService.syncTaskToGoogle(anchor._id, userId);
      } catch (err) {
        logger.warn?.(`No se pudo sincronizar ancla tras completar serie: ${err.message}`);
      }
    }
    return anchor;
  }

  const dayStart = new Date(nextDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(nextDate);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await Tareas.findOne({
    usuario: userId,
    serieId: serie._id,
    esExcepcionSerie: { $ne: true },
    $or: [
      { fechaInicio: { $gte: dayStart, $lte: dayEnd } },
      { fechaVencimiento: { $gte: dayStart, $lte: dayEnd } },
    ],
  });

  if (existing) {
    return existing;
  }

  dayStart.setHours(12, 0, 0, 0);
  const nueva = new Tareas({
    titulo: serie.titulo,
    descripcion: appendRecurrenceToNotes(serie.descripcion || '', serie.rrule),
    usuario: userId,
    objetivo: serie.objetivo,
    serieId: serie._id,
    fechaInicio: nextDue,
    fechaVencimiento: nextDue,
    prioridad: 'BAJA',
    googleTasksSync: {
      enabled: exportInstances,
      syncStatus: exportInstances ? 'pending' : 'synced',
      needsSync: exportInstances,
      googleTaskListId: serie.googleTasksSync?.googleTaskListId,
    },
  });

  await nueva.save();

  if (exportInstances && nueva.objetivo) {
    try {
      await googleTasksService.syncTaskToGoogle(nueva._id, userId);
    } catch (err) {
      logger.warn?.(`No se pudo exportar siguiente ocurrencia de serie: ${err.message}`);
    }
  }

  return nueva;
}

export { HORIZON_DAYS };
