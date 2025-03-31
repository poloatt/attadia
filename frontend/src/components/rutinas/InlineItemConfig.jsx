import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Divider,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Radio,
  Button,
  Switch,
  Collapse,
  CircularProgress,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RepeatIcon from '@mui/icons-material/Repeat';
import SettingsIcon from '@mui/icons-material/Settings';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import TuneIcon from '@mui/icons-material/Tune';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logSaveOperation } from './DEBUG.js';

// Función para normalizar la frecuencia a un número entero
const normalizeFrecuencia = (value) => {
  const stringValue = String(value || '1');
  const parsed = parseInt(stringValue, 10);
  return Number(isNaN(parsed) ? 1 : Math.max(1, parsed));
};

// Días de la semana para posible expansión futura
const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

// Función para obtener etiqueta descriptiva de la frecuencia
const getFrecuenciaLabel = (config) => {
  if (!config?.activo) return 'Inactivo';
  
  const frecuencia = normalizeFrecuencia(config.frecuencia || 1);
  const plural = frecuencia > 1 ? 'veces' : 'vez';
  
  const tipo = (config?.tipo || 'DIARIO').toUpperCase();
  const periodo = config?.periodo || 'CADA_DIA';
  
  switch (tipo) {
    case 'DIARIO':
      return `${frecuencia} ${plural} por día`;
    case 'SEMANAL':
      // Si hay días específicos de la semana seleccionados, mostrarlos
      if (config.diasSemana && config.diasSemana.length > 0) {
        const diasNames = config.diasSemana
          .map(dia => DIAS_SEMANA.find(d => d.value === dia)?.label.slice(0, 3))
          .filter(Boolean)
          .join(', ');
        return `${frecuencia} ${plural}/sem (${diasNames})`;
      }
      return `${frecuencia} ${plural} por semana`;
    case 'MENSUAL':
      // Si hay días específicos del mes seleccionados, mostrarlos
      if (config.diasMes && config.diasMes.length > 0) {
        if (config.diasMes.length <= 3) {
          return `${frecuencia} ${plural}/mes (días ${config.diasMes.join(', ')})`;
        } else {
          return `${frecuencia} ${plural}/mes (${config.diasMes.length} días)`;
        }
      }
      return `${frecuencia} ${plural} por mes`;
    case 'TRIMESTRAL':
      return `${frecuencia} ${plural} por trimestre`;
    case 'SEMESTRAL':
      return `${frecuencia} ${plural} por semestre`;
    case 'ANUAL':
      return `${frecuencia} ${plural} por año`;
    case 'PERSONALIZADO':
      if (periodo === 'CADA_DIA') {
        return `Cada ${frecuencia} días`;
      } else if (periodo === 'CADA_SEMANA') {
        return `Cada ${frecuencia} semanas`;
      } else if (periodo === 'CADA_MES') {
        return `Cada ${frecuencia} meses`;
      } else if (periodo === 'CADA_TRIMESTRE') {
        return `Cada ${frecuencia} trimestres`;
      } else if (periodo === 'CADA_SEMESTRE') {
        return `Cada ${frecuencia} semestres`;
      } else if (periodo === 'CADA_ANO') {
        return `Cada ${frecuencia} años`;
      }
      return `Personalizado: ${frecuencia} ${periodo.toLowerCase()}`;
    default:
      return `${frecuencia} ${plural} por día`;
  }
};

const InlineItemConfig = ({
  config = {
    tipo: 'DIARIO',
    diasSemana: [],
    diasMes: [],
    frecuencia: 1,
    activo: true,
    periodo: 'CADA_DIA'
  },
  onConfigChange,
  ultimaCompletacion,
  isCompleted,
  tooltip
}) => {
  // Asegurar que la configuración inicial tenga valores normalizados
  const normalizedConfig = {
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    diasSemana: config?.diasSemana || [],
    diasMes: config?.diasMes || [],
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    activo: config?.activo !== false,
    periodo: config?.periodo || 'CADA_DIA'
  };

  // Estados del componente
  const [configState, setConfigState] = useState(normalizedConfig);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(
    configState.tipo === 'PERSONALIZADO' ? 2 : 1
  );
  const [savingChanges, setSavingChanges] = useState(false);

  // Mostrar la cadencia actual en formato legible
  const cadenciaActual = useMemo(() => {
    return getFrecuenciaLabel(configState);
  }, [configState]);

  // Sincronizar cuando cambien las props
  useEffect(() => {
    const normalizedPropConfig = {
      tipo: (config?.tipo || 'DIARIO').toUpperCase(),
      diasSemana: config?.diasSemana || [],
      diasMes: config?.diasMes || [],
      frecuencia: normalizeFrecuencia(config?.frecuencia),
      activo: config?.activo !== false,
      periodo: config?.periodo || 'CADA_DIA'
    };

    setConfigState(normalizedPropConfig);
    setOpcionSeleccionada(normalizedPropConfig.tipo === 'PERSONALIZADO' ? 2 : 1);
  }, [config]);

  // Manejadores de cambios
  const handleFrecuenciaChange = (newValue) => {
    setConfigState(prev => ({
      ...prev,
      frecuencia: newValue
    }));
  };

  const handleTipoChange = (event) => {
    const newTipo = event.target.value || 'DIARIO';
    
    console.log(`[InlineItemConfig] 📝 Cambiando tipo a ${newTipo}`);
    
    let newPeriodo = configState.periodo;
    
    // Solo cambiar el periodo si es necesario para mantener coherencia
    if (newTipo === 'DIARIO' && configState.periodo !== 'CADA_DIA') {
      newPeriodo = 'CADA_DIA';
      console.log(`[InlineItemConfig] ℹ️ Ajustando periodo a CADA_DIA para tipo DIARIO`);
    } else if (newTipo === 'SEMANAL' && configState.periodo !== 'CADA_SEMANA') {
      newPeriodo = 'CADA_SEMANA';
      console.log(`[InlineItemConfig] ℹ️ Ajustando periodo a CADA_SEMANA para tipo SEMANAL`);
    } else if (newTipo === 'MENSUAL' && configState.periodo !== 'CADA_MES') {
      newPeriodo = 'CADA_MES';
      console.log(`[InlineItemConfig] ℹ️ Ajustando periodo a CADA_MES para tipo MENSUAL`);
    } else {
      console.log(`[InlineItemConfig] ℹ️ Manteniendo periodo actual: ${configState.periodo}`);
    }
    
    // Actualizar el estado con los nuevos valores
    setConfigState(prev => ({
      ...prev,
      tipo: newTipo,
      periodo: newPeriodo
    }));
  };

  const handlePeriodoChange = (event) => {
    const newPeriodo = event.target.value;
    console.log(`[InlineItemConfig] 📝 Cambiando periodo a ${newPeriodo}`);
    setConfigState(prev => ({
      ...prev,
      periodo: newPeriodo
    }));
  };

  const handleSave = () => {
    try {
      setSavingChanges(true);
      console.log(`[InlineItemConfig] 💾 Guardando configuración:`, configState);
      
      if (typeof onConfigChange === 'function') {
        // Crear copia para evitar referencias
        const configToSave = { ...configState };
        console.log(`[InlineItemConfig] 📤 Enviando configuración final:`, configToSave);
        
        // Añadir un timestamp para forzar actualización de la UI
        configToSave._lastUpdated = new Date().getTime();
        
        // Actualizar la UI y notificar al componente padre
        onConfigChange(configToSave);
        console.log(`[InlineItemConfig] ✅ Configuración guardada y UI actualizada`);
        
        // Forzar re-renderizado con un retraso para permitir que el estado se actualice
        setTimeout(() => {
          // Este setState fuerza el re-renderizado del componente
          setConfigState(prevState => ({...prevState, _refreshUI: new Date().getTime()}));
        }, 50);
      } else {
        console.warn('[InlineItemConfig] ⚠️ onConfigChange no es una función, no se pudo guardar');
      }
    } catch (error) {
      console.error('[InlineItemConfig] ❌ Error al guardar configuración:', error);
    } finally {
      setSavingChanges(false);
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: '#181818', p: 1.5 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography 
          variant="subtitle2"
          sx={{ 
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 500,
            fontSize: '0.8rem',
            letterSpacing: '0.05em'
          }}
        >
          Estado
        </Typography>
        <Switch 
          checked={configState.activo} 
          onChange={(e) => setConfigState(prev => ({ ...prev, activo: e.target.checked }))}
          size="small"
          sx={{
            '& .MuiSwitch-thumb': {
              borderRadius: 0
            },
            '& .MuiSwitch-track': {
              borderRadius: 0
            },
            '& .Mui-checked': {
              color: 'rgb(70, 70, 70) !important',
            },
            '& .Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'rgb(90, 90, 90) !important',
            }
          }}
        />
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 400, 
            color: configState.activo ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem'
          }}
        >
          {configState.activo ? "Activo" : "Inactivo"}
        </Typography>
      </Box>

      {configState.activo && (
        <>
          <Box sx={{ mb: 2.5 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                display: 'block', 
                mb: 0.8, 
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Tipo de Repetición
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 1 
              }}>
                <Button
                  variant={configState.tipo === 'DIARIO' ? 'contained' : 'text'}
                  size="small"
                  onClick={() => handleTipoChange({ target: { value: 'DIARIO' } })}
                  startIcon={<RepeatIcon sx={{ fontSize: '1rem' }} />}
                  sx={{ 
                    textTransform: 'none',
                    height: 36,
                    backgroundColor: configState.tipo === 'DIARIO' ? 'rgba(60, 60, 60, 0.9)' : 'transparent',
                    border: 'none',
                    color: configState.tipo === 'DIARIO' ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: configState.tipo === 'DIARIO' ? 'rgba(80, 80, 80, 0.9)' : 'rgba(60, 60, 60, 0.3)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Diario
                </Button>
                <Button
                  variant={configState.tipo === 'SEMANAL' ? 'contained' : 'text'}
                  size="small"
                  onClick={() => handleTipoChange({ target: { value: 'SEMANAL' } })}
                  startIcon={<DateRangeIcon sx={{ fontSize: '1rem' }} />}
                  sx={{ 
                    textTransform: 'none',
                    height: 36,
                    backgroundColor: configState.tipo === 'SEMANAL' ? 'rgba(60, 60, 60, 0.9)' : 'transparent',
                    border: 'none',
                    color: configState.tipo === 'SEMANAL' ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: configState.tipo === 'SEMANAL' ? 'rgba(80, 80, 80, 0.9)' : 'rgba(60, 60, 60, 0.3)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Semanal
                </Button>
              </Box>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 1 
              }}>
                <Button
                  variant={configState.tipo === 'MENSUAL' ? 'contained' : 'text'}
                  size="small"
                  onClick={() => handleTipoChange({ target: { value: 'MENSUAL' } })}
                  startIcon={<EventIcon sx={{ fontSize: '1rem' }} />}
                  sx={{ 
                    textTransform: 'none',
                    height: 36,
                    backgroundColor: configState.tipo === 'MENSUAL' ? 'rgba(60, 60, 60, 0.9)' : 'transparent',
                    border: 'none',
                    color: configState.tipo === 'MENSUAL' ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: configState.tipo === 'MENSUAL' ? 'rgba(80, 80, 80, 0.9)' : 'rgba(60, 60, 60, 0.3)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Mensual
                </Button>
                <Button
                  variant={configState.tipo === 'PERSONALIZADO' ? 'contained' : 'text'}
                  size="small"
                  onClick={() => handleTipoChange({ target: { value: 'PERSONALIZADO' } })}
                  startIcon={<TuneIcon sx={{ fontSize: '1rem' }} />}
                  sx={{ 
                    textTransform: 'none',
                    height: 36,
                    backgroundColor: configState.tipo === 'PERSONALIZADO' ? 'rgba(60, 60, 60, 0.9)' : 'transparent',
                    border: 'none',
                    color: configState.tipo === 'PERSONALIZADO' ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: configState.tipo === 'PERSONALIZADO' ? 'rgba(80, 80, 80, 0.9)' : 'rgba(60, 60, 60, 0.3)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Personalizado
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Opciones adicionales según el tipo */}
          {configState.tipo === 'PERSONALIZADO' && (
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  display: 'block', 
                  mb: 0.8, 
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Frecuencia
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                p: 1,
                bgcolor: 'rgba(255,255,255,0.03)'
              }}>
                <Typography variant="body2" sx={{ minWidth: 60, color: 'rgba(255,255,255,0.7)' }}>
                  Cada
                </Typography>
                <TextField
                  value={configState.frecuencia}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      handleFrecuenciaChange(value);
                    }
                  }}
                  type="number"
                  size="small"
                  inputProps={{ 
                    min: 1, 
                    max: configState.tipo === 'SEMANAL' ? 7 : 31,
                    style: { 
                      textAlign: 'center',
                      color: '#fff'
                    } 
                  }}
                  sx={{ 
                    width: 60,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(60, 60, 60, 0.3)',
                        boxShadow: 'none',
                        borderColor: 'rgba(150, 150, 150, 0.5)'
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: '#fff'
                    }
                  }}
                />
                <FormControl 
                  size="small" 
                  sx={{ 
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: '#fff'
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255,255,255,0.5)'
                    },
                    '& .MuiInputBase-input': {
                      color: '#fff'
                    }
                  }}
                >
                  <Select
                    value={configState.periodo}
                    onChange={handlePeriodoChange}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#222',
                          color: '#fff',
                          borderRadius: 0
                        }
                      }
                    }}
                  >
                    <MenuItem value="CADA_DIA">día(s)</MenuItem>
                    <MenuItem value="CADA_SEMANA">semana(s)</MenuItem>
                    <MenuItem value="CADA_MES">mes(es)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {/* Configuración de frecuencia para tipo SEMANAL o MENSUAL */}
          {(configState.tipo === 'SEMANAL' || configState.tipo === 'MENSUAL') && (
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  display: 'block', 
                  mb: 0.8, 
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Frecuencia
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                p: 1,
                bgcolor: 'rgba(255,255,255,0.03)'
              }}>
                <TextField
                  value={configState.frecuencia}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      handleFrecuenciaChange(value);
                    }
                  }}
                  type="number"
                  size="small"
                  inputProps={{ 
                    min: 1, 
                    max: configState.tipo === 'SEMANAL' ? 7 : 31,
                    style: { 
                      textAlign: 'center',
                      color: '#fff'
                    } 
                  }}
                  sx={{ 
                    width: 60,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(60, 60, 60, 0.3)',
                        boxShadow: 'none',
                        borderColor: 'rgba(150, 150, 150, 0.5)'
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: '#fff'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ flexGrow: 1, color: 'rgba(255,255,255,0.7)' }}>
                  {configState.tipo === 'SEMANAL' 
                    ? `veces por semana` 
                    : `veces por mes`}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              color="inherit"
              onClick={handleSave}
              startIcon={<SaveIcon />}
              disabled={savingChanges}
              sx={{ 
                borderRadius: 2,
                boxShadow: 'none',
                height: 36,
                px: 2,
                backgroundColor: 'rgba(50, 50, 50, 0.9)',
                color: '#fff',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(70, 70, 70, 0.9)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }
              }}
            >
              Guardar
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default InlineItemConfig; 