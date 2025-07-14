import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  Grid,
  DialogTitle,
  Collapse,
  Tabs,
  Tab,
  Switch,
  Radio
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import RepeatIcon from '@mui/icons-material/Repeat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PublicIcon from '@mui/icons-material/Public';
import InfoIcon from '@mui/icons-material/Info';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FrecuenciaControl from './FrecuenciaControl';
import clienteAxios from '../../config/axios';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import TuneIcon from '@mui/icons-material/Tune';
import SyncIcon from '@mui/icons-material/Sync';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';


const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

// Función para normalizar la frecuencia a un número entero
const normalizeFrecuencia = (value) => {
  // Asegurar que value es un valor que podemos parsear a número
  const stringValue = String(value || '1');
  const parsed = parseInt(stringValue, 10);
  return Number(isNaN(parsed) ? 1 : Math.max(1, parsed)); // Devolver explícitamente un Number
};

// Función para obtener etiqueta descriptiva de la frecuencia
const getFrecuenciaLabel = (config) => {
  if (!config?.activo) return 'Inactivo';
  
  const frecuencia = normalizeFrecuencia(config.frecuencia || 1);
  const plural = frecuencia > 1 ? 'veces' : 'vez';
  
  const tipo = (config.tipo || 'DIARIO').toUpperCase();
  const periodo = config.periodo || 'CADA_DIA';
  
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

// Utility function
const defaultConfig = {
  tipo: 'DIARIO',
  frecuencia: 1,
  periodo: 'CADA_DIA',
  diasSemana: [],
  diasMes: [],
  activo: true,
  // Nuevos campos para mejorar la personalización
  esPreferenciaUsuario: true,  // Indica si esta configuración es una preferencia de usuario
  ultimaActualizacion: new Date().toISOString(), // Fecha de última actualización
  diasCompletados: 0, // Contador de días completados para estadísticas
  diasConsecutivos: 0 // Contador de días consecutivos para seguimiento
};

// Función para determinar a qué sección pertenece un ítem por su ID
const getSectionFromId = (itemId) => {
  if (!itemId) return null;
  
  // Mapeo de secciones conocidas y sus ítems
  const sectionMapping = {
    // Body Care
    'bath': 'bodyCare',
    'bodyCream': 'bodyCare',
    'skinCareDay': 'bodyCare',
    'skinCareNight': 'bodyCare',
    
    // Supplements
    'vitamins': 'supplements',
    'protein': 'supplements',
    'creatine': 'supplements',
    
    // Exercise
    'cardio': 'exercise',
    'strength': 'exercise',
    'stretching': 'exercise',
    
    // Self Care
    'meditation': 'selfCare',
    'reading': 'selfCare',
    'journaling': 'selfCare',
    
    // Personal Growth
    'learning': 'personalGrowth',
    'hobby': 'personalGrowth',
    'socializing': 'personalGrowth'
  };
  
  return sectionMapping[itemId] || null;
};

// Componente para selección de días
const SeleccionDias = ({ dias = [], onChange, disabled = false }) => {
  // Crear una copia del array de días para manipular
  const [selectedDays, setSelectedDays] = useState(dias);

  // Sincronizar con props
  useEffect(() => {
    setSelectedDays(dias);
  }, [dias]);

  const handleDayToggle = (day) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    
    setSelectedDays(newSelectedDays);
    if (onChange) onChange(newSelectedDays);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 0.5,
      opacity: disabled ? 0.7 : 1
    }}>
      {DIAS_SEMANA.map((dia) => (
        <Chip
          key={dia.value}
          label={dia.label.slice(0, 3)}
          size="small"
          clickable={!disabled}
          color={selectedDays.includes(dia.value) ? "primary" : "default"}
          onClick={() => !disabled && handleDayToggle(dia.value)}
          sx={{ 
            height: 26, 
            fontSize: '0.7rem',
            borderRadius: 0.5,
            cursor: disabled ? 'default' : 'pointer'
          }}
        />
      ))}
    </Box>
  );
};

const ItemCadenciaConfig = ({ 
  config = {
    tipo: 'DIARIO',
    diasSemana: [],
    diasMes: [],
    frecuencia: 1,
    activo: true
  }, 
  onConfigChange,
  ultimaCompletacion,
  isCompleted,
  tooltip,
  itemId,
  onExpandConfig,  // Nueva prop para manejar la expansión
  rutinaFecha      // Nueva prop para verificar si es una fecha pasada
}) => {
  const [dialogState, setDialogState] = useState({
    open: false,
    tipo: 'DIARIO',
    frecuencia: 1,
    periodo: 'CADA_DIA',
    diasSemana: [],
    diasMes: [],
    activo: true
  });
  
  // Normalizar la configuración para evitar errores
  const normalizedConfig = useMemo(() => ({
    tipo: (config?.tipo || 'DIARIO').toUpperCase(),
    frecuencia: normalizeFrecuencia(config?.frecuencia),
    periodo: config?.periodo || 'CADA_DIA',
    diasSemana: Array.isArray(config?.diasSemana) ? config.diasSemana : [],
    diasMes: Array.isArray(config?.diasMes) ? config.diasMes : [],
    activo: config?.activo !== false, // Por defecto activo
    _source: config?._source || 'LOCAL' // Origen de la configuración
  }), [config]);
  
  // Determinar si la fecha de la rutina es en el pasado
  const isPastDate = useMemo(() => {
    if (!rutinaFecha) return false;
    
    try {
      const fechaRutina = new Date(rutinaFecha);
      const today = new Date();
      
      // Normalizar ambas fechas a inicio del día para comparación precisa
      fechaRutina.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      return fechaRutina < today;
    } catch (error) {
      console.error('[ItemCadenciaConfig] Error al verificar si la fecha es pasada:', error);
      return false;
    }
  }, [rutinaFecha]);
  
  // Estado para mostrar tooltip de advertencia cuando intentan editar fechas pasadas
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  
  // Referencia para mantener un historial de la última configuración guardada
  const lastSavedConfigRef = useRef(normalizedConfig);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const initialRenderRef = useRef(true);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(dialogState.tipo === 'PERSONALIZADO' ? 2 : 1);
  const [savingChanges, setSavingChanges] = useState(false);

  // Sincronizar estado con props, pero solo si el diálogo está cerrado
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    
    // Siempre normalizar la configuración recibida
    const normalizedPropConfig = {
      tipo: (config?.tipo || 'DIARIO').toUpperCase(),
      diasSemana: config?.diasSemana || [],
      diasMes: config?.diasMes || [],
      frecuencia: normalizeFrecuencia(config?.frecuencia),
      activo: config?.activo !== false,
      periodo: config?.periodo || 'CADA_DIA'
    };
    
    if (!dialogState.open) {
      // Actualizar el estado del diálogo con la nueva configuración
      setDialogState(prev => ({
        ...prev,
        ...normalizedPropConfig
      }));
      
      // Actualizar lastSavedConfigRef para evitar pérdida de configuración
      lastSavedConfigRef.current = { ...normalizedPropConfig };
      
      // Determinar la opción seleccionada basada en la configuración
      setOpcionSeleccionada(normalizedPropConfig.tipo === 'PERSONALIZADO' ? 2 : 1);
    }
  }, [config, dialogState.open]);

  const handleSave = () => {
    try {
      setSavingChanges(true);
      
      // Crear un objeto limpio con solo los datos primitivos necesarios
      const newConfig = {
        tipo: String(dialogState.tipo || 'DIARIO').toUpperCase(),
        frecuencia: normalizeFrecuencia(dialogState.frecuencia),
        periodo: String(dialogState.periodo || 'CADA_DIA'),
        // Crear copias nuevas de los arrays para evitar referencias a objetos
        diasSemana: Array.isArray(dialogState.diasSemana) ? [...dialogState.diasSemana] : [],
        diasMes: Array.isArray(dialogState.diasMes) ? [...dialogState.diasMes] : [],
        activo: Boolean(dialogState.activo !== false)
      };
      
      // Validación adicional para tipo SEMANAL
      if (newConfig.tipo === 'SEMANAL') {
        console.log('[ItemCadenciaConfig] 🔍 Verificando tipo SEMANAL:', newConfig.tipo);
        // Forzar explícitamente el tipo
        newConfig.tipo = 'SEMANAL';
        // Asegurar el periodo correcto para tipo SEMANAL
        newConfig.periodo = 'CADA_SEMANA';
      }
      
      // Eliminar cualquier campo adicional no esperado
      Object.keys(newConfig).forEach(key => {
        // Si hay algún objeto complejo, eliminarlo
        if (typeof newConfig[key] === 'object' && !Array.isArray(newConfig[key])) {
          delete newConfig[key];
        }
      });
      
      // Usar la herramienta de depuración para registrar el guardado

      
      console.log(`[ItemCadenciaConfig] 🔄 Guardando configuración para ${itemId}:`, JSON.stringify(newConfig));
      console.log(`[ItemCadenciaConfig] 🔍 Tipo enviado: ${newConfig.tipo}, periodo: ${newConfig.periodo}`);
      
      // Cerrar el diálogo antes de actualizar para evitar problemas de sincronización
      setDialogState(prev => ({ ...prev, open: false }));
      
      // Aplicar la nueva configuración de forma síncrona
      if (typeof onConfigChange === 'function') {
        console.log(`[ItemCadenciaConfig] 📡 Enviando cambios al componente padre para ${itemId}`);
        onConfigChange(newConfig);
      
        // Guardar la configuración actual como referencia
        lastSavedConfigRef.current = { ...newConfig };
        setSaveSuccess(true);
        
        // Cerrar el panel de configuración después de guardar (solo si existe onExpandConfig)
        if (typeof onExpandConfig === 'function') {
          setTimeout(() => {
            onExpandConfig(null); // Pasar null para cerrar el panel
            console.log(`[ItemCadenciaConfig] ✅ Configuración guardada y panel cerrado para ${itemId}`);
          }, 50);
        } else {
          console.log(`[ItemCadenciaConfig] ✅ Configuración guardada para ${itemId} (sin panel que cerrar)`);
        }
      } else {
        console.warn('[ItemCadenciaConfig] ⚠️ onConfigChange no es una función, no se pudo guardar');
      }
    } catch (error) {
      console.error('[ItemCadenciaConfig] ❌ Error al guardar configuración:', error);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleOpen = () => {
    // Si es una fecha pasada, mostrar tooltip de advertencia en lugar de abrir diálogo
    if (isPastDate) {
      setShowPastDateWarning(true);
      // Ocultar después de 3 segundos
      setTimeout(() => {
        setShowPastDateWarning(false);
      }, 3000);
      return;
    }
    
    console.log(`[ItemCadenciaConfig] Abriendo diálogo de configuración para ${itemId}`);
    console.log(`[ItemCadenciaConfig] Config actual:`, JSON.stringify(normalizedConfig));
    
    // Reiniciar el estado del diálogo con la configuración actual
    setDialogState(prev => ({
      ...prev,
      open: true,
      tipo: normalizedConfig.tipo,
      frecuencia: normalizedConfig.frecuencia,
      periodo: normalizedConfig.periodo,
      diasSemana: [...normalizedConfig.diasSemana],
      diasMes: [...normalizedConfig.diasMes],
      activo: normalizedConfig.activo
    }));
  };

  const handleClose = () => {
    console.log(`[ItemCadenciaConfig] Cerrando diálogo de configuración para ${itemId}`);
    setDialogState(prev => ({ 
      ...prev, 
      open: false 
    }));
  };

  const handleFrecuenciaChange = (newValue) => {
    setDialogState(prev => ({
      ...prev,
      frecuencia: newValue
    }));
  };

  const handleTipoChange = (event) => {
    setDialogState(prev => ({ 
      ...prev, 
      tipo: event.target.value
    }));
  };

  const handlePeriodoChange = (event) => {
    setDialogState(prev => ({ 
      ...prev, 
      periodo: event.target.value 
    }));
  };

  // Función para capitalizar solo la primera letra
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Función para generar el texto de estado
  const getStatusText = () => {
    // Si no está activo, mostrar inactivo
    if (!normalizedConfig.activo) {
      return 'Inactivo';
    }
    
    // Si está completado, mostrar completado
    if (isCompleted) {
      // Si tenemos información de la última completación, mostrarla
      if (ultimaCompletacion) {
        try {
          const fecha = new Date(ultimaCompletacion);
          return `Completado ${format(fecha, "d MMM", { locale: es })}`;
        } catch (e) {
      return 'Completado';
        }
      }
      return 'Completado';
    }
    
    // Si no está completado, mostrar la frecuencia configurada
    const frecuenciaLabel = getFrecuenciaLabel(normalizedConfig);
    return frecuenciaLabel;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip 
        title={tooltip || (isPastDate ? "La configuración de fechas pasadas no se puede modificar" : getFrecuenciaLabel(normalizedConfig))}
        arrow
        open={showPastDateWarning || undefined}
      >
        <IconButton
          onClick={handleOpen}
          size="small"
          color={isPastDate ? "default" : "primary"}
          sx={{ 
            p: 0.5,
            opacity: isPastDate ? 0.6 : 1,
            '&:hover': {
              bgcolor: isPastDate ? 'rgba(0,0,0,0.04)' : 'rgba(25,118,210,0.08)'
            }
          }}
        >
          <SettingsIcon fontSize="small" />
          {isPastDate && (
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(0,0,0,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DateRangeIcon 
                fontSize="small" 
                sx={{ 
                  opacity: 0.7,
                  color: 'text.disabled',
                  transform: 'scale(0.7)'
                }} 
              />
            </Box>
          )}
        </IconButton>
      </Tooltip>
      
      <Dialog
        open={dialogState.open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          px: 2, 
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#0a0a0a',
          borderBottom: '1px solid #222222'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.selected',
                width: 24,
                height: 24,
                borderRadius: 0
              }}
            >
              <SettingsIcon sx={{ fontSize: '1rem' }} />
            </Box>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: '0.75rem' }}>
              {tooltip || 'Configuración'}
            </Typography>
          </Box>
          
          <IconButton
              size="small"
            onClick={handleClose}
            sx={{ color: 'text.secondary', ml: 0.5, p: 0.2 }}
          >
            <CloseIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
      </DialogTitle>
        
        <DialogContent sx={{ px: 2, py: 1, bgcolor: '#0a0a0a' }}>
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              <Switch 
              checked={dialogState.activo} 
              onChange={(e) => setDialogState(prev => ({ ...prev, activo: e.target.checked }))}
              color="primary"
                size="small"
              />
              <Typography variant="body2" sx={{ fontWeight: dialogState.activo ? 500 : 400, fontSize: '0.8rem' }}>
                {dialogState.activo ? "Activo" : "Inactivo"}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1, opacity: 0.3 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Primera opción */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: opcionSeleccionada === 1 ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                p: 1,
                borderRadius: 0
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Radio 
                    checked={opcionSeleccionada === 1}
                    onChange={() => {
                      setOpcionSeleccionada(1);
                      setDialogState(prev => ({
                        ...prev,
                        tipo: prev.tipo === 'PERSONALIZADO' ? 'DIARIO' : prev.tipo
                      }));
                    }}
                    disabled={!dialogState.activo}
                    size="small"
                    sx={{ 
                      p: 0.5, 
                      mr: 1,
                      '& .MuiSvgIcon-root': {
                        borderRadius: 0
                      }
                    }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    opacity: !dialogState.activo ? 0.4 : opcionSeleccionada === 1 ? 1 : 0.7
                  }}>
                    <TextField
                      type="number"
                      value={dialogState.frecuencia}
                      onChange={(e) => handleFrecuenciaChange(parseInt(e.target.value) || 1)}
                      InputProps={{ 
                        inputProps: { min: 1 },
                        sx: {
                          borderRadius: 0
                        }
                      }}
                      size="small"
                      disabled={!dialogState.activo}
                      sx={{ 
                        width: '70px',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 0
                        }
                      }}
                    />
                    
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={dialogState.tipo === 'PERSONALIZADO' ? 'DIARIO' : dialogState.tipo}
                        onChange={handleTipoChange}
                        disabled={!dialogState.activo || opcionSeleccionada !== 1}
                        displayEmpty
                        sx={{
                          bgcolor: !dialogState.activo ? '#0a0a0a' : opcionSeleccionada === 1 ? '#111111' : '#0a0a0a',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#222222'
                          },
                          borderRadius: 0
                        }}
                      >
                        <MenuItem value="DIARIO">por día</MenuItem>
                        <MenuItem value="SEMANAL">por semana</MenuItem>
                        <MenuItem value="MENSUAL">por mes</MenuItem>
                        <MenuItem value="TRIMESTRAL">por trimestre</MenuItem>
                        <MenuItem value="SEMESTRAL">por semestre</MenuItem>
                        <MenuItem value="ANUAL">por año</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>
              
              {/* Segunda opción */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: opcionSeleccionada === 2 ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                p: 1,
                borderRadius: 0
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Radio 
                    checked={opcionSeleccionada === 2}
                    onChange={() => {
                      setOpcionSeleccionada(2);
                      setDialogState(prev => ({
                        ...prev,
                        tipo: 'PERSONALIZADO'
                      }));
                    }}
                    disabled={!dialogState.activo}
                    size="small"
                    sx={{ 
                      p: 0.5, 
                      mr: 1,
                      '& .MuiSvgIcon-root': {
                        borderRadius: 0
                      }
                    }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    opacity: !dialogState.activo ? 0.4 : opcionSeleccionada === 2 ? 1 : 0.7
                  }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Cada</Typography>
                    
                    <TextField
                      type="number"
                      value={dialogState.frecuencia}
                      onChange={(e) => handleFrecuenciaChange(parseInt(e.target.value) || 1)}
                      InputProps={{ 
                        inputProps: { min: 1 },
                        sx: {
                          borderRadius: 0
                        }
                      }}
                      size="small"
                      disabled={!dialogState.activo}
                      sx={{ 
                        width: '70px',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 0
                        }
                      }}
                    />
                    
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={dialogState.periodo}
                        onChange={handlePeriodoChange}
                        disabled={!dialogState.activo || opcionSeleccionada !== 2}
                        displayEmpty
                        sx={{
                          bgcolor: !dialogState.activo ? '#0a0a0a' : opcionSeleccionada === 2 ? '#111111' : '#0a0a0a',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#222222'
                          },
                          borderRadius: 0
                        }}
                      >
                        <MenuItem value="CADA_DIA">días</MenuItem>
                        <MenuItem value="CADA_SEMANA">semanas</MenuItem>
                        <MenuItem value="CADA_MES">meses</MenuItem>
                        <MenuItem value="CADA_TRIMESTRE">trimestres</MenuItem>
                        <MenuItem value="CADA_SEMESTRE">semestres</MenuItem>
                        <MenuItem value="CADA_ANO">años</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 2, 
          py: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          bgcolor: '#0a0a0a'
        }}>
          <Button 
            size="small" 
            onClick={handleClose}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              fontSize: '0.75rem',
              borderRadius: 0
            }}
          >
            Cancelar
          </Button>
          
          <Button 
            size="small" 
            variant="contained"
            onClick={handleSave}
            disabled={savingChanges}
            startIcon={savingChanges ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              bgcolor: '#1a1a1a',
              borderRadius: 0,
              '&:hover': {
                bgcolor: '#252525'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemCadenciaConfig; 