import React, { useMemo } from 'react';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import {
  TareaFormHeader,
  TareaFormPriorityToggle,
  TareaFormAllDaySwitch,
  TareaFormRow,
  TareaFormPrimaryLine,
  TareaFormSecondaryLine,
  TareaFormSectionLabel,
  tareaFormGooglePaperSx,
  tareaFormSchedulePillButtonSx,
  tareaFormDatePillSx,
  tareaFormPillRowSx,
  tareaFormScheduleStackSx,
  tareaFormRowWithActionSx,
  TAREA_FORM_PILL_GAP,
  TareaFormHeaderTitleRow,
  tareaFormRowContentGutterSx,
  tareaFormHeaderActionSpacerSx,
} from '@shared/components/forms/tareaFormUi';
import { TareaFormIcons } from '@shared/components/forms/tareaFormIcons';
import { cleanDescriptionForForm } from './tareaRecurrenceFormUtils';
import { parseTaskDate } from '@shared/utils/agendaRules';
import { formatDatePill, formatTimePill } from './utils/tareaFormDateUtils';

function ReadOnlyPill({ children }) {
  return (
    <Box
      component="span"
      sx={{
        ...tareaFormSchedulePillButtonSx,
        cursor: 'default',
        pointerEvents: 'none',
        '&:hover': { bgcolor: tareaFormSchedulePillButtonSx.bgcolor },
      }}
    >
      {children}
    </Box>
  );
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
        ...tareaFormGooglePaperSx(isMobile),
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
        <TareaFormHeader onClose={onClose} closeLabel="Cerrar">
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
          <TareaFormHeaderTitleRow
            action={tipo === 'TAREA' ? (
              <TareaFormPriorityToggle
                prioridad={prioridadLocal || tarea.prioridad}
                readOnly
                hideWhenLow
                sx={{ mt: 0.25, flexShrink: 0 }}
              />
            ) : null}
          >
            <Typography
              variant="body1"
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '1.375rem',
                fontWeight: 400,
                lineHeight: 1.35,
                wordBreak: 'break-word',
              }}
            >
              {display(tarea.titulo)}
            </Typography>
          </TareaFormHeaderTitleRow>
        </TareaFormHeader>

        <Box sx={{ px: 2, pb: 1.5 }}>
          {descripcion ? (
            <TareaFormRow icon={TareaFormIcons.description} showDivider={false}>
              <Box sx={tareaFormRowContentGutterSx}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}
                  color="text.primary"
                >
                  {display(descripcion)}
                </Typography>
              </Box>
            </TareaFormRow>
          ) : null}

          {fechaInicio ? (
            <TareaFormRow icon={TareaFormIcons.schedule} showDivider={false} align="flex-start">
              <Stack spacing={TAREA_FORM_PILL_GAP} sx={tareaFormScheduleStackSx}>
                <Box sx={tareaFormRowWithActionSx}>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="center"
                    gap={TAREA_FORM_PILL_GAP}
                    useFlexGap
                    sx={{ flex: 1, minWidth: 0, ...tareaFormPillRowSx, width: 'auto' }}
                  >
                    <ReadOnlyPill sx={tareaFormDatePillSx}>
                      {formatDatePill(fechaInicio)}
                    </ReadOnlyPill>
                    {!isAllDay && (
                      <ReadOnlyPill>{formatTimePill(fechaInicio)}</ReadOnlyPill>
                    )}
                    {!isAllDay && !fechaVencimiento && fechaFin ? (
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          –
                        </Typography>
                        <ReadOnlyPill>{formatTimePill(fechaFin)}</ReadOnlyPill>
                      </>
                    ) : null}
                  </Stack>
                  {isAllDay ? (
                    <TareaFormAllDaySwitch checked readOnly hideWhenOff />
                  ) : (
                    <Box sx={tareaFormHeaderActionSpacerSx} aria-hidden />
                  )}
                </Box>
                {fechaVencimiento && !isAllDay ? (
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="center"
                    gap={TAREA_FORM_PILL_GAP}
                    useFlexGap
                    sx={{ ...tareaFormPillRowSx, ...tareaFormRowContentGutterSx }}
                  >
                    <ReadOnlyPill sx={tareaFormDatePillSx}>
                      {formatDatePill(fechaVencimiento)}
                    </ReadOnlyPill>
                    <ReadOnlyPill>{formatTimePill(fechaVencimiento)}</ReadOnlyPill>
                  </Stack>
                ) : null}
              </Stack>
            </TareaFormRow>
          ) : fechaVencimiento ? (
            <TareaFormRow icon={TareaFormIcons.deadline} showDivider={false}>
              <Box sx={tareaFormRowContentGutterSx}>
                <ReadOnlyPill sx={tareaFormDatePillSx}>
                  {formatDatePill(fechaVencimiento)}
                </ReadOnlyPill>
              </Box>
            </TareaFormRow>
          ) : null}

          {tipo === 'TAREA' && objetivoLabel ? (
            <TareaFormRow icon={TareaFormIcons.objetivo} showDivider={false}>
              <Box sx={tareaFormRowContentGutterSx}>
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
              </Box>
            </TareaFormRow>
          ) : null}

          <TareaFormRow icon={TareaFormIcons.estado} showDivider={false}>
            <Box sx={tareaFormRowContentGutterSx}>
              <TareaFormPrimaryLine>{getEstadoLabel(estadoLocal || tarea.estado)}</TareaFormPrimaryLine>
            </Box>
          </TareaFormRow>

          {subtareas.length > 0 ? (
            <>
              <TareaFormRow icon={TareaFormIcons.subtarea} showDivider={false}>
                <Box sx={tareaFormRowContentGutterSx}>
                  <Box>
                    <TareaFormPrimaryLine>Subtareas</TareaFormPrimaryLine>
                    <TareaFormSecondaryLine>
                      {subtareasCompletadas}/{subtareas.length} completadas
                    </TareaFormSecondaryLine>
                  </Box>
                </Box>
              </TareaFormRow>
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
                      <TareaFormIcons.completed />
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
              <TareaFormSectionLabel>Archivos adjuntos</TareaFormSectionLabel>
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
