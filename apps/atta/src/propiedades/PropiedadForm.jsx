import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Fade,
  TextField,
  Paper,
  Grid,
  Chip,
  Autocomplete,
  InputAdornment,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import {
  House,
  Apartment,
  Business,
  Warehouse,
  LocationOn,
  AttachMoney,
  SquareFoot,
  HomeWork,
  MeetingRoom,
  Bathtub,
  LocalParking,
  Pool,
  PendingActions,
  CheckCircle,
  Engineering,
  BookmarkAdded,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { snackbar } from '@shared/components/common';
import { useRelationalData } from '@shared/hooks/useRelationalData';
import { useAuth } from '@shared/context/AuthContext';
import clienteAxios from '@shared/config/axios';
import { FORM_HEIGHTS } from '@shared/config/uiConstants';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
    backgroundImage: 'none',
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
    backgroundColor: theme.palette.background.default,
    '& fieldset': {
      borderColor: theme.palette.divider
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

const CategoryChip = styled(Chip)(({ theme, customcolor }) => ({
  borderRadius: 0,
  height: FORM_HEIGHTS.input,
  minWidth: 40,
  padding: 0,
  transition: 'all 0.2s ease',
  backgroundColor: 'transparent',
  border: 'none',
  color: theme.palette.text.secondary,
  '& .MuiChip-icon': {
    margin: 0,
    fontSize: '1.25rem',
    transition: 'all 0.2s ease'
  },
  '& .MuiChip-label': {
    display: 'none',
    transition: 'all 0.2s ease',
    padding: theme.spacing(0, 1),
    color: theme.palette.text.secondary
  },
  '&:hover': {
    backgroundColor: 'transparent',
    '& .MuiChip-label': {
      display: 'block'
    },
    '& .MuiChip-icon': {
      color: customcolor
    }
  },
  '&.selected': {
    backgroundColor: 'transparent',
    '& .MuiChip-icon': {
      color: customcolor
    },
    '& .MuiChip-label': {
      display: 'block'
    }
  }
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: -9,
  left: 8,
  padding: '0 4px',
  backgroundColor: theme.palette.background.default,
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  zIndex: 1
}));

const TIPOS_PROPIEDAD = [
  { valor: 'CASA', icon: <House />, label: 'Casa', color: '#4caf50' },
  { valor: 'DEPARTAMENTO', icon: <Apartment />, label: 'Departamento', color: '#2196f3' },
  { valor: 'OFICINA', icon: <Business />, label: 'Oficina', color: '#9c27b0' },
  { valor: 'LOCAL', icon: <Warehouse />, label: 'Local', color: '#ff9800' },
  { valor: 'TERRENO', icon: <LocationOn />, label: 'Terreno', color: '#795548' }
];

const ESTADOS_PROPIEDAD = [
  { valor: 'DISPONIBLE', icon: <PendingActions />, label: 'Disponible', color: '#4caf50' },
  { valor: 'OCUPADA', icon: <CheckCircle />, label: 'Ocupada', color: '#2196f3' },
  { valor: 'MANTENIMIENTO', icon: <Engineering />, label: 'En Mantenimiento', color: '#ff9800' },
  { valor: 'RESERVADA', icon: <BookmarkAdded />, label: 'Reservada', color: '#9c27b0' }
];

const CARACTERISTICAS = [
  { valor: 'HABITACIONES', icon: <MeetingRoom />, label: 'Dormitorios', color: '#4caf50' },
  { valor: 'BAÑOS', icon: <Bathtub />, label: 'Baños', color: '#2196f3' },
  { valor: 'PARQUEADERO', icon: <LocalParking />, label: 'Parqueadero', color: '#ff9800' },
  { valor: 'PISCINA', icon: <Pool />, label: 'Piscina', color: '#9c27b0' }
];

const PropiedadForm = ({
  open,
  onClose,
  onSubmit,
  initialData = {},
  isEditing = false,
  createWithHistory,
  updateWithHistory
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    alias: initialData.alias || '',
    tipo: initialData.tipo || 'CASA',
    direccion: initialData.direccion || '',
    ciudad: initialData.ciudad || '',
    estado: Array.isArray(initialData.estado) ? initialData.estado : (initialData.estado ? [initialData.estado] : ['DISPONIBLE']),
    metrosCuadrados: initialData.metrosCuadrados?.toString() || '',
    caracteristicas: initialData.caracteristicas || [],
    descripcion: initialData.descripcion || '',
    moneda: initialData.moneda?._id || initialData.moneda?.id || initialData.moneda || '',
    cuenta: initialData.cuenta?._id || initialData.cuenta?.id || initialData.cuenta || ''
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const relatedFields = [
    { 
      type: 'relational',
      name: 'moneda',
      endpoint: '/monedas',
      labelField: 'nombre',
      populate: []
    },
    {
      type: 'relational',
      name: 'cuenta',
      endpoint: '/cuentas',
      labelField: 'nombre',
      populate: ['moneda']
    }
  ];

  const { relatedData, isLoading: isLoadingRelated } = useRelationalData({
    open,
    relatedFields
  });

  const [selectedMoneda, setSelectedMoneda] = useState(null);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  useEffect(() => {
    if (open) {
      setFormData({
        alias: initialData.alias || '',
        tipo: initialData.tipo || 'CASA',
        direccion: initialData.direccion || '',
        ciudad: initialData.ciudad || '',
        estado: Array.isArray(initialData.estado) ? initialData.estado : (initialData.estado ? [initialData.estado] : ['DISPONIBLE']),
        metrosCuadrados: initialData.metrosCuadrados?.toString() || '',
        caracteristicas: initialData.caracteristicas || [],
        descripcion: initialData.descripcion || '',
        moneda: initialData.moneda?._id || initialData.moneda?.id || initialData.moneda || '',
        cuenta: initialData.cuenta?._id || initialData.cuenta?.id || initialData.cuenta || ''
      });

      // Inicializar moneda y cuenta
      if (relatedData?.moneda?.length) {
        const monedaId = initialData.moneda?._id || initialData.moneda?.id || initialData.moneda;
        const monedaEncontrada = relatedData.moneda.find(m => 
          m._id === monedaId || m.id === monedaId
        );
        if (monedaEncontrada) {
          setSelectedMoneda(monedaEncontrada);
          setFormData(prev => ({
            ...prev,
            moneda: monedaEncontrada._id || monedaEncontrada.id
          }));
        }
      }

      if (relatedData?.cuenta?.length) {
        const cuentaId = initialData.cuenta?._id || initialData.cuenta?.id || initialData.cuenta || user?.cuentaDefault;
        const cuentaEncontrada = relatedData.cuenta.find(c => 
          c._id === cuentaId || c.id === cuentaId
        );
        if (cuentaEncontrada) {
          setSelectedCuenta(cuentaEncontrada);
          setFormData(prev => ({
            ...prev,
            cuenta: cuentaEncontrada._id || cuentaEncontrada.id
          }));
        }
      }

      setErrors({});
    }
  }, [open, initialData, relatedData, user]);

  const handleChange = (name, value) => {
    // Convertir valores numéricos
    const numericFields = ['metrosCuadrados'];
    let finalValue = value;
    
    if (numericFields.includes(name)) {
      // Permitir números decimales y mantener valor vacío como string vacía
      if (value === '') {
        finalValue = '';
      } else {
        // Permitir números con punto decimal
        finalValue = value.replace(/[^0-9.]/g, '');
        // Evitar múltiples puntos decimales
        const parts = finalValue.split('.');
        if (parts.length > 2) {
          finalValue = parts[0] + '.' + parts.slice(1).join('');
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleCaracteristica = (caracteristica) => {
    const caracteristicas = formData.caracteristicas.includes(caracteristica)
      ? formData.caracteristicas.filter(c => c !== caracteristica)
      : [...formData.caracteristicas, caracteristica];
    
    handleChange('caracteristicas', caracteristicas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Preparar datos para enviar, siendo explícito sobre los campos
    const dataToSubmit = {
      alias: formData.alias,
      descripcion: formData.descripcion,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      tipo: formData.tipo,
      estado: formData.estado,
      metrosCuadrados: formData.metrosCuadrados ? Number(formData.metrosCuadrados) : 0,
      caracteristicas: formData.caracteristicas || [],
      moneda: formData.moneda || null,
      cuenta: formData.cuenta || null,
      usuario: user?._id || user?.id
    };

    // Solo incluir _id para edición
    if (initialData._id) {
      dataToSubmit._id = initialData._id;
    }

    try {
      setIsSaving(true);
      let response;
      
      if (initialData._id) {
        // Usar updateWithHistory si está disponible, sino usar clienteAxios
        if (updateWithHistory) {
          response = await updateWithHistory(initialData._id, dataToSubmit, initialData);
        } else {
          response = await clienteAxios.put(`/api/propiedades/${initialData._id}`, dataToSubmit);
        }
      } else {
        // Usar createWithHistory si está disponible, sino usar clienteAxios
        if (createWithHistory) {
          response = await createWithHistory(dataToSubmit);
        } else {
          response = await clienteAxios.post('/api/propiedades', dataToSubmit);
        }
      }

      snackbar.success(isEditing ? 'Propiedad actualizada exitosamente' : 'Propiedad creada exitosamente');

      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('entityUpdated', {
        detail: { type: 'propiedades', action: isEditing ? 'edit' : 'create' }
      }));

      onClose();
      if (typeof onSubmit === 'function') {
        onSubmit(response.data);
      }
    } catch (error) {
      console.error('Error al guardar la propiedad:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Error al guardar la propiedad';
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
              snackbar.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validación de campos requeridos
    if (!formData.alias?.trim()) newErrors.alias = 'El alias es requerido';
    if (!formData.descripcion?.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (!formData.direccion?.trim()) newErrors.direccion = 'La dirección es requerida';
    if (!formData.ciudad?.trim()) newErrors.ciudad = 'La ciudad es requerida';
    
    // Validación de campos numéricos (solo si se proporciona valor)
    const numericFields = {
      metrosCuadrados: 'Los metros cuadrados'
    };

    Object.entries(numericFields).forEach(([field, label]) => {
      // Solo validar si el campo tiene contenido
      if (formData[field] && formData[field].trim() !== '') {
        const value = parseFloat(formData[field]);
        if (isNaN(value) || value < 0) {
          newErrors[field] = `${label} debe ser un número válido (mayor o igual a 0)`;
        }
      }
    });

    return newErrors;
  };

  return (
    <StyledDialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <Box sx={{ position: 'relative' }}>
        <DialogTitle sx={{ px: 3, py: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ 
              color: isSaving ? 'text.secondary' : 'text.primary' 
            }}>
              {isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ 
                color: 'text.secondary',
                borderRadius: 0
              }}
              disabled={isSaving}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Fade in={isSaving}>
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0,
              height: 2
            }} 
          />
        </Fade>
      </Box>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          noValidate
          id="propiedad-form"
        >
          {/* Información Básica */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Alias de la Propiedad"
                value={formData.alias}
                onChange={(e) => handleChange('alias', e.target.value)}
                error={!!errors.alias}
                helperText={errors.alias}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlagIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Descripción"
                multiline
                minRows={1}
                maxRows={5}
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                error={!!errors.descripcion}
                helperText={errors.descripcion}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <DescriptionIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Información sobre alquiler mensual */}
            <Grid item xs={12}>
              <Alert 
                severity="info" 
                icon={<InfoIcon />}
                sx={{ borderRadius: 0 }}
              >
                <Typography variant="body2">
                  <strong>Alquiler Mensual:</strong> Se calcula automáticamente desde los contratos activos. 
                  Para establecer el precio, crea un contrato para esta propiedad.
                </Typography>
              </Alert>
            </Grid>
            
            {/* Cuenta */}
            <Grid item xs={12}>
                <Autocomplete
                fullWidth
                  value={selectedCuenta}
                  onChange={(_, newValue) => {
                    setSelectedCuenta(newValue);
                    setFormData(prev => ({ 
                      ...prev, 
                      cuenta: newValue?._id || newValue?.id || null 
                    }));
                  }}
                  options={relatedData?.cuenta || []}
                  getOptionLabel={(option) => `${option?.nombre || ''} - ${option?.tipo || ''}`}
                  loading={isLoadingRelated}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      label="Cuenta"
                      error={!!errors.cuenta}
                      helperText={errors.cuenta}
                      InputLabelProps={{
                        ...params.InputLabelProps,
                        shrink: true
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => 
                    option?._id === value?._id || 
                    option?.id === value?.id
                  }
                />
            </Grid>

            {/* Dirección y Ciudad */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StyledTextField
                  fullWidth
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  error={!!errors.direccion}
                  helperText={errors.direccion}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                <StyledTextField
                  fullWidth
                  label="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  error={!!errors.ciudad}
                  helperText={errors.ciudad}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>
            </Grid>

            {/* Características numéricas */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <StyledTextField
                  sx={{ flex: 1 }}
                  label="Metros Cuadrados"
                  type="number"
                  value={formData.metrosCuadrados}
                  onChange={(e) => handleChange('metrosCuadrados', e.target.value)}
                  error={!!errors.metrosCuadrados}
                  helperText={errors.metrosCuadrados}
                  InputProps={{
                    startAdornment: <SquareFoot sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>
            </Grid>

            {/* Tipo de Propiedad */}
            <Grid item xs={12}>
              <Box sx={{ 
                position: 'relative',
                border: t => `1px solid ${t.palette.divider}`,
                p: 2,
                pt: 1.5
              }}>
                <StyledSectionTitle>
                  Tipo de Propiedad
                </StyledSectionTitle>
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0,
                  '& .MuiChip-root': {
                    flex: '0 0 auto',
                    width: 'auto',
                    mr: 1
                  }
                }}>
                  {TIPOS_PROPIEDAD.map((tipo) => (
                    <CategoryChip
                      key={tipo.valor}
                      icon={tipo.icon}
                      label={tipo.label}
                      onClick={() => handleChange('tipo', tipo.valor)}
                      className={formData.tipo === tipo.valor ? 'selected' : ''}
                      customcolor={tipo.color}
                    />
                  ))}
                </Box>
              </Box>
              {errors.tipo && (
                <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                  {errors.tipo}
                </Typography>
              )}
            </Grid>

            {/* Estado de la Propiedad - Solo Lectura */}
            <Grid item xs={12}>
              <Box sx={{ 
                position: 'relative',
                border: t => `1px solid ${t.palette.divider}`,
                p: 2,
                pt: 1.5,
                opacity: 0.8 // Indicador visual de que es solo lectura
              }}>
                <StyledSectionTitle>
                  Estado de la Propiedad (Automático)
                </StyledSectionTitle>
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0,
                  '& .MuiChip-root': {
                    flex: '0 0 auto',
                    width: 'auto',
                    mr: 1
                  }
                }}>
                  {Array.isArray(formData.estado) ? formData.estado.map((estadoValor) => {
                    const estado = ESTADOS_PROPIEDAD.find(e => e.valor === estadoValor);
                    return estado ? (
                      <CategoryChip
                        key={estado.valor}
                        icon={estado.icon}
                        label={estado.label}
                        className="selected"
                        customcolor={estado.color}
                        sx={{ pointerEvents: 'none' }}
                      />
                    ) : null;
                  }) : null}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  El estado se calcula automáticamente basado en los contratos activos y futuros
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Características Adicionales */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              position: 'relative',
              border: t => `1px solid ${t.palette.divider}`,
              p: 2,
              pt: 1.5
            }}>
              <StyledSectionTitle>
                Características Adicionales
              </StyledSectionTitle>
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0,
                '& .MuiChip-root': {
                  flex: '0 0 auto',
                  width: 'auto',
                  mr: 1
                }
              }}>
                {CARACTERISTICAS.map((caracteristica) => (
                  <CategoryChip
                    key={caracteristica.valor}
                    icon={caracteristica.icon}
                    label={caracteristica.label}
                    onClick={() => toggleCaracteristica(caracteristica.valor)}
                    className={formData.caracteristicas.includes(caracteristica.valor) ? 'selected' : ''}
                    customcolor={caracteristica.color}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2,
        borderTop: t => `1px solid ${t.palette.divider}`,
        gap: 1
      }}>
        <Button 
          onClick={onClose} 
          disabled={isSaving}
          sx={{ 
            borderRadius: 0,
            height: FORM_HEIGHTS.button
          }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="propiedad-form"
          variant="contained"
          disabled={isSaving}
          sx={{ 
            borderRadius: 0,
            height: FORM_HEIGHTS.button
          }}
        >
          {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default PropiedadForm; 