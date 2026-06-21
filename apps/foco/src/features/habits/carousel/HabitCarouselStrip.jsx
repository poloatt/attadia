import React from 'react';
import { Box } from '@mui/material';
import { isSameDay } from 'date-fns';
import { getNormalizedToday } from '@shared/utils/dateUtils';
import HabitCarouselRow from './HabitCarouselRow';

/**
 * Franja compacta de action items de rutinas para la fecha seleccionada.
 */
export default function HabitCarouselStrip({ targetDate, agendaView = 'ahora' }) {
  const resolvedDate = targetDate || getNormalizedToday();
  const isToday = isSameDay(resolvedDate, getNormalizedToday());
  const showLuego = isToday && agendaView === 'luego';

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
      <HabitCarouselRow
        mode="ahora"
        variant="iconsRow"
        showDividers={false}
        targetDate={resolvedDate}
      />
      {showLuego && (
        <HabitCarouselRow
          mode="luego"
          variant="iconsRow"
          showDividers={false}
          targetDate={resolvedDate}
        />
      )}
    </Box>
  );
}
