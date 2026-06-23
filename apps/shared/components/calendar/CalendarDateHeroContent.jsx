import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { startOfDay } from 'date-fns';
import { formatCalendarDayHeader } from '../../utils/focoNavigationUtils';

const DAY_MODE_CHIP = {
  today: { label: 'Hoy', color: 'primary' },
  historical: { label: 'Histórico', color: 'default' },
  future: { label: 'Futuro', color: 'warning' },
};

/**
 * Contenido tipográfico del hero de fecha estilo Google Calendar.
 * Usado por AgendaCalendarDateHeader y navegación de rutinas.
 */
export default function CalendarDateHeroContent({
  date,
  compact = false,
  subtitle = '',
  variant = 'default',
  completionPercentage,
  completionColor = 'primary',
  completionTooltip = '',
  dayMode = null,
  viewingToday = false,
  onGoToToday,
  loading = false,
}) {
  const normalized = startOfDay(date || new Date());
  const { weekday, dayNumber, monthYear } = formatCalendarDayHeader(normalized);
  const isRutina = variant === 'rutina';

  const pctLabel = typeof completionPercentage === 'number'
    ? `${completionPercentage}%`
    : '—';

  const modeChip = dayMode ? DAY_MODE_CHIP[dayMode] : null;

  if (isRutina) {
    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textTransform: 'capitalize',
            fontWeight: 600,
            letterSpacing: '0.04em',
            display: 'block',
            lineHeight: 1.2,
          }}
        >
          {weekday}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem' },
                fontWeight: 400,
                lineHeight: 1,
                color: 'text.primary',
              }}
            >
              {dayNumber}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textTransform: 'capitalize', fontWeight: 500 }}
            >
              {monthYear}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              minWidth: 0,
            }}
            title={completionTooltip}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1,
                color: `${completionColor}.main`,
              }}
            >
              {pctLabel}
            </Typography>
          </Box>
          {modeChip && dayMode !== 'today' && (
            <Chip
              size="small"
              label={modeChip.label}
              color={modeChip.color}
              variant="outlined"
              sx={{
                height: 24,
                flexShrink: 0,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
        </Box>
        {subtitle ? (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', lineHeight: 1.2, mt: 0.25 }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: 'capitalize',
          fontWeight: 600,
          letterSpacing: '0.04em',
          display: 'block',
          lineHeight: 1.2,
        }}
      >
        {weekday}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: compact ? 0.75 : 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: compact
              ? { xs: '1.35rem', sm: '1.5rem' }
              : { xs: '1.75rem', sm: '2rem' },
            fontWeight: 400,
            lineHeight: 1,
            color: 'text.primary',
          }}
        >
          {dayNumber}
        </Typography>
        <Typography
          variant={compact ? 'body2' : 'body1'}
          color="text.secondary"
          sx={{ textTransform: 'capitalize', fontWeight: 500 }}
        >
          {monthYear}
        </Typography>
      </Box>
      {subtitle ? (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', lineHeight: 1.2 }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
