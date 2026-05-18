import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Box,
  Stack,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  TaskTipoChips,
  TaskFormSectionLabel,
  TaskFormHeader,
  TaskFormFooter,
  taskFormDialogPaperSx,
  taskFormTitleFieldSx,
} from '../foco/taskFormUi';
import TareaFormAdvancedFields from '../foco/TareaFormAdvancedFields';
import { useResponsive } from '@shared/hooks';
import {
  AttachFile as AttachFileIcon,
  Google as GoogleIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import ObjetivoForm from './ObjetivoForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '@shared/config/axios';
/**
 * Componente de formulario para crear/editar tareas
 * 
 * @param {boolean} open - Controla si el diálogo está abierto
 * @param {Function} onClose - Función para cerrar el diálogo
 * @param {Function} onSubmit - Función que se llama al enviar el formulario (requerida)
 * @param {Object} initialData - Datos iniciales para edición (opcional)
 * @param {boolean} isEditing - Indica si se está editando una tarea existente
 * @param {string} objetivoId - ID del objetivo si se está creando desde un objetivo específico (opcional)
 * @param {Array} objetivos - Lista de objetivos disponibles (opcional)
 * @param {Function} onObjetivosUpdate - Función para actualizar la lista de objetivos (opcional)
 * @param {Function} updateWithHistory - Función para actualizar tareas con historial (opcional)
 *   Solo se usa para actualizar subtareas dentro del formulario cuando la tarea ya está guardada.
 *   Si no se proporciona, las actualizaciones de subtareas solo funcionarán para subtareas nuevas (sin _id).
 */
const TareaForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isEditing,
  objetivoId,
  objetivos,
  onObjetivosUpdate,
  updateWithHistory
}) => {
  const { isMobile } = useResponsive();
  const [isObjetivoFormOpen, setIsObjetivoFormOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  const initialFormState = {
    titulo: '',
    descripcion: '',
    estado: 'PENDIENTE',
    fechaInicio: new Date(),
    fechaFin: null,
    fechaVencimiento: null,
    prioridad: 'BAJA',
    archivos: [],
    objetivo: null,
    completada: false,
    subtareas: [],
    tipo: 'TAREA',
    rrule: null,
  };

  const [formData, setFormData] = useState(() => ({
    ...initialFormState,
    ...initialData,
    tipo: initialData?.tipo === 'EVENTO' ? 'EVENTO' : 'TAREA',
    fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
    fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
    fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento) : null,
    objetivo: objetivoId || (initialData?.objetivo?._id || initialData?.objetivo) || null,
    estado: initialData?.estado || 'PENDIENTE',
    googleTasksSync: initialData?.googleTasksSync || { enabled: false }
  }));

  const [errors, setErrors] = useState({});
  const [syncingToGoogle, setSyncingToGoogle] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormState,
        ...initialData,
        tipo: initialData?.tipo === 'EVENTO' ? 'EVENTO' : 'TAREA',
        fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
        fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
        fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento) : null,
        objetivo: objetivoId || (initialData?.objetivo?._id || initialData?.objetivo) || null,
        estado: initialData?.estado || 'PENDIENTE',
        subtareas: initialData?.subtareas || []
      });
    }
  }, [initialData, open, objetivoId]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleToggleSubtarea = async (index) => {
    try {
      const subtarea = formData.subtareas[index];
      
      // Si la subtarea es nueva (no tiene _id), solo actualizamos el estado local
      if (!subtarea._id) {
        setFormData(prev => ({
          ...prev,
          subtareas: prev.subtareas.map((st, i) => 
            i === index ? { ...st, completada: !st.completada } : st
          )
        }));
        return;
      }

      // Validar que la tarea esté guardada y que updateWithHistory esté disponible
      if (!formData._id) {
        enqueueSnackbar('Guarda la tarea primero antes de actualizar subtareas', { variant: 'warning' });
        return;
      }

      if (!updateWithHistory) {
        enqueueSnackbar('Función de actualización no disponible', { variant: 'error' });
        return;
      }

      console.log('Actualizando subtarea:', {
        tareaId: formData._id,
        subtareaId: subtarea._id,
        completada: !subtarea.completada
      });

      // Guardar el estado original
      const tareaOriginal = { ...formData };
      
      // Preparar las subtareas actualizadas
      const subtareasActualizadas = formData.subtareas.map((st, i) => 
        i === index ? { ...st, completada: !st.completada } : st
      );
      
      // Determinar nuevo estado basado en subtareas
      const todasCompletadas = subtareasActualizadas.every(st => st.completada);
      const algunaCompletada = subtareasActualizadas.some(st => st.completada);
      let nuevoEstado = 'PENDIENTE';
      if (todasCompletadas) {
        nuevoEstado = 'COMPLETADA';
      } else if (algunaCompletada) {
        nuevoEstado = 'EN_PROGRESO';
      }
      
      // Preparar actualización incluyendo estado y completada cuando corresponda
      const updateData = {
        subtareas: subtareasActualizadas,
        estado: nuevoEstado
      };
      
      // Si todas las subtareas están completadas, marcar la tarea como completada
      if (todasCompletadas) {
        updateData.completada = true;
      } else {
        updateData.completada = false;
      }
      
      const response = await updateWithHistory(formData._id, updateData, tareaOriginal);
      
      console.log('Respuesta del servidor:', response);

      // Actualizamos el estado local con los datos del servidor
      if (response) {
        setFormData(prev => ({
          ...prev,
          subtareas: response.subtareas || subtareasActualizadas,
          estado: response.estado || nuevoEstado,
          completada: response.completada !== undefined ? response.completada : (todasCompletadas ? true : false)
        }));
        enqueueSnackbar('Subtarea actualizada exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error al actualizar subtarea:', error);
      enqueueSnackbar('Error al actualizar subtarea', { variant: 'error' });
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      nombre: file.name,
      tipo: file.type,
      url: URL.createObjectURL(file)
    }));

    setFormData(prev => ({
      ...prev,
      archivos: [...prev.archivos, ...newFiles]
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      try {
        console.log('Preparando datos para enviar...');
        
        // Si no hay objetivoId, significa que estamos en la vista de tareas
        // y necesitamos un objetivo seleccionado
        const isEvento = formData.tipo === 'EVENTO';
        if (!isEvento && !objetivoId && !formData.objetivo) {
          setErrors(prev => ({
            ...prev,
            objetivo: 'El objetivo es requerido'
          }));
          return;
        }

        const formDataToSubmit = {
          ...formData,
          tipo: isEvento ? 'EVENTO' : 'TAREA',
          fechaInicio: formData.fechaInicio ? (formData.fechaInicio instanceof Date ? formData.fechaInicio.toISOString() : formData.fechaInicio) : new Date().toISOString(),
          fechaVencimiento: formData.fechaVencimiento ? (formData.fechaVencimiento instanceof Date ? formData.fechaVencimiento.toISOString() : formData.fechaVencimiento) : null,
          fechaFin: formData.fechaFin ? (formData.fechaFin instanceof Date ? formData.fechaFin.toISOString() : formData.fechaFin) : null,
          objetivo: isEvento ? (objetivoId || formData.objetivo || null) : (objetivoId || formData.objetivo),
          rrule: formData.rrule || null,
        };

        onSubmit(formDataToSubmit);
        onClose();
      } catch (error) {
        console.error('Error al preparar datos:', error);
        setErrors(prev => ({
          ...prev,
          submit: error.message || 'Error al preparar los datos del formulario'
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.titulo) {
      newErrors.titulo = 'El título es requerido';
    }
    if (!formData.estado) {
      newErrors.estado = 'El estado es requerido';
    }
    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida';
    }
    if (formData.fechaFin && formData.fechaInicio > formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    const isEvento = formData.tipo === 'EVENTO';
    if (!isEvento && !objetivoId && !formData.objetivo) {
      newErrors.objetivo = 'El objetivo es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleObjetivosubmit = async (objetivoData) => {
    try {
      const response = await clienteAxios.post('/api/objetivos', objetivoData);
      const nuevoobjetivo = response.data;
      
      // Actualizar el campo de objetivo en el formulario
      setFormData((prev) => ({
        ...prev,
        objetivo: nuevoobjetivo._id || nuevoobjetivo.id,
        googleTasksSync: {
          ...(prev.googleTasksSync || {}),
          ...(nuevoobjetivo.googleTasksSync?.googleTaskListId
            ? { googleTaskListId: nuevoobjetivo.googleTasksSync.googleTaskListId }
            : {}),
        },
      }));
      
      // Cerrar el formulario de objetivo
      setIsObjetivoFormOpen(false);
      
      // Actualizar la lista de Objetivos
      if (onObjetivosUpdate) {
        await onObjetivosUpdate();
      }
      
      enqueueSnackbar('objetivo creado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al crear objetivo:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al crear el objetivo', 
        { variant: 'error' }
      );
    }
  };

  const handleSyncToGoogle = async () => {
    if (!formData._id) {
      enqueueSnackbar('Guarda la tarea primero antes de sincronizar', { variant: 'warning' });
      return;
    }

    try {
      setSyncingToGoogle(true);
      
      const response = await clienteAxios.post(`/api/google-tasks/sync/task/${formData._id}`);
      const taskSynced = response.data?.success === true;
      
      if (taskSynced) {
        // Actualizar el estado local con la información de sincronización
        setFormData(prev => ({
          ...prev,
          googleTasksSync: {
            ...prev.googleTasksSync,
            enabled: true,
            syncStatus: 'synced',
            lastSyncDate: new Date()
          }
        }));
        
        enqueueSnackbar('Tarea sincronizada con Google Tasks exitosamente', { variant: 'success' });
      } else {
        enqueueSnackbar('La tarea no pudo ser sincronizada. Verifica la configuración.', { variant: 'warning' });
      }
    } catch (error) {
      console.error('Error al sincronizar con Google Tasks:', error);
      const errorMessage = error.response?.data?.error || 'Error al sincronizar con Google Tasks';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSyncingToGoogle(false);
    }
  };

  const handleToggleGoogleSync = () => {
    setFormData(prev => ({
      ...prev,
      googleTasksSync: {
        ...prev.googleTasksSync,
        enabled: !prev.googleTasksSync.enabled
      }
    }));
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'BAJA':
        return '#66BB6A';
      case 'MEDIA':
        return '#FFA726';
      case 'ALTA':
        return '#EF5350';
      default:
        return '#FFA726';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          ...taskFormDialogPaperSx(isMobile),
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      sx={{
        zIndex: 1300,
        '& .MuiBackdrop-root': {
          bottom: isMobile ? '56px' : 0,
        },
      }}
    >
      <DialogContent sx={{
        bgcolor: 'background.paper',
        flex: 1,
        overflowY: 'auto',
        py: 0,
        px: 0,
      }}>
        <TaskFormHeader onClose={onClose}>
          <TaskTipoChips
            value={formData.tipo || 'TAREA'}
            onChange={(v) => setFormData((prev) => ({ ...prev, tipo: v }))}
            options={[
              { value: 'EVENTO', label: 'Evento' },
              { value: 'TAREA', label: 'Tarea' },
            ]}
            sx={{ mb: 1.5, pr: 4 }}
          />

          <TextField
            variant="standard"
            fullWidth
            placeholder="Agregar título"
            value={formData.titulo}
            onChange={handleChange('titulo')}
            error={!!errors.titulo}
            helperText={errors.titulo}
            required
            autoFocus
            sx={{ ...taskFormTitleFieldSx, pr: 3 }}
          />

          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
            <Button
              variant="text"
              component="label"
              startIcon={<AttachFileIcon sx={{ fontSize: 18 }} />}
              size="small"
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '0.8125rem',
                minWidth: 'auto',
                px: 0.5,
              }}
            >
              Adjuntar
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>
            {isEditing && formData._id && (
              <Tooltip
                title={
                  formData.googleTasksSync?.enabled
                    ? (formData.googleTasksSync?.googleTaskId
                      ? 'Sincronizado con Google Tasks'
                      : 'Sincronizar con Google Tasks')
                    : 'Habilitar sincronización con Google Tasks'
                }
              >
                <Button
                  variant="text"
                  startIcon={
                    syncingToGoogle ? (
                      <SyncIcon className="animate-spin" sx={{ fontSize: 18 }} />
                    ) : (
                      <GoogleIcon
                        sx={{
                          fontSize: 18,
                          color: formData.googleTasksSync?.googleTaskId
                            ? 'success.main'
                            : 'text.secondary',
                        }}
                      />
                    )
                  }
                  size="small"
                  onClick={handleSyncToGoogle}
                  disabled={syncingToGoogle}
                  sx={{
                    color: formData.googleTasksSync?.googleTaskId
                      ? 'success.main'
                      : 'text.secondary',
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    minWidth: 'auto',
                    px: 0.5,
                  }}
                >
                  {syncingToGoogle ? 'Sincronizando...' : 'Google'}
                </Button>
              </Tooltip>
            )}
          </Stack>
        </TaskFormHeader>

        <Box sx={{ px: 2 }}>
        <TareaFormAdvancedFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          objetivos={objetivos}
          objetivoId={objetivoId}
          showFechaInicio
          showSubtareas
          onCreateObjetivo={() => setIsObjetivoFormOpen(true)}
          onToggleSubtarea={handleToggleSubtarea}
        />

          {formData.archivos.length > 0 && (
            <Box sx={{ py: 1.5 }}>
              <TaskFormSectionLabel>Archivos adjuntos</TaskFormSectionLabel>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {formData.archivos.map((archivo, index) => (
                  <Chip
                    key={index}
                    label={archivo.nombre}
                    onDelete={() => {
                      setFormData(prev => ({
                        ...prev,
                        archivos: prev.archivos.filter((_, i) => i !== index)
                      }));
                    }}
                    size="small"
                    sx={{ borderRadius: '16px' }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        <TaskFormFooter
          onSave={handleSubmit}
          saveLabel={isEditing ? 'Actualizar' : 'Guardar'}
        />
      </DialogContent>

      {/* Formulario de objetivo */}
      <ObjetivoForm
        open={isObjetivoFormOpen}
        onClose={() => setIsObjetivoFormOpen(false)}
        onSubmit={handleObjetivosubmit}
        isEditing={false}
      />
    </Dialog>
  );
};

export default TareaForm;
