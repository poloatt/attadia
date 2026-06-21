import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import {
  TaskFormRow,
  TaskFormPillSelect,
  taskFormStandardFieldSx,
  taskFormRowContentIndent,
  taskFormFieldInputSx,
  taskFormActionIconSx,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import TaskFormDescriptionField from './TaskFormDescriptionField';
import TaskFormScheduleFields from './TaskFormScheduleFields';
import TaskFormSettingsRow from './TaskFormSettingsRow';
import { findObjetivoById } from './buildTareaPayload';
import { isSameDayAsToday } from '@shared/utils/agendaRules';

function toDateOrNull(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mergeDateAndTime(day, time) {
  const base = startOfDay(day || new Date());
  const t = time || new Date();
  return setMinutes(setHours(base, t.getHours()), t.getMinutes());
}

/** Deriva "todo el día" cuando no hay un flag explícito en formData. */
function deriveAllDay(start, end) {
  if (!start) return true;
  const atMidnight = start.getHours() === 0 && start.getMinutes() === 0;
  if (!end) return atMidnight;
  const isEndOfDay = end.getHours() === 23 && end.getMinutes() >= 59;
  return atMidnight && isEndOfDay;
}

function mapObjetivoOptions(objetivos) {
  return (objetivos || []).map((obj) => ({
    value: obj._id || obj.id,
    label: obj.nombre || obj.titulo,
  }));
}

/**
 * Campos avanzados compartidos entre TareaForm y FocoQuickCreate (expandido).
 * @param {'full'|'compact'} variant - full: formulario diálogo; compact: solo metadatos (quick expand)
 */
export default function TareaFormAdvancedFields({
  formData,
  setFormData,
  errors = {},
  objetivos: objetivosProp,
  Objetivos: ObjetivosProp,
  objetivoId = null,
  variant = 'full',
  showDescription = variant === 'full',
  showSchedule = variant === 'full',
  showSettings = true,
  showObjetivo = true,
  showSubtareas = true,
  showVencimiento = true,
  onCreateObjetivo,
  onToggleSubtarea,
  onAttach,
}) {
  const objetivos = objetivosProp ?? ObjetivosProp ?? [];
  const [newSubtarea, setNewSubtarea] = useState('');
  const tipo = formData.tipo === 'EVENTO' ? 'EVENTO' : 'TAREA';

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleObjetivoChange = (event) => {
    const objetivoId = event.target.value;
    const objetivo = findObjetivoById(objetivos, objetivoId);
    const listId = objetivo?.googleTasksSync?.googleTaskListId || null;

    setFormData((prev) => {
      const syncEnabled = prev.googleTasksSync?.enabled;
      return {
        ...prev,
        objetivo: objetivoId || null,
        googleTasksSync: {
          ...(prev.googleTasksSync || {}),
          ...(listId ? { googleTaskListId: listId } : {}),
          ...(syncEnabled
            ? { needsSync: true, syncStatus: 'pending' }
            : {}),
        },
      };
    });
  };

  const handleAddSubtarea = () => {
    if (!newSubtarea.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subtareas: [
        ...(prev.subtareas || []),
        {
          titulo: newSubtarea.trim(),
          completada: false,
          orden: (prev.subtareas?.length || 0) + 1,
        },
      ],
    }));
    setNewSubtarea('');
  };

  const handleDeleteSubtarea = (index) => {
    setFormData((prev) => ({
      ...prev,
      subtareas: prev.subtareas.filter((_, i) => i !== index),
    }));
  };

  const handleLocalToggleSubtarea = (index) => {
    setFormData((prev) => ({
      ...prev,
      subtareas: prev.subtareas.map((st, i) =>
        (i === index ? { ...st, completada: !st.completada } : st),
      ),
    }));
  };

  const handleToggleSubtareaClick = (index) => {
    if (onToggleSubtarea) {
      onToggleSubtarea(index);
    } else {
      handleLocalToggleSubtarea(index);
    }
  };

  const objetivoValue = (() => {
    const currentValue = formData.objetivo || formData.proyecto || '';
    const exists = (objetivos || []).some((p) => (p._id || p.id) === currentValue);
    return exists ? currentValue : '';
  })();

  const subtareas = formData.subtareas || [];
  const objetivoOptions = mapObjetivoOptions(objetivos);

  // --- Horario (fecha + hora inicio/fin + todo el día) ---
  const scheduleStart = toDateOrNull(formData.fechaInicio) || new Date();
  const scheduleEnd = toDateOrNull(formData.fechaFin);
  const scheduleDay = startOfDay(scheduleStart);
  const scheduleDuration = scheduleEnd
    ? Math.max(5, differenceInMinutes(scheduleEnd, scheduleStart))
    : 60;
  const scheduleAllDay = formData.allDay ?? deriveAllDay(scheduleStart, scheduleEnd);

  const applySchedule = ({
    nextDay = scheduleDay,
    nextTime = scheduleStart,
    nextAllDay = scheduleAllDay,
    nextDuration = scheduleDuration,
  }) => {
    const effectiveAllDay = isSameDayAsToday(nextDay) ? false : nextAllDay;
    let inicio;
    let fin;
    if (effectiveAllDay) {
      inicio = startOfDay(nextDay);
      fin = endOfDay(nextDay);
    } else {
      inicio = mergeDateAndTime(nextDay, nextTime);
      fin = addMinutes(inicio, nextDuration || 60);
    }
    setFormData((prev) => ({
      ...prev,
      allDay: effectiveAllDay,
      fechaInicio: inicio,
      fechaFin: fin,
    }));
  };

  const scheduleBlock = (
    <TaskFormScheduleFields
      day={scheduleDay}
      onDayChange={(v) => applySchedule({ nextDay: startOfDay(v) })}
      time={scheduleStart}
      onTimeChange={(v) => applySchedule({ nextTime: v, nextAllDay: false })}
      allDay={scheduleAllDay}
      onAllDayChange={(checked) => applySchedule({ nextAllDay: checked })}
      expanded
      showTimeControls={!scheduleAllDay}
      durationMin={scheduleDuration}
      onDurationChange={(mins) => applySchedule({ nextDuration: mins, nextAllDay: false })}
      showDuration
      showDeadline={showVencimiento}
      deadline={formData.fechaVencimiento}
      onDeadlineChange={(v) => setFormData((prev) => ({ ...prev, fechaVencimiento: v }))}
      errors={errors}
    />
  );

  const settingsBlock = (
    <TaskFormSettingsRow
      estado={formData.estado}
      onEstadoChange={handleChange('estado')}
      prioridad={formData.prioridad}
      onPrioridadChange={(value) => setFormData((prev) => ({ ...prev, prioridad: value }))}
      showRecurrence
      recurrenceRrule={formData.rrule}
      onRecurrenceChange={(rr) => setFormData((prev) => ({ ...prev, rrule: rr }))}
      tipo={tipo}
      onAttach={onAttach}
      errors={errors}
    />
  );

  const objetivoBlock = showObjetivo && !objetivoId && tipo !== 'EVENTO' && (
    <TaskFormRow icon={TaskFormIcons.objetivo} showDivider={false} align="center">
      <TaskFormPillSelect
        value={objetivoValue}
        onChange={handleObjetivoChange}
        options={objetivoOptions}
        emptyLabel="Sin objetivo"
        error={errors.objetivo || errors.proyecto}
        required
        onCreate={onCreateObjetivo}
        createLabel="Nuevo objetivo"
      />
    </TaskFormRow>
  );

  const subtareasBlock = showSubtareas && tipo !== 'EVENTO' && (
    <>
      <TaskFormRow icon={TaskFormIcons.subtarea} showDivider={false}>
        <TextField
          variant="standard"
          fullWidth
          placeholder="Agregar subtarea"
          value={newSubtarea}
          onChange={(e) => setNewSubtarea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSubtarea();
            }
          }}
          InputProps={{ disableUnderline: true }}
          sx={{
            ...taskFormStandardFieldSx,
            '& .MuiInputBase-input': {
              ...taskFormFieldInputSx,
              color: newSubtarea ? 'text.primary' : 'text.secondary',
            },
          }}
        />
      </TaskFormRow>
      {subtareas.length > 0 && (
        <Stack spacing={0.5} sx={{ pl: taskFormRowContentIndent, pb: 1 }}>
          {subtareas.map((subtarea, index) => (
            <Box
              key={subtarea._id || `sub-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.25,
                minHeight: 40,
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleToggleSubtareaClick(index)}
                sx={{
                  p: 0.5,
                  color: subtarea.completada ? 'success.main' : 'text.secondary',
                  '& .MuiSvgIcon-root': taskFormActionIconSx,
                }}
              >
                <TaskFormIcons.completed />
              </IconButton>
              <TextField
                value={subtarea.titulo}
                variant="standard"
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    subtareas: prev.subtareas.map((st, i) =>
                      (i === index ? { ...st, titulo: e.target.value } : st),
                    ),
                  }));
                }}
                sx={{
                  flex: 1,
                  ...taskFormStandardFieldSx,
                  '& .MuiInputBase-input': {
                    textDecoration: subtarea.completada ? 'line-through' : 'none',
                    color: subtarea.completada ? 'text.secondary' : 'text.primary',
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={() => handleDeleteSubtarea(index)}
                sx={{
                  p: 0.5,
                  color: 'error.main',
                  '& .MuiSvgIcon-root': taskFormActionIconSx,
                }}
              >
                <TaskFormIcons.close />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );

  if (variant === 'compact') {
    return (
      <>
        {subtareasBlock}
        {showSettings && settingsBlock}
        {objetivoBlock}
      </>
    );
  }

  return (
    <>
      {showDescription && (
        <TaskFormDescriptionField
          value={formData.descripcion}
          onChange={handleChange('descripcion')}
        />
      )}

      {subtareasBlock}
      {showSchedule && scheduleBlock}
      {showSettings && settingsBlock}
      {objetivoBlock}
    </>
  );
}
