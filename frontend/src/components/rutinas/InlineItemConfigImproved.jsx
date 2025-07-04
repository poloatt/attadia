import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  Switch,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Divider
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import './InlineItemConfigImproved.css';

// Función para normalizar la frecuencia
const normalizeFrecuencia = (value) => {
  const parsed = parseInt(String(value || '1'), 10);
  return Number(isNaN(parsed) ? 1 : Math.max(1, parsed));
};

// Styled components para mejor UX
const StyledChip = styled(Chip)(({ theme, selected }) => ({
  fontSize: '0.75rem',
  height: 24,
  fontWeight: 500,
  borderRadius: 12,
  border: 'none',
  backgroundColor: selected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
  color: selected ? '#fff' : 'rgba(255, 255, 255, 0.6)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: selected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  '&:active': {
    transform: 'translateY(0)',
    transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: 28,
    width: 50,
    fontSize: '0.8rem',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.05)'
    },
    '& fieldset': {
      border: 'none'
    }
  },
  '& .MuiInputBase-input': {
    color: '#fff',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 500,
    padding: '4px 8px'
  }
}));

const ConfigContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  borderRadius: 8,
  padding: 12,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  }
}));

// Función para obtener etiqueta descriptiva
const getFrecuenciaLabel = (config) => {
  if (!config?.activo) return 'Inactivo';
  
  const frecuencia = normalizeFrecuencia(config.frecuencia || 1);
  const tipo = (config?.tipo || 'DIARIO').toUpperCase();
  
  switch (tipo) {
    case 'DIARIO':
      return frecuencia === 1 ? 'Diario' : `${frecuencia}x/día`;
    case 'SEMANAL':
      return frecuencia === 1 ? 'Semanal' : `${frecuencia}x/sem`;
    case 'MENSUAL':
      return frecuencia === 1 ? 'Mensual' : `${frecuencia}x/mes`;
    case 'PERSONALIZADO':
      const periodo = config?.periodo || 'CADA_DIA';
      if (periodo === 'CADA_DIA') return `Cada ${frecuencia}d`;
      if (periodo === 'CADA_SEMANA') return `Cada ${frecuencia}s`;
      if (periodo === 'CADA_MES') return `Cada ${frecuencia}m`;
      return 'Personalizado';
    default:
      return 'Diario';
  }
};

const InlineItemConfigImproved = ({
  config = {
    tipo: 'DIARIO',
    frecuencia: 1,
    activo: true,
    periodo: 'CADA_DIA'
  },
  onConfigChange,
  itemId,
  sectionId
}) => {
  const [configState, setConfigState] = useState({
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    activo: config?.activo !== false,
    periodo: config?.periodo || 'CADA_DIA'
  });

  const [expanded, setExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save con debounce
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        if (typeof onConfigChange === 'function') {
          onConfigChange(configState);
          setHasChanges(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [configState, hasChanges, onConfigChange]);

  // Sincronizar con props
  useEffect(() => {
    const newState = {
      tipo: (config?.tipo || 'DIARIO').toUpperCase(),
      frecuencia: normalizeFrecuencia(config?.frecuencia),
      activo: config?.activo !== false,
      periodo: config?.periodo || 'CADA_DIA'
    };
    setConfigState(newState);
  }, [config]);

  const cadenciaLabel = useMemo(() => getFrecuenciaLabel(configState), [configState]);

  const handleConfigChange = (newConfig) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
    setHasChanges(true);
  };

  const tipoOptions = [
    { value: 'DIARIO', label: 'Diario' },
    { value: 'SEMANAL', label: 'Semanal' },
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'PERSONALIZADO', label: 'Personalizado' }
  ];

  const periodoOptions = [
    { value: 'CADA_DIA', label: 'día(s)' },
    { value: 'CADA_SEMANA', label: 'semana(s)' },
    { value: 'CADA_MES', label: 'mes(es)' }
  ];

  return (
    <ConfigContainer>
      {/* Header con toggle activo/inactivo */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: expanded ? 2 : 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch
            checked={configState.activo}
            onChange={(e) => handleConfigChange({ activo: e.target.checked })}
            size="small"
            sx={{
              width: 36,
              height: 20,
              '& .MuiSwitch-switchBase': {
                margin: 1,
                padding: 0,
                transform: 'translateX(6px)',
                '&.Mui-checked': {
                  color: '#fff',
                  transform: 'translateX(22px)',
                  '& .MuiSwitch-thumb': {
                    backgroundColor: '#fff',
                    width: 12,
                    height: 12,
                  },
                  '& + .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    opacity: 1,
                  }
                }
              },
              '& .MuiSwitch-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                width: 12,
                height: 12,
                boxShadow: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              },
              '& .MuiSwitch-track': {
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                opacity: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }
            }}
          />
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: configState.activo ? '#fff' : 'rgba(255, 255, 255, 0.4)',
              fontWeight: 500,
              fontSize: '0.75rem',
              transition: 'color 0.2s ease'
            }}
          >
            {cadenciaLabel}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasChanges && (
            <Fade in={hasChanges}>
              <Box sx={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                animation: 'pulse 1.5s infinite'
              }} />
            </Fade>
          )}
          
          <Tooltip title={expanded ? "Ocultar configuración" : "Mostrar configuración"}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <TuneIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Configuración expandida */}
      <Collapse in={expanded} timeout={300}>
        <Box sx={{ pt: 1 }}>
          <Divider sx={{ 
            borderColor: 'rgba(255, 255, 255, 0.06)', 
            mb: 2 
          }} />
          
          {/* Tipo de repetición */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1,
                display: 'block'
              }}
            >
              Tipo
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tipoOptions.map(option => (
                <StyledChip
                  key={option.value}
                  label={option.label}
                  selected={configState.tipo === option.value}
                  clickable
                  onClick={() => handleConfigChange({ tipo: option.value })}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Frecuencia */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexWrap: 'wrap' 
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Frecuencia
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StyledTextField
                value={configState.frecuencia}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    handleConfigChange({ frecuencia: value });
                  }
                }}
                type="number"
                inputProps={{ min: 1, max: 99 }}
                size="small"
              />
              
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem'
                }}
              >
                {configState.tipo === 'DIARIO' && 'por día'}
                {configState.tipo === 'SEMANAL' && 'por semana'}
                {configState.tipo === 'MENSUAL' && 'por mes'}
                {configState.tipo === 'PERSONALIZADO' && 'veces cada'}
              </Typography>
            </Box>

            {/* Período personalizado */}
            {configState.tipo === 'PERSONALIZADO' && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {periodoOptions.map(option => (
                  <StyledChip
                    key={option.value}
                    label={option.label}
                    selected={configState.periodo === option.value}
                    clickable
                    onClick={() => handleConfigChange({ periodo: option.value })}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </ConfigContainer>
  );
};

export default InlineItemConfigImproved; 