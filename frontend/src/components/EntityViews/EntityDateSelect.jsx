import React from 'react';
import { Box, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    backgroundColor: 'transparent',
    '& fieldset': {
      borderColor: theme.palette.divider
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)'
  }
}));

const EntityDateSelect = ({
  label,
  value,
  onChange,
  error,
  helperText,
  startIcon,
  fullWidth = true,
  disabled = false,
  minDate,
  maxDate,
  ...props
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        renderInput={(params) => (
          <StyledTextField
            {...params}
            fullWidth={fullWidth}
            error={error}
            helperText={helperText}
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: true
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default EntityDateSelect; 