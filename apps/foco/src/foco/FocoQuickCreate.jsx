import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Popover,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { addMinutes, endOfDay, setHours, setMinutes, startOfDay } from 'date-fns';
import {
  TaskFormRow,
  TaskFormTipoSelector,
  TASK_FORM_TIPO_ALL,
  TaskFormHeader,
  TaskFormFooter,
  TaskFormPillSelect,
  taskFormGooglePaperSx,
  taskFormTitleFieldSx,
  taskFormCaptionTextSx,
  taskFormPillTextSx,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import TaskFormDescriptionField from './TaskFormDescriptionField';
import TaskFormScheduleFields from './TaskFormScheduleFields';
import TareaFormAdvancedFields from './TareaFormAdvancedFields';
import HabitFormFields from './HabitFormFields';
import { availableIcons } from '@shared/utils/iconConfig';
import { DEFAULT_HABIT_CONFIG } from './habitFormDefaults';
import { normalizeTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { isSameDayAsToday } from '@shared/utils/agendaRules';

const DEFAULT_HABIT_ICON = availableIcons[0]?.name || 'Add';

const INITIAL_ADVANCED = {
  descripcion: '',
  estado: 'PENDIENTE',
  prioridad: 'BAJA',
  fechaVencimiento: null,
  rrule: null,
  objetivo: '',
  subtareas: [],
};

function mergeDateAndTime(day, time) {
  const base = startOfDay(day || new Date());
  const t = time || new Date();
  return setMinutes(setHours(base, t.getHours()), t.getMinutes());
}

function defaultStartAt(selectedDate) {
  const now = new Date();
  const day = startOfDay(selectedDate || now);
  return setMinutes(setHours(day, now.getHours()), 0);
}

function QuickCreateShell({
  isMobile,
  open,
  anchorEl,
  onClose,
  expanded,
  children,
}) {
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            ...taskFormGooglePaperSx(true),
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            maxHeight: expanded ? '90vh' : '55vh',
            height: expanded ? '90vh' : 'auto',
            transition: 'max-height 0.25s ease',
          },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: 'divider',
            mx: 'auto',
            mt: 1,
            mb: 0.5,
            flexShrink: 0,
          }}
        />
        <Box
          sx={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      </SwipeableDrawer>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          ...taskFormGooglePaperSx(false),
          mt: 1,
          width: { xs: 'calc(100vw - 24px)', sm: 400 },
          maxWidth: '100vw',
          maxHeight: expanded ? 'calc(100vh - 24px)' : undefined,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          overflowY: expanded ? 'auto' : 'visible',
          maxHeight: expanded ? 'calc(100vh - 48px)' : undefined,
        }}
      >
        {children}
      </Box>
    </Popover>
  );
}

export default function FocoQuickCreate({
  open,
  anchorEl,
  onClose,
  isMobile = false,
  selectedDate,
  initialStart,
  objetivos: objetivosProp,
  Objetivos: ObjetivosProp,
  onSave,
  defaultTipo = 'EVENTO',
}) {
  const objetivos = objetivosProp ?? ObjetivosProp ?? [];
  const titleRef = useRef(null);
  const [titulo, setTitulo] = useState('');
  const [day, setDay] = useState(() => startOfDay(selectedDate || new Date()));
  const [time, setTime] = useState(() => new Date());
  const [allDay, setAllDay] = useState(true);
  const [durationMin, setDurationMin] = useState(60);
  const [objetivo, setObjetivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [advanced, setAdvanced] = useState(INITIAL_ADVANCED);
  const [errors, setErrors] = useState({});
  const [tipo, setTipo] = useState(() => {
    if (defaultTipo === 'TAREA') return 'TAREA';
    if (defaultTipo === 'HABITO') return 'HABITO';
    return 'EVENTO';
  });
  const [habitSection, setHabitSection] = useState('bodyCare');
  const [habitIcon, setHabitIcon] = useState(DEFAULT_HABIT_ICON);
  const [habitConfig, setHabitConfig] = useState(DEFAULT_HABIT_CONFIG);

  const resetForm = useCallback(() => {
    const start = initialStart ? new Date(initialStart) : defaultStartAt(selectedDate);
    const hasExplicitTime = Boolean(initialStart);
    setTitulo('');
    setDay(startOfDay(start));
    setTime(start);
    setAllDay(!hasExplicitTime);
    setDurationMin(60);
    setObjetivo('');
    setExpanded(false);
    setAdvanced(INITIAL_ADVANCED);
    setErrors({});
    setHabitSection('bodyCare');
    setHabitIcon(DEFAULT_HABIT_ICON);
    setHabitConfig({ ...DEFAULT_HABIT_CONFIG });
    if (defaultTipo === 'TAREA') setTipo('TAREA');
    else if (defaultTipo === 'HABITO') setTipo('HABITO');
    else setTipo('EVENTO');
  }, [initialStart, selectedDate, defaultTipo]);

  useEffect(() => {
    if (!open) return;
    resetForm();
    const t = window.setTimeout(() => titleRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, resetForm]);

  const fechaInicio = useMemo(() => {
    if (allDay) return startOfDay(day);
    return mergeDateAndTime(day, time);
  }, [day, time, allDay]);

  const fechaFin = useMemo(() => {
    if (allDay) return endOfDay(day);
    return addMinutes(fechaInicio, durationMin);
  }, [fechaInicio, durationMin, allDay, day]);

  const fechaVencimiento = useMemo(
    () => advanced.fechaVencimiento ?? fechaFin,
    [advanced.fechaVencimiento, fechaFin],
  );

  const advancedFormData = useMemo(() => ({
    tipo,
    descripcion: advanced.descripcion,
    estado: advanced.estado,
    prioridad: advanced.prioridad,
    fechaVencimiento,
    rrule: advanced.rrule,
    objetivo: expanded && tipo === 'TAREA' ? advanced.objetivo : objetivo,
    subtareas: advanced.subtareas,
  }), [tipo, advanced, fechaVencimiento, expanded, objetivo]);

  const validateSave = () => {
    const trimmed = titulo.trim();
    if (!trimmed) {
      titleRef.current?.focus();
      return false;
    }
    if (tipo === 'TAREA' && !expanded && !objetivo) {
      setErrors({ objetivo: 'El objetivo es requerido' });
      return false;
    }
    if (tipo === 'TAREA' && expanded && !advancedFormData.objetivo) {
      setErrors({ objetivo: 'El objetivo es requerido' });
      return false;
    }
    if (tipo === 'HABITO' && expanded && !habitIcon) {
      setErrors({ icon: 'Selecciona un icono' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateSave()) return;

    const trimmed = titulo.trim();
    setSaving(true);
    try {
      if (tipo === 'HABITO') {
        await onSave({
          titulo: trimmed,
          tipo: 'HABITO',
          section: habitSection,
          icon: expanded ? habitIcon : 'Add',
          config: expanded ? habitConfig : DEFAULT_HABIT_CONFIG,
        });
      } else {
        await onSave({
          titulo: trimmed,
          tipo,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          fechaVencimiento: (fechaVencimiento instanceof Date
            ? fechaVencimiento.toISOString()
            : fechaVencimiento) || fechaFin.toISOString(),
          objetivo: advancedFormData.objetivo || null,
          descripcion: advancedFormData.descripcion,
          estado: advancedFormData.estado,
          prioridad: advancedFormData.prioridad,
          rrule: advancedFormData.rrule || null,
          subtareas: advancedFormData.subtareas,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleMoreOptions = () => {
    setExpanded((v) => {
      const next = !v;
      if (next) {
        setAdvanced((prev) => ({
          ...prev,
          objetivo: tipo === 'TAREA' ? (objetivo || prev.objetivo) : prev.objetivo,
          fechaVencimiento: prev.fechaVencimiento ?? fechaFin,
        }));
      }
      return next;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !expanded) {
      e.preventDefault();
      handleSave();
    }
  };

  const titlePlaceholder =
    tipo === 'HABITO' ? 'Nombre del hábito' : 'Agregar título';

  const objetivoOptions = useMemo(
    () => objetivos.map((p) => ({
      value: p._id,
      label: p.nombre || p.titulo || 'Objetivo',
    })),
    [objetivos],
  );

  const moreOptionsLabel = expanded ? 'Menos opciones' : 'Más opciones';

  const shellExpanded = expanded;

  const formBody = (
    <Box sx={{ pb: 0.5 }}>
      <TaskFormHeader onClose={onClose}>
        <Box sx={{ mb: 1.5, pr: 4 }}>
          <TaskFormTipoSelector
            value={tipo}
            options={TASK_FORM_TIPO_ALL}
            onChange={(v) => {
              setTipo(v);
              if (v !== 'TAREA') setExpanded(false);
            }}
          />
        </Box>

        {tipo === 'HABITO' && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1, ...taskFormCaptionTextSx }}>
            Los hábitos se guardan en Rutinas y no se sincronizan con Google Tasks.
          </Typography>
        )}

        <TextField
          inputRef={titleRef}
          fullWidth
          variant="standard"
          placeholder={titlePlaceholder}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ ...taskFormTitleFieldSx, pr: 3 }}
        />
      </TaskFormHeader>

      <Box sx={{ px: 2 }}>
      {expanded && tipo !== 'HABITO' && (
        <TaskFormDescriptionField
          value={advanced.descripcion}
          onChange={(e) => setAdvanced((prev) => ({ ...prev, descripcion: e.target.value }))}
        />
      )}

      {expanded && tipo === 'TAREA' && (
        <TareaFormAdvancedFields
          variant="compact"
          formData={advancedFormData}
          setFormData={(updater) => {
            setAdvanced((prev) => {
              const base = {
                descripcion: prev.descripcion,
                estado: prev.estado,
                prioridad: prev.prioridad,
                fechaVencimiento: prev.fechaVencimiento ?? fechaFin,
                rrule: prev.rrule,
                objetivo: prev.objetivo || objetivo,
                subtareas: prev.subtareas,
                tipo,
              };
              const next = typeof updater === 'function' ? updater(base) : updater;
              return {
                descripcion: next.descripcion ?? prev.descripcion,
                estado: next.estado ?? prev.estado,
                prioridad: next.prioridad ?? prev.prioridad,
                fechaVencimiento: next.fechaVencimiento ?? prev.fechaVencimiento ?? fechaFin,
                rrule: next.rrule ?? prev.rrule,
                objetivo: next.objetivo ?? prev.objetivo ?? objetivo,
                subtareas: next.subtareas ?? prev.subtareas,
              };
            });
          }}
          errors={errors}
          objetivos={objetivos}
          showSettings={false}
          showObjetivo={false}
        />
      )}

      {tipo === 'HABITO' ? (
        <>
          {!expanded && (
            <HabitFormFields
              section={habitSection}
              onSectionChange={setHabitSection}
              icon={habitIcon}
              onIconChange={setHabitIcon}
              config={habitConfig}
              onConfigChange={setHabitConfig}
              errors={errors}
              showIconPicker={false}
              showCadence={false}
            />
          )}
          <Collapse in={expanded} timeout={200}>
            <Box sx={{ pt: expanded ? 0.5 : 0 }}>
              <HabitFormFields
                section={habitSection}
                onSectionChange={setHabitSection}
                icon={habitIcon}
                onIconChange={(name) => {
                  setHabitIcon(name);
                  if (errors.icon) setErrors((e) => ({ ...e, icon: undefined }));
                }}
                config={habitConfig}
                onConfigChange={(newConfig) => {
                  setHabitConfig((prev) => ({
                    ...prev,
                    ...newConfig,
                    horarios: normalizeTimeOfDay(
                      newConfig.horarios !== undefined ? newConfig.horarios : prev.horarios,
                    ),
                  }));
                }}
                errors={errors}
                showSection
                showIconPicker
                showCadence
              />
            </Box>
          </Collapse>
        </>
      ) : (
        <TaskFormScheduleFields
          day={day}
          onDayChange={(v) => {
            const nextDay = startOfDay(v);
            setDay(nextDay);
            if (isSameDayAsToday(nextDay)) setAllDay(false);
          }}
          time={time}
          onTimeChange={setTime}
          allDay={allDay}
          onAllDayChange={setAllDay}
          expanded={expanded}
          showTimeControls={expanded || !allDay || isSameDayAsToday(day)}
          durationMin={durationMin}
          onDurationChange={setDurationMin}
          showDuration={expanded}
          showDeadline={expanded}
          deadline={fechaVencimiento}
          onDeadlineChange={(v) => setAdvanced((prev) => ({ ...prev, fechaVencimiento: v }))}
          errors={errors}
        />
      )}

      {tipo === 'TAREA' && !expanded && (
        <TaskFormRow icon={TaskFormIcons.objetivo} showDivider={false} align="center">
          <TaskFormPillSelect
            value={objetivo}
            onChange={(e) => {
              setObjetivo(e.target.value);
              if (errors.objetivo) setErrors({});
            }}
            options={objetivoOptions}
            emptyLabel="Sin objetivo"
            error={errors.objetivo}
            required
          />
        </TaskFormRow>
      )}

      {tipo !== 'HABITO' && (
        <Collapse in={expanded} timeout={200}>
          <Box sx={{ pt: 0.5 }}>
            <TareaFormAdvancedFields
              variant="compact"
              formData={advancedFormData}
              setFormData={(updater) => {
                setAdvanced((prev) => {
                  const base = {
                    descripcion: prev.descripcion,
                    estado: prev.estado,
                    prioridad: prev.prioridad,
                    fechaVencimiento: prev.fechaVencimiento ?? fechaFin,
                    rrule: prev.rrule,
                    objetivo: prev.objetivo || objetivo,
                    subtareas: prev.subtareas,
                    tipo,
                  };
                  const next = typeof updater === 'function' ? updater(base) : updater;
                  if (next.objetivo && errors.objetivo) {
                    setErrors((e) => ({ ...e, objetivo: undefined }));
                  }
                  return {
                    descripcion: next.descripcion ?? prev.descripcion,
                    estado: next.estado ?? prev.estado,
                    prioridad: next.prioridad ?? prev.prioridad,
                    fechaVencimiento: next.fechaVencimiento ?? prev.fechaVencimiento ?? fechaFin,
                    rrule: next.rrule ?? prev.rrule,
                    objetivo: next.objetivo ?? prev.objetivo ?? objetivo,
                    subtareas: next.subtareas ?? prev.subtareas,
                  };
                });
              }}
              errors={errors}
              objetivos={objetivos}
              showSubtareas={tipo !== 'TAREA'}
            />
          </Box>
        </Collapse>
      )}

      <TaskFormFooter
        onSave={handleSave}
        saving={saving}
        disabled={!titulo.trim()}
        leftAction={(
          <Button
            size="small"
            color="inherit"
            endIcon={(
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            )}
            onClick={handleMoreOptions}
            sx={{ textTransform: 'none', color: 'text.secondary', px: 0, ...taskFormPillTextSx }}
          >
            {moreOptionsLabel}
          </Button>
        )}
      />
      </Box>
    </Box>
  );

  return (
    <QuickCreateShell
      isMobile={isMobile}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      expanded={shellExpanded}
    >
      {formBody}
    </QuickCreateShell>
  );
}
