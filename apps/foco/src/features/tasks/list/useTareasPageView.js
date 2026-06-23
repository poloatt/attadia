import { useEffect, useState } from 'react';

/** @typedef {'list' | 'agenda'} TareasPageView */

/** Vistas de la página Tareas: lista o calendario agenda. */
export const TAREAS_PAGE_VIEWS = /** @type {const} */ (['list', 'agenda']);

/**
 * Sincroniza la vista lista/agenda de Tareas vía `tareasPageViewChanged`.
 * @param {TareasPageView} [defaultView='list']
 */
export function useTareasPageView(defaultView = 'list') {
  const [pageView, setPageView] = useState(defaultView);

  useEffect(() => {
    const handlePageViewChanged = (event) => {
      const { view } = event.detail || {};
      if (view === 'list' || view === 'agenda') setPageView(view);
    };
    window.addEventListener('tareasPageViewChanged', handlePageViewChanged);
    return () => window.removeEventListener('tareasPageViewChanged', handlePageViewChanged);
  }, []);

  return pageView;
}

/** @param {TareasPageView} view */
export function setTareasPageView(view) {
  if (view !== 'list' && view !== 'agenda') return;
  window.dispatchEvent(new CustomEvent('tareasPageViewChanged', { detail: { view } }));
}

/** @param {TareasPageView} current */
export function toggleTareasPageView(current) {
  setTareasPageView(current === 'list' ? 'agenda' : 'list');
}
