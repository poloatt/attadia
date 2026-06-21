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
  startOfDay,
} from 'date-fns';
import {
  toDateOrNull,
  mergeDateAndTimeFromDay as mergeDateAndTime,
  deriveAllDay,
} from './utils/tareaFormDateUtils';
import {
  TareaFormRow,
  TareaFormPillSelect,
  TareaFormHeaderContentRow,
  tareaFormStandardFieldSx,
  tareaFormRowContentIndent,
  tareaFormFieldInputSx,
  tareaFormActionIconSx,
  tareaFormRowContentGutterSx,
} from '@shared/components/forms/tareaFormUi';
import { TareaFormIcons } from '@shared/components/forms/tareaFormIcons';
import TareaFormDescriptionField from '@shared/components/forms/TareaFormDescriptionField';
import TareaFormScheduleFields from './fields/TareaFormScheduleFields';
import TareaFormSettingsRow from './fields/TareaFormSettingsRow';
import { findObjetivoById } from './buildTareaPayload';
import { isSameDayAsToday } from '@shared/utils/agendaRules';

function mapObjetivoOptions(objetivos) {
  return (objetivos || []).map((obj) => ({
    value: obj._id || obj.id,
    label: obj.nombre || obj.titulo,
  }));
}

/**
 * Campos avanzados compartidos entre TareaForm y AgendaQuickCreate (expandido).
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
    const currentValue = formData.objetivo || '';
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
  const scheduleAllDayRaw = formData.allDay ?? deriveAllDay(scheduleStart, scheduleEnd);
  const scheduleAllDay = isSameDayAsToday(scheduleDay) ? false : scheduleAllDayRaw;

  const applySchedule = ({
    nextDay = scheduleDay,
    nextTime = scheduleStart,
    nextAllDay = scheduleAllDayRaw,
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
      allDay: nextAllDay,
      fechaInicio: inicio,
      fechaFin: fin,
    }));
  };

  const scheduleBlock = (
    <TareaFormScheduleFields
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
    <TareaFormSettingsRow
      estado={formData.estado}
      onEstadoChange={handleChange('estado')}
      showPrioridad={false}
      showRecurrence
      recurrenceRrule={formData.rrule}
      onRecurrenceChange={(rr) => setFormData((prev) => ({ ...prev, rrule: rr }))}
      tipo={tipo}
      errors={errors}
    />
  );

  const objetivoBlock = showObjetivo && !objetivoId && tipo !== 'EVENTO' && (
    <TareaFormRow icon={TareaFormIcons.objetivo} showDivider={false} align="center">
      <Box sx={tareaFormRowContentGutterSx}>
        <TareaFormPillSelect
          value={objetivoValue}
          onChange={handleObjetivoChange}
          options={objetivoOptions}
          emptyLabel="Sin objetivo"
          error={errors.objetivo}
          required
          onCreate={onCreateObjetivo}
          createLabel="Nuevo objetivo"
        />
      </Box>
    </TareaFormRow>
  );

  const subtareasBlock = showSubtareas && tipo !== 'EVENTO' && (
    <>
      <TareaFormRow icon={TareaFormIcons.subtarea} showDivider={false}>
        <TareaFormHeaderContentRow>
          <TextField
            variant="standard"
            fullWidth
            placeholder="Agregar subtarea..."
            value={newSubtarea}
            onChange={(e) => setNewSubtarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSubtarea();
              }
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              ...tareaFormStandardFieldSx,
              '& .MuiInputBase-input': {
                ...tareaFormFieldInputSx,
                color: newSubtarea ? 'text.primary' : 'text.secondary',
              },
            }}
          />
        </TareaFormHeaderContentRow>
      </TareaFormRow>
      {subtareas.length > 0 && (
        <Stack spacing={0.5} sx={{ pl: tareaFormRowContentIndent, pb: 1 }}>
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
                  '& .MuiSvgIcon-root': tareaFormActionIconSx,
                }}
              >
                <TareaFormIcons.completed />
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
                  ...tareaFormStandardFieldSx,
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
                  '& .MuiSvgIcon-root': tareaFormActionIconSx,
                }}
              >
                <TareaFormIcons.close />
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
        <TareaFormDescriptionField
          value={formData.descripcion}
          onChange={handleChange('descripcion')}
          onAttach={onAttach}
        />
      )}

      {subtareasBlock}
      {showSchedule && scheduleBlock}
      {showSettings && settingsBlock}
      {objetivoBlock}
    </>
  );
}
