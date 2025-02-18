import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  TextField,
  Autocomplete,
  InputAdornment,
  LinearProgress,
  Paper,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  AttachMoney,
  CalendarToday,
  Description,
  Home,
  Person,
  MeetingRoom,
  Engineering,
  Info as InfoIcon,
  House,
  Apartment,
  Business,
  Warehouse,
  LocationOn
} from '@mui/icons-material';
import EntityDateSelect from '../EntityViews/EntityDateSelect';
import { CircularProgress } from '@mui/material';

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
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: theme.palette.divider,
      transition: 'border-color 0.2s ease'
    },
    '&:hover fieldset': {
      borderColor: theme.palette.action.hover
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    '&.Mui-focused': {
      color: theme.palette.primary.main
    }
  },
  '& .MuiInputAdornment-root': {
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
      color: theme.palette.text.secondary
    }
  }
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    color: theme.palette.primary.main
  }
}));

const FormSection = styled(Box, {
  shouldForwardProp: prop => prop !== 'isAlternate'
})(({ theme, isAlternate }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: isAlternate ? theme.palette.background.paper : 'transparent',
  marginBottom: theme.spacing(0.5),
  transition: 'background-color 0.2s ease'
}));

const StyledToggleButton = styled(ToggleButton)(({ theme, customcolor }) => ({
  flex: 1,
  height: 40,
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(customcolor, 0.08),
    '& .MuiSvgIcon-root': {
      color: customcolor
    }
  },
  '&.Mui-selected': {
    backgroundColor: alpha(customcolor, 0.12),
    borderColor: customcolor,
    '& .MuiSvgIcon-root': {
      color: customcolor
    },
    '& .MuiTypography-root': {
      color: customcolor
    },
    '&:hover': {
      backgroundColor: alpha(customcolor, 0.16)
    }
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    marginRight: theme.spacing(1),
    transition: 'color 0.2s ease'
  },
  '& .MuiTypography-root': {
    fontSize: '0.875rem',
    transition: 'color 0.2s ease'
  }
}));

const CategoryChip = styled(Chip)(({ theme, customcolor }) => ({
  borderRadius: 0,
  height: 40,
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

const TIPOS_PROPIEDAD = [
  { valor: 'CASA', icon: <House />, label: 'Casa', color: '#4caf50' },
  { valor: 'DEPARTAMENTO', icon: <Apartment />, label: 'Departamento', color: '#2196f3' },
  { valor: 'OFICINA', icon: <Business />, label: 'Oficina', color: '#9c27b0' },
  { valor: 'LOCAL', icon: <Warehouse />, label: 'Local', color: '#ff9800' },
  { valor: 'TERRENO', icon: <LocationOn />, label: 'Terreno', color: '#795548' }
];

const TIPO_ALQUILER = [
  { valor: false, icon: <Home />, label: 'Propiedad', color: '#4caf50' },
  { valor: true, icon: <MeetingRoom />, label: 'Habitación', color: '#2196f3' }
];

const ContratoForm = ({
  initialData = {},
  relatedData = {},
  onSubmit,
  onClose,
  isSaving = false
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    inquilino: initialData.inquilino || [],
    propiedad: initialData.propiedad?._id || initialData.propiedad || '',
    esPorHabitacion: initialData.esPorHabitacion || false,
    habitacion: initialData.habitacion?._id || initialData.habitacion || '',
    fechaInicio: initialData.fechaInicio ? new Date(initialData.fechaInicio) : null,
    fechaFin: initialData.fechaFin ? new Date(initialData.fechaFin) : null,
    montoMensual: initialData.montoMensual?.toString() || '0',
    cuenta: initialData.cuenta?._id || initialData.cuenta || '',
    deposito: initialData.deposito?.toString() || '0',
    observaciones: initialData.observaciones || '',
    documentoUrl: initialData.documentoUrl || '',
    esMantenimiento: initialData.esMantenimiento || false,
    estado: initialData.estado || 'PLANEADO'
  });

  const [errors, setErrors] = useState({});
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);
  const [selectedHabitacion, setSelectedHabitacion] = useState(null);
  const [selectedInquilinos, setSelectedInquilinos] = useState([]);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  useEffect(() => {
    if (relatedData.propiedades?.length > 0 && initialData.propiedad) {
      const propiedad = relatedData.propiedades.find(p => 
        p._id === (initialData.propiedad?._id || initialData.propiedad)
      );
      setSelectedPropiedad(propiedad || null);
    }

    if (relatedData.habitaciones?.length > 0 && initialData.habitacion) {
      const habitacion = relatedData.habitaciones.find(h => 
        h._id === (initialData.habitacion?._id || initialData.habitacion)
      );
      setSelectedHabitacion(habitacion || null);
    }

    if (relatedData.inquilinos?.length > 0 && initialData.inquilino) {
      const inquilinos = Array.isArray(initialData.inquilino) ? initialData.inquilino : [initialData.inquilino];
      const selectedInqs = inquilinos
        .map(inqId => relatedData.inquilinos.find(i => 
          i._id === (typeof inqId === 'object' ? inqId._id : inqId)
        ))
        .filter(Boolean);
      setSelectedInquilinos(selectedInqs);
      setFormData(prev => ({
        ...prev,
        inquilino: selectedInqs.map(inq => inq._id)
      }));
    }

    if (relatedData.cuentas?.length > 0 && initialData.cuenta) {
      const cuenta = relatedData.cuentas.find(c => 
        c._id === (initialData.cuenta?._id || initialData.cuenta)
      );
      setSelectedCuenta(cuenta || null);
    }
  }, [initialData, relatedData]);

  const handleChange = (field, value) => {
    console.log(`Cambiando ${field}:`, value);
    
    // Validación especial para fechas
    if (field === 'fechaInicio' || field === 'fechaFin') {
      if (value && !(value instanceof Date)) {
        value = new Date(value);
      }
      if (value && isNaN(value.getTime())) {
        console.error('Fecha inválida:', value);
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Iniciando submit con datos:', formData);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('Errores de validación encontrados:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    try {
      // Preparar datos para envío
      const dataToSubmit = {
        ...formData,
        propiedad: formData.propiedad || null,
        habitacion: formData.habitacion || null,
        inquilino: formData.esMantenimiento ? null : (formData.inquilino || []),
        cuenta: formData.cuenta || null,
        montoMensual: formData.esMantenimiento ? 0 : parseFloat(formData.montoMensual || 0),
        deposito: parseFloat(formData.deposito || 0),
        fechaInicio: formData.fechaInicio?.toISOString(),
        fechaFin: formData.fechaFin?.toISOString(),
        esMantenimiento: Boolean(formData.esMantenimiento),
        estado: formData.estado || 'PLANEADO',
        observaciones: formData.observaciones || '',
        documentoUrl: formData.documentoUrl || ''
      };

      // Validar fechas antes de enviar
      if (!dataToSubmit.fechaInicio || !dataToSubmit.fechaFin) {
        throw new Error('Las fechas son requeridas');
      }

      // Eliminar campos null o undefined
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === null || dataToSubmit[key] === undefined) {
          delete dataToSubmit[key];
        }
      });

      console.log('Datos preparados para envío:', dataToSubmit);
      await onSubmit(dataToSubmit);
      onClose(); // Cerrar el formulario después de enviar exitosamente
    } catch (error) {
      console.error('Error en submit:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Error al guardar el contrato'
      }));
    }
  };

  const validateForm = () => {
    console.log('Validando formulario con datos:', formData);
    const newErrors = {};

    // Validaciones básicas
    if (!formData.propiedad) newErrors.propiedad = 'La propiedad es requerida';
    if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';
    if (!formData.fechaFin) newErrors.fechaFin = 'La fecha de fin es requerida';
    
    // Validar que las fechas sean instancias válidas de Date
    if (formData.fechaInicio && !(formData.fechaInicio instanceof Date && !isNaN(formData.fechaInicio))) {
      newErrors.fechaInicio = 'Fecha de inicio inválida';
    }
    if (formData.fechaFin && !(formData.fechaFin instanceof Date && !isNaN(formData.fechaFin))) {
      newErrors.fechaFin = 'Fecha de fin inválida';
    }

    // Validaciones específicas para contratos no de mantenimiento
    if (!formData.esMantenimiento) {
      if (!formData.cuenta) newErrors.cuenta = 'La cuenta es requerida';
      if (!formData.inquilino || formData.inquilino.length === 0) {
        newErrors.inquilino = 'El inquilino es requerido';
      }
      const montoMensual = parseFloat(formData.montoMensual);
      if (isNaN(montoMensual) || montoMensual <= 0) {
        newErrors.montoMensual = 'El monto mensual debe ser mayor a 0';
      }
    }

    // Validación de fechas
    if (formData.fechaInicio && formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);
      if (inicio >= fin) {
        newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    console.log('Errores de validación:', newErrors);
    return newErrors;
  };

  return (
    <StyledDialog
      open={true}
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
            {formData.esMantenimiento ? (
              <Engineering sx={{ color: 'warning.main' }} />
            ) : (
              <Description sx={{ color: 'primary.main' }} />
            )}
            <Typography variant="h6">
              {initialData._id ? 'Editar Contrato' : 'Nuevo Contrato'}
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            disabled={isSaving} 
            sx={{ 
              borderRadius: 0,
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
          p: 0,
          bgcolor: 'background.default',
          flex: 1,
          overflowY: 'auto'
        }}>
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            id="contrato-form"
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* Tipo de Contrato */}
            <FormSection>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Engineering sx={{ color: 'warning.main' }} />
                  <Typography variant="subtitle1">Tipo de Contrato</Typography>
                </Box>
                <Switch
                  checked={formData.esMantenimiento}
                  onChange={(e) => {
                    const esMantenimiento = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      esMantenimiento,
                      montoMensual: esMantenimiento ? '0' : prev.montoMensual,
                      inquilino: esMantenimiento ? [] : prev.inquilino
                    }));
                    setSelectedInquilinos([]);
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'warning.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.warning.main, 0.08)
                      }
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'warning.main'
                    }
                  }}
                />
              </Box>
              {formData.esMantenimiento && (
                <Typography 
                  variant="caption" 
                  color="warning.main"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <InfoIcon sx={{ fontSize: '1rem' }} />
                  Durante el mantenimiento, el monto mensual será 0 y no se requiere inquilino
                </Typography>
              )}
            </FormSection>

            {/* Propiedad y Tipo de Alquiler */}
            <FormSection alternate>
              <StyledSectionTitle>
                <Home />
                Propiedad y Tipo de Alquiler
              </StyledSectionTitle>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  value={selectedPropiedad}
                  onChange={(_, newValue) => {
                    setSelectedPropiedad(newValue);
                    handleChange('propiedad', newValue?._id || newValue?.id || '');
                    setSelectedHabitacion(null);
                    handleChange('habitacion', '');
                  }}
                  options={relatedData.propiedades || []}
                  getOptionLabel={(option) => option.titulo || ''}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      label="Propiedad"
                      error={!!errors.propiedad}
                      helperText={errors.propiedad}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            {selectedPropiedad ? 
                              TIPOS_PROPIEDAD.find(t => t.valor === selectedPropiedad.tipo)?.icon || <Home /> 
                              : <Home />
                            }
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {TIPOS_PROPIEDAD.find(t => t.valor === option.tipo)?.icon || <Home />}
                      <Typography>{option.titulo}</Typography>
                    </Box>
                  )}
                />
                {!formData.esMantenimiento && (
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    alignSelf: 'center',
                    height: '56px',
                    alignItems: 'center'
                  }}>
                    {TIPO_ALQUILER.map((tipo) => (
                      <StyledToggleButton
                        key={String(tipo.valor)}
                        value={tipo.valor}
                        selected={formData.esPorHabitacion === tipo.valor}
                        onClick={() => {
                          handleChange('esPorHabitacion', tipo.valor);
                          if (!tipo.valor) {
                            setSelectedHabitacion(null);
                            handleChange('habitacion', '');
                          }
                        }}
                        customcolor={tipo.color}
                      >
                        {tipo.icon}
                        <Typography variant="body2">{tipo.label}</Typography>
                      </StyledToggleButton>
                    ))}
                  </Box>
                )}
              </Box>
            </FormSection>

            {/* Habitación (solo si esPorHabitacion es true) */}
            {formData.esPorHabitacion && !formData.esMantenimiento && (
              <FormSection>
                <StyledSectionTitle>
                  <MeetingRoom />
                  Habitación
                </StyledSectionTitle>
                <Autocomplete
                  value={selectedHabitacion}
                  onChange={(_, newValue) => {
                    setSelectedHabitacion(newValue);
                    handleChange('habitacion', newValue?._id || newValue?.id || '');
                  }}
                  options={relatedData.habitaciones?.filter(h => 
                    h.propiedad === formData.propiedad
                  ) || []}
                  getOptionLabel={(option) => option.nombre || ''}
                  disabled={!formData.propiedad}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      label="Seleccionar Habitación"
                      error={!!errors.habitacion}
                      helperText={errors.habitacion}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MeetingRoom />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </FormSection>
            )}

            {/* Fechas */}
            <FormSection alternate>
              <StyledSectionTitle>
                <CalendarToday />
                Fechas del Contrato
              </StyledSectionTitle>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <EntityDateSelect
                  sx={{ flex: 1 }}
                  label="Fecha de Inicio"
                  value={formData.fechaInicio}
                  onChange={(newValue) => handleChange('fechaInicio', newValue)}
                  error={!!errors.fechaInicio}
                  helperText={errors.fechaInicio}
                />
                <EntityDateSelect
                  sx={{ flex: 1 }}
                  label="Fecha de Fin"
                  value={formData.fechaFin}
                  onChange={(newValue) => handleChange('fechaFin', newValue)}
                  error={!!errors.fechaFin}
                  helperText={errors.fechaFin}
                  minDate={formData.fechaInicio}
                />
              </Box>
            </FormSection>

            {/* Campos específicos según el tipo de contrato */}
            {!formData.esMantenimiento && (
              <>
                {/* Inquilinos */}
                <FormSection>
                  <StyledSectionTitle>
                    <Person />
                    Inquilinos
                  </StyledSectionTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Autocomplete
                      multiple
                      value={selectedInquilinos}
                      onChange={(_, newValue) => {
                        setSelectedInquilinos(newValue);
                        handleChange('inquilino', newValue.map(inq => inq._id));
                      }}
                      options={relatedData.inquilinos || []}
                      getOptionLabel={(option) => 
                        option && typeof option === 'object' ? 
                          `${option.nombre || ''} ${option.apellido || ''}` : ''
                      }
                      renderInput={(params) => (
                        <StyledTextField
                          {...params}
                          label="Seleccionar Inquilinos"
                          error={!!errors.inquilino}
                          helperText={errors.inquilino}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person />
                              </InputAdornment>
                            )
                          }}
                        />
                      )}
                      renderTags={() => null}
                    />
                    {selectedInquilinos.length > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1,
                        p: 1,
                        bgcolor: 'background.default'
                      }}>
                        {selectedInquilinos.map((inquilino) => inquilino && (
                          <Chip
                            key={inquilino._id}
                            label={`${inquilino.nombre || ''} ${inquilino.apellido || ''}`}
                            onDelete={() => {
                              const newInquilinos = selectedInquilinos.filter(
                                i => i._id !== inquilino._id
                              );
                              setSelectedInquilinos(newInquilinos);
                              handleChange('inquilino', newInquilinos.map(inq => inq._id));
                            }}
                            sx={{ 
                              borderRadius: 0,
                              bgcolor: 'background.paper',
                              '& .MuiChip-deleteIcon': {
                                color: 'text.secondary',
                                '&:hover': {
                                  color: 'error.main'
                                }
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </FormSection>

                {/* Montos y Cuenta */}
                <FormSection alternate>
                  <StyledSectionTitle>
                    <AttachMoney />
                    Montos y Cuenta
                  </StyledSectionTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <StyledTextField
                        sx={{ flex: 1 }}
                        label="Monto Mensual"
                        value={formData.montoMensual}
                        onChange={(e) => handleChange('montoMensual', e.target.value)}
                        error={!!errors.montoMensual}
                        helperText={errors.montoMensual}
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          )
                        }}
                      />
                      <StyledTextField
                        sx={{ flex: 1 }}
                        label="Depósito"
                        value={formData.deposito}
                        onChange={(e) => handleChange('deposito', e.target.value)}
                        error={!!errors.deposito}
                        helperText={errors.deposito}
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Box>
                    <Autocomplete
                      value={selectedCuenta}
                      onChange={(_, newValue) => {
                        console.log('Nueva cuenta seleccionada:', newValue);
                        setSelectedCuenta(newValue);
                        handleChange('cuenta', newValue?._id || newValue?.id || '');
                      }}
                      options={relatedData.cuentas || []}
                      getOptionLabel={(option) => 
                        `${option.nombre || ''} - ${option.moneda?.simbolo || ''} (${option.tipo || ''})`
                      }
                      renderInput={(params) => (
                        <StyledTextField
                          {...params}
                          label="Cuenta"
                          error={!!errors.cuenta}
                          helperText={errors.cuenta}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney />
                              </InputAdornment>
                            )
                          }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box>
                              <Typography>{option.nombre}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.moneda?.simbolo} - {option.tipo}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                  </Box>
                </FormSection>
              </>
            )}

            {/* Observaciones */}
            <FormSection>
              <StyledSectionTitle>
                <Description />
                Observaciones
              </StyledSectionTitle>
              <StyledTextField
                fullWidth
                multiline
                rows={3}
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <Description />
                    </InputAdornment>
                  )
                }}
              />
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
              borderRadius: 0,
              minWidth: 100
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="contrato-form"
            variant="contained"
            disabled={isSaving}
            sx={{ 
              borderRadius: 0,
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
                  {initialData._id ? 'Actualizar' : 'Crear'}
                </Box>
              </>
            ) : (
              initialData._id ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </DialogActions>
      </Box>
    </StyledDialog>
  );
};

export default ContratoForm; 