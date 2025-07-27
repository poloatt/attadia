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
  borderRadius: selected ? 0 : 12,
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
  paddingTop: 0.3,
  paddingBottom: 0.3,
  paddingLeft: 0,
  paddingRight: 0,
  background: theme.palette.background.paper,
  boxShadow: 'none',
  transition: 'border-color 0.2s',
}));

// Función para obtener etiqueta descriptiva
export const getFrecuenciaLabel = (config) => {
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
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 0.3 }} />
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: 22 }}>
        {/* Tabs verticales de tipo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.04, mr: 0.1, minWidth: 22 }}>
          {tipoOptions.map((option, idx) => (
            <React.Fragment key={option.value}>
              <Box
                onClick={() => handleConfigChange({ tipo: option.value })}
                sx={{
                  cursor: 'pointer',
                  px: 0.2,
                  py: 0.08,
                  fontWeight: 600,
                  fontSize: '0.78em',
                  color: configState.tipo === option.value ? '#fff' : 'rgba(255,255,255,0.5)',
                  background: configState.tipo === option.value ? 'rgba(255,255,255,0.08)' : 'none',
                  borderLeft: configState.tipo === option.value ? '3px solid #1976d2' : '3px solid transparent',
                  borderRadius: 0,
                  transition: 'background 0.2s, color 0.2s',
                  textAlign: 'left',
                  minWidth: 22,
                  mb: 0.04,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff'
                  }
                }}
              >
                {option.label}
              </Box>
              {idx < tipoOptions.length - 1 && (
                <Divider orientation="horizontal" flexItem sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
              )}
            </React.Fragment>
          ))}
        </Box>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.3, borderColor: 'rgba(255,255,255,0.08)' }} />
        {/* Panel de configuración de frecuencia */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap', minWidth: 0, justifyContent: 'center', py: 0.12 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.12 }}>
                <IconButton
                  size="small"
                  onClick={() => handleConfigChange({ frecuencia: Math.max(1, configState.frecuencia - 1) })}
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: 0,
                    color: 'rgba(255,255,255,0.7)',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    fontSize: '0.95rem',
                    p: 0,
                    minWidth: 0,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
                  }}
                >
                  -
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#fff',
                    minWidth: 24,
                    textAlign: 'center',
                    mx: 0.5,
                    fontSize: '1.1rem',
                    lineHeight: 1.1
                  }}
                >
                  {configState.frecuencia}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleConfigChange({ frecuencia: Math.max(1, configState.frecuencia + 1) })}
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: 0,
                    color: 'rgba(255,255,255,0.7)',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    fontSize: '0.95rem',
                    p: 0,
                    minWidth: 0,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
                  }}
                >
                  +
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.7rem',
                  mt: 0.12,
                  textAlign: 'center',
                  display: 'block',
                  minWidth: 24
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
              <Box sx={{ display: 'flex', gap: 0.18, mt: 0.12 }}>
                {periodoOptions.map(option => (
                  <StyledChip
                    key={option.value}
                    label={option.label}
                    selected={configState.periodo === option.value}
                    clickable
                    onClick={() => handleConfigChange({ periodo: option.value })}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7em', px: 0.7 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ConfigContainer>
  );
};

export default InlineItemConfigImproved; 
