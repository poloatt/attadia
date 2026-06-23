import shouldShowItem from './shouldShowItem.js';

/**
 * Visibilidad de ítem para rutina (backend save / completitud).
 * Usa la misma cadencia que el panel y carrusel, sin filtro de franja horaria.
 */
export function shouldShowRutinaItem(section, itemId, rutina) {
  if (!section || !itemId || !rutina) return false;

  const plain = typeof rutina.toObject === 'function'
    ? rutina.toObject({ flattenMaps: true })
    : rutina;

  return shouldShowItem(section, itemId, plain, { skipHorarioFilter: true });
}
