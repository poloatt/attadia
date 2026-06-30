import React from 'react';
import { Box, Chip, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { startOfDay } from 'date-fns';
import { formatCalendarDayHeader } from '../../utils/focoNavigationUtils';

/** Pill de % de rutina — tipografía Google Calendar; `subtle` = blanco brilloso suave. */
export function RutinaCompletionPctChip({ label, color = 'primary', tooltip = '', subtle = false }) {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main ?? theme.palette.primary.main;
  const subtleStyles = subtle
    ? {
      bgcolor: alpha(theme.palette.common.white, 0.1),
      color: alpha(theme.palette.common.white, 0.9),
      boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.16)}`,
    }
    : {
      bgcolor: alpha(paletteColor, 0.12),
      color: paletteColor,
    };

  return (
    <Chip
      size="small"
      label={label}
      title={tooltip || undefined}
      sx={{
        height: 22,
        borderRadius: '9999px',
        flexShrink: 0,
        ...subtleStyles,
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

/** Estilos de barra de progreso rutina — blanco sutil con ligero brillo. */
export function getRutinaProgressBarSx(theme, { bleedProgressBar = false } = {}) {
  return {
    width: '100%',
    height: 4,
    borderRadius: 0,
    mt: 0.5,
    bgcolor: alpha(theme.palette.common.white, 0.08),
    '& .MuiLinearProgress-bar': {
      borderRadius: 0,
      bgcolor: alpha(theme.palette.common.white, 0.72),
      boxShadow: `0 0 10px ${alpha(theme.palette.common.white, 0.22)}`,
    },
    ...(bleedProgressBar && {
      width: { md: `calc(100% + ${theme.spacing(6)})` },
      ml: { md: theme.spacing(-3) },
    }),
  };
}

const DAY_MODE_LABEL = {
  historical: 'Histórico',
  future: 'Futuro',
};

export { DAY_MODE_LABEL };

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
            gap: { xs: 0.375, sm: 0.5 },
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
            flexWrap: 'nowrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: { xs: 0.375, sm: 0.5 },
              minWidth: 0,
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
            <RutinaCompletionPctChip
              label={pctLabel}
              color={completionColor}
              tooltip={completionTooltip}
              subtle={variant === 'rutina'}
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
