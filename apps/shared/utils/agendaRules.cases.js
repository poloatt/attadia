import { getAgendaBucket, getAgendaSortKey, isInAhora, isInLuego } from './agendaRules';

/**
 * Casos de verificación (manual) para validar reglas de agenda.
 * No se importa en producción. Útil para correr en consola/Node durante debugging.
 */
export const agendaRuleCases = [
  {
    id: 'dueNextMonth_startToday',
    title: 'Due próximo mes + start hoy => LUEGO (por due), bucket por due',
    task: { fechaInicio: new Date().toISOString(), fechaVencimiento: new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString() },
  },
  {
    id: 'dueTomorrow',
    title: 'Due mañana => AHORA, bucket MAÑANA/HOY según fecha',
    task: { fechaVencimiento: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
  },
  {
    id: 'startIn10Days_noDue',
    title: 'Sin due, start en 10 días => LUEGO, bucket por start',
    task: { fechaInicio: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString() },
  },
  {
    id: 'noDates',
    title: 'Sin fechas => AHORA, bucket SIN FECHA',
    task: { titulo: 'Sin fechas' },
  },
];

export function evaluateAgendaRuleCases(now = new Date()) {
  return agendaRuleCases.map(c => {
    const inAhora = isInAhora(c.task, now);
    const inLuego = isInLuego(c.task, now);
    return {
      id: c.id,
      title: c.title,
      inAhora,
      inLuego,
      bucketAhora: getAgendaBucket(c.task, 'ahora', now),
      bucketLuego: getAgendaBucket(c.task, 'luego', now),
      sortKey: getAgendaSortKey(c.task),
    };
  });
}






