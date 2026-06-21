import React from 'react';
import { Box, Popover } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { es } from 'date-fns/locale';

export default function CalendarDatePickerPopover({
  open,
  anchorEl,
  onClose,
  value,
  onChange,
}) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.default',
          boxShadow: (t) => t.shadows[8],
          mt: 0.5,
        },
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Box
          sx={{
            '& .MuiPickersDay-root.Mui-selected': {
              bgcolor: 'primary.main',
            },
          }}
        >
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={value}
            onChange={(d) => {
              if (d) onChange(d);
            }}
            views={['year', 'month', 'day']}
            openTo="day"
            showToolbar={false}
            componentsProps={{ actionBar: { actions: [] } }}
            renderInput={() => null}
          />
        </Box>
      </LocalizationProvider>
    </Popover>
  );
}
