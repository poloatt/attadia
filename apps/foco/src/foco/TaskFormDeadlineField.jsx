import React, { useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TaskFormPillButton, taskFormDatePillSx } from './taskFormUi';
import { PickerPopover, PopoverInlineDatePicker } from './taskFormPickers';

function formatDeadlinePill(date) {
  if (!date) return null;
  const raw = format(date, 'EEEE, d MMMM', { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Pill de fecha límite para usar dentro del sector de horario (sin TaskFormRow propio). */
export function TaskFormDeadlinePill({
  value,
  onChange,
  placeholder = 'Agregar fecha límite',
}) {
  const anchorRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const displayValue = formatDeadlinePill(value);

  const handleClear = (event) => {
    event.stopPropagation();
    onChange?.(null);
    setPickerOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <TaskFormPillButton
          ref={anchorRef}
          variant="schedule"
          onClick={() => setPickerOpen(true)}
          aria-label={value ? 'Cambiar fecha límite' : placeholder}
          sx={{
            ...taskFormDatePillSx,
            ...(!value ? { color: 'text.secondary' } : null),
          }}
        >
          {displayValue || placeholder}
        </TaskFormPillButton>

        {value ? (
          <IconButton
            size="small"
            onClick={handleClear}
            aria-label="Quitar fecha límite"
            sx={{ color: 'text.secondary', p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Box>

      <PickerPopover
        open={pickerOpen}
        anchorEl={anchorRef.current}
        onClose={() => setPickerOpen(false)}
      >
        <PopoverInlineDatePicker
          value={value}
          onChange={(v) => {
            onChange?.(v);
            setPickerOpen(false);
          }}
        />
      </PickerPopover>
    </LocalizationProvider>
  );
}

/** @deprecated Usar TaskFormDeadlinePill dentro de TaskFormScheduleFields. */
export default function TaskFormDeadlineField(props) {
  return <TaskFormDeadlinePill {...props} />;
}
