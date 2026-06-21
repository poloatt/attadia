import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@mui/material';
import TooltipSpan from '@shared/components/TooltipSpan';

const VIEW_MODE_BUTTON_WIDTH = 64;

/**
 * Botón Día/Semana para la barra unificada de Agenda en /foco (desktop).
 * Estado sincronizado vía agendaCalendarState; alterna con agendaToggleViewMode.
 */
export default function AgendaViewModeToggle({ disabled = false }) {
  const [calendarViewMode, setCalendarViewMode] = useState('week');

  useEffect(() => {
    const handleAgendaCalendarState = (event) => {
      const { viewMode: vm } = event.detail || {};
      if (vm === 'day' || vm === 'week') setCalendarViewMode(vm);
    };
    window.addEventListener('agendaCalendarState', handleAgendaCalendarState);
    return () => window.removeEventListener('agendaCalendarState', handleAgendaCalendarState);
  }, []);

  const handleToggleViewMode = useCallback(() => {
    window.dispatchEvent(new CustomEvent('agendaToggleViewMode'));
  }, []);

  const viewModeLabel = calendarViewMode === 'week' ? 'Día' : 'Semana';
  const viewModeTooltip = calendarViewMode === 'week' ? 'Ver día' : 'Ver semana';

  return (
    <TooltipSpan title={viewModeTooltip}>
      <Button
        size="small"
        variant="text"
        onClick={handleToggleViewMode}
        disabled={disabled}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          minWidth: VIEW_MODE_BUTTON_WIDTH,
          width: VIEW_MODE_BUTTON_WIDTH,
          flexShrink: 0,
          px: 0.75,
          py: 0.25,
          lineHeight: 1.2,
          color: 'text.secondary',
          '&:hover': { color: 'text.primary' },
        }}
        aria-label={viewModeTooltip}
      >
        {viewModeLabel}
      </Button>
    </TooltipSpan>
  );
}
