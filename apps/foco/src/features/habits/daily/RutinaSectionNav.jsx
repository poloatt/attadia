import React from 'react';
import { Box, Typography } from '@mui/material';
import { DynamicIcon } from '@shared/components/common/DynamicIcon';
import { getRutinaSectionIconKey } from '@shared/navigation/rutinaSectionIcons';
import {
  HABIT_SECTIONS,
  RUTINA_SECTION_LABELS,
  categorizeSectionHabits,
} from '@shared/utils/rutinaDesktopUtils';
import { hubSectionBg } from '@shared/styles/hubSectionStyles';

const navItemSx = (selected) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.25,
  py: 1,
  borderRadius: 1.5,
  cursor: 'pointer',
  bgcolor: selected ? 'action.selected' : hubSectionBg,
  border: '1px solid',
  borderColor: selected ? 'primary.main' : 'divider',
  transition: 'border-color 0.15s, background-color 0.15s',
  '&:hover': {
    bgcolor: selected ? 'action.selected' : 'action.hover',
  },
});

export default function RutinaSectionNav({
  rutina,
  habits,
  habitsPreferences = {},
  selectedSection,
  onSelectSection,
}) {
  return (
    <Box
      component="nav"
      aria-label="Grupos de hábitos"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minWidth: 220,
        maxWidth: 260,
        flexShrink: 0,
      }}
    >
      {HABIT_SECTIONS.map((section) => {
        const { completed, incomplete } = categorizeSectionHabits({
          section,
          rutina,
          habits,
          habitsPreferences,
        });
        const label = RUTINA_SECTION_LABELS[section] || section;

        return (
          <Box
            key={section}
            role="button"
            tabIndex={0}
            aria-pressed={selectedSection === section}
            onClick={() => onSelectSection(section)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectSection(section);
              }
            }}
            sx={navItemSx(selectedSection === section)}
          >
            <DynamicIcon
              iconKey={getRutinaSectionIconKey(section)}
              size="small"
              sx={{ color: 'text.secondary', flexShrink: 0 }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {completed.length}/{completed.length + incomplete.length}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
