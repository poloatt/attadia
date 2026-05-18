import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { isSameDay } from 'date-fns';
import { useRutinas, useHabits } from '@shared/context';
import { getNormalizedToday } from '@shared/utils/dateUtils';
import RutinasPendientesHoy from '../rutinas/RutinasPendientesHoy';
import RutinasLuego from '../rutinas/RutinasLuego';

/**
 * Franja compacta de action items de rutinas para la fecha seleccionada.
 */
export default function RutinasActionStrip({ targetDate, agendaView = 'ahora' }) {
  const { fetchRutinas } = useRutinas();
  const { fetchHabits } = useHabits();

  const resolvedDate = targetDate || getNormalizedToday();
  const isToday = isSameDay(resolvedDate, getNormalizedToday());
  const showLuego = isToday && agendaView === 'luego';

  useEffect(() => {
    if (typeof fetchRutinas === 'function') fetchRutinas();
    if (typeof fetchHabits === 'function') fetchHabits();
  }, [fetchRutinas, fetchHabits]);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
      }}
    >
      <RutinasPendientesHoy
        variant="iconsRow"
        showDividers={false}
        targetDate={resolvedDate}
      />
      {showLuego && (
        <RutinasLuego
          variant="iconsRow"
          showDividers={false}
          targetDate={resolvedDate}
        />
      )}
    </Box>
  );
}
