import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import InlineItemConfigImproved from './InlineItemConfigImproved';
import {
  TareaFormRow,
  TareaFormSectionLabel,
  TareaFormPillSelect,
  HabitIconPicker,
} from '@shared/components/forms/tareaFormUi';
import { TareaFormIcons } from '@shared/components/forms/tareaFormIcons';
import { HABIT_SECTION_OPTIONS } from './habitFormDefaults';

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
  cadenceMinimal = false,
  sectionMinimal = false,
}) {
  const handleConfigChange = useCallback((newConfig) => {
    onConfigChange?.(newConfig);
  }, [onConfigChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {showSection && !sectionMinimal && (
        <TareaFormRow icon={TareaFormIcons.habit} showDivider={false} align="center">
          <TareaFormPillSelect
            value={section}
            onChange={(e) => onSectionChange(e.target.value)}
            options={HABIT_SECTION_OPTIONS}
            emptyLabel="Seleccionar grupo"
            error={errors.section}
          />
        </TareaFormRow>
      )}

      {showIconPicker && (
        <TareaFormRow icon={TareaFormIcons.habitIcon} showDivider={false} align="center">
          <HabitIconPicker
            value={icon}
            onChange={onIconChange}
            error={errors.icon}
          />
        </TareaFormRow>
      )}

      {showCadence && (
        cadenceMinimal ? (
          <Box
            sx={{
              borderRadius: 2,
              bgcolor: 'action.hover',
              px: { xs: 0.5, sm: 1 },
              py: 1,
              mx: { xs: 0.5, sm: 1 },
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
        ) : (
        <TareaFormRow icon={TareaFormIcons.recurrence} showDivider={false} align="flex-start">
          <Box sx={{ width: '100%' }}>
            <TareaFormSectionLabel>Cadencia</TareaFormSectionLabel>
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
        </TareaFormRow>
        )
      )}
    </Box>
  );
}
