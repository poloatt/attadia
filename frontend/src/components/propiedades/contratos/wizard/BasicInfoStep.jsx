import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Grid,
  Alert,
  InputAdornment
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Description as ContractIcon,
  CalendarToday as CalendarIcon,
  Engineering as MaintenanceIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { EntityDateSelect } from '../../../EntityViews';

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

const TypeChip = styled(Chip)(({ theme, selected }) => ({
  borderRadius: 0,
  height: 48,
  fontSize: '0.875rem',
  fontWeight: selected ? 600 : 400,
  backgroundColor: selected 
    ? alpha(theme.palette.primary.main, 0.1) 
    : 'transparent',
  color: selected 
    ? theme.palette.primary.main 
    : theme.palette.text.secondary,
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

const BasicInfoStep = ({
  formData,
  onFormDataChange,
  onErrorsChange,
  onStepComplete,
  errors,
  theme
}) => {
  const contractTypes = [
    {
      value: 'ALQUILER',
      label: 'Alquiler',
      description: 'Contrato de alquiler residencial',
      icon: <ContractIcon />
    },
    {
      value: 'MANTENIMIENTO',
      label: 'Mantenimiento',
      description: 'Contrato de servicios de mantenimiento',
      icon: <MaintenanceIcon />
    }
  ];

  const validateStep = () => {
    const newErrors = {};
    
    // Validar tipo de contrato
    if (!formData.tipoContrato) {
      newErrors.tipoContrato = 'Selecciona un tipo de contrato';
    }
    
    // Validar fechas
    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida';
    }
    
    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es requerida';
    }
    
    // Validar que fecha fin sea posterior a fecha inicio
    if (formData.fechaInicio && formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);
      
      if (fin <= inicio) {
        newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      
    }
    
    // Validar observaciones (opcional pero con límite)
    if (formData.observaciones && formData.observaciones.length > 500) {
      newErrors.observaciones = 'Las observaciones no pueden exceder 500 caracteres';
    }
    
    onErrorsChange(newErrors);
    
    // El paso es válido si no hay errores
    const isValid = Object.keys(newErrors).length === 0;
    onStepComplete(0, isValid);
  };

  useEffect(() => {
    validateStep();
  }, [formData.tipoContrato, formData.fechaInicio, formData.fechaFin, formData.observaciones]);

  const handleTypeChange = (tipo) => {
    onFormDataChange({ tipoContrato: tipo });
  };

  const calculateDuration = () => {
    if (!formData.fechaInicio || !formData.fechaFin) return null;
    
    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);
    const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                 (fin.getMonth() - inicio.getMonth()) + 1;
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    if (meses > 1) {
      return `${meses} meses`;
    } else {
      return `${dias} días`;
    }
  };

  const duration = calculateDuration();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Título del paso */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <ContractIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Información Básica del Contrato
        </Typography>
      </Box>

      {/* Tipos de contrato */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
          Tipo de Contrato
        </Typography>
        <Grid container spacing={1}>
          {contractTypes.map((type) => (
            <Grid item xs={12} sm={6} key={type.value}>
              <TypeChip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                        {type.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {type.description}
                      </Typography>
                    </Box>
                  </Box>
                }
                selected={formData.tipoContrato === type.value}
                onClick={() => handleTypeChange(type.value)}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
          ))}
        </Grid>
        {errors.tipoContrato && (
          <Alert severity="error" sx={{ mt: 1, borderRadius: 0 }}>
            {errors.tipoContrato}
          </Alert>
        )}
      </Box>

      {/* Fechas */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
          Período del Contrato
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <EntityDateSelect
              label="Fecha de Inicio"
              value={formData.fechaInicio}
              onChange={(date) => onFormDataChange({ fechaInicio: date })}
              error={Boolean(errors.fechaInicio)}
              helperText={errors.fechaInicio || ''}
              minDate={new Date()}
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <EntityDateSelect
              label="Fecha de Fin"
              value={formData.fechaFin}
              onChange={(date) => onFormDataChange({ fechaFin: date })}
              error={Boolean(errors.fechaFin)}
              helperText={errors.fechaFin || ''}
              minDate={formData.fechaInicio || new Date()}
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>
        
        {/* Duración calculada */}
        {duration && (
          <Box sx={{ 
            mt: 2, 
            p: 1.5, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 0
          }}>
            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
              Duración del contrato: {duration}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Observaciones */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
          Observaciones (Opcional)
        </Typography>
        <StyledTextField
          multiline
          rows={3}
          placeholder="Agrega notas o comentarios sobre el contrato..."
          value={formData.observaciones}
          onChange={(e) => onFormDataChange({ observaciones: e.target.value })}
          error={!!errors.observaciones}
          helperText={
            errors.observaciones || 
            `${formData.observaciones?.length || 0}/500 caracteres`
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <InfoIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Resumen del paso */}
      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.5), border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <strong>Resumen:</strong> {formData.tipoContrato === 'MANTENIMIENTO' ? 'Contrato de mantenimiento' : 'Contrato de alquiler'} 
          {duration && ` por ${duration}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default BasicInfoStep; 
