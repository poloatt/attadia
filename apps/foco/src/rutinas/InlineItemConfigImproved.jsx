import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Divider,
  Chip,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';
import { styled, alpha } from '@mui/material/styles';
import './InlineItemConfigImproved.css';
import { CancelarTabButton, GuardarTabButton } from '@shared/components/common/SystemButtons';
import { getTimeOfDayLabels, normalizeTimeOfDay, VALID_TIME_OF_DAY } from '@shared/utils/timeOfDayUtils';

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
  background: alpha(theme.palette.background.paper, 0.78),
  boxShadow: 'none',
  transition: 'border-color 0.2s',
}));

// Función para obtener etiqueta descriptiva
export const getFrecuenciaLabel = (config) => {
  if (!config?.activo) return 'Inactivo';
  
  const frecuencia = normalizeFrecuencia(config.frecuencia || 1);
  const tipo = (config?.tipo || 'DIARIO').toUpperCase();
  
  let label = '';
  switch (tipo) {
    case 'DIARIO':
      label = frecuencia === 1 ? 'Diario' : `${frecuencia}x/día`;
      break;
    case 'SEMANAL':
      label = frecuencia === 1 ? 'Semanal' : `${frecuencia}x/sem`;
      break;
    case 'MENSUAL':
      label = frecuencia === 1 ? 'Mensual' : `${frecuencia}x/mes`;
      break;
    case 'PERSONALIZADO':
      const periodo = config?.periodo || 'CADA_DIA';
      if (periodo === 'CADA_DIA') label = `Cada ${frecuencia}d`;
      else if (periodo === 'CADA_SEMANA') label = `Cada ${frecuencia}s`;
      else if (periodo === 'CADA_MES') label = `Cada ${frecuencia}m`;
      else label = 'Personalizado';
      break;
    default:
      label = 'Diario';
  }
  
  // Agregar horarios si están configurados
  const horariosLabel = getTimeOfDayLabels(config?.horarios);
  if (horariosLabel) {
    return `${label} • ${horariosLabel}`;
  }
  
  return label;
};

const InlineItemConfigImproved = ({
  config = {
    tipo: 'DIARIO',
    frecuencia: 1,
    activo: true,
    periodo: 'CADA_DIA',
    horarios: []
  },
  onConfigChange,
  itemId,
  sectionId,
  hideActions = false // Prop para ocultar botones cuando está embebido en un formulario
}) => {
  // Estado base original (desde props) - NO debe cambiar hasta que se guarde
  const [originalConfig, setOriginalConfig] = useState({
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    activo: config?.activo !== false,
    periodo: config?.periodo || 'CADA_DIA',
    horarios: normalizeTimeOfDay(config?.horarios)
  });

  // Estado actual con cambios acumulativos - se va modificando con cada cambio
  const [configState, setConfigState] = useState({
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    activo: config?.activo !== false,
    periodo: config?.periodo || 'CADA_DIA',
    horarios: normalizeTimeOfDay(config?.horarios)
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
      periodo: config?.periodo || 'CADA_DIA',
      horarios: normalizeTimeOfDay(config?.horarios)
    };

    // Solo actualizar si realmente cambió la configuración original Y no hay cambios pendientes
    if (JSON.stringify(newOriginalConfig) !== JSON.stringify(originalConfig) && !hasChanges) {
      console.log('[InlineItemConfigImproved] Configuración original actualizada (sin cambios pendientes):', newOriginalConfig);
      setOriginalConfig(newOriginalConfig);
      setConfigState(newOriginalConfig);
      setLastSavedConfig(JSON.stringify(newOriginalConfig));
    }
  }, [config, hasChanges, originalConfig]);

  // Actualizar refs cuando cambien los estados
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Función para detectar cambios acumulativos comparando con la configuración original
  const detectChanges = useCallback((newConfig) => {
    // Usar la misma lógica que hasRealChanges para comparación consistente
    const horariosChanged = JSON.stringify(newConfig.horarios || []) !== JSON.stringify(originalConfig.horarios || []);
    const otherKeysChanged = Object.keys(newConfig).some(key => {
      if (key === 'horarios') return false; // Ya se comparó arriba
      return newConfig[key] !== originalConfig[key];
    });
    const hasAnyChanges = horariosChanged || otherKeysChanged;
    
    setHasChanges(hasAnyChanges);
  }, [originalConfig]);

  const cadenciaLabel = useMemo(() => getFrecuenciaLabel(configState), [configState]);

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

    // Ajustar horarios si cambia la frecuencia: si hay más horarios que la nueva frecuencia, recortar
    if (Object.prototype.hasOwnProperty.call(newConfig, 'frecuencia')) {
      const newFrecuencia = Number(newConfig.frecuencia || 1);
      const currentHorarios = updatedConfig.horarios || [];
      if (currentHorarios.length > newFrecuencia) {
        updatedConfig.horarios = currentHorarios.slice(0, newFrecuencia);
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
    // Comparación especial para arrays (horarios)
    const horariosChanged = JSON.stringify(configState.horarios || []) !== JSON.stringify(originalConfig.horarios || []);
    const otherKeysChanged = Object.keys(configState).some(key => {
      if (key === 'horarios') return false; // Ya se comparó arriba
      return configState[key] !== originalConfig[key];
    });
    return horariosChanged || otherKeysChanged;
  }, [configState, originalConfig]);

  // Calcular máximo de horarios permitidos según frecuencia
  const maxHorarios = useMemo(() => {
    return configState.frecuencia || 1;
  }, [configState.frecuencia]);

  // Handler para toggle de horarios con validación de frecuencia
  const handleHorarioToggle = (horario) => {
    const currentHorarios = configState.horarios || [];
    const isSelected = currentHorarios.includes(horario);
    
    if (isSelected) {
      // Deseleccionar: siempre permitido
      const newHorarios = currentHorarios.filter(h => h !== horario);
      handleConfigChange({ horarios: newHorarios });
    } else {
      // Seleccionar: solo si no se ha alcanzado el máximo
      if (currentHorarios.length < maxHorarios) {
        const newHorarios = [...currentHorarios, horario].sort();
        handleConfigChange({ horarios: newHorarios });
      }
      // Si ya se alcanzó el máximo, no hacer nada (el checkbox estará deshabilitado)
    }
  };

  // Sincronizar hasChanges con los cambios reales
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InlineItemConfigImproved.jsx:301',message:'sync hasChanges useEffect',data:{hasChanges,hasRealChanges,areEqual:hasChanges===hasRealChanges},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (hasChanges !== hasRealChanges) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InlineItemConfigImproved.jsx:303',message:'syncing hasChanges',data:{oldHasChanges:hasChanges,newHasChanges:hasRealChanges},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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

          {/* Selector de horarios */}
          <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {VALID_TIME_OF_DAY.map((horario) => {
                const currentHorarios = configState.horarios || [];
                const isChecked = currentHorarios.includes(horario);
                const isDisabled = !isChecked && currentHorarios.length >= maxHorarios;
                const label = horario === 'MAÑANA' ? 'Mañana' : horario === 'TARDE' ? 'Tarde' : 'Noche';
                return (
                  <Chip
                    key={horario}
                    label={label}
                    onClick={() => !isDisabled && handleHorarioToggle(horario)}
                    disabled={isDisabled}
                    size="small"
                    sx={{
                      backgroundColor: isChecked 
                        ? 'rgba(25, 118, 210, 0.2)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isDisabled 
                        ? 'rgba(255,255,255,0.2)' 
                        : isChecked 
                          ? '#1976d2' 
                          : 'rgba(255,255,255,0.7)',
                      border: isChecked 
                        ? '1px solid rgba(25, 118, 210, 0.5)' 
                        : '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.7rem',
                      height: '24px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      '&:hover': {
                        backgroundColor: isDisabled 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : isChecked 
                            ? 'rgba(25, 118, 210, 0.3)' 
                            : 'rgba(255, 255, 255, 0.12)',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.4
                      }
                    }}
                  />
                );
              })}
            </Box>
            {configState.horarios && configState.horarios.length === maxHorarios && maxHorarios > 1 && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.65rem',
                  mt: 0.1,
                  textAlign: 'center'
                }}
              >
                Máximo alcanzado ({maxHorarios} horarios)
              </Typography>
            )}
          </Box>

          {/* Footer reservado: evita que el contenido "salte" cuando aparecen botones / feedback */}
          {!hideActions && (
            <Box
              sx={{
                mt: 0.6,
                minHeight: 28, // reservar espacio para botones / feedback (sin mover el panel)
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {/* Acciones mínimas dentro del recuadro (debajo de la frecuencia) */}
              {hasChanges ? (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <CancelarTabButton
                    onClick={handleCancel}
                    disabled={isSaving}
                    sx={{ px: 0.8, py: 0.4, fontSize: '0.78em' }}
                  />
                  <GuardarTabButton
                    onClick={() => handleSave('today')}
                    disabled={isSaving}
                    loading={isSaving}
                    sx={{ px: 0.8, py: 0.4, fontSize: '0.78em' }}
                  />
                </Box>
              ) : isSaving ? (
                /* Indicador de éxito cuando se guarda (compacto, dentro del recuadro) */
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
              ) : null}
            </Box>
          )}
        </Box>
      </Box>
    </ConfigContainer>
  );
};

export default InlineItemConfigImproved; 
