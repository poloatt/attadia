import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import {
  TaskFormRow,
  TaskFormSectionLabel,
  TaskFormPillSelect,
  taskFormStandardFieldSx,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import TaskFormDescriptionField from './TaskFormDescriptionField';
import TaskFormRecurrencePicker from './TaskFormRecurrencePicker';
import { findObjetivoById } from './buildTareaPayload';

function renderStandardDateField(params, fieldProps = {}) {
  return (
    <TextField
      {...params}
      variant="standard"
      fullWidth
      sx={{ ...taskFormStandardFieldSx, ...fieldProps.sx }}
      {...fieldProps}
    />
  );
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
  showSubtareas = true,
  onCreateObjetivo,
  onToggleSubtarea,
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

  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
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

  const estadoPrioridadBlock = (
    <TaskFormRow icon={TaskFormIcons.estado} showDivider={false}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          select
          variant="standard"
          fullWidth
          value={formData.estado || 'PENDIENTE'}
          onChange={handleChange('estado')}
          error={!!errors.estado}
          helperText={errors.estado}
          required
          InputProps={{ disableUnderline: true }}
          sx={{
            ...taskFormStandardFieldSx,
            '& .MuiInputBase-input': { fontSize: '0.875rem' },
          }}
        >
          <MenuItem value="PENDIENTE">Pendiente</MenuItem>
          <MenuItem value="EN_PROGRESO">En Progreso</MenuItem>
          <MenuItem value="COMPLETADA">Completada</MenuItem>
        </TextField>
        {tipo !== 'EVENTO' && (
          <Tooltip title="Prioridad">
            <Button
              variant="text"
              onClick={() => handleChange('prioridad')({
                target: { value: formData.prioridad === 'ALTA' ? 'BAJA' : 'ALTA' },
              })}
              startIcon={<TaskFormIcons.prioridad />}
              size="small"
              sx={{
                color: formData.prioridad === 'ALTA' ? 'error.main' : 'text.secondary',
                flexShrink: 0,
                minWidth: 'auto',
                textTransform: 'none',
              }}
            >
              {formData.prioridad === 'ALTA' ? 'Alta' : 'Baja'}
            </Button>
          </Tooltip>
        )}
      </Box>
    </TaskFormRow>
  );

  const objetivoBlock = !objetivoId && tipo !== 'EVENTO' && (
    <TaskFormRow icon={TaskFormIcons.objetivo} showDivider={false}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: 'column' }}>
        <TaskFormPillSelect
          value={objetivoValue}
          onChange={handleObjetivoChange}
          options={objetivoOptions}
          emptyLabel="Sin objetivo"
          error={errors.objetivo || errors.proyecto}
          required
        />
        {onCreateObjetivo && (
          <Button
            variant="text"
            startIcon={<TaskFormIcons.add />}
            onClick={onCreateObjetivo}
            size="small"
            sx={{ color: 'text.secondary', minWidth: 'auto', textTransform: 'none', px: 0 }}
          >
            Nuevo objetivo
          </Button>
        )}
      </Box>
    </TaskFormRow>
  );

  const subtareasBlock = showSubtareas && tipo !== 'EVENTO' && (
    <>
      <TaskFormRow icon={TaskFormIcons.subtarea} showDivider={false}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            variant="standard"
            value={newSubtarea}
            onChange={(e) => setNewSubtarea(e.target.value)}
            placeholder="Agregar subtarea"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtarea()}
            fullWidth
            InputProps={{ disableUnderline: true }}
            sx={{
              ...taskFormStandardFieldSx,
              '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                color: 'text.secondary',
              },
            }}
          />
          <Button
            variant="text"
            startIcon={<TaskFormIcons.add />}
            onClick={handleAddSubtarea}
            size="small"
            sx={{ color: 'text.secondary', flexShrink: 0, minWidth: 'auto', textTransform: 'none' }}
          >
            Añadir
          </Button>
        </Box>
      </TaskFormRow>
      {subtareas.length > 0 && (
        <Stack spacing={0.5} sx={{ pl: 5.5, pb: 1 }}>
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
                  '& .MuiSvgIcon-root': { fontSize: '1.25rem' },
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
                  '& .MuiSvgIcon-root': { fontSize: '1.25rem' },
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
        {estadoPrioridadBlock}
        {objetivoBlock}
        {subtareasBlock}
      </>
    );
  }

  return (
    <>
      <TaskFormDescriptionField
        value={formData.descripcion}
        onChange={handleChange('descripcion')}
      />

      <TaskFormRow icon={TaskFormIcons.schedule} showDivider={false}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <Stack spacing={1.5} sx={{ width: '100%' }}>
            <Box>
              <TaskFormSectionLabel>Inicio</TaskFormSectionLabel>
              <DatePicker
                value={formData.fechaInicio}
                onChange={handleDateChange('fechaInicio')}
                renderInput={(params) => renderStandardDateField(params, {
                  required: true,
                  error: !!errors.fechaInicio,
                  helperText: errors.fechaInicio,
                })}
              />
            </Box>
            <Box>
              <TaskFormSectionLabel>Vencimiento</TaskFormSectionLabel>
              <DatePicker
                value={formData.fechaVencimiento}
                onChange={handleDateChange('fechaVencimiento')}
                renderInput={(params) => renderStandardDateField(params, {
                  error: !!errors.fechaVencimiento,
                  helperText: errors.fechaVencimiento,
                })}
              />
            </Box>
            <Box>
              <TaskFormSectionLabel>Repetición</TaskFormSectionLabel>
              <TaskFormRecurrencePicker
                value={formData.rrule}
                onChange={(rr) => setFormData((prev) => ({ ...prev, rrule: rr }))}
              />
            </Box>
          </Stack>
        </LocalizationProvider>
      </TaskFormRow>

      {estadoPrioridadBlock}
      {objetivoBlock}
      {subtareasBlock}
    </>
  );
}
