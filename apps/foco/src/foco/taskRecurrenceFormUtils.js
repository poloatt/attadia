/**
 * RRULE y descripción limpia para el formulario de tareas (series + bloque en notes).
 */

export function parseRruleFromDescription(descripcion = '') {
  const text = String(descripcion || '');
  const block = text.match(/Recurrencia:\s*\n\s*RRULE:(FREQ[^\n\r]+)/i);
  if (block) return block[1].trim();
  const inline = text.match(/(?:^|\n)\s*RRULE:(FREQ[^\n\r]+)/i);
  if (inline) return inline[1].trim();
  return null;
}

export function cleanDescriptionForForm(descripcion = '') {
  let text = String(descripcion || '');
  const recIdx = text.search(/\n\s*Recurrencia:\s*(\n|$)/i);
  if (recIdx >= 0) text = text.slice(0, recIdx);
  const subIdx = text.search(/\n\s*Subtareas:\s*(\n|$)/i);
  if (subIdx >= 0) text = text.slice(0, subIdx);
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

export function resolveTaskFormRrule(task) {
  if (!task) return null;
  const serie = task.serieId;
  if (serie && typeof serie === 'object' && serie.rrule && serie.activa !== false) {
    return serie.rrule;
  }
  if (task.rrule) return task.rrule;
  return parseRruleFromDescription(task.descripcion);
}
