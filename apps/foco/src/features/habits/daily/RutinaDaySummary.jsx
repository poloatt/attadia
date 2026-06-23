import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { getHubSubsectionSx } from '@shared/styles/hubSectionStyles';
import { formatRutinaDaySubtitle, getRutinaDayMode } from '@shared/utils/rutinasPageUtils';

const summarySx = {
  ...getHubSubsectionSx(),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 1.25,
  py: 0.75,
  mb: 1,
  flexWrap: 'wrap',
};

const DAY_MODE_CHIP = {
  today: { label: 'Hoy', color: 'primary' },
  historical: { label: 'Histórico', color: 'default' },
  future: { label: 'Futuro', color: 'warning' },
};

/** Resumen informativo del día activo (fecha, %, posición, chip de modo). */
export default function RutinaDaySummary({
  fecha,
  percentage,
  currentPage,
  totalPages,
  dayMode,
}) {
  const mode = dayMode || getRutinaDayMode(fecha);
  const chip = DAY_MODE_CHIP[mode];
  const subtitle = formatRutinaDaySubtitle({
    fecha,
    percentage,
    currentPage,
    totalPages,
  });

  if (!subtitle && !chip) return null;

  return (
    <Box sx={summarySx} data-testid="rutina-day-summary">
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
        {subtitle}
      </Typography>
      {chip ? (
        <Chip
          size="small"
          label={chip.label}
          color={chip.color}
          variant={mode === 'today' ? 'filled' : 'outlined'}
          sx={{ height: 22, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
        />
      ) : null}
    </Box>
  );
}
