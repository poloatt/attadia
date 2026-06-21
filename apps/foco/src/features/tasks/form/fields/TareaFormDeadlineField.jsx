import React, { useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  TareaFormPillButton,
  tareaFormDatePillSx,
  tareaFormHeaderActionIconSx,
  tareaFormPillIconSx,
  tareaFormRowActionColumnSx,
} from '@shared/components/forms/tareaFormUi';
import { formatDeadlinePill } from '../utils/tareaFormDateUtils';
import { PickerPopover, PopoverInlineDatePicker } from '@shared/components/forms/tareaFormPickers';

/** Plain clear control for deadline pills — matches attach/priority icon buttons. */
export function TareaFormDeadlineClearButton({ onClear, sx }) {
  const handleClick = (event) => {
    event.stopPropagation();
    onClear?.();
  };

  return (
    <IconButton
      size="small"
      onClick={handleClick}
      aria-label="Quitar fecha límite"
      sx={{
        ...tareaFormRowActionColumnSx,
        ...tareaFormHeaderActionIconSx(),
        '&:hover:not(:disabled)': {
          bgcolor: 'transparent',
          color: 'text.primary',
        },
        ...sx,
      }}
    >
      <CloseIcon sx={tareaFormPillIconSx} />
    </IconButton>
  );
}

/** Pill de fecha límite para usar dentro del sector de horario (sin TareaFormRow propio). */
export function TareaFormDeadlinePill({
  value,
  onChange,
  placeholder = 'Agregar fecha límite',
  showClear = true,
}) {
  const anchorRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const displayValue = formatDeadlinePill(value);

  const handleClear = () => {
    onChange?.(null);
    setPickerOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <>
        <TareaFormPillButton
          ref={anchorRef}
          variant="schedule"
          onClick={() => setPickerOpen(true)}
          aria-label={value ? 'Cambiar fecha límite' : placeholder}
          sx={{
            ...tareaFormDatePillSx,
            ...(!value ? { color: 'text.secondary' } : null),
          }}
        >
          {displayValue || placeholder}
        </TareaFormPillButton>

        {showClear && value ? (
          <TareaFormDeadlineClearButton onClear={handleClear} />
        ) : null}
      </>

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
