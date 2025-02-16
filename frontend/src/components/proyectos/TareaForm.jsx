import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Label as LabelIcon,
  PriorityHigh as PriorityIcon,
  CheckCircleOutline as CompletedIcon,
  AccountTree as ProjectIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import ProyectoForm from './ProyectoForm';

const TareaForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isEditing,
  proyectoId,
  proyectos
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [isProyectoFormOpen, setIsProyectoFormOpen] = useState(false);
  
  const [formData, setFormData] = useState(() => ({
    titulo: initialData?.titulo || '',
    descripcion: initialData?.descripcion || '',
    estado: initialData?.estado || 'PENDIENTE',
    fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
    fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
    fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento) : null,
    prioridad: initialData?.prioridad || 'MEDIA',
    archivos: initialData?.archivos || [],
    proyecto: proyectoId || initialData?.proyecto || null,
    completada: initialData?.completada || false,
    subtareas: initialData?.subtareas || []
  }));

  const [errors, setErrors] = useState({});
  const [newSubtarea, setNewSubtarea] = useState('');

  useEffect(() => {
    setFormData({
      titulo: initialData?.titulo || '',
      descripcion: initialData?.descripcion || '',
      estado: initialData?.estado || 'PENDIENTE',
      fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
      fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
      fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento) : null,
      prioridad: initialData?.prioridad || 'MEDIA',
      archivos: initialData?.archivos || [],
      proyecto: proyectoId || initialData?.proyecto || null,
      completada: initialData?.completada || false,
      subtareas: initialData?.subtareas || []
    });
  }, [initialData, open, proyectoId]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleAddSubtarea = () => {
    if (newSubtarea.trim()) {
      setFormData(prev => ({
        ...prev,
        subtareas: [...prev.subtareas, {
          titulo: newSubtarea.trim(),
          completada: false,
          orden: prev.subtareas.length + 1
        }]
      }));
      setNewSubtarea('');
    }
  };

  const handleDeleteSubtarea = (index) => {
    setFormData(prev => ({
      ...prev,
      subtareas: prev.subtareas.filter((_, i) => i !== index)
    }));
  };

  const handleToggleSubtarea = (index) => {
    setFormData(prev => ({
      ...prev,
      subtareas: prev.subtareas.map((subtarea, i) => 
        i === index ? { ...subtarea, completada: !subtarea.completada } : subtarea
      )
    }));
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
        
        // Si no hay proyectoId, significa que estamos en la vista de tareas
        // y necesitamos un proyecto seleccionado
        if (!proyectoId && !formData.proyecto) {
          setErrors(prev => ({
            ...prev,
            proyecto: 'El proyecto es requerido'
          }));
          return;
        }

        const formDataToSubmit = {
          ...formData,
          fechaInicio: formData.fechaInicio.toISOString(),
          fechaVencimiento: formData.fechaVencimiento ? formData.fechaVencimiento.toISOString() : null,
          fechaFin: formData.fechaFin ? formData.fechaFin.toISOString() : null,
          proyecto: proyectoId || formData.proyecto
        };

        console.log('Datos preparados para enviar:', formDataToSubmit);
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
    
    // Solo validamos el proyecto si no tenemos proyectoId
    if (!proyectoId && !formData.proyecto) {
      newErrors.proyecto = 'El proyecto es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProyectoSubmit = async (proyectoData) => {
    try {
      const response = await clienteAxios.post('/proyectos', proyectoData);
      const nuevoProyecto = response.data;
      
      // Actualizar el campo de proyecto en el formulario
      setFormData(prev => ({
        ...prev,
        proyecto: nuevoProyecto._id || nuevoProyecto.id
      }));
      
      // Cerrar el formulario de proyecto
      setIsProyectoFormOpen(false);
      
      enqueueSnackbar('Proyecto creado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al crear el proyecto', 
        { variant: 'error' }
      );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: 0
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
        </Typography>
        <Button
          variant="text"
          component="label"
          startIcon={<AttachFileIcon />}
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'primary.main'
            }
          }}
        >
          Adjuntar
          <input
            type="file"
            hidden
            multiple
            onChange={handleFileChange}
          />
        </Button>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Campos básicos */}
          <Stack spacing={2}>
            <TextField
              size="small"
              label="Título"
              fullWidth
              value={formData.titulo}
              onChange={handleChange('titulo')}
              error={!!errors.titulo}
              helperText={errors.titulo}
              required
              InputProps={{
                startAdornment: <FlagIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.25rem' }} />
              }}
            />

            <TextField
              size="small"
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={handleChange('descripcion')}
              InputProps={{
                startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.25rem', mt: 1 }} />
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  size="small"
                  label="Estado"
                  fullWidth
                  value={formData.estado}
                  onChange={handleChange('estado')}
                  error={!!errors.estado}
                  helperText={errors.estado}
                  required
                  SelectProps={{
                    sx: {
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }
                    }
                  }}
                >
                  {[
                    { value: 'PENDIENTE', label: 'Pendiente', color: theme.palette.warning.main },
                    { value: 'EN_PROGRESO', label: 'En Progreso', color: theme.palette.info.main },
                    { value: 'COMPLETADA', label: 'Completada', color: theme.palette.success.main },
                    { value: 'CANCELADA', label: 'Cancelada', color: theme.palette.error.main }
                  ].map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: option.color,
                          mr: 1
                        }}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  size="small"
                  label="Prioridad"
                  fullWidth
                  value={formData.prioridad}
                  onChange={handleChange('prioridad')}
                  SelectProps={{
                    sx: {
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }
                    }
                  }}
                >
                  {[
                    { value: 'BAJA', label: 'Baja', color: theme.palette.success.light },
                    { value: 'MEDIA', label: 'Media', color: theme.palette.warning.light },
                    { value: 'ALTA', label: 'Alta', color: theme.palette.error.light }
                  ].map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: option.color,
                          mr: 1
                        }}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={formData.fechaInicio}
                    onChange={handleDateChange('fechaInicio')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        required
                        error={!!errors.fechaInicio}
                        helperText={errors.fechaInicio}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de Vencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleDateChange('fechaVencimiento')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        error={!!errors.fechaVencimiento}
                        helperText={errors.fechaVencimiento}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            {/* Campo de Proyecto - solo se muestra si no hay proyectoId */}
            {!proyectoId && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Proyecto"
                    value={formData.proyecto || ''}
                    onChange={handleChange('proyecto')}
                    error={!!errors.proyecto}
                    helperText={errors.proyecto}
                    required
                    InputProps={{
                      startAdornment: <ProjectIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.25rem' }} />
                    }}
                  >
                    {proyectos?.map((proyecto) => (
                      <MenuItem 
                        key={proyecto._id || proyecto.id} 
                        value={proyecto._id || proyecto.id}
                      >
                        {proyecto.titulo || proyecto.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={() => setIsProyectoFormOpen(true)}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main'
                      }
                    }}
                    size="small"
                  >
                    Nuevo
                  </Button>
                </Box>
              </Box>
            )}

            {/* Subtareas */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  label="Subtareas"
                  value={newSubtarea}
                  onChange={(e) => setNewSubtarea(e.target.value)}
                  placeholder="Agregar subtarea"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtarea()}
                  fullWidth
                />
                <Button
                  variant="text"
                  size="small"
                  onClick={handleAddSubtarea}
                  startIcon={<AddIcon />}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: 'primary.main'
                    }
                  }}
                >
                  Agregar
                </Button>
              </Box>
              <Stack spacing={1}>
                {formData.subtareas.map((subtarea, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleToggleSubtarea(index)}
                      sx={{ 
                        p: 0.5,
                        color: subtarea.completada ? 'success.main' : 'text.secondary',
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.25rem'
                        }
                      }}
                    >
                      <CompletedIcon />
                    </IconButton>
                    <Typography
                      sx={{
                        flex: 1,
                        textDecoration: subtarea.completada ? 'line-through' : 'none',
                        color: subtarea.completada ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {subtarea.titulo}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSubtarea(index)}
                      sx={{ 
                        p: 0.5,
                        color: 'error.main',
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.25rem'
                        }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Archivos adjuntos */}
            {formData.archivos.length > 0 && (
              <Box>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1,
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}
                >
                  Archivos Adjuntos
                </Typography>
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
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{ borderRadius: 0 }}
        >
          {isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>

      {/* Formulario de Proyecto */}
      <ProyectoForm
        open={isProyectoFormOpen}
        onClose={() => setIsProyectoFormOpen(false)}
        onSubmit={handleProyectoSubmit}
        isEditing={false}
      />
    </Dialog>
  );
};

export default TareaForm;