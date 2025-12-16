import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  ButtonBase,
  Typography,
  TextField,
  Switch,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Divider,
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
  // Estado base original (desde props) - NO debe cambiar hasta que se guarde
  const [originalConfig, setOriginalConfig] = useState({
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    activo: config?.activo !== false,
    periodo: config?.periodo || 'CADA_DIA'
  });

  // Estado actual con cambios acumulativos - se va modificando con cada cambio
  const [configState, setConfigState] = useState({
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    activo: config?.activo !== false,
    periodo: config?.periodo || 'CADA_DIA'
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] = useState(null);
  
  // Usar useRef para evitar comparaciones innecesarias
  const configRef = useRef(config);
  const hasChangesRef = useRef(hasChanges);

  // Sincronizar configuración original cuando cambien las props (solo si no hay cambios pendientes)
  useEffect(() => {
    const newOriginalConfig = {
      tipo: (config?.tipo || 'DIARIO').toUpperCase(),
      frecuencia: normalizeFrecuencia(config?.frecuencia),
      activo: config?.activo !== false,
      periodo: config?.periodo || 'CADA_DIA'
    };

    // Solo actualizar si realmente cambió la configuración original Y no hay cambios pendientes
    if (JSON.stringify(newOriginalConfig) !== JSON.stringify(originalConfig) && !hasChanges) {
      console.log('[InlineItemConfigImproved] Configuración original actualizada (sin cambios pendientes):', newOriginalConfig);
      setOriginalConfig(newOriginalConfig);
      setConfigState(newOriginalConfig);
      setLastSavedConfig(JSON.stringify(newOriginalConfig));
    }
  }, [config, hasChanges]);

  // Actualizar refs cuando cambien los estados
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Función para detectar cambios acumulativos comparando con la configuración original
  const detectChanges = useCallback((newConfig) => {
    let hasAnyChanges = false;

    Object.keys(newConfig).forEach(key => {
      if (newConfig[key] !== originalConfig[key]) {
        hasAnyChanges = true;
      }
    });

    setHasChanges(hasAnyChanges);
  }, [originalConfig]);

  const cadenciaLabel = useMemo(() => getFrecuenciaLabel(configState), [configState]);

  const actionTabSx = useMemo(() => ({
    cursor: 'pointer',
    px: 0.8,
    py: 0.4,
    fontWeight: 700,
    fontSize: '0.78em',
    color: '#fff',
    background: 'rgba(255,255,255,0.06)',
    borderLeft: '3px solid rgba(25, 118, 210, 0.6)',
    borderRadius: 0,
    transition: 'background 0.2s, color 0.2s',
    '&:hover': {
      background: 'rgba(255,255,255,0.12)',
      color: '#fff'
    },
    '&.Mui-disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }), []);

  const actionPrimaryTabSx = useMemo(() => ({
    ...actionTabSx,
    background: 'rgba(25, 118, 210, 0.18)',
    borderLeft: '3px solid #1976d2',
    '&:hover': {
      background: 'rgba(25, 118, 210, 0.28)'
    }
  }), [actionTabSx]);

  const handleConfigChange = (newConfig) => {
    console.log('[InlineItemConfigImproved] Aplicando cambio:', newConfig);
    
    // Aplicar cambios al estado actual (ACUMULATIVO)
    const updatedConfig = { ...configState, ...newConfig };

    // Mantener coherencia tipo <-> periodo:
    // - Para DIARIO/SEMANAL/MENSUAL el periodo queda fijo
    // - Para PERSONALIZADO el usuario elige periodo
    if (Object.prototype.hasOwnProperty.call(newConfig, 'tipo')) {
      const tipo = String(newConfig.tipo || 'DIARIO').toUpperCase();
      if (tipo === 'DIARIO') updatedConfig.periodo = 'CADA_DIA';
      if (tipo === 'SEMANAL') updatedConfig.periodo = 'CADA_SEMANA';
      if (tipo === 'MENSUAL') updatedConfig.periodo = 'CADA_MES';
      if (tipo === 'PERSONALIZADO') {
        updatedConfig.periodo = updatedConfig.periodo || 'CADA_DIA';
      }
    }
    setConfigState(updatedConfig);
    
    // Detectar todos los cambios acumulativos comparando con la configuración original
    detectChanges(updatedConfig);
  };

  const handleSave = async (scope = 'today') => {
    if (typeof onConfigChange === 'function') {
      setIsSaving(true);
      try {
        console.log('[InlineItemConfigImproved] Guardando configuración completa:', configState);
        
        await onConfigChange(configState, { scope, sectionId, itemId });
        
        // Marcar como guardado exitosamente
        setHasChanges(false);
        setLastSavedConfig(JSON.stringify(configState));
        
        // IMPORTANTE: Actualizar la configuración original para futuras comparaciones
        setOriginalConfig(configState);
        
        console.log('[InlineItemConfigImproved] Configuración guardada exitosamente');
        
        // Mostrar feedback visual temporal
        setTimeout(() => {
          setIsSaving(false);
        }, 1000);
      } catch (error) {
        console.error('Error al guardar configuración:', error);
        setIsSaving(false);
        // Mantener hasChanges como true para que el usuario pueda reintentar
      }
    }
  };

  const handleCancel = () => {
    console.log('[InlineItemConfigImproved] Cancelando cambios, restaurando configuración original');
    setConfigState(originalConfig);
    setHasChanges(false);
    setLastSavedConfig(JSON.stringify(originalConfig));
  };

  // Nota UX: se eliminó “Por defecto” para dejar solo Deshacer + Guardar

  // Función para verificar si hay cambios reales (comparando con original)
  const hasRealChanges = useMemo(() => {
    return Object.keys(configState).some(key => configState[key] !== originalConfig[key]);
  }, [configState, originalConfig]);

  // Sincronizar hasChanges con los cambios reales
  useEffect(() => {
    if (hasChanges !== hasRealChanges) {
      setHasChanges(hasRealChanges);
    }
  }, [hasChanges, hasRealChanges]);

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
              <TextField
                select
                size="small"
                value={configState.periodo}
                onChange={(e) => handleConfigChange({ periodo: e.target.value })}
                SelectProps={{ native: true }}
                sx={{
                  minWidth: 140,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    height: 32
                  },
                  '& select': { color: '#fff' }
                }}
              >
                {periodoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            )}
          </Box>

          {/* Acciones mínimas dentro del recuadro (debajo de la frecuencia) */}
          {hasChanges && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 0.6 }}>
              <ButtonBase
                onClick={handleCancel}
                disabled={isSaving}
                sx={actionTabSx}
              >
                Deshacer
              </ButtonBase>
              <ButtonBase
                onClick={() => handleSave('today')}
                disabled={isSaving}
                sx={actionPrimaryTabSx}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </ButtonBase>
            </Box>
          )}

          {/* Indicador de éxito cuando se guarda (compacto, dentro del recuadro) */}
          {!hasChanges && isSaving && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#4caf50',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <CheckIcon sx={{ fontSize: '1rem' }} />
                Configuración guardada
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ConfigContainer>
  );
};

export default InlineItemConfigImproved; 
