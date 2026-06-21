import React from 'react';
import { TextField } from '@mui/material';
import {
  TareaFormRow,
  TareaFormAttachButton,
  TareaFormHeaderContentRow,
  tareaFormStandardFieldSx,
  tareaFormFieldInputSx,
} from './tareaFormUi';
import { TareaFormIcons } from './tareaFormIcons';

/** Descripción en fila con icono (estilo Google Calendar). */
export default function TareaFormDescriptionField({
  value,
  onChange,
  onAttach,
  placeholder = 'Agregar descripción...',
  showDivider = false,
}) {
  return (
    <TareaFormRow icon={TareaFormIcons.description} showDivider={showDivider}>
      <TareaFormHeaderContentRow
        action={onAttach ? <TareaFormAttachButton onChange={onAttach} /> : null}
      >
        <TextField
          variant="standard"
          fullWidth
          placeholder={placeholder}
          multiline
          minRows={1}
          maxRows={5}
          value={value || ''}
          onChange={onChange}
          sx={{
            flex: 1,
            minWidth: 0,
            ...tareaFormStandardFieldSx,
            '& .MuiInputBase-input': {
              ...tareaFormFieldInputSx,
              color: value ? 'text.primary' : 'text.secondary',
            },
          }}
        />
      </TareaFormHeaderContentRow>
    </TareaFormRow>
  );
}
