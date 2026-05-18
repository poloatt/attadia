import React, { useState, useEffect, useCallback } from 'react';

import {

  Dialog,

  DialogContent,

  TextField,

  Box,

  Typography,

} from '@mui/material';

import { useHabits, useRutinas } from '@shared/context';

import clienteAxios from '@shared/config/axios';

import { availableIcons } from '@shared/utils/iconConfig';

import { useResponsive } from '@shared/hooks';

import {

  taskFormDialogPaperSx,

  taskFormTitleFieldSx,

  TaskFormHeader,

  TaskFormFooter,

} from '../../foco/src/foco/taskFormUi';

import HabitFormFields from '../../foco/src/foco/HabitFormFields';

import { DEFAULT_HABIT_CONFIG, normalizeHabitConfig } from '../../foco/src/foco/habitFormDefaults';

import { normalizeTimeOfDay } from '@shared/utils/timeOfDayUtils';

import { saveHabitFromForm } from '../../foco/src/foco/saveHabitFromForm';



const DEFAULT_ICON = availableIcons[0]?.name || 'Add';



const HabitFormDialog = ({ open, onClose, editingHabit = null, editingSection = null, initialDraft = null }) => {

  const { isMobile } = useResponsive();

  const { habits, addHabit, updateHabit, fetchHabits } = useHabits();

  const { updateUserHabitPreference, rutina } = useRutinas();



  const [formData, setFormData] = useState({

    label: '',

    section: 'bodyCare',

    icon: DEFAULT_ICON,

  });



  const [config, setConfig] = useState(DEFAULT_HABIT_CONFIG);

  const [errors, setErrors] = useState({});

  const [isSaving, setIsSaving] = useState(false);



  useEffect(() => {

    if (!open) return;



    if (editingHabit && editingSection) {

      setFormData({

        label: editingHabit.label || '',

        section: editingSection,

        icon: editingHabit.icon || DEFAULT_ICON,

      });



      const habitId = editingHabit.id || editingHabit._id;

      const habitConfig = habitId ? rutina?.config?.[editingSection]?.[habitId] : null;

      if (habitConfig) {

        setConfig({

          tipo: habitConfig.tipo || 'DIARIO',

          frecuencia: Number(habitConfig.frecuencia || 1),

          activo: habitConfig.activo !== false,

          periodo: habitConfig.periodo || 'CADA_DIA',

          diasSemana: Array.isArray(habitConfig.diasSemana) ? [...habitConfig.diasSemana] : [],

          diasMes: Array.isArray(habitConfig.diasMes) ? [...habitConfig.diasMes] : [],

          horarios: Array.isArray(habitConfig.horarios) ? [...habitConfig.horarios] : [],

        });

      } else {

        setConfig({ ...DEFAULT_HABIT_CONFIG });

      }

    } else {

      setFormData({

        label: initialDraft?.label || '',

        section: initialDraft?.section || 'bodyCare',

        icon: DEFAULT_ICON,

      });

      setConfig({ ...DEFAULT_HABIT_CONFIG });

    }

    setErrors({});

  }, [open, editingHabit, editingSection, initialDraft, rutina?.config]);



  const validateForm = () => {

    const newErrors = {};

    if (!formData.label?.trim()) {

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



  const handleSave = async () => {

    if (!validateForm()) return;



    setIsSaving(true);

    try {

      let habitId;



      if (editingHabit && editingSection) {

        habitId = editingHabit.id || editingHabit._id;



        await updateHabit(habitId, editingSection, {

          label: formData.label.trim(),

          icon: formData.icon,

          activo: editingHabit.activo !== undefined ? editingHabit.activo : true,

        });



        if (formData.section !== editingSection) {

          const currentConfig = rutina?.config?.[editingSection]?.[habitId];

          await clienteAxios.delete(`/api/users/habits/${habitId}`, {

            data: { section: editingSection },

          });

          const orden = habits[formData.section]?.length || 0;

          await addHabit(formData.section, {

            id: habitId,

            label: formData.label.trim(),

            icon: formData.icon,

            activo: editingHabit.activo !== undefined ? editingHabit.activo : true,

            orden,

          });

          if (currentConfig && updateUserHabitPreference) {

            await updateUserHabitPreference(formData.section, habitId, currentConfig, true);

          }

        }



        const normalizedConfig = normalizeHabitConfig(config);

        if (updateUserHabitPreference) {

          await updateUserHabitPreference(formData.section, habitId, normalizedConfig, true);

        }

      } else {

        await saveHabitFromForm({

          label: formData.label,

          section: formData.section,

          icon: formData.icon,

          config,

          habits,

          addHabit,

          updateUserHabitPreference,

          fetchHabits,

        });

      }



      if (editingHabit) {

        await fetchHabits();

      }

      onClose();

    } catch (error) {

      console.error('[HabitFormDialog] Error al guardar hábito:', error);

      setErrors({

        submit: error.message || 'Error al guardar el hábito. Por favor, intenta nuevamente.',

      });

    } finally {

      setIsSaving(false);

    }

  };



  const handleConfigChange = useCallback((newConfig) => {

    setConfig((prev) => ({

      ...prev,

      ...newConfig,

      horarios: normalizeTimeOfDay(

        newConfig.horarios !== undefined ? newConfig.horarios : prev.horarios,

      ),

    }));

  }, []);



  return (

    <Dialog

      open={open}

      onClose={onClose}

      maxWidth="sm"

      fullWidth

      fullScreen={isMobile}

      PaperProps={{

        sx: {

          ...taskFormDialogPaperSx(isMobile),

          display: 'flex',

          flexDirection: 'column',

        },

      }}

    >

      <DialogContent sx={{ flex: 1, overflowY: 'auto', py: 0, px: 0 }}>

        <TaskFormHeader onClose={onClose}>

          <TextField

            variant="standard"

            fullWidth

            placeholder="Nombre del hábito"

            value={formData.label}

            onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}

            error={!!errors.label}

            helperText={errors.label}

            autoFocus

            sx={{ ...taskFormTitleFieldSx, pr: 3 }}

          />

        </TaskFormHeader>



        <Box sx={{ px: 2 }}>

          <HabitFormFields

            section={formData.section}

            onSectionChange={(section) => setFormData((prev) => ({ ...prev, section }))}

            icon={formData.icon}

            onIconChange={(icon) => setFormData((prev) => ({ ...prev, icon }))}

            config={config}

            onConfigChange={handleConfigChange}

            errors={errors}

            showSection

            showIconPicker

            showCadence

          />



          {errors.submit && (

            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>

              {errors.submit}

            </Typography>

          )}

        </Box>



        <TaskFormFooter

          onSave={handleSave}

          saving={isSaving}

          saveLabel={isSaving ? 'Guardando...' : 'Guardar'}

        />

      </DialogContent>

    </Dialog>

  );

};



export default HabitFormDialog;

