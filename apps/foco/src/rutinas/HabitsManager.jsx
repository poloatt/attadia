import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Button,
  TextField,
  List,
  ListItem,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Collapse,
  Chip
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import { useHabits, useRutinas } from '@shared/context';
import { getIconByName, availableIcons } from '@shared/utils/iconConfig';
import { getTimeOfDayLabels } from '@shared/utils/timeOfDayUtils';
import InlineItemConfigImproved from './InlineItemConfigImproved';
import clienteAxios from '@shared/config/axios';
import { SystemButtons } from '@shared/components/common/SystemButtons';

const SECTIONS = [
  { value: 'bodyCare', label: 'Cuidado Personal' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'ejercicio', label: 'Ejercicio' },
  { value: 'cleaning', label: 'Limpieza' }
];

export const HabitsManager = ({ open, onClose }) => {
  const { isMobile, theme } = useResponsive();
  const { habits, loading, fetchHabits, addHabit, updateHabit, deleteHabit, reorderHabits, resetHabits } = useHabits();
  const { updateUserHabitPreference } = useRutinas();
  
  const [currentSection, setCurrentSection] = useState('bodyCare');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    icon: 'Add',
    activo: true
  });
  const [errors, setErrors] = useState({});
  const [openSetupHabitId, setOpenSetupHabitId] = useState(null);
  const [habitsConfig, setHabitsConfig] = useState({});
  const [editingHabitName, setEditingHabitName] = useState(false);
  const [habitNameEdit, setHabitNameEdit] = useState('');
  const habitsRef = useRef(habits); // Ref para evitar recrear fetchHabitsConfig cuando habits cambia

  // Actualizar ref cuando habits cambia
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // Función para cargar la configuración de hábitos desde las preferencias del usuario
  // IMPORTANTE: Debe declararse ANTES del useEffect que la usa
  // Usa habitsRef.current en lugar de habits directamente para evitar recrear la función
  const fetchHabitsConfig = useCallback(async () => {
    // Debug telemetry deshabilitado en producción
    try {
      const response = await clienteAxios.get('/api/users/preferences/habits');
      const loadedConfig = response.data?.habits || {};
      
      // Debug telemetry deshabilitado en producción
      
      // Asegurar que todos los hábitos tengan configuración inicializada
      const initializedConfig = { ...loadedConfig };
      const currentHabits = habitsRef.current[currentSection] || [];
      
      // Debug telemetry deshabilitado en producción
      
      // Para cada hábito en la sección actual, asegurar que tenga configuración
      currentHabits.forEach(habit => {
        if (!initializedConfig[currentSection]) {
          initializedConfig[currentSection] = {};
        }
        
        // Si el hábito no tiene configuración, inicializar con valores por defecto
        if (!initializedConfig[currentSection][habit.id]) {
          // Debug telemetry deshabilitado en producción
          initializedConfig[currentSection][habit.id] = {
            tipo: 'DIARIO',
            frecuencia: 1,
            activo: true,
            periodo: 'CADA_DIA',
            diasSemana: [],
            diasMes: [],
            horarios: []
          };
        }
      });
      
      // Debug telemetry deshabilitado en producción
      setHabitsConfig(initializedConfig);
    } catch (error) {
      // Debug telemetry deshabilitado en producción
      console.error('[HabitsManager] Error al cargar configuración de hábitos:', error);
      // Inicializar con estructura vacía pero válida
      setHabitsConfig({});
    }
  }, [currentSection]); // SOLO currentSection como dependencia - habits se accede vía ref para evitar loops

  // Cargar hábitos y configuración al abrir el modal
  useEffect(() => {
    // #region agent log
    // Debug telemetry deshabilitado en producción
    // #endregion
    if (open) {
      // #region agent log
      // Debug telemetry deshabilitado en producción
      // #endregion
      fetchHabits();
      fetchHabitsConfig();
    }
  }, [open, fetchHabits, fetchHabitsConfig]);

  // Función para guardar la configuración de cadencia de un hábito
  const handleConfigChange = async (habitId, newConfig) => {
    // Debug telemetry deshabilitado en producción
    try {
      // Normalizar configuración
      const normalizedConfig = {
        tipo: (newConfig.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(newConfig.frecuencia || 1),
        activo: newConfig.activo !== undefined ? Boolean(newConfig.activo) : true,
        periodo: newConfig.periodo || 'CADA_DIA',
        diasSemana: Array.isArray(newConfig.diasSemana) ? [...newConfig.diasSemana] : [],
        diasMes: Array.isArray(newConfig.diasMes) ? [...newConfig.diasMes] : [],
        horarios: Array.isArray(newConfig.horarios) ? [...newConfig.horarios] : [],
        esPreferenciaUsuario: true,
        ultimaActualizacion: new Date().toISOString()
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:124',message:'Before calling updateUserHabitPreference',data:{habitId,currentSection,normalizedConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Actualizar preferencias del usuario Y la rutina actual si existe
      if (updateUserHabitPreference) {
        const result = await updateUserHabitPreference(currentSection, habitId, normalizedConfig, true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:157',message:'updateUserHabitPreference result',data:{habitId,currentSection,result,isNewHabit:!habitsConfig[currentSection]?.[habitId]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!result || !result.updated) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:160',message:'updateUserHabitPreference failed',data:{habitId,currentSection,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn('[HabitsManager] No se pudo actualizar preferencia completamente');
      }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:130',message:'Using fallback API call',data:{habitId,currentSection},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Fallback: actualizar directamente
        await clienteAxios.put('/api/users/preferences/habits', {
          habits: {
            [currentSection]: {
              [habitId]: normalizedConfig
            }
          }
        });
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:185',message:'Updating local state',data:{habitId,currentSection,prevConfigExists:!!habitsConfig[currentSection]?.[habitId],normalizedConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Actualizar estado local INMEDIATAMENTE después de guardar
      // Esto asegura que la UI se actualice sin esperar a recargar desde el backend
      setHabitsConfig(prev => {
        const updated = {
          ...prev,
          [currentSection]: {
            ...(prev[currentSection] || {}),
            [habitId]: normalizedConfig
          }
        };
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:194',message:'State updated',data:{habitId,currentSection,configInState:!!updated[currentSection]?.[habitId]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return updated;
      });
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:149',message:'Error in handleConfigChange',data:{habitId,currentSection,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[HabitsManager] Error al guardar configuración:', error);
    }
  };

  const handleSectionChange = (event, newValue) => {
    setCurrentSection(newValue);
    setShowAddForm(false);
    setOpenSetupHabitId(null);
    setFormData({ id: '', label: '', icon: 'Add', activo: true });
    setErrors({});
    setEditingHabitName(false);
    setHabitNameEdit('');
    // Recargar configuración de la nueva sección
    fetchHabitsConfig();
  };

  const handleAddClick = () => {
    setShowAddForm(true);
    setFormData({ id: '', label: '', icon: 'Add', activo: true });
    setErrors({});
  };

  // Escuchar evento del botón AddButton
  useEffect(() => {
    const handleHeaderAddButtonClick = (event) => {
      if (event.detail?.type === 'habit') {
        handleAddClick();
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButtonClick);
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButtonClick);
    };
  }, []);


  const handleCancelEdit = () => {
    setShowAddForm(false);
    setFormData({ id: '', label: '', icon: 'Add', activo: true });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.id || formData.id.trim() === '') {
      newErrors.id = 'El ID es requerido';
    } else if (!/^[a-z][a-z0-9]*$/.test(formData.id)) {
      newErrors.id = 'El ID debe comenzar con letra y contener solo letras minúsculas y números';
    } else if (habits[currentSection]?.some(h => h.id === formData.id)) {
      newErrors.id = 'Ya existe un hábito con ese ID';
    }
    
    if (!formData.label || formData.label.trim() === '') {
      newErrors.label = 'El nombre es requerido';
    }
    
    if (!formData.icon) {
      newErrors.icon = 'Debe seleccionar un icono';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Crear nuevo hábito
      const orden = habits[currentSection]?.length || 0;
      await addHabit(currentSection, {
        id: formData.id,
        label: formData.label,
        icon: formData.icon,
        activo: formData.activo,
        orden
      });
      
      // Inicializar configuración por defecto para el nuevo hábito
      const defaultConfig = {
        tipo: 'DIARIO',
        frecuencia: 1,
        activo: true,
        periodo: 'CADA_DIA',
        diasSemana: [],
        diasMes: [],
        esPreferenciaUsuario: true,
        ultimaActualizacion: new Date().toISOString()
      };
      
      // Guardar configuración inicial
      try {
        if (updateUserHabitPreference) {
          await updateUserHabitPreference(currentSection, formData.id, defaultConfig, true);
        } else {
          await clienteAxios.put('/api/users/preferences/habits', {
            habits: {
              [currentSection]: {
                [formData.id]: defaultConfig
              }
            }
          });
        }
        
        // Actualizar estado local
        setHabitsConfig(prev => ({
          ...prev,
          [currentSection]: {
            ...(prev[currentSection] || {}),
            [formData.id]: defaultConfig
          }
        }));
      } catch (configError) {
        console.warn('[HabitsManager] Error al inicializar configuración del nuevo hábito:', configError);
        // No fallar si no se puede inicializar la configuración, el usuario puede configurarla después
      }
      
      handleCancelEdit();
      // Recargar hábitos y configuración para asegurar sincronización
      await fetchHabits();
      await fetchHabitsConfig();
    } catch (error) {
      // El error ya se maneja en el contexto
    }
  };

  const handleDelete = async (habitId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este hábito?')) {
      try {
        await deleteHabit(habitId, currentSection);
      } catch (error) {
        // El error ya se maneja en el contexto
      }
    }
  };


  const handleReset = async () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todos los hábitos a los valores por defecto? Esta acción no se puede deshacer.')) {
      try {
        await resetHabits();
      } catch (error) {
        // El error ya se maneja en el contexto
      }
    }
  };

  const currentHabits = habits[currentSection] || [];
  const sortedHabits = [...currentHabits].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const IconComponent = getIconByName(formData.icon);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 1,
          maxHeight: isMobile ? '100vh' : '90vh',
          bgcolor: theme.palette.background.default
        }
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          p: 1.5,
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 500 }}>
          Gestionar Hábitos
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ 
            color: 'text.secondary',
            width: 32,
            height: 32,
            padding: 0.5
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          p: 0, 
          bgcolor: theme.palette.background.default,
          minHeight: isMobile ? 'auto' : '600px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <Tabs
            value={currentSection}
            onChange={handleSectionChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              flex: 1,
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                padding: '8px 16px',
                fontSize: '0.875rem'
              }
            }}
          >
            {SECTIONS.map(section => (
              <Tab key={section.value} label={section.label} value={section.value} />
            ))}
          </Tabs>
          {!showAddForm && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pr: 1 }}>
              <Tooltip title="Restablecer a defaults">
                <IconButton
                  size="small"
                  onClick={handleReset}
                  sx={{ 
                    color: 'text.secondary',
                    width: 32,
                    height: 32,
                    padding: 0.5
                  }}
                >
                  <SettingsBackupRestoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <SystemButtons.AddButton
                entityConfig={{
                  id: 'habit',
                  name: 'Hábito',
                  title: 'Hábito',
                  canAdd: true
                }}
                buttonSx={{
                  borderRadius: 0,
                  width: 32,
                  height: 32,
                  padding: 0.5
                }}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
          {showAddForm ? (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="ID"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  error={!!errors.id}
                  helperText={errors.id || 'Solo letras minúsculas y números'}
                  disabled={false}
                  fullWidth
                  size="small"
                />
                
                <TextField
                  label="Nombre"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  error={!!errors.label}
                  helperText={errors.label}
                  fullWidth
                  size="small"
                />
                
                <FormControl fullWidth size="small" error={!!errors.icon}>
                  <InputLabel>Icono</InputLabel>
                  <Select
                    value={formData.icon}
                    label="Icono"
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    renderValue={(value) => {
                      const Icon = getIconByName(value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {Icon && <Icon fontSize="small" />}
                          <span>{availableIcons.find(i => i.name === value)?.label || value}</span>
                        </Box>
                      );
                    }}
                  >
                    {availableIcons.map(icon => {
                      const Icon = getIconByName(icon.name);
                      return (
                        <MenuItem key={icon.name} value={icon.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {Icon && <Icon fontSize="small" />}
                            <span>{icon.label}</span>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {errors.icon && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.icon}</Typography>}
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    size="small"
                    sx={{ borderRadius: 0, flex: 1 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    size="small"
                    sx={{ borderRadius: 0, flex: 1 }}
                  >
                    Agregar
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : null}

          {sortedHabits.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No hay hábitos en esta sección
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Lista horizontal de hábitos */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 1,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  pb: 1,
                  '&::-webkit-scrollbar': {
                    height: 6
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 3
                  }
                }}
              >
                {sortedHabits.map((habit, index) => {
                  const Icon = getIconByName(habit.icon);
                  
                  // Obtener configuración del hábito, inicializando con valores por defecto si no existe
                  const habitConfig = habitsConfig[currentSection]?.[habit.id] || {
                    tipo: 'DIARIO',
                    frecuencia: 1,
                    activo: habit.activo !== undefined ? habit.activo : true,
                    periodo: 'CADA_DIA',
                    diasSemana: [],
                    diasMes: []
                  };
                  
                  const isSetupOpen = openSetupHabitId === habit.id;
                  
                  const handleHabitClick = async (e) => {
                    // No hacer nada si se hace click en los botones de acción
                    if (e.target.closest('button')) {
                      return;
                    }
                    
                    // Si se está abriendo el setup, inicializar datos de edición
                    if (!isSetupOpen) {
                      setEditingHabitName(false);
                      setHabitNameEdit(habit.label);
                      
                      // Si no hay configuración, inicializarla
                      if (!habitsConfig[currentSection]?.[habit.id]) {
                        const defaultConfig = {
                          tipo: 'DIARIO',
                          frecuencia: 1,
                          activo: habit.activo !== undefined ? habit.activo : true,
                          periodo: 'CADA_DIA',
                          diasSemana: [],
                          diasMes: [],
                          horarios: []
                        };
                        
                        setHabitsConfig(prev => ({
                          ...prev,
                          [currentSection]: {
                            ...(prev[currentSection] || {}),
                            [habit.id]: defaultConfig
                          }
                        }));
                        
                        handleConfigChange(habit.id, defaultConfig).catch(err => {
                          console.warn('[HabitsManager] Error al inicializar configuración:', err);
                        });
                      }
                    }
                    
                    setOpenSetupHabitId(isSetupOpen ? null : habit.id);
                    if (isSetupOpen) {
                      setEditingField(null);
                    }
                  };
                  
                  return (
                    <Box
                      key={habit.id}
                      onClick={handleHabitClick}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 200,
                        maxWidth: 250,
                        bgcolor: habit.activo ? 'background.paper' : 'action.disabledBackground',
                        border: isSetupOpen
                          ? `2px solid ${theme.palette.primary.main}`
                          : `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        p: 1,
                        position: 'relative',
                        opacity: habit.activo === false ? 0.6 : 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      {/* Header del hábito */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                        {Icon && (
                          <Icon 
                            sx={{ 
                              color: habit.activo ? 'primary.main' : 'text.disabled',
                              fontSize: '1.25rem',
                              flexShrink: 0
                            }} 
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: habit.activo ? 'text.primary' : 'text.disabled',
                              textDecoration: habit.activo ? 'none' : 'line-through',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {habit.label}
                          </Typography>
                          {/* Resumen de configuración */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              {(() => {
                                const tipo = (habitConfig?.tipo || 'DIARIO').toUpperCase();
                                const frecuencia = Number(habitConfig?.frecuencia || 1);
                                let cadenciaLabel = '';
                                if (tipo === 'DIARIO') {
                                  cadenciaLabel = frecuencia === 1 ? 'Diario' : `${frecuencia}x/día`;
                                } else if (tipo === 'SEMANAL') {
                                  cadenciaLabel = frecuencia === 1 ? 'Semanal' : `${frecuencia}x/sem`;
                                } else if (tipo === 'MENSUAL') {
                                  cadenciaLabel = frecuencia === 1 ? 'Mensual' : `${frecuencia}x/mes`;
                                } else {
                                  cadenciaLabel = 'Personalizado';
                                }
                                return cadenciaLabel;
                              })()}
                            </Typography>
                            {/* Indicador de horarios */}
                            {habitConfig?.horarios && Array.isArray(habitConfig.horarios) && habitConfig.horarios.length > 0 && (
                              <Chip
                                label={getTimeOfDayLabels(habitConfig.horarios)}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  border: '1px solid rgba(25, 118, 210, 0.3)',
                                  '& .MuiChip-label': {
                                    px: 0.5,
                                    py: 0
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              
              {/* Panel de configuración y edición - se muestra debajo cuando se selecciona un hábito */}
              <Box sx={{ minHeight: openSetupHabitId ? '450px' : '0px', transition: 'min-height 0.3s ease', overflow: 'hidden' }}>
                {openSetupHabitId && sortedHabits.find(h => h.id === openSetupHabitId) && (
                  <Collapse in={!!openSetupHabitId} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                    {(() => {
                      const selectedHabit = sortedHabits.find(h => h.id === openSetupHabitId);
                      if (!selectedHabit) return null;
                      
                      const habitConfig = habitsConfig[currentSection]?.[selectedHabit.id] || {
                        tipo: 'DIARIO',
                        frecuencia: 1,
                        activo: selectedHabit.activo !== undefined ? selectedHabit.activo : true,
                        periodo: 'CADA_DIA',
                        diasSemana: [],
                        diasMes: [],
                        horarios: []
                      };
                      
                      const IconComponent = getIconByName(selectedHabit.icon);
                      
                      const handleStartEditName = () => {
                        setHabitNameEdit(selectedHabit.label);
                        setEditingHabitName(true);
                      };
                      
                      const handleSaveName = async () => {
                        if (!habitNameEdit || habitNameEdit.trim() === '') {
                          return;
                        }
                        
                        try {
                          await updateHabit(selectedHabit.id, currentSection, {
                            label: habitNameEdit.trim(),
                            icon: selectedHabit.icon,
                            activo: selectedHabit.activo !== undefined ? selectedHabit.activo : true
                          });
                          await fetchHabits();
                          setEditingHabitName(false);
                        } catch (error) {
                          console.error('[HabitsManager] Error al actualizar nombre del hábito:', error);
                        }
                      };
                      
                      const handleCancelEditName = () => {
                        setHabitNameEdit(selectedHabit.label);
                        setEditingHabitName(false);
                      };
                      
                      return (
                        <Box>
                          {/* Título con nombre del hábito */}
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              {IconComponent && (
                                <IconComponent 
                                  sx={{ 
                                    color: 'primary.main', 
                                    fontSize: '1.5rem',
                                    flexShrink: 0
                                  }} 
                                />
                              )}
                              {editingHabitName ? (
                                <>
                                  <TextField
                                    value={habitNameEdit}
                                    onChange={(e) => setHabitNameEdit(e.target.value)}
                                    size="small"
                                    autoFocus
                                    sx={{ flex: 1 }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveName();
                                      } else if (e.key === 'Escape') {
                                        handleCancelEditName();
                                      }
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={handleSaveName}
                                    color="primary"
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={handleCancelEditName}
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                                    {selectedHabit.label}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={handleStartEditName}
                                    sx={{ width: 28, height: 28 }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                            
                            {/* Selector de grupo */}
                            <Box sx={{ mt: 1 }}>
                              <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem', height: '32px' } }}>
                                <InputLabel sx={{ fontSize: '0.85rem' }}>Grupo</InputLabel>
                                <Select
                                  value={currentSection}
                                  label="Grupo"
                                  sx={{ fontSize: '0.85rem' }}
                                  onChange={async (e) => {
                                    const newSection = e.target.value;
                                    if (newSection !== currentSection) {
                                      try {
                                        // Mover el hábito a la nueva sección
                                        // Primero eliminar de la sección actual
                                        await deleteHabit(selectedHabit.id, currentSection);
                                        // Luego agregar a la nueva sección
                                        const orden = habits[newSection]?.length || 0;
                                        await addHabit(newSection, {
                                          id: selectedHabit.id,
                                          label: selectedHabit.label,
                                          icon: selectedHabit.icon,
                                          activo: selectedHabit.activo !== undefined ? selectedHabit.activo : true,
                                          orden
                                        });
                                        
                                        // Mover la configuración también
                                        const habitConfigToMove = habitsConfig[currentSection]?.[selectedHabit.id];
                                        if (habitConfigToMove && updateUserHabitPreference) {
                                          await updateUserHabitPreference(newSection, selectedHabit.id, habitConfigToMove, true);
                                        }
                                        
                                        // Actualizar estado local
                                        setHabitsConfig(prev => {
                                          const updated = { ...prev };
                                          if (updated[currentSection]?.[selectedHabit.id]) {
                                            if (!updated[newSection]) {
                                              updated[newSection] = {};
                                            }
                                            updated[newSection][selectedHabit.id] = updated[currentSection][selectedHabit.id];
                                            delete updated[currentSection][selectedHabit.id];
                                          }
                                          return updated;
                                        });
                                        
                                        // Cerrar el panel y cambiar a la nueva sección
                                        setOpenSetupHabitId(null);
                                        setCurrentSection(newSection);
                                        await fetchHabits();
                                        await fetchHabitsConfig();
                                      } catch (error) {
                                        console.error('[HabitsManager] Error al mover hábito a otra sección:', error);
                                      }
                                    }
                                  }}
                                >
                                  {SECTIONS.map(section => (
                                    <MenuItem key={section.value} value={section.value}>
                                      {section.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                            <InlineItemConfigImproved
                              config={habitConfig}
                              onConfigChange={async (newConfig) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:683',message:'onConfigChange from InlineItemConfigImproved',data:{habitId:selectedHabit.id,currentSection,newConfig,isNewHabit:!habitsConfig[currentSection]?.[selectedHabit.id]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                // #endregion
                                await handleConfigChange(selectedHabit.id, newConfig);
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:687',message:'After handleConfigChange, before fetchHabitsConfig',data:{habitId:selectedHabit.id,currentSection},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                                // #endregion
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:738',message:'After fetchHabitsConfig',data:{habitId:selectedHabit.id,currentSection,configAfterReload:!!habitsConfig[currentSection]?.[selectedHabit.id],willTriggerRerender:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                                // #endregion
                              }}
                              itemId={selectedHabit.id}
                              sectionId={currentSection}
                            />
                          </Box>
                          
                          {/* Botón de eliminar */}
                          <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => {
                                setOpenSetupHabitId(null);
                                handleDelete(selectedHabit.id);
                              }}
                              disabled={loading || sortedHabits.length <= 1}
                              fullWidth
                              size="small"
                              sx={{ borderRadius: 0 }}
                            >
                              Eliminar Hábito
                            </Button>
                          </Box>
                        </Box>
                      );
                    })()}
                    </Box>
                  </Collapse>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, bgcolor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 0 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

