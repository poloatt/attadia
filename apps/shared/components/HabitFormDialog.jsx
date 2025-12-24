import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useHabits, useRutinas } from '@shared/context';
import clienteAxios from '@shared/config/axios';
import { getIconByName, availableIcons } from '@shared/utils/iconConfig';
import { normalizeTimeOfDay } from '@shared/utils/timeOfDayUtils';
// Importación relativa desde shared/components hacia foco/src/rutinas
import InlineItemConfigImproved from '../../foco/src/rutinas/InlineItemConfigImproved';

const SECTIONS = [
  { value: 'bodyCare', label: 'Cuidado Personal' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'ejercicio', label: 'Ejercicio' },
  { value: 'cleaning', label: 'Limpieza' }
];

const HabitFormDialog = ({ open, onClose, editingHabit = null, editingSection = null }) => {
  const { habits, addHabit, updateHabit, fetchHabits } = useHabits();
  const { updateUserHabitPreference, rutina } = useRutinas();
  
  const [formData, setFormData] = useState({
    label: '',
    section: 'bodyCare',
    icon: availableIcons.length > 0 ? availableIcons[0].name : ''
  });
  
  const [config, setConfig] = useState({
    tipo: 'DIARIO',
    frecuencia: 1,
    activo: true,
    periodo: 'CADA_DIA',
    diasSemana: [],
    diasMes: [],
    horarios: []
  });
  
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Resetear o cargar formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (editingHabit && editingSection) {
        // Modo edición: cargar datos del hábito existente
        setFormData({
          label: editingHabit.label || '',
          section: editingSection,
          icon: editingHabit.icon || 'Add'
        });
        
        // Cargar configuración del hábito si existe
        const habitId = editingHabit.id || editingHabit._id;
        if (habitId && editingSection) {
          // Intentar obtener la configuración desde las preferencias de la rutina
          const habitConfig = rutina?.config?.[editingSection]?.[habitId];
          if (habitConfig) {
            setConfig({
              tipo: habitConfig.tipo || 'DIARIO',
              frecuencia: Number(habitConfig.frecuencia || 1),
              activo: habitConfig.activo !== false,
              periodo: habitConfig.periodo || 'CADA_DIA',
              diasSemana: Array.isArray(habitConfig.diasSemana) ? [...habitConfig.diasSemana] : [],
              diasMes: Array.isArray(habitConfig.diasMes) ? [...habitConfig.diasMes] : [],
              horarios: Array.isArray(habitConfig.horarios) ? [...habitConfig.horarios] : []
            });
          } else {
            // Usar valores por defecto si no se encuentra
            setConfig({
              tipo: 'DIARIO',
              frecuencia: 1,
              activo: true,
              periodo: 'CADA_DIA',
              diasSemana: [],
              diasMes: [],
              horarios: []
            });
          }
        }
      } else {
        // Modo creación: resetear formulario
        setFormData({
          label: '',
          section: 'bodyCare',
          icon: availableIcons.length > 0 ? availableIcons[0].name : ''
        });
        setConfig({
          tipo: 'DIARIO',
          frecuencia: 1,
          activo: true,
          periodo: 'CADA_DIA',
          diasSemana: [],
          diasMes: [],
          horarios: []
        });
      }
      setErrors({});
    }
  }, [open, editingHabit, editingSection, habits]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.label || formData.label.trim() === '') {
      newErrors.label = 'El nombre es requerido';
    }
    
    if (!formData.section) {
      newErrors.section = 'Debe seleccionar un grupo';
    }
    
    if (!formData.icon) {
      newErrors.icon = 'Debe seleccionar un icono';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateHabitId = (label) => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '') // Eliminar espacios
      .substring(0, 30); // Limitar longitud
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      let habitId;
      
      if (editingHabit && editingSection) {
        // Modo edición: actualizar hábito existente
        habitId = editingHabit.id || editingHabit._id;
        
        await updateHabit(habitId, editingSection, {
          label: formData.label.trim(),
          icon: formData.icon,
          activo: editingHabit.activo !== undefined ? editingHabit.activo : true
        });
        
        // Si cambió la sección, mover el hábito y su configuración
        if (formData.section !== editingSection) {
          // Obtener la configuración actual antes de mover
          const currentConfig = rutina?.config?.[editingSection]?.[habitId];
          
          // Eliminar de la sección anterior
          await clienteAxios.delete(`/api/users/habits/${habitId}`, {
            data: { section: editingSection }
          });
          
          // Agregar a la nueva sección
          const orden = habits[formData.section]?.length || 0;
          await addHabit(formData.section, {
            id: habitId,
            label: formData.label.trim(),
            icon: formData.icon,
            activo: editingHabit.activo !== undefined ? editingHabit.activo : true,
            orden
          });
          
          // Si había configuración, moverla también a la nueva sección
          if (currentConfig && updateUserHabitPreference) {
            await updateUserHabitPreference(formData.section, habitId, currentConfig, true);
          }
        }
      } else {
        // Modo creación: crear nuevo hábito
        const baseId = generateHabitId(formData.label);
        habitId = baseId;
        let counter = 1;
        
        // Verificar que el ID sea único
        while (habits[formData.section]?.some(h => h.id === habitId)) {
          habitId = `${baseId}${counter}`;
          counter++;
        }

        const orden = habits[formData.section]?.length || 0;
        await addHabit(formData.section, {
          id: habitId,
          label: formData.label.trim(),
          icon: formData.icon,
          activo: true,
          orden
        });
      }
      
      // Guardar configuración de cadencia - asegurar que horarios esté incluido
      try {
        // Normalizar la configuración antes de guardar
        const normalizedConfig = {
          tipo: (config.tipo || 'DIARIO').toUpperCase(),
          frecuencia: Number(config.frecuencia || 1),
          activo: config.activo !== false,
          periodo: config.periodo || 'CADA_DIA',
          diasSemana: Array.isArray(config.diasSemana) ? [...config.diasSemana] : [],
          diasMes: Array.isArray(config.diasMes) ? [...config.diasMes] : [],
          horarios: normalizeTimeOfDay(config.horarios), // Normalizar horarios correctamente
          esPreferenciaUsuario: true,
          ultimaActualizacion: new Date().toISOString()
        };
        
        console.log('[HabitFormDialog] Config horarios antes de normalizar:', config.horarios);
        console.log('[HabitFormDialog] Config horarios después de normalizar:', normalizedConfig.horarios);
        
        console.log('[HabitFormDialog] Guardando configuración normalizada:', normalizedConfig);
        
        if (updateUserHabitPreference) {
          await updateUserHabitPreference(formData.section, habitId, normalizedConfig, true);
        } else {
          await clienteAxios.put('/api/users/preferences/habits', {
            habits: {
              [formData.section]: {
                [habitId]: normalizedConfig
              }
            }
          });
        }
        
        console.log('[HabitFormDialog] Configuración guardada exitosamente');
      } catch (configError) {
        console.error('[HabitFormDialog] Error al guardar configuración:', configError);
        // No fallar si no se puede guardar la configuración, pero mostrar error
        setErrors({ submit: 'El hábito se creó pero hubo un error al guardar la configuración de cadencia' });
      }
      
      // Recargar hábitos
      await fetchHabits();
      
      // Cerrar diálogo
      onClose();
    } catch (error) {
      console.error('[HabitFormDialog] Error al guardar hábito:', error);
      setErrors({ submit: 'Error al guardar el hábito. Por favor, intenta nuevamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = useCallback((newConfig, meta) => {
    // Siempre actualizar el estado config con los cambios (tanto draft como today)
    // Esto asegura que cuando se guarde el hábito, tenga la configuración más reciente
    console.log('[HabitFormDialog] handleConfigChange:', { newConfig, meta, hasHorarios: !!newConfig.horarios, horarios: newConfig.horarios });
    setConfig(prevConfig => {
      // Normalizar horarios usando la función de utilidad
      const normalizedHorarios = normalizeTimeOfDay(newConfig.horarios !== undefined ? newConfig.horarios : prevConfig.horarios);
      
      const updatedConfig = {
        ...prevConfig,
        ...newConfig,
        horarios: normalizedHorarios
      };
      console.log('[HabitFormDialog] Config actualizado:', updatedConfig);
      return updatedConfig;
    });
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          borderRadius: 1,
          '& .MuiDialogTitle-root': {
            bgcolor: 'background.default'
          },
          '& .MuiDialogContent-root': {
            bgcolor: 'background.default'
          },
          '& .MuiDialogActions-root': {
            bgcolor: 'background.default'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, bgcolor: 'background.default' }}>
        <Typography component="span" variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 500 }}>
          {editingHabit ? 'Editar Hábito' : 'Agregar Hábito'}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Fila superior: Icono a la izquierda, Nombre y Grupo a la derecha */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            {/* Selector de icono - a la izquierda */}
            <FormControl error={!!errors.icon} sx={{ minWidth: 200 }}>
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
              {errors.icon && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {errors.icon}
                </Typography>
              )}
            </FormControl>
            
            {/* Nombre y Grupo - a la derecha, alineados */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              {/* Campo de nombre */}
              <TextField
                label="Nombre del hábito"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                error={!!errors.label}
                helperText={errors.label}
                fullWidth
                autoFocus
              />
              
              {/* Selector de grupo */}
              <FormControl fullWidth error={!!errors.section}>
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  label="Grupo"
                >
                  {SECTIONS.map((section) => (
                    <MenuItem key={section.value} value={section.value}>
                      {section.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.section && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.section}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Box>
          
          {/* Configuración de cadencia */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Configuración de Cadencia
            </Typography>
             <Box sx={{ 
               border: '1px solid',
               borderColor: 'divider',
               borderRadius: 1,
               p: 1.5,
               bgcolor: 'background.default'
             }}>
              <InlineItemConfigImproved
                config={config}
                onConfigChange={handleConfigChange}
                itemId="new-habit"
                sectionId={formData.section}
                hideActions={true}
              />
            </Box>
          </Box>
          
          {errors.submit && (
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
              {errors.submit}
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 2, pb: 2, bgcolor: 'background.default' }}>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HabitFormDialog;

