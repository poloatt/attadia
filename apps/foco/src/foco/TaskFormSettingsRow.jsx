import React, { useState } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';
import { TaskFormRow, TaskFormPillButton, taskFormPillChevronSx, taskFormPillIconSx, taskFormPillRowSx, taskFormErrorTextSx } from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import TaskFormRecurrencePicker from './TaskFormRecurrencePicker';

const ESTADO_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'COMPLETADA', label: 'Completada' },
];

function getEstadoLabel(estado) {
  return ESTADO_OPTIONS.find((o) => o.value === estado)?.label || 'Pendiente';
}

/**
 * Fila unificada: Estado | Prioridad | Cadencia | Adjuntar (pills compartidos).
 */
export default function TaskFormSettingsRow({
  estado,
  onEstadoChange,
  prioridad,
  onPrioridadChange,
  showPrioridad = true,
  showRecurrence = true,
  recurrenceRrule = null,
  onRecurrenceChange,
  tipo = 'TAREA',
  onAttach,
  errors = {},
}) {
  const [estadoAnchor, setEstadoAnchor] = useState(null);
  const estadoOpen = Boolean(estadoAnchor);

  const handleEstadoSelect = (value) => {
    setEstadoAnchor(null);
    onEstadoChange?.({ target: { value } });
  };

  return (
    <TaskFormRow icon={TaskFormIcons.estado} showDivider={false} align="center">
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={0.75}
        useFlexGap
        sx={taskFormPillRowSx}
      >
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.75} useFlexGap>
          <TaskFormPillButton
            variant="settings"
            onClick={(e) => setEstadoAnchor(e.currentTarget)}
            aria-label="Estado"
            sx={errors.estado ? { outline: '1px solid', outlineColor: 'error.main' } : undefined}
          >
            {getEstadoLabel(estado || 'PENDIENTE')}
            <ChevronDownIcon sx={taskFormPillChevronSx} />
          </TaskFormPillButton>

          <Menu anchorEl={estadoAnchor} open={estadoOpen} onClose={() => setEstadoAnchor(null)}>
            {ESTADO_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} onClick={() => handleEstadoSelect(opt.value)}>
                {opt.label}
              </MenuItem>
            ))}
          </Menu>

          {showPrioridad && tipo !== 'EVENTO' && onPrioridadChange && (
            <TaskFormPillButton
              variant="settings"
              onClick={() => onPrioridadChange(prioridad === 'ALTA' ? 'BAJA' : 'ALTA')}
              aria-label="Prioridad"
              sx={{ color: prioridad === 'ALTA' ? 'error.main' : 'text.primary' }}
            >
              <TaskFormIcons.prioridad sx={taskFormPillIconSx} />
              {prioridad === 'ALTA' ? 'Alta' : 'Baja'}
            </TaskFormPillButton>
          )}

          {showRecurrence && onRecurrenceChange && (
            <TaskFormRecurrencePicker
              variant="settings"
              value={recurrenceRrule}
              onChange={onRecurrenceChange}
            />
          )}
        </Stack>

        {onAttach && (
          <TaskFormPillButton
            variant="settings"
            component="label"
            aria-label="Adjuntar archivos"
            sx={{ ml: 'auto', cursor: 'pointer' }}
          >
            <AttachFileIcon sx={taskFormPillIconSx} />
            Adjuntar
            <input type="file" hidden multiple onChange={onAttach} />
          </TaskFormPillButton>
        )}
      </Stack>

      {errors.estado ? (
        <Box component="span" sx={{ ...taskFormErrorTextSx, mt: 0.5, display: 'block' }}>
          {errors.estado}
        </Box>
      ) : null}
    </TaskFormRow>
  );
}
