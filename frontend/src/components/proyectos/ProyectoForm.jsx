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
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Label as LabelIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
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
    etiquetas: initialData?.etiquetas || [],
    presupuesto: initialData?.presupuesto || { monto: '', moneda: null },
    archivos: initialData?.archivos || [],
    propiedad: initialData?.propiedad || null,
    tareas: initialData?.tareas || []
  });

  const [newTag, setNewTag] = useState('');
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

  const handleAddTag = () => {
    if (newTag.trim() && !formData.etiquetas.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        etiquetas: [...prev.etiquetas, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.filter(tag => tag !== tagToDelete)
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

  const handleTareasChange = (nuevasTareas) => {
    setFormData(prev => ({
      ...prev,
      tareas: nuevasTareas
    }));
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

  const handleTareaSubmit = (tareaData) => {
    setFormData(prev => ({
      ...prev,
      tareas: [...prev.tareas, tareaData]
    }));
    setIsTareaFormOpen(false);
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
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', width: 40, justifyContent: 'center' }}>
                  <FlagIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </Box>
              )
            }}
            sx={{ mt: 1 }}
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
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: 40, justifyContent: 'center', pt: 1 }}>
                  <DescriptionIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </Box>
              )
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
                      alignItems: 'center'
                    }
                  }
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
                      alignItems: 'center'
                    }
                  }
                }}
              >
                {[
                  { value: 'BAJA', label: 'Baja', color: '#66BB6A' },
                  { value: 'MEDIA', label: 'Media', color: '#FFA726' },
                  { value: 'ALTA', label: 'Alta', color: '#EF5350' }
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
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', width: 40, justifyContent: 'center' }}>
                            <ScheduleIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
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
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', width: 40, justifyContent: 'center' }}>
                            <ScheduleIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                          </Box>
                        )
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Etiquetas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                InputProps={{
                  startAdornment: <LabelIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddTag}
                startIcon={<AddIcon />}
                sx={{ borderRadius: 0 }}
              >
                Agregar
              </Button>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {formData.etiquetas.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Archivos Adjuntos
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              size="small"
              sx={{ borderRadius: 0 }}
            >
              Adjuntar Archivos
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
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

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tareas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsTareaFormOpen(true)}
                startIcon={<AddIcon />}
                sx={{ borderRadius: 0 }}
              >
                Agregar Tarea
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
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ borderRadius: 0 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ borderRadius: 0 }}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
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