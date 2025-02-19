import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  LinearProgress,
  useTheme
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
  AccountBalance as BankIcon,
  Category as CategoryIcon,
  AutorenewOutlined as RecurrentIcon
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import EntityDateSelect from '../EntityViews/EntityDateSelect';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      maxHeight: '100%',
      height: '100%',
      width: '100%',
      maxWidth: '100%'
    },
    [theme.breakpoints.up('sm')]: {
      minWidth: '600px',
      maxWidth: '800px'
    }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    '& fieldset': {
      borderColor: theme.palette.divider
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)'
  }
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const CATEGORIAS = [
  'Salud y Belleza',
  'Contabilidad y Facturas',
  'Transporte',
  'Comida y Mercado',
  'Fiesta',
  'Ropa',
  'Tecnología',
  'Otro'
];

const TransaccionRecurrenteForm = ({
  open,
  onClose,
  onSubmit,
  initialData = {},
  relatedData = {},
  isEditing = false,
  isSaving = false
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    cuenta: '',
    tipo: 'INGRESO',
    categoria: '',
    frecuencia: 'MENSUAL',
    diaDelMes: '1',
    fechaInicio: null,
    fechaFin: null,
    propiedad: '',
    estado: 'ACTIVO',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      
      // Establecer cuenta seleccionada
      if (initialData.cuenta && relatedData.cuentas) {
        const cuenta = relatedData.cuentas.find(c => 
          c._id === (initialData.cuenta?._id || initialData.cuenta)
        );
        setSelectedCuenta(cuenta || null);
      }

      // Establecer propiedad seleccionada
      if (initialData.propiedad && relatedData.propiedades) {
        const propiedad = relatedData.propiedades.find(p => 
          p._id === (initialData.propiedad?._id || initialData.propiedad)
        );
        setSelectedPropiedad(propiedad || null);
      }
    }
  }, [open, initialData, relatedData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCuentaChange = (newValue) => {
    setSelectedCuenta(newValue);
    handleChange('cuenta', newValue?._id || newValue?.id || '');
  };

  const handlePropiedadChange = (newValue) => {
    setSelectedPropiedad(newValue);
    handleChange('propiedad', newValue?._id || newValue?.id || '');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.descripcion) newErrors.descripcion = 'La descripción es requerida';
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }
    if (!formData.cuenta) newErrors.cuenta = 'La cuenta es requerida';
    if (!formData.categoria) newErrors.categoria = 'La categoría es requerida';
    if (!formData.frecuencia) newErrors.frecuencia = 'La frecuencia es requerida';
    if (!formData.diaDelMes || parseInt(formData.diaDelMes) < 1 || parseInt(formData.diaDelMes) > 31) {
      newErrors.diaDelMes = 'El día del mes debe estar entre 1 y 31';
    }
    if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error en submit:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Error al guardar la transacción recurrente'
      }));
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: t => `1px solid ${t.palette.divider}`,
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecurrentIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              {isEditing ? 'Editar Transacción Recurrente' : 'Nueva Transacción Recurrente'}
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            disabled={isSaving}
            sx={{ 
              borderRadius: t => t.shape.borderRadius,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Progress bar */}
        {isSaving && (
          <LinearProgress 
            sx={{ 
              height: 2,
              '& .MuiLinearProgress-bar': {
                transition: 'transform 0.2s linear'
              }
            }} 
          />
        )}

        {/* Content */}
        <DialogContent sx={{ 
          p: 3,
          bgcolor: 'background.default',
          flex: 1,
          overflowY: 'auto'
        }}>
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            id="transaccion-recurrente-form"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {/* Información básica */}
            <FormSection>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Descripción"
                    value={formData.descripcion}
                    onChange={(e) => handleChange('descripcion', e.target.value)}
                    error={!!errors.descripcion}
                    helperText={errors.descripcion}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={formData.tipo}
                      onChange={(e) => handleChange('tipo', e.target.value)}
                      label="Tipo"
                    >
                      <MenuItem value="INGRESO">Ingreso</MenuItem>
                      <MenuItem value="EGRESO">Egreso</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Monto"
                    type="number"
                    value={formData.monto}
                    onChange={(e) => handleChange('monto', e.target.value)}
                    error={!!errors.monto}
                    helperText={errors.monto}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Cuenta y Categoría */}
            <FormSection>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    value={selectedCuenta}
                    onChange={(_, newValue) => handleCuentaChange(newValue)}
                    options={relatedData.cuentas || []}
                    getOptionLabel={(option) => option.nombre || ''}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        label="Cuenta"
                        error={!!errors.cuenta}
                        helperText={errors.cuenta}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    value={formData.categoria}
                    onChange={(_, newValue) => handleChange('categoria', newValue)}
                    options={CATEGORIAS}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        label="Categoría"
                        error={!!errors.categoria}
                        helperText={errors.categoria}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Frecuencia y Día */}
            <FormSection>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia</InputLabel>
                    <Select
                      value={formData.frecuencia}
                      onChange={(e) => handleChange('frecuencia', e.target.value)}
                      label="Frecuencia"
                    >
                      <MenuItem value="MENSUAL">Mensual</MenuItem>
                      <MenuItem value="TRIMESTRAL">Trimestral</MenuItem>
                      <MenuItem value="SEMESTRAL">Semestral</MenuItem>
                      <MenuItem value="ANUAL">Anual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Día del mes"
                    type="number"
                    value={formData.diaDelMes}
                    onChange={(e) => handleChange('diaDelMes', e.target.value)}
                    error={!!errors.diaDelMes}
                    helperText={errors.diaDelMes}
                    inputProps={{ min: 1, max: 31 }}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Fechas */}
            <FormSection>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Fecha de inicio"
                    type="date"
                    value={formData.fechaInicio ? new Date(formData.fechaInicio).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('fechaInicio', e.target.value)}
                    error={!!errors.fechaInicio}
                    helperText={errors.fechaInicio}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Fecha de fin (opcional)"
                    type="date"
                    value={formData.fechaFin ? new Date(formData.fechaFin).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('fechaFin', e.target.value)}
                    error={!!errors.fechaFin}
                    helperText={errors.fechaFin}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Propiedad */}
            <FormSection>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    value={selectedPropiedad}
                    onChange={(_, newValue) => handlePropiedadChange(newValue)}
                    options={relatedData.propiedades || []}
                    getOptionLabel={(option) => option.titulo || ''}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        label="Propiedad (opcional)"
                        error={!!errors.propiedad}
                        helperText={errors.propiedad}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          borderTop: t => `1px solid ${t.palette.divider}`,
          gap: 1
        }}>
          <Button 
            onClick={onClose} 
            disabled={isSaving}
            sx={{ 
              borderRadius: t => t.shape.borderRadius,
              minWidth: 100
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="transaccion-recurrente-form"
            variant="contained"
            disabled={isSaving}
            sx={{ 
              borderRadius: t => t.shape.borderRadius,
              minWidth: 100,
              position: 'relative'
            }}
          >
            {isSaving ? (
              <>
                <CircularProgress 
                  size={16} 
                  sx={{ 
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-12px'
                  }}
                />
                <Box sx={{ opacity: 0 }}>
                  {isEditing ? 'Actualizar' : 'Crear'}
                </Box>
              </>
            ) : (
              isEditing ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </DialogActions>
      </Box>
    </StyledDialog>
  );
};

export default TransaccionRecurrenteForm; 