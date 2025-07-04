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
  InputAdornment,
  Tooltip,
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
import { useSnackbar } from 'notistack';
import clienteAxios from '../../config/axios';

const TareaForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isEditing,
  proyectoId,
  proyectos,
  onProyectosUpdate
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [isProyectoFormOpen, setIsProyectoFormOpen] = useState(false);
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
    proyecto: null,
    completada: false,
    subtareas: []
  };

  const [formData, setFormData] = useState(() => ({
    ...initialFormState,
    ...initialData,
    fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
    fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
    fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento) : null,
    proyecto: proyectoId || (initialData?.proyecto?._id || initialData?.proyecto) || null,
    estado: initialData?.estado || 'PENDIENTE'
  }));

  const [errors, setErrors] = useState({});
  const [newSubtarea, setNewSubtarea] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormState,
        ...initialData,
        fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
        fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
        fechaVencimiento: initialData?.fechaVencimiento ? new Date(initialData.fechaVencimiento) : null,
        proyecto: proyectoId || (initialData?.proyecto?._id || initialData?.proyecto) || null,
        estado: initialData?.estado || 'PENDIENTE',
        subtareas: initialData?.subtareas || []
      });
    }
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

  const handleToggleSubtarea = async (index) => {
    try {
      const subtarea = formData.subtareas[index];
      if (!subtarea._id) {
        // Si la subtarea es nueva (no tiene _id), solo actualizamos el estado local
        setFormData(prev => ({
          ...prev,
          subtareas: prev.subtareas.map((st, i) => 
            i === index ? { ...st, completada: !st.completada } : st
          )
        }));
        return;
      }

      console.log('Actualizando subtarea:', {
        tareaId: formData._id,
        subtareaId: subtarea._id,
        completada: !subtarea.completada
      });

      // Si la subtarea ya existe, llamamos al endpoint
      const response = await clienteAxios.patch(`/api/tareas/${formData._id}/subtareas`, {
        subtareaId: subtarea._id,
        completada: !subtarea.completada
      });
      
      console.log('Respuesta del servidor:', response.data);

      // Actualizamos el estado local con los datos del servidor
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          subtareas: response.data.subtareas || prev.subtareas.map(st => 
            st._id === subtarea._id ? { ...st, completada: !st.completada } : st
          )
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
      const response = await clienteAxios.post('/api/proyectos', proyectoData);
      const nuevoProyecto = response.data;
      
      // Actualizar el campo de proyecto en el formulario
      setFormData(prev => ({
        ...prev,
        proyecto: nuevoProyecto._id || nuevoProyecto.id
      }));
      
      // Cerrar el formulario de proyecto
      setIsProyectoFormOpen(false);
      
      // Actualizar la lista de proyectos
      if (onProyectosUpdate) {
        await onProyectosUpdate();
      }
      
      enqueueSnackbar('Proyecto creado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al crear el proyecto', 
        { variant: 'error' }
      );
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return '#FFA726';
      case 'EN_PROGRESO':
        return '#42A5F5';
      case 'COMPLETADA':
        return '#66BB6A';
      default:
        return '#FFA726';
    }
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

  // Estilos comunes para los campos
  const commonInputStyles = {
    '& .MuiInputBase-root': {
      borderRadius: 1
    }
  };

  const commonIconContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    mr: 1
  };

  const commonIconStyles = {
    color: 'text.secondary',
    fontSize: '1.25rem'
  };

  const commonSelectStyles = {
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      gap: 1
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
          borderRadius: 1,
          bgcolor: 'grey.900'
        }
      }}
      sx={{
        zIndex: 1500 // Asegurar que esté por encima del BottomNavigation
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'grey.900'
      }}>
        <Typography component="div">
          {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="text"
            component="label"
            startIcon={<AttachFileIcon />}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'transparent'
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
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ 
        bgcolor: 'grey.900', 
        maxHeight: { xs: '60vh', sm: '70vh', md: '75vh' }, 
        overflowY: 'auto' 
      }}>
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
              startAdornment: (
                <InputAdornment position="start">
                  <FlagIcon />
                </InputAdornment>
              )
            }}
          />

          <TextField
            size="small"
            label="Descripción"
            fullWidth
            multiline
            minRows={1}
            maxRows={5}
            value={formData.descripcion}
            onChange={handleChange('descripcion')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <DescriptionIcon />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={formData.estado}
              onChange={handleChange('estado')}
              error={!!errors.estado}
              helperText={errors.estado}
              required
              sx={{ ...commonInputStyles, flex: 1 }}
              SelectProps={{
                sx: commonSelectStyles
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={commonIconContainerStyles}>
                    <LabelIcon sx={commonIconStyles} />
                  </Box>
                )
              }}
            >
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="EN_PROGRESO">En Progreso</MenuItem>
              <MenuItem value="COMPLETADA">Completada</MenuItem>
            </TextField>
            <Tooltip title="Prioridad">
              <Button
                variant="text"
                onClick={() => handleChange('prioridad')({ target: { value: formData.prioridad === 'ALTA' ? 'BAJA' : 'ALTA' }})}
                startIcon={<PriorityIcon />}
                size="small"
                sx={{ 
                  color: formData.prioridad === 'ALTA' ? 'error.main' : 'text.secondary',
                  '&:hover': {
                    color: formData.prioridad === 'ALTA' ? 'error.dark' : 'primary.main',
                    backgroundColor: 'transparent'
                  },
                  minWidth: 'auto',
                  height: 40
                }}
              >
                {formData.prioridad === 'ALTA' ? 'Alta' : 'Baja'}
              </Button>
            </Tooltip>
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' },
            gap: 2
          }}>
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
                    sx={commonInputStyles}
                  />
                )}
              />
            </LocalizationProvider>

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
                    sx={commonInputStyles}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>

          {/* Campo de Proyecto - solo se muestra si no hay proyectoId */}
          {!proyectoId && (
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
                sx={commonInputStyles}
                SelectProps={{
                  sx: commonSelectStyles
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={commonIconContainerStyles}>
                      <ProjectIcon sx={commonIconStyles} />
                    </Box>
                  )
                }}
              >
                <MenuItem key="empty" value="">
                  <em>Seleccionar proyecto</em>
                </MenuItem>
                {(proyectos || []).map((proyecto) => (
                  <MenuItem 
                    key={proyecto._id || `proyecto-${proyecto.id}`} 
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
                  minWidth: 'auto',
                  height: 40,
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'transparent'
                  }
                }}
                size="small"
              >
                Nuevo
              </Button>
            </Box>
          )}

          {/* Subtareas */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              label="Subtareas"
              value={newSubtarea}
              onChange={(e) => setNewSubtarea(e.target.value)}
              placeholder="Agregar subtarea"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubtarea()}
              fullWidth
              sx={{
                ...commonInputStyles,
                '& .MuiInputBase-root': {
                  height: 40
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={commonIconContainerStyles}>
                    <CompletedIcon sx={commonIconStyles} />
                  </Box>
                )
              }}
            />
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleAddSubtarea}
              sx={{ 
                color: 'text.secondary',
                minWidth: 'auto',
                height: 40,
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'transparent'
                }
              }}
              size="small"
            >
              Nuevo
            </Button>
          </Box>
          {formData.subtareas.length > 0 && (
            <Stack spacing={1}>
              {formData.subtareas.map((subtarea, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    px: 2,
                    border: 1,
                    borderColor: 'grey.800',
                    borderRadius: 1,
                    bgcolor: 'grey.900',
                    height: 40
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
                  <TextField
                    value={subtarea.titulo}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        subtareas: prev.subtareas.map((st, i) => 
                          i === index ? { ...st, titulo: e.target.value } : st
                        )
                      }));
                    }}
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': {
                        height: 32,
                        fontSize: '0.875rem',
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          borderColor: 'transparent'
                        },
                        '&:hover fieldset': {
                          borderColor: 'grey.700'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main'
                        }
                      },
                      '& .MuiInputBase-input': {
                        p: 1,
                        textDecoration: subtarea.completada ? 'line-through' : 'none',
                        color: subtarea.completada ? 'text.secondary' : 'text.primary'
                      }
                    }}
                  />
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
          )}

          {/* Archivos adjuntos */}
          {formData.archivos.length > 0 && (
            <Box>
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ mb: 1 }}
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
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        bgcolor: 'grey.900',
        flexDirection: 'row',
        gap: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button 
          onClick={onClose}
          variant="text"
          sx={{ color: 'grey.500', fontWeight: 500, minWidth: 100 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          color="primary"
          size="large"
          sx={{ borderRadius: 1, fontWeight: 700, minWidth: 100, boxShadow: 2 }}
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