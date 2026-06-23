import React from 'react';
import { Box, Chip, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { startOfDay } from 'date-fns';
import { formatCalendarDayHeader } from '../../utils/focoNavigationUtils';

/** Pill de % de rutina alineado a tipografía Google Calendar (pequeño, regular). */
export function RutinaCompletionPctChip({ label, color = 'primary', tooltip = '' }) {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main ?? theme.palette.primary.main;

  return (
    <Chip
      size="small"
      label={label}
      title={tooltip || undefined}
      sx={{
        height: 22,
        borderRadius: '9999px',
        flexShrink: 0,
        bgcolor: alpha(paletteColor, 0.12),
        color: paletteColor,
        '& .MuiChip-label': {
          px: 0.75,
          py: 0,
          fontSize: '0.8125rem',
          fontWeight: 400,
          lineHeight: 1.2,
        },
      }}
    />
  );
}

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
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const normalized = startOfDay(date || new Date());
  const { weekday, dayNumber, monthYear } = formatCalendarDayHeader(normalized);
  const isRutina = variant === 'rutina';
  const showInlineCompletion = isRutina && typeof completionPercentage === 'number' && !isNarrow;

  const pctLabel = typeof completionPercentage === 'number'
    ? `${completionPercentage}%`
    : '—';

  const modeChip = dayMode ? DAY_MODE_CHIP[dayMode] : null;

  if (isRutina) {
    return (
      <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textTransform: 'capitalize',
            fontWeight: 600,
            letterSpacing: '0.04em',
            display: 'block',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {weekday}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
            flexWrap: isNarrow ? 'wrap' : 'nowrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: { xs: 0.5, sm: 1 },
              minWidth: 0,
              flex: isNarrow ? '1 1 auto' : undefined,
              flexShrink: 1,
              overflow: 'hidden',
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 400,
                lineHeight: 1,
                color: 'text.primary',
                flexShrink: 0,
              }}
            >
              {dayNumber}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                textTransform: 'capitalize',
                fontWeight: 500,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {monthYear}
            </Typography>
          </Box>
          {showInlineCompletion && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <RutinaCompletionPctChip
                label={pctLabel}
                color={completionColor}
                tooltip={completionTooltip}
              />
            </Box>
          )}
          {modeChip && dayMode !== 'today' && (
            <Chip
              size="small"
              label={modeChip.label}
              color={modeChip.color}
              variant="outlined"
              sx={{
                height: 24,
                flexShrink: 0,
                maxWidth: { xs: 72, sm: 'none' },
                '& .MuiChip-label': {
                  px: { xs: 0.5, sm: 1 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
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
