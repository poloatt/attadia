import React, { useState } from 'react';
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
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import TareasSection from './TareasSection';
import TareaForm from './TareaForm';

const ProyectoForm = ({ open, onClose, onSubmit, initialData = null, isEditing }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    estado: initialData?.estado || 'PENDIENTE',
    fechaInicio: initialData?.fechaInicio ? new Date(initialData.fechaInicio) : new Date(),
    fechaFin: initialData?.fechaFin ? new Date(initialData.fechaFin) : null,
    prioridad: initialData?.prioridad || 'MEDIA',
    presupuesto: initialData?.presupuesto || { monto: '', moneda: null },
    archivos: initialData?.archivos || [],
    propiedad: initialData?.propiedad || null,
    tareas: initialData?.tareas || []
  });

  const [errors, setErrors] = useState({});
  const [isTareaFormOpen, setIsTareaFormOpen] = useState(false);

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

  const handleTareaSubmit = (tareaData) => {
    setFormData(prev => ({
      ...prev,
      tareas: [...prev.tareas, tareaData]
    }));
    setIsTareaFormOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es requerido';
    if (!formData.estado) newErrors.estado = 'El estado es requerido';
    if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';
    if (formData.fechaFin && formData.fechaInicio > formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      PENDIENTE: '#FFA726',
      EN_PROGRESO: '#42A5F5',
      COMPLETADO: '#66BB6A'
    };
    return colors[estado] || theme.palette.grey[500];
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      BAJA: '#66BB6A',
      MEDIA: '#FFA726',
      ALTA: '#EF5350'
    };
    return colors[prioridad] || theme.palette.grey[500];
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
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'grey.900'
      }}>
        <Typography component="div">
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
      
      <DialogContent sx={{ bgcolor: 'grey.900', maxHeight: { xs: '60vh', sm: '70vh', md: '75vh' }, overflowY: 'auto' }}>
        <Stack spacing={2}>
          <TextField
            size="small"
            label="Nombre del Proyecto"
            fullWidth
            value={formData.nombre}
            onChange={handleChange('nombre')}
            error={!!errors.nombre}
            helperText={errors.nombre}
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
            rows={3}
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

          <Grid container spacing={2} sx={{ px: 2 }}>
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
                sx={{
                  ...commonInputStyles,
                  '& .MuiInputBase-root': {
                    p: 0,
                    mx: -2
                  }
                }}
                SelectProps={{
                  sx: commonSelectStyles
                }}
              >
                {[
                  { value: 'PENDIENTE', label: 'Pendiente', color: '#FFA726' },
                  { value: 'EN_PROGRESO', label: 'En Progreso', color: '#42A5F5' },
                  { value: 'COMPLETADO', label: 'Completado', color: '#66BB6A' }
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
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ px: 2 }}>
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
                      sx={{
                        ...commonInputStyles,
                        '& .MuiInputBase-root': {
                          mx: -2
                        }
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={commonIconContainerStyles}>
                            <ScheduleIcon sx={commonIconStyles} />
                          </Box>
                        )
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Fin"
                  value={formData.fechaFin}
                  onChange={handleDateChange('fechaFin')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      error={!!errors.fechaFin}
                      helperText={errors.fechaFin}
                      sx={{
                        ...commonInputStyles,
                        '& .MuiInputBase-root': {
                          mx: -2
                        }
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={commonIconContainerStyles}>
                            <ScheduleIcon sx={commonIconStyles} />
                          </Box>
                        )
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>

          {/* Tareas */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tareas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setIsTareaFormOpen(true)}
                startIcon={<AddIcon />}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Nueva Tarea
              </Button>
            </Box>
            <Stack spacing={1}>
              {formData.tareas.map((tarea, index) => (
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
                  <Typography
                    sx={{
                      flex: 1,
                      color: tarea.completada ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    {tarea.titulo}
                  </Typography>
                  <Chip 
                    label={tarea.estado}
                    size="small"
                    sx={{ 
                      backgroundColor: `${getEstadoColor(tarea.estado)}20`,
                      color: getEstadoColor(tarea.estado),
                      borderRadius: 1
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tareas: prev.tareas.filter((_, i) => i !== index)
                      }));
                    }}
                    sx={{ color: 'error.main' }}
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
        zIndex: 2
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

      <TareaForm
        open={isTareaFormOpen}
        onClose={() => setIsTareaFormOpen(false)}
        onSubmit={handleTareaSubmit}
        proyectoId={initialData?._id}
      />
    </Dialog>
  );
};

export default ProyectoForm; 