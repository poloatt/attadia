import React from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEstadoColor } from '@shared/components/common/StatusSystem';
import { isTaskCompleted } from '@shared/utils/agendaRules';
import { MIN_EVENT_HEIGHT_PX } from './calendarLayout';

export default function FocoEventBlock({
  event,
  compact = false,
  timedCompact = false,
  onClick,
  onToggleComplete,
}) {
  const theme = useTheme();
  const { task, start, end, allDay, objetivo } = event;
  const completed = isTaskCompleted(task);
  const isEvento = String(task?.tipo || '').toUpperCase() === 'EVENTO';
  const estadoColor = getEstadoColor(task?.estado || 'PENDIENTE', 'TAREA');
  const accent = isEvento
    ? theme.palette.primary.main
    : (objetivo?.color || estadoColor || theme.palette.secondary.main);

  const timeLabel = allDay
    ? 'Todo el día'
    : `${format(start, 'HH:mm', { locale: es })} – ${format(end, 'HH:mm', { locale: es })}`;

  const showCheckbox = onToggleComplete && !isEvento && !timedCompact;
  const showTime = !compact && !timedCompact;

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(task);
      }}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: timedCompact ? 0.25 : 0.5,
        px: timedCompact ? 0.5 : 0.75,
        py: timedCompact ? 0 : (compact ? 0.25 : 0.5),
        borderRadius: timedCompact ? 0.5 : 1,
        borderLeft: `3px solid ${accent}`,
        bgcolor: theme.palette.mode === 'dark'
          ? alpha(accent, completed ? 0.12 : 0.22)
          : alpha(accent, completed ? 0.08 : 0.14),
        opacity: completed ? 0.65 : 1,
        cursor: 'pointer',
        overflow: 'hidden',
        height: timedCompact ? '100%' : 'auto',
        minHeight: timedCompact ? MIN_EVENT_HEIGHT_PX : (compact ? 28 : 36),
        boxSizing: 'border-box',
        '&:hover': {
          filter: 'brightness(1.05)',
        },
      }}
    >
      {showCheckbox && (
        <Checkbox
          size="small"
          checked={completed}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onToggleComplete(task, !completed);
          }}
          sx={{ p: 0, mt: -0.25 }}
        />
      )}
      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            lineHeight: 1.15,
            display: 'block',
            textDecoration: completed ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: timedCompact ? '0.65rem' : undefined,
          }}
        >
          {task.titulo}
          {(task.esRecurrente || task.serieId) && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.5, opacity: 0.75, fontSize: '0.55rem' }}
            >
              ↻
            </Typography>
          )}
        </Typography>
        {showTime && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {timeLabel}
            {objetivo?.nombre ? ` · ${objetivo.nombre}` : ''}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
