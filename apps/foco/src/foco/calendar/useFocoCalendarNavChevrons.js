import { useCallback, useEffect, useState } from 'react';
import { shiftCalendarDate } from '@shared/utils/focoNavigationUtils';

/** Sincroniza con `focoCalendarState` y navega vía evento `navigate` (mismo contrato que RutinaNavigation). */
export function useFocoCalendarNavChevrons(viewModeOverride) {
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState(() => (
    viewModeOverride === 'week' ? 'week' : 'day'
  ));

  useEffect(() => {
    const handleFocoCalendarState = (event) => {
      const { date, viewMode: vm } = event.detail || {};
      if (date) setCalendarDate(new Date(date));
      if (vm === 'day' || vm === 'week') setViewMode(vm);
    };
    window.addEventListener('focoCalendarState', handleFocoCalendarState);
    return () => window.removeEventListener('focoCalendarState', handleFocoCalendarState);
  }, []);

  useEffect(() => {
    if (viewModeOverride === 'day' || viewModeOverride === 'week') {
      setViewMode(viewModeOverride);
    }
  }, [viewModeOverride]);

  const effectiveMode = viewModeOverride || viewMode;

  const dispatchCalendarNavigate = useCallback((direction, date) => {
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: {
        direction,
        date: (date || new Date()).toISOString(),
      },
    }));
  }, []);

  const onPrevious = useCallback(() => {
    const nextDate = shiftCalendarDate(calendarDate, effectiveMode, 'prev');
    setCalendarDate(nextDate);
    dispatchCalendarNavigate('prev', nextDate);
  }, [calendarDate, dispatchCalendarNavigate, effectiveMode]);

  const onNext = useCallback(() => {
    const nextDate = shiftCalendarDate(calendarDate, effectiveMode, 'next');
    setCalendarDate(nextDate);
    dispatchCalendarNavigate('next', nextDate);
  }, [calendarDate, dispatchCalendarNavigate, effectiveMode]);

  const prevTooltip = effectiveMode === 'week' ? 'Semana anterior' : 'Día anterior';
  const nextTooltip = effectiveMode === 'week' ? 'Semana siguiente' : 'Día siguiente';

  return { onPrevious, onNext, prevTooltip, nextTooltip };
}
