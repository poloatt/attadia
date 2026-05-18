import React from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEstadoColor } from '@shared/components/common/StatusSystem';
import { isTaskCompleted } from '@shared/utils/agendaRules';

export default function FocoEventBlock({
  event,
  compact = false,
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
        gap: 0.5,
        px: 0.75,
        py: compact ? 0.25 : 0.5,
        borderRadius: 1,
        borderLeft: `3px solid ${accent}`,
        bgcolor: theme.palette.mode === 'dark'
          ? alpha(accent, completed ? 0.12 : 0.22)
          : alpha(accent, completed ? 0.08 : 0.14),
        opacity: completed ? 0.65 : 1,
        cursor: 'pointer',
        overflow: 'hidden',
        minHeight: compact ? 28 : 36,
        '&:hover': {
          filter: 'brightness(1.05)',
        },
      }}
    >
      {onToggleComplete && !isEvento && (
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
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            display: 'block',
            textDecoration: completed ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.titulo}
          {(task.esRecurrente || task.serieId) && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.5, opacity: 0.75, fontSize: '0.6rem' }}
            >
              ↻
            </Typography>
          )}
        </Typography>
        {!compact && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {timeLabel}
            {objetivo?.nombre ? ` · ${objetivo.nombre}` : ''}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
