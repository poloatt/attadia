import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Grid,
  Alert,
  Avatar,
  InputAdornment
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  MeetingRoom as RoomIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  House as HouseIcon
} from '@mui/icons-material';

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
  }
}));

const PropertyCard = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  border: selected 
    ? `2px solid ${theme.palette.primary.main}` 
    : `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.05) 
    : alpha(theme.palette.background.paper, 0.5),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.1) 
      : alpha(theme.palette.background.paper, 0.8)
  }
}));

const TenantChip = styled(Chip)(({ theme, selected }) => ({
  borderRadius: 0,
  height: 40,
  fontSize: '0.875rem',
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.1) 
    : 'transparent',
  color: selected 
    ? theme.palette.primary.main 
    : theme.palette.text.primary,
  border: selected 
    ? `2px solid ${theme.palette.primary.main}` 
    : `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected 
      ? alpha(theme.palette.primary.main, 0.15) 
      : alpha(theme.palette.background.paper, 0.5)
  }
}));

const PropertyTenantsStep = ({
  formData,
  onFormDataChange,
  onErrorsChange,
  onStepComplete,
  errors,
  relatedData,
  theme
}) => {
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);
  const [selectedHabitacion, setSelectedHabitacion] = useState(null);
  const [selectedInquilinos, setSelectedInquilinos] = useState([]);

  // Obtener propiedad seleccionada
  useEffect(() => {
    if (formData.propiedad && relatedData.propiedades) {
      const propiedad = relatedData.propiedades.find(p => 
        p._id === formData.propiedad || p.id === formData.propiedad
      );
      setSelectedPropiedad(propiedad || null);
    }
  }, [formData.propiedad, relatedData.propiedades]);

  // Obtener habitación seleccionada
  useEffect(() => {
    if (formData.habitacion && selectedPropiedad?.habitaciones) {
      const habitacion = selectedPropiedad.habitaciones.find(h => 
        h._id === formData.habitacion || h.id === formData.habitacion
      );
      setSelectedHabitacion(habitacion || null);
    }
  }, [formData.habitacion, selectedPropiedad]);

  // Obtener inquilinos seleccionados
  useEffect(() => {
    if (formData.inquilino && relatedData.inquilinos) {
      const inquilinos = relatedData.inquilinos.filter(inq => 
        formData.inquilino.includes(inq._id || inq.id)
      );
      setSelectedInquilinos(inquilinos);
    }
  }, [formData.inquilino, relatedData.inquilinos]);

  const validateStep = () => {
    const newErrors = {};
    
    // Validar propiedad
    if (!formData.propiedad) {
      newErrors.propiedad = 'Selecciona una propiedad';
    }
    
    // Validar inquilinos (al menos uno)
    if (!formData.inquilino || formData.inquilino.length === 0) {
      newErrors.inquilino = 'Selecciona al menos un inquilino';
    }
    
    // Validar habitación si es por habitación
    if (formData.esPorHabitacion && !formData.habitacion) {
      newErrors.habitacion = 'Selecciona una habitación';
    }
    
    onErrorsChange(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    onStepComplete(1, isValid);
  };

  useEffect(() => {
    validateStep();
  }, [formData.propiedad, formData.inquilino, formData.habitacion, formData.esPorHabitacion]);

  const handlePropiedadChange = (propiedad) => {
    setSelectedPropiedad(propiedad);
    onFormDataChange({ 
      propiedad: propiedad?._id || propiedad?.id || '',
      habitacion: '' // Reset habitación al cambiar propiedad
    });
  };

  const handleHabitacionChange = (habitacion) => {
    setSelectedHabitacion(habitacion);
    onFormDataChange({ 
      habitacion: habitacion?._id || habitacion?.id || ''
    });
  };

  const handleInquilinosChange = (inquilinos) => {
    setSelectedInquilinos(inquilinos);
    onFormDataChange({ 
      inquilino: inquilinos.map(inq => inq._id || inq.id)
    });
  };

  const handlePorHabitacionChange = (esPorHabitacion) => {
    onFormDataChange({ 
      esPorHabitacion,
      habitacion: esPorHabitacion ? formData.habitacion : ''
    });
  };

  const getPropertyIcon = (tipo) => {
    const iconMap = {
      'CASA': HouseIcon,
      'DEPARTAMENTO': BusinessIcon,
      'APARTAMENTO': BusinessIcon,
      'LOCAL': StoreIcon
    };
    return iconMap[tipo] || HomeIcon;
  };

  const getPropertyStatus = (propiedad) => {
    if (!propiedad) return null;
    
    const contratosActivos = relatedData.contratos?.filter(c => 
      c.propiedad?._id === propiedad._id && 
      c.estado === 'ACTIVO'
    ) || [];
    
    if (contratosActivos.length > 0) {
      return { status: 'OCUPADA', color: 'error.main' };
    }
    
    return { status: 'DISPONIBLE', color: 'success.main' };
  };

  const getInquilinoStatus = (inquilino) => {
    if (!inquilino) return null;
    
    const contratosActivos = relatedData.contratos?.filter(c => 
      c.inquilino?.some(inq => inq._id === inquilino._id) && 
      c.estado === 'ACTIVO'
    ) || [];
    
    if (contratosActivos.length > 0) {
      return { status: 'CON CONTRATO', color: 'warning.main' };
    }
    
    return { status: 'DISPONIBLE', color: 'success.main' };
  };

  const propertyStatus = getPropertyStatus(selectedPropiedad);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Título del paso */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <HomeIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Propiedad e Inquilinos
        </Typography>
      </Box>

      {/* Selección de Propiedad */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Propiedad
        </Typography>
        
        <Autocomplete
          options={relatedData.propiedades || []}
          value={selectedPropiedad}
          onChange={(_, newValue) => handlePropiedadChange(newValue)}
          getOptionLabel={(option) => 
            `${option.alias || 'Sin alias'} - ${option.direccion || 'Sin dirección'}`
          }
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Buscar propiedad"
              error={!!errors.propiedad}
              helperText={errors.propiedad}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <HomeIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          )}
          renderOption={(props, option) => {
            const Icon = getPropertyIcon(option.tipo);
            const status = getPropertyStatus(option);
            
            return (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Icon sx={{ color: 'text.secondary' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.alias || 'Sin alias'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.direccion} - {option.ciudad}
                    </Typography>
                  </Box>
                  {status && (
                    <Chip
                      label={status.status}
                      size="small"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 20,
                        borderRadius: 0,
                        color: status.color
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          }}
        />

        {/* Información de la propiedad seleccionada */}
        {selectedPropiedad && (
          <PropertyCard selected={true} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {React.createElement(getPropertyIcon(selectedPropiedad.tipo))}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {selectedPropiedad.alias || 'Sin alias'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  {selectedPropiedad.direccion}, {selectedPropiedad.ciudad}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Tipo: {selectedPropiedad.tipo}
                  </Typography>
                  {selectedPropiedad.metrosCuadrados && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedPropiedad.metrosCuadrados}m²
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {propertyStatus && (
                    <Chip
                      label={propertyStatus.status}
                      size="small"
                      sx={{ 
                        fontSize: '0.75rem',
                        borderRadius: 0,
                        color: propertyStatus.color
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </PropertyCard>
        )}
      </Box>

      {/* Switch por habitación */}
      {selectedPropiedad?.habitaciones && selectedPropiedad.habitaciones.length > 0 && (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.esPorHabitacion}
                onChange={(e) => handlePorHabitacionChange(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RoomIcon sx={{ fontSize: '1.1rem' }} />
                <Typography>Alquiler por habitación específica</Typography>
              </Box>
            }
          />
          
          {formData.esPorHabitacion && (
            <Alert severity="info" sx={{ mt: 1, borderRadius: 0 }}>
              Esta propiedad tiene {selectedPropiedad.habitaciones.length} habitación(es) disponibles
            </Alert>
          )}
        </Box>
      )}

      {/* Selección de habitación */}
      {formData.esPorHabitacion && selectedPropiedad?.habitaciones && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Habitación
          </Typography>
          
          <Autocomplete
            options={selectedPropiedad.habitaciones || []}
            value={selectedHabitacion}
            onChange={(_, newValue) => handleHabitacionChange(newValue)}
            getOptionLabel={(option) => 
              `${option.nombre || 'Habitación'} - ${option.metrosCuadrados || 'Sin medidas'}m²`
            }
            renderInput={(params) => (
              <StyledTextField
                {...params}
                label="Seleccionar habitación"
                error={!!errors.habitacion}
                helperText={errors.habitacion}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <RoomIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RoomIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.nombre || 'Habitación'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.metrosCuadrados || 'Sin medidas'}m²
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          />
        </Box>
      )}

      {/* Selección de Inquilinos */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Inquilinos
        </Typography>
        
        <Autocomplete
          multiple
          options={relatedData.inquilinos || []}
          value={selectedInquilinos}
          onChange={(_, newValue) => handleInquilinosChange(newValue)}
          getOptionLabel={(option) => 
            `${option.nombre} ${option.apellido}`
          }
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Buscar inquilinos"
              error={!!errors.inquilino}
              helperText={errors.inquilino || 'Selecciona al menos un inquilino'}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          )}
          renderOption={(props, option) => {
            const status = getInquilinoStatus(option);
            
            return (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {option.nombre?.[0]}{option.apellido?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.nombre} {option.apellido}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.email || 'Sin email'}
                    </Typography>
                  </Box>
                  {status && (
                    <Chip
                      label={status.status}
                      size="small"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 20,
                        borderRadius: 0,
                        color: status.color
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <TenantChip
                key={option._id || option.id}
                label={`${option.nombre} ${option.apellido}`}
                avatar={
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                    {option.nombre?.[0]}{option.apellido?.[0]}
                  </Avatar>
                }
                {...getTagProps({ index })}
              />
            ))
          }
        />
      </Box>

      {/* Resumen del paso */}
      <Box sx={{ 
        p: 2, 
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 0
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <strong>Resumen:</strong> 
          {selectedPropiedad && ` ${selectedPropiedad.alias || 'Propiedad'}`}
          {formData.esPorHabitacion && selectedHabitacion && ` - ${selectedHabitacion.nombre || 'Habitación'}`}
          {selectedInquilinos.length > 0 && ` con ${selectedInquilinos.length} inquilino(s)`}
        </Typography>
      </Box>
    </Box>
  );
};

export default PropertyTenantsStep; 
