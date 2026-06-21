import { Tareas } from '../models/index.js';
import { parseScheduleFromNotes, taskHasTimedSchedule } from '../../../shared/utils/googleTasksScheduleNotes.js';

/**
 * Fusiona due de Google (solo día) con horario local/timed sin pisar la hora del usuario.
 */
export function mergeGoogleDueWithLocalSchedule(tarea, googleDueRaw) {
  if (!googleDueRaw || !tarea) return;

  const dueDate = Tareas.parseGoogleDueDate(googleDueRaw);
  if (!dueDate) return;

  const sync = tarea.googleTasksSync || {};
  const scheduleFromNotes = parseScheduleFromNotes(tarea.descripcion || '');
  const hasTimed = taskHasTimedSchedule(tarea) || Boolean(scheduleFromNotes);
  const needsSync = sync.needsSync === true;

  if (scheduleFromNotes?.fechaInicio) {
    tarea.fechaInicio = scheduleFromNotes.fechaInicio;
    tarea.fechaVencimiento = scheduleFromNotes.fechaFin || scheduleFromNotes.fechaInicio;
    if (scheduleFromNotes.fechaFin) tarea.fechaFin = scheduleFromNotes.fechaFin;
    if (!tarea.googleTasksSync) tarea.googleTasksSync = {};
    tarea.googleTasksSync.hasTimedSchedule = true;
    return;
  }

  if (!hasTimed && !needsSync) {
    tarea.fechaVencimiento = dueDate;
    tarea.fechaInicio = dueDate;
    return;
  }

  const localStart = tarea.fechaInicio instanceof Date
    ? new Date(tarea.fechaInicio.getTime())
    : new Date(tarea.fechaInicio);
  if (Number.isNaN(localStart.getTime())) {
    tarea.fechaInicio = dueDate;
    tarea.fechaVencimiento = dueDate;
    return;
  }

  const newStart = new Date(dueDate);
  newStart.setHours(
    localStart.getHours(),
    localStart.getMinutes(),
    localStart.getSeconds(),
    0,
  );
  tarea.fechaInicio = newStart;

  const localEndRaw = tarea.fechaFin || tarea.fechaVencimiento;
  const localEnd = localEndRaw instanceof Date ? localEndRaw : new Date(localEndRaw);
  if (localEnd && !Number.isNaN(localEnd.getTime()) && localEnd > localStart) {
    const durationMs = localEnd.getTime() - localStart.getTime();
    const newEnd = new Date(newStart.getTime() + durationMs);
    tarea.fechaVencimiento = newEnd;
    if (tarea.fechaFin) tarea.fechaFin = newEnd;
  } else {
    tarea.fechaVencimiento = newStart;
  }

  if (!tarea.googleTasksSync) tarea.googleTasksSync = {};
  if (taskHasTimedSchedule(tarea)) {
    tarea.googleTasksSync.hasTimedSchedule = true;
  }
}
