import React from 'react';
import { TextField } from '@mui/material';
import { TaskFormRow, taskFormStandardFieldSx } from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';

/** Descripción en fila con icono (estilo Google Calendar). */
export default function TaskFormDescriptionField({
  value,
  onChange,
  placeholder = 'Agregar descripción...',
  showDivider = false,
}) {
  return (
    <TaskFormRow icon={TaskFormIcons.description} showDivider={showDivider}>
      <TextField
        variant="standard"
        fullWidth
        placeholder={placeholder}
        multiline
        minRows={1}
        maxRows={5}
        value={value || ''}
        onChange={onChange}
        InputProps={{ disableUnderline: true }}
        sx={{
          ...taskFormStandardFieldSx,
          '& .MuiInputBase-input': {
            fontSize: '0.875rem',
            color: value ? 'text.primary' : 'text.secondary',
            py: 0,
          },
        }}
      />
    </TaskFormRow>
  );
}
