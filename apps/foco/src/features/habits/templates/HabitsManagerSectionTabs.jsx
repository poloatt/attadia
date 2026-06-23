import React from 'react';
import { Box, Tabs, Tab, Tooltip, IconButton } from '@mui/material';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import AddIcon from '@mui/icons-material/Add';
import { SECTIONS } from './habitsManagerUtils';

export default function HabitsManagerSectionTabs({
  currentSection,
  onSectionChange,
  onReset,
  showAddForm,
  onAddClick,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        flexShrink: 0,
      }}
    >
      <Tabs
        value={currentSection}
        onChange={onSectionChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          flex: 1,
          minHeight: 40,
          '& .MuiTab-root': {
            minHeight: 40,
            py: 1,
            px: 2,
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'none',
          },
        }}
      >
        {SECTIONS.map((section) => (
          <Tab key={section.value} label={section.label} value={section.value} />
        ))}
      </Tabs>
      {!showAddForm && (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pr: 1, flexShrink: 0 }}>
          <Tooltip title="Restablecer valores por defecto">
            <IconButton
              size="small"
              onClick={onReset}
              aria-label="Restablecer hábitos"
              sx={{ width: 32, height: 32, color: 'text.secondary' }}
            >
              <SettingsBackupRestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Agregar hábito">
            <IconButton
              size="small"
              onClick={onAddClick}
              aria-label="Agregar hábito"
              sx={{ width: 32, height: 32, color: 'text.secondary' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
