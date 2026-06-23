import React from 'react';
import { TextField, Typography } from '@mui/material';
import { TareaFormHeaderTitleRow } from './tareaFormLayout';
import { tareaFormTitleFieldSx, tareaFormTitleTextSx } from './tareaFormTokens';

/**
 * Título editable alineado al gutter de filas (estilo Google Calendar / task forms).
 */
export default function TareaFormTitleField({
  value,
  onChange,
  placeholder = 'Agregar título',
  error = false,
  helperText,
  required = false,
  autoFocus = false,
  readOnly = false,
  action = null,
  inputRef,
  onKeyDown,
  sx,
  inputProps,
}) {
  return (
    <TareaFormHeaderTitleRow action={action}>
      {readOnly ? (
        <Typography
          variant="body1"
          sx={{
            flex: 1,
            minWidth: 0,
            wordBreak: 'break-word',
            color: value ? 'text.primary' : 'text.secondary',
            ...tareaFormTitleTextSx,
            ...sx,
          }}
        >
          {value || placeholder}
        </Typography>
      ) : (
        <TextField
          variant="standard"
          fullWidth
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          error={error}
          helperText={helperText}
          required={required}
          autoFocus={autoFocus}
          inputRef={inputRef}
          onKeyDown={onKeyDown}
          inputProps={inputProps}
          sx={{ flex: 1, minWidth: 0, ...tareaFormTitleFieldSx, ...sx }}
        />
      )}
    </TareaFormHeaderTitleRow>
  );
}
