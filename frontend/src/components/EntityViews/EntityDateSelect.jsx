import React, { useCallback } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import TodayIcon from '@mui/icons-material/Today';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from '../../utils/dateUtils';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    backgroundColor: 'transparent',
    '& fieldset': {
      borderColor: theme.palette.divider
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    },
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)',
      color: theme.palette.primary.main
    },
    '&.Mui-error': {
      color: theme.palette.error.main
    }
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
  const handleToday = useCallback(() => {
    const today = getNormalizedToday();
    const formattedDate = formatDateForAPI(today);
    console.debug('[EntityDateSelect] Seleccionando hoy:', {
      today,
      formattedDate,
      error
    });
    onChange(formattedDate);
  }, [onChange, error]);

  const handleDateChange = useCallback((newDate) => {
    if (!newDate || isNaN(newDate.getTime())) {
      console.debug('[EntityDateSelect] Fecha inválida o nula');
      return;
    }
    
    // Normalizar la fecha a medianoche en la zona horaria local
    const localDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      0, 0, 0, 0
    );
    
    const formattedDate = formatDateForAPI(localDate);
    console.debug('[EntityDateSelect] Fecha seleccionada:', {
      original: newDate,
      normalized: localDate,
      formatted: formattedDate,
      error
    });
    
    onChange(formattedDate);
  }, [onChange, error]);

  // Parsear y validar el valor inicial
  let parsedValue = null;
  try {
    if (value) {
      parsedValue = parseAPIDate(value);
      console.debug('[EntityDateSelect] Valor parseado:', {
        input: value,
        parsed: parsedValue,
        error
      });
      
      if (!parsedValue || isNaN(parsedValue.getTime())) {
        console.warn('[EntityDateSelect] Valor inicial inválido:', value);
        parsedValue = null;
      }
    }
  } catch (error) {
    console.error('[EntityDateSelect] Error al parsear fecha:', error);
    parsedValue = null;
  }

  return (
    <LocalizationProvider 
      dateAdapter={AdapterDateFns} 
      adapterLocale={es}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DatePicker
          label={label}
          value={parsedValue}
          onChange={handleDateChange}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          showToolbar={false}
          views={['day']}
          inputFormat="yyyy-MM-dd"
          mask="____-__-__"
          renderInput={(params) => (
            <StyledTextField
              {...params}
              fullWidth={fullWidth}
              error={error}
              helperText={helperText}
              InputProps={{
                ...params.InputProps,
                startAdornment: startIcon,
                error: error
              }}
            />
          )}
          {...props}
        />
        <IconButton 
          onClick={handleToday}
          disabled={disabled}
          sx={{ 
            borderRadius: 0,
            padding: '8px',
            '&:hover': {
              backgroundColor: 'action.hover'
            },
            '&.Mui-disabled': {
              opacity: 0.5
            }
          }}
        >
          <TodayIcon />
        </IconButton>
      </Box>
    </LocalizationProvider>
  );
};

export default React.memo(EntityDateSelect); 