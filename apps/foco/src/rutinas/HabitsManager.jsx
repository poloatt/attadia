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
  Collapse
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import TuneIcon from '@mui/icons-material/Tune';
import { useHabits, useRutinas } from '@shared/context';
import { getIconByName, availableIcons } from '@shared/utils/iconConfig';
import InlineItemConfigImproved from './InlineItemConfigImproved';
import clienteAxios from '@shared/config/axios';

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
  const [editingHabit, setEditingHabit] = useState(null);
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
  const habitsRef = useRef(habits); // Ref para evitar recrear fetchHabitsConfig cuando habits cambia

  // Actualizar ref cuando habits cambia
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // Función para cargar la configuración de hábitos desde las preferencias del usuario
  // IMPORTANTE: Debe declararse ANTES del useEffect que la usa
  // Usa habitsRef.current en lugar de habits directamente para evitar recrear la función
  const fetchHabitsConfig = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:68',message:'fetchHabitsConfig called',data:{currentSection,habitsCount:Object.keys(habitsRef.current).reduce((acc,k)=>(acc+(habitsRef.current[k]?.length||0)),0),habitsInSection:habitsRef.current[currentSection]?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      const response = await clienteAxios.get('/api/users/preferences/habits');
      const loadedConfig = response.data?.habits || {};
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:75',message:'Config loaded from API',data:{loadedConfigKeys:Object.keys(loadedConfig),currentSectionConfigKeys:Object.keys(loadedConfig[currentSection]||{}),loadedConfigSample:JSON.stringify(loadedConfig[currentSection]||{}).substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Asegurar que todos los hábitos tengan configuración inicializada
      const initializedConfig = { ...loadedConfig };
      const currentHabits = habitsRef.current[currentSection] || [];
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:73',message:'Before initializing configs',data:{currentHabitsIds:currentHabits.map(h=>h.id),existingConfigIds:Object.keys(initializedConfig[currentSection]||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // Para cada hábito en la sección actual, asegurar que tenga configuración
      currentHabits.forEach(habit => {
        if (!initializedConfig[currentSection]) {
          initializedConfig[currentSection] = {};
        }
        
        // Si el hábito no tiene configuración, inicializar con valores por defecto
        if (!initializedConfig[currentSection][habit.id]) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:80',message:'Initializing default config for habit',data:{habitId:habit.id,section:currentSection,isNewHabit:!loadedConfig[currentSection]?.[habit.id]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          initializedConfig[currentSection][habit.id] = {
            tipo: 'DIARIO',
            frecuencia: 1,
            activo: true,
            periodo: 'CADA_DIA',
            diasSemana: [],
            diasMes: []
          };
        }
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:107',message:'Setting habitsConfig state',data:{finalConfigKeys:Object.keys(initializedConfig[currentSection]||{}),allSections:Object.keys(initializedConfig),sampleConfig:initializedConfig[currentSection]?.[currentHabits[0]?.id]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setHabitsConfig(initializedConfig);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:115',message:'Error loading config',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[HabitsManager] Error al cargar configuración de hábitos:', error);
      // Inicializar con estructura vacía pero válida
      setHabitsConfig({});
    }
  }, [currentSection]); // SOLO currentSection como dependencia - habits se accede vía ref para evitar loops

  // Cargar hábitos y configuración al abrir el modal
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:121',message:'useEffect for open modal',data:{open,habitsChanged:JSON.stringify(habits).length,hasFetchHabits:!!fetchHabits,hasFetchHabitsConfig:!!fetchHabitsConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (open) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:125',message:'Calling fetchHabits and fetchHabitsConfig',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      fetchHabits();
      fetchHabitsConfig();
    }
  }, [open, fetchHabits, fetchHabitsConfig]);

  // Función para guardar la configuración de cadencia de un hábito
  const handleConfigChange = async (habitId, newConfig) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:109',message:'handleConfigChange called',data:{habitId,currentSection,newConfig,hasUpdateUserHabitPreference:!!updateUserHabitPreference,isNewHabit:!habitsConfig[currentSection]?.[habitId]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // Normalizar configuración
      const normalizedConfig = {
        tipo: (newConfig.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(newConfig.frecuencia || 1),
        activo: newConfig.activo !== undefined ? Boolean(newConfig.activo) : true,
        periodo: newConfig.periodo || 'CADA_DIA',
        diasSemana: Array.isArray(newConfig.diasSemana) ? [...newConfig.diasSemana] : [],
        diasMes: Array.isArray(newConfig.diasMes) ? [...newConfig.diasMes] : [],
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
    setEditingHabit(null);
    setShowAddForm(false);
    setOpenSetupHabitId(null);
    setFormData({ id: '', label: '', icon: 'Add', activo: true });
    setErrors({});
    // Recargar configuración de la nueva sección
    fetchHabitsConfig();
  };

  const handleAddClick = () => {
    setShowAddForm(true);
    setEditingHabit(null);
    setFormData({ id: '', label: '', icon: 'Add', activo: true });
    setErrors({});
  };

  const handleEditClick = (habit) => {
    setEditingHabit(habit);
    setShowAddForm(false);
    setFormData({
      id: habit.id,
      label: habit.label,
      icon: habit.icon,
      activo: habit.activo
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
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
    } else if (!editingHabit && habits[currentSection]?.some(h => h.id === formData.id)) {
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
      if (editingHabit) {
        // Actualizar hábito existente
        await updateHabit(formData.id, currentSection, {
          label: formData.label,
          icon: formData.icon,
          activo: formData.activo
        });
      } else {
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

  const handleMoveUp = async (habitId) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:358',message:'handleMoveUp called',data:{habitId,currentSection,habitsCount:habits[currentSection]?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
    // #endregion
    try {
      // IMPORTANTE: Usar sortedHabits para mantener el mismo orden que se muestra en la UI
      // CRÍTICO: Solo usar hábitos que tienen ID válido (excluir hábitos sin ID o con ID inválido)
      const currentHabits = [...(habits[currentSection] || [])]
        .filter(h => h && h.id && h.id !== '' && h.id != null) // Filtrar hábitos sin ID válido
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const index = currentHabits.findIndex(h => h.id === habitId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:365',message:'Before reorder',data:{index,currentHabitsIds:currentHabits.map(h=>h.id),habitIdsToSend:currentHabits.map(h=>h.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
      // #endregion
      
      if (index > 0) {
        const newOrder = [...currentHabits];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        // IMPORTANTE: Solo enviar IDs que existen y no son null/undefined
        const habitIds = newOrder.map(h => h.id).filter(id => id != null && id !== '');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:372',message:'Calling reorderHabits',data:{currentSection,habitIds,habitIdsCount:habitIds.length,currentHabitsCount:currentHabits.length,habitIdsList:habitIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
        // #endregion
        if (habitIds.length > 0 && habitIds.length === currentHabits.length) {
          await reorderHabits(currentSection, habitIds);
        } else {
          console.error('[HabitsManager] Error: No se pueden reordenar hábitos con IDs faltantes', { habitIds, currentHabits });
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:382',message:'handleMoveUp error',data:{habitId,currentSection,error:error.message,errorResponse:error.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
      // #endregion
      console.error('[HabitsManager] Error al mover hábito hacia arriba:', error);
      // El error ya se maneja en el contexto, pero no lanzamos el error para evitar que se propague
    }
  };

  const handleMoveDown = async (habitId) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:394',message:'handleMoveDown called',data:{habitId,currentSection,habitsCount:habits[currentSection]?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
    // #endregion
    try {
      // IMPORTANTE: Usar sortedHabits para mantener el mismo orden que se muestra en la UI
      // CRÍTICO: Solo usar hábitos que tienen ID válido (excluir hábitos sin ID o con ID inválido)
      const currentHabits = [...(habits[currentSection] || [])]
        .filter(h => h && h.id && h.id !== '' && h.id != null) // Filtrar hábitos sin ID válido
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const index = currentHabits.findIndex(h => h.id === habitId);
      
      if (index < currentHabits.length - 1) {
        const newOrder = [...currentHabits];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        // IMPORTANTE: Solo enviar IDs que existen y no son null/undefined
        const habitIds = newOrder.map(h => h.id).filter(id => id != null && id !== '');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:406',message:'Calling reorderHabits',data:{currentSection,habitIds,habitIdsCount:habitIds.length,currentHabitsCount:currentHabits.length,habitIdsList:habitIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
        // #endregion
        if (habitIds.length > 0 && habitIds.length === currentHabits.length) {
          await reorderHabits(currentSection, habitIds);
        } else {
          console.error('[HabitsManager] Error: No se pueden reordenar hábitos con IDs faltantes', { habitIds, currentHabits });
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:415',message:'handleMoveDown error',data:{habitId,currentSection,error:error.message,errorResponse:error.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
      // #endregion
      console.error('[HabitsManager] Error al mover hábito hacia abajo:', error);
      // El error ya se maneja en el contexto, pero no lanzamos el error para evitar que se propague
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
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
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
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: theme.palette.background.default }}>
        <Tabs
          value={currentSection}
          onChange={handleSectionChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
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

        <Box sx={{ p: 1.5 }}>
          {showAddForm || editingHabit ? (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="ID"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  error={!!errors.id}
                  helperText={errors.id || 'Solo letras minúsculas y números'}
                  disabled={!!editingHabit}
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
                    {editingHabit ? 'Actualizar' : 'Agregar'}
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
              sx={{ mb: 1.5, borderRadius: 0 }}
              fullWidth
              size="small"
            >
              Agregar Hábito
            </Button>
          )}

          {sortedHabits.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No hay hábitos en esta sección
            </Typography>
          ) : (
            <List dense sx={{ py: 0 }}>
              {sortedHabits.map((habit, index) => {
                const Icon = getIconByName(habit.icon);
                
                // Obtener configuración del hábito, inicializando con valores por defecto si no existe
                // Esto funciona tanto para hábitos precargados como para nuevos
                const habitConfig = habitsConfig[currentSection]?.[habit.id] || {
                  tipo: 'DIARIO',
                  frecuencia: 1,
                  activo: habit.activo !== undefined ? habit.activo : true,
                  periodo: 'CADA_DIA',
                  diasSemana: [],
                  diasMes: []
                };
                
                const isSetupOpen = openSetupHabitId === habit.id;
                
                return (
                  <React.Fragment key={habit.id}>
                    <ListItem
                      sx={{
                        bgcolor: habit.activo ? 'transparent' : 'action.disabledBackground',
                        borderRadius: 0,
                        mb: 0.5,
                        py: 0.75,
                        px: 1,
                        border: editingHabit?.id === habit.id ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, width: '100%' }}>
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
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {habit.label}
                          </Typography>
                          {/* Mostrar resumen de configuración */}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem', display: 'block', mt: 0.2 }}
                          >
                            {(() => {
                              const tipo = (habitConfig?.tipo || 'DIARIO').toUpperCase();
                              const frecuencia = Number(habitConfig?.frecuencia || 1);
                              if (tipo === 'DIARIO') {
                                return frecuencia === 1 ? 'Diario' : `${frecuencia}x/día`;
                              } else if (tipo === 'SEMANAL') {
                                return frecuencia === 1 ? 'Semanal' : `${frecuencia}x/sem`;
                              } else if (tipo === 'MENSUAL') {
                                return frecuencia === 1 ? 'Mensual' : `${frecuencia}x/mes`;
                              }
                              return 'Personalizado';
                            })()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.25, ml: 1 }}>
                          <Tooltip title="Configurar cadencia">
                            <IconButton
                              size="small"
                              onClick={async () => {
                                // Si se está abriendo el setup y no hay configuración, inicializarla
                                if (!isSetupOpen && !habitsConfig[currentSection]?.[habit.id]) {
                                  const defaultConfig = {
                                    tipo: 'DIARIO',
                                    frecuencia: 1,
                                    activo: habit.activo !== undefined ? habit.activo : true,
                                    periodo: 'CADA_DIA',
                                    diasSemana: [],
                                    diasMes: []
                                  };
                                  
                                  // Actualizar estado local inmediatamente para mostrar el setup
                                  setHabitsConfig(prev => ({
                                    ...prev,
                                    [currentSection]: {
                                      ...(prev[currentSection] || {}),
                                      [habit.id]: defaultConfig
                                    }
                                  }));
                                  
                                  // Guardar en el backend (sin esperar para no bloquear la UI)
                                  handleConfigChange(habit.id, defaultConfig).catch(err => {
                                    console.warn('[HabitsManager] Error al inicializar configuración:', err);
                                  });
                                }
                                
                                setOpenSetupHabitId(isSetupOpen ? null : habit.id);
                              }}
                              sx={{ 
                                width: 28, 
                                height: 28, 
                                padding: 0.5,
                                color: isSetupOpen ? 'primary.main' : 'text.secondary'
                              }}
                            >
                              <TuneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mover arriba">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveUp(habit.id)}
                                disabled={index === 0 || loading}
                                sx={{ width: 28, height: 28, padding: 0.5 }}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Mover abajo">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveDown(habit.id)}
                                disabled={index === sortedHabits.length - 1 || loading}
                                sx={{ width: 28, height: 28, padding: 0.5 }}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(habit)}
                              disabled={loading}
                              sx={{ width: 28, height: 28, padding: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(habit.id)}
                              disabled={loading || sortedHabits.length <= 1}
                              color="error"
                              sx={{ width: 28, height: 28, padding: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </ListItem>
                    {/* Panel de configuración de cadencia */}
                    <Collapse in={isSetupOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ pl: 4, pr: 1, pb: 1, mb: 0.5 }}>
                        <InlineItemConfigImproved
                          config={habitConfig}
                          onConfigChange={async (newConfig) => {
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:683',message:'onConfigChange from InlineItemConfigImproved',data:{habitId:habit.id,currentSection,newConfig,isNewHabit:!habitsConfig[currentSection]?.[habit.id]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                            // #endregion
                            // Guardar configuración (actualiza preferencias globales y rutina actual)
                            await handleConfigChange(habit.id, newConfig);
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:687',message:'After handleConfigChange, before fetchHabitsConfig',data:{habitId:habit.id,currentSection},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                            // #endregion
                            // NO recargar configuración aquí para evitar loops
                            // El estado local ya se actualizó en handleConfigChange
                            // Solo recargar si es necesario después de un delay o en un efecto separado
                            // await fetchHabitsConfig(); // COMENTADO: causa loop infinito
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsManager.jsx:738',message:'After fetchHabitsConfig',data:{habitId:habit.id,currentSection,configAfterReload:!!habitsConfig[currentSection]?.[habit.id],willTriggerRerender:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                            // #endregion
                          }}
                          itemId={habit.id}
                          sectionId={currentSection}
                        />
                      </Box>
                    </Collapse>
                  </React.Fragment>
                );
              })}
            </List>
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

