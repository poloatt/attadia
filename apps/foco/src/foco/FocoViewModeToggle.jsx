import React, { useCallback, useEffect, useState } from 'react';
import { Button, Tooltip } from '@mui/material';

const VIEW_MODE_BUTTON_WIDTH = 64;

/**
 * Botón Día/Semana para la barra unificada de Agenda en /foco (desktop).
 * Estado sincronizado vía focoCalendarState; alterna con focoToggleViewMode.
 */
export default function FocoViewModeToggle({ disabled = false }) {
  const [calendarViewMode, setCalendarViewMode] = useState('week');

  useEffect(() => {
    const handleFocoCalendarState = (event) => {
      const { viewMode: vm } = event.detail || {};
      if (vm === 'day' || vm === 'week') setCalendarViewMode(vm);
    };
    window.addEventListener('focoCalendarState', handleFocoCalendarState);
    return () => window.removeEventListener('focoCalendarState', handleFocoCalendarState);
  }, []);

  const handleToggleViewMode = useCallback(() => {
    window.dispatchEvent(new CustomEvent('focoToggleViewMode'));
  }, []);

  const viewModeLabel = calendarViewMode === 'week' ? 'Día' : 'Semana';
  const viewModeTooltip = calendarViewMode === 'week' ? 'Ver día' : 'Ver semana';

  return (
    <Tooltip title={viewModeTooltip}>
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
    </Tooltip>
  );
}
