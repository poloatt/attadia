import React from 'react';
import { Box } from '@mui/material';
import RutinasActionStrip from '../RutinasActionStrip';
import { calendarContextBarSx } from './calendarLayout';

/**
 * Franja de acciones de rutina debajo del encabezado de fecha en vistas de calendario.
 */
export default function FocoCalendarContextBar({
  targetDate,
  agendaView = 'ahora',
}) {
  return (
    <Box sx={calendarContextBarSx}>
      <RutinasActionStrip targetDate={targetDate} agendaView={agendaView} />
    </Box>
  );
}
