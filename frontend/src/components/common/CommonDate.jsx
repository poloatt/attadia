import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { startOfDay, parseISO, format } from 'date-fns';
import TodayIcon from '@mui/icons-material/Today';

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
  // Obtener la fecha actual al inicio del día
  const today = useMemo(() => startOfDay(new Date()), []);

  // Función para formatear fecha a YYYY-MM-DD
  const formatToAPI = useCallback((date) => {
    return format(date, 'yyyy-MM-dd');
  }, []);

  const handleToday = useCallback(() => {
    onChange(today);
  }, [onChange, today]);

  const handleDateChange = useCallback((newDate) => {
    if (!newDate || isNaN(newDate.getTime())) return;
    // Normalizar la fecha al inicio del día
    const normalizedDate = startOfDay(newDate);
    onChange(normalizedDate);
  }, [onChange]);

  const inputRef = useRef();

  // Parsear el valor inicial
  const parsedValue = useMemo(() => {
    if (!value) return today;
    if (value instanceof Date && !isNaN(value)) return value;
    try {
      const date = parseISO(value);
      return isNaN(date.getTime()) ? today : startOfDay(date);
    } catch {
      return today;
    }
  }, [value, today]);

  const [open, setOpen] = useState(false);

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
          minDate={minDate ? startOfDay(parseISO(minDate)) : undefined}
          maxDate={maxDate ? startOfDay(parseISO(maxDate)) : undefined}
          inputFormat="dd/MM/yyyy"
          mask="__/__/____"
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          PopperProps={{
            anchorEl: inputRef.current || undefined,
            sx: { zIndex: 1500 }
          }}
          renderInput={(params) => (
            <StyledTextField
              {...params}
              inputRef={inputRef}
              fullWidth={fullWidth}
              error={error}
              helperText={helperText}
              InputProps={{
                ...params.InputProps,
                startAdornment: null,
                endAdornment: null,
                sx: { borderRadius: 0 }
              }}
            />
          )}
          {...props}
        />
        <IconButton
          onClick={() => setOpen(true)}
          disabled={disabled}
          sx={{
            color: '#fff', // Blanco
            backgroundColor: 'transparent',
            p: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
            },
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed'
            }
          }}
        >
          <TodayIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>
    </LocalizationProvider>
  );
};

export const CommonDate = EntityDateSelect;
export default React.memo(EntityDateSelect); 
