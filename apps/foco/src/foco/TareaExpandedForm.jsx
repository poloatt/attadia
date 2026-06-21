import React, { useMemo } from 'react';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TaskFormHeader,
  TaskFormRow,
  TaskFormPrimaryLine,
  TaskFormSecondaryLine,
  TaskFormSectionLabel,
  taskFormGooglePaperSx,
  taskFormPillButtonSx,
  taskFormDatePillSx,
  taskFormPillRowSx,
  taskFormScheduleStackSx,
  TASK_FORM_PILL_GAP,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import { cleanDescriptionForForm } from './taskRecurrenceFormUtils';
import { parseTaskDate } from '@shared/utils/agendaRules';

function ReadOnlyPill({ children }) {
  return (
    <Box
      component="span"
      sx={{
        ...taskFormPillButtonSx,
        cursor: 'default',
        pointerEvents: 'none',
        '&:hover': { bgcolor: taskFormPillButtonSx.bgcolor },
      }}
    >
      {children}
    </Box>
  );
}

function formatDatePill(date) {
  if (!date) return null;
  const raw = format(date, 'EEEE, d MMMM', { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatTimePill(date) {
  if (!date) return null;
  return format(date, 'HH:mm');
}

function getEstadoLabel(estado) {
  switch (estado) {
    case 'COMPLETADA': return 'Completada';
    case 'EN_PROGRESO': return 'En Progreso';
    case 'PENDIENTE': return 'Pendiente';
    case 'CANCELADA': return 'Cancelada';
    default: return estado;
  }
}

function resolveObjetivoLabel(tarea, objetivos) {
  if (tarea.objetivo && typeof tarea.objetivo === 'object') {
    return tarea.objetivo.nombre || tarea.objetivo.titulo || 'Objetivo';
  }
  const id = tarea.objetivo;
  if (!id) return null;
  const found = (objetivos || []).find((o) => String(o._id || o.id) === String(id));
  return found?.nombre || found?.titulo || null;
}

/**
 * Read-only Google Calendar–style detail card for expanded task rows.
 */
export default function TareaExpandedForm({
  tarea,
  objetivos = [],
  subtareas = [],
  estadoLocal,
  prioridadLocal,
  showValues = true,
  maskText = (v) => v,
  onClose,
  onToggleSubtarea,
  isUpdating = false,
  isArchive = false,
  isMobile = false,
}) {
  const tipo = tarea.tipo === 'EVENTO' ? 'EVENTO' : 'TAREA';
  const descripcion = cleanDescriptionForForm(tarea.descripcion);
  const fechaInicio = parseTaskDate(tarea.fechaInicio);
  const fechaFin = parseTaskDate(tarea.fechaFin);
  const fechaVencimiento = parseTaskDate(tarea.fechaVencimiento);

  const isAllDay = useMemo(() => {
    if (!fechaInicio) return true;
    const atMidnight = fechaInicio.getHours() === 0 && fechaInicio.getMinutes() === 0;
    if (!fechaFin) return atMidnight;
    return atMidnight && fechaFin.getHours() === 23 && fechaFin.getMinutes() >= 59;
  }, [fechaInicio, fechaFin]);

  const display = (value) => (showValues ? value : maskText(value));
  const objetivoLabel = resolveObjetivoLabel(tarea, objetivos);
  const subtareasCompletadas = subtareas.filter((st) => st.completada).length;

  return (
    <Box
      sx={{
        ...taskFormGooglePaperSx(isMobile),
        borderRadius: 2,
        mx: isMobile ? 0.5 : 1,
        my: 0.75,
        overflow: 'hidden',
        maxHeight: isMobile ? '70vh' : '75vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <TaskFormHeader onClose={onClose} closeLabel="Cerrar">
          <Chip
            label={tipo === 'EVENTO' ? 'Evento' : 'Tarea'}
            size="small"
            sx={{
              mb: 1,
              height: 32,
              borderRadius: '16px',
              fontSize: '0.8125rem',
              bgcolor: 'action.selected',
              color: 'text.primary',
              fontWeight: 500,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.375rem',
              fontWeight: 400,
              lineHeight: 1.35,
              pr: 3,
              wordBreak: 'break-word',
            }}
          >
            {display(tarea.titulo)}
          </Typography>
        </TaskFormHeader>

        <Box sx={{ px: 2, pb: 1.5 }}>
          {descripcion ? (
            <TaskFormRow icon={TaskFormIcons.description} showDivider={false}>
              <Typography
                variant="body2"
                sx={{ fontSize: '0.875rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}
                color="text.primary"
              >
                {display(descripcion)}
              </Typography>
            </TaskFormRow>
          ) : null}

          {fechaInicio ? (
            <TaskFormRow icon={TaskFormIcons.schedule} showDivider={false} align="flex-start">
              <Stack spacing={TASK_FORM_PILL_GAP} sx={taskFormScheduleStackSx}>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  gap={TASK_FORM_PILL_GAP}
                  useFlexGap
                  sx={taskFormPillRowSx}
                >
                  <ReadOnlyPill sx={taskFormDatePillSx}>
                    {formatDatePill(fechaInicio)}
                  </ReadOnlyPill>
                  {!isAllDay && (
                    <>
                      <ReadOnlyPill>{formatTimePill(fechaInicio)}</ReadOnlyPill>
                      {fechaFin ? (
                        <>
                          <Typography component="span" variant="body2" color="text.secondary">
                            –
                          </Typography>
                          <ReadOnlyPill>{formatTimePill(fechaFin)}</ReadOnlyPill>
                        </>
                      ) : null}
                    </>
                  )}
                  {isAllDay ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem', ml: 'auto' }}
                    >
                      Todo el día
                    </Typography>
                  ) : null}
                </Stack>
                {fechaVencimiento && !isAllDay ? (
                  <ReadOnlyPill sx={taskFormDatePillSx}>
                    {formatDatePill(fechaVencimiento)}
                  </ReadOnlyPill>
                ) : null}
              </Stack>
            </TaskFormRow>
          ) : fechaVencimiento ? (
            <TaskFormRow icon={TaskFormIcons.deadline} showDivider={false}>
              <ReadOnlyPill sx={taskFormDatePillSx}>
                {formatDatePill(fechaVencimiento)}
              </ReadOnlyPill>
            </TaskFormRow>
          ) : null}

          {tipo === 'TAREA' && objetivoLabel ? (
            <TaskFormRow icon={TaskFormIcons.objetivo} showDivider={false}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  py: 0.75,
                  px: 1.5,
                  borderRadius: '20px',
                  bgcolor: 'action.hover',
                  fontSize: '0.8125rem',
                  color: 'text.primary',
                  minHeight: 36,
                }}
              >
                {display(objetivoLabel)}
              </Box>
            </TaskFormRow>
          ) : null}

          <TaskFormRow icon={TaskFormIcons.estado} showDivider={false}>
            <Box>
              <TaskFormPrimaryLine>{getEstadoLabel(estadoLocal || tarea.estado)}</TaskFormPrimaryLine>
              {prioridadLocal === 'ALTA' ? (
                <TaskFormSecondaryLine>Prioridad alta</TaskFormSecondaryLine>
              ) : null}
            </Box>
          </TaskFormRow>

          {subtareas.length > 0 ? (
            <>
              <TaskFormRow icon={TaskFormIcons.subtarea} showDivider={false}>
                <Box>
                  <TaskFormPrimaryLine>Subtareas</TaskFormPrimaryLine>
                  <TaskFormSecondaryLine>
                    {subtareasCompletadas}/{subtareas.length} completadas
                  </TaskFormSecondaryLine>
                </Box>
              </TaskFormRow>
              <Stack spacing={0.25} sx={{ pl: 5.5, pb: 0.5 }}>
                {subtareas.map((subtarea, index) => (
                  <Box
                    key={subtarea._id || index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      minHeight: 40,
                    }}
                  >
                    <IconButton
                      size="small"
                      disabled={isUpdating}
                      onClick={() => onToggleSubtarea?.(subtarea._id, subtarea.completada)}
                      sx={{
                        p: 0.5,
                        color: subtarea.completada ? 'success.main' : 'text.secondary',
                        '& .MuiSvgIcon-root': { fontSize: '1.25rem' },
                      }}
                    >
                      <TaskFormIcons.completed />
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontSize: '0.875rem',
                        lineHeight: 1.45,
                        textDecoration: subtarea.completada ? 'line-through' : 'none',
                        color: subtarea.completada ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {display(subtarea.titulo)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          ) : null}

          {tarea.archivos?.length > 0 ? (
            <Box sx={{ py: 1.25 }}>
              <TaskFormSectionLabel>Archivos adjuntos</TaskFormSectionLabel>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                {tarea.archivos.map((archivo, index) => (
                  <Chip
                    key={index}
                    label={archivo.nombre}
                    size="small"
                    sx={{ borderRadius: '16px' }}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
