import React, { useCallback } from 'react';
import {
  Box,
  Chip,
  Typography,
} from '@mui/material';
import { availableIcons, getIconByName } from '@shared/utils/iconConfig';
import InlineItemConfigImproved from '../rutinas/InlineItemConfigImproved';
import {
  TaskFormRow,
  TaskFormSectionLabel,
  TaskFormPillSelect,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import { HABIT_SECTIONS } from './habitFormDefaults';

const SECTION_OPTIONS = HABIT_SECTIONS.map((sec) => ({
  value: sec.value,
  label: sec.label,
}));

/**
 * Campos de hábito con look & feel alineado a Google Calendar / taskFormUi.
 */
export default function HabitFormFields({
  section,
  onSectionChange,
  icon,
  onIconChange,
  config,
  onConfigChange,
  errors = {},
  showSection = true,
  showIconPicker = true,
  showCadence = true,
}) {
  const handleConfigChange = useCallback((newConfig) => {
    onConfigChange?.(newConfig);
  }, [onConfigChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {showSection && (
        <TaskFormRow icon={TaskFormIcons.habit} showDivider={false}>
          <TaskFormPillSelect
            value={section}
            onChange={(e) => onSectionChange(e.target.value)}
            options={SECTION_OPTIONS}
            emptyLabel="Seleccionar grupo"
            error={errors.section}
          />
        </TaskFormRow>
      )}

      {showIconPicker && (
        <TaskFormRow icon={TaskFormIcons.habit} showDivider={false}>
          <Box sx={{ width: '100%' }}>
            <TaskFormSectionLabel>Icono</TaskFormSectionLabel>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                overflowX: 'auto',
                pb: 0.5,
                mx: -0.5,
                px: 0.5,
                '&::-webkit-scrollbar': { height: 4 },
              }}
            >
              {availableIcons.map((item) => {
                const IconComp = getIconByName(item.name);
                const selected = icon === item.name;
                return (
                  <Chip
                    key={item.name}
                    icon={IconComp ? <IconComp sx={{ fontSize: '1.1rem !important' }} /> : undefined}
                    label={item.label}
                    size="small"
                    onClick={() => onIconChange(item.name)}
                    variant={selected ? 'filled' : 'outlined'}
                    sx={{
                      flexShrink: 0,
                      height: 36,
                      borderRadius: '18px',
                      fontSize: '0.75rem',
                      borderColor: selected ? 'transparent' : 'divider',
                      bgcolor: selected ? 'action.selected' : 'transparent',
                      color: selected ? 'text.primary' : 'text.secondary',
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                );
              })}
            </Box>
            {errors.icon && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.icon}
              </Typography>
            )}
          </Box>
        </TaskFormRow>
      )}

      {showCadence && (
        <TaskFormRow icon={TaskFormIcons.recurrence} showDivider={false} align="flex-start">
          <Box sx={{ width: '100%' }}>
            <TaskFormSectionLabel>Cadencia</TaskFormSectionLabel>
            <Box
              sx={{
                mt: 0.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                px: { xs: 0.5, sm: 1 },
                py: 1,
              }}
            >
              <InlineItemConfigImproved
                config={config}
                onConfigChange={handleConfigChange}
                itemId="new-habit-inline"
                sectionId={section}
                hideActions
              />
            </Box>
          </Box>
        </TaskFormRow>
      )}
    </Box>
  );
}
