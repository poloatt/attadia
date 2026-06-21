import React from 'react';
import { Box, IconButton } from '@mui/material';
import TooltipSpan from '@shared/components/TooltipSpan';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useAgendaCalendarNavChevrons } from './useAgendaCalendarNavChevrons';

const chevronButtonSx = {
  width: 28,
  height: 28,
  p: 0.25,
  minWidth: 28,
  minHeight: 28,
  color: 'text.secondary',
  '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
};

const chevronButtonCompactSx = {
  width: 22,
  height: 22,
  p: 0,
  minWidth: 22,
  minHeight: 22,
  color: 'text.secondary',
  '& .MuiSvgIcon-root': { fontSize: '0.95rem' },
  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
};

/** ‹ › para calendario Foco (móvil en encabezado día/semana). */
export default function AgendaCalendarNavChevrons({ viewMode, compact = false }) {
  const { onPrevious, onNext, prevTooltip, nextTooltip } = useAgendaCalendarNavChevrons(viewMode);
  const buttonSx = compact ? chevronButtonCompactSx : chevronButtonSx;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <TooltipSpan title={prevTooltip}>
        <IconButton
          size="small"
          onClick={onPrevious}
          sx={buttonSx}
          aria-label="Anterior"
          data-testid="foco-calendar-prev"
        >
          <NavigateBefore fontSize="small" />
        </IconButton>
      </TooltipSpan>
      <TooltipSpan title={nextTooltip}>
        <IconButton
          size="small"
          onClick={onNext}
          sx={buttonSx}
          aria-label="Siguiente"
          data-testid="foco-calendar-next"
        >
          <NavigateNext fontSize="small" />
        </IconButton>
      </TooltipSpan>
    </Box>
  );
}
