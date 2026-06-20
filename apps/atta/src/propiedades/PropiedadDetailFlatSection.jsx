import React from 'react';
import { Box } from '@mui/material';
import { TaskFormRow, TaskFormSectionLabel } from '../../../foco/src/foco/taskFormUi';

/** Bloque de detalle siempre visible (sin collapse), estilo Google Calendar. */
export default function PropiedadDetailFlatSection({
  icon,
  title,
  children,
  showDivider = true,
}) {
  return (
    <TaskFormRow icon={icon} showDivider={showDivider} align="flex-start">
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <TaskFormSectionLabel>{title}</TaskFormSectionLabel>
        {children}
      </Box>
    </TaskFormRow>
  );
}
