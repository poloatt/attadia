import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown as ChevronDownIcon } from '@mui/icons-material';
import { addMinutes, differenceInMinutes, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
  TaskFormRow,
  TaskFormPrimaryLine,
  TaskFormSecondaryLine,
  TaskFormSectionLabel,
  TaskFormPillButton,
  taskFormPickerPopoverPaperSx,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import TaskFormRecurrencePicker from './TaskFormRecurrencePicker';

function mergeDateAndTime(day, time) {
  const d = new Date(day);
  const t = time || new Date();
  d.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return d;
}

function formatDatePill(day) {
  const raw = format(day, 'EEEE, d MMMM', { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatTimePill(time) {
  return format(time || new Date(), 'HH:mm');
}

function formatDeadlineSummary(date) {
  if (!date) return null;
  return format(date, 'EEE, d MMM yyyy', { locale: es });
}

const inlinePickerBoxSx = {
  '& .MuiPickersPopper-root': {
    position: 'relative !important',
    transform: 'none !important',
    inset: 'unset !important',
  },
  '& .MuiPaper-root': {
    boxShadow: 'none',
    backgroundImage: 'none',
  },
};

const hiddenPickerInputSx = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
  p: 0,
  m: 0,
  border: 0,
};

function PickerPopover({ open, anchorEl, onClose, children }) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: taskFormPickerPopoverPaperSx }}
    >
      {children}
    </Popover>
  );
}

function PopoverInlineDatePicker({ value, onChange }) {
  return (
    <Box sx={inlinePickerBoxSx}>
      <DatePicker
        value={value}
        onChange={onChange}
        views={['year', 'month', 'day']}
        openTo="day"
        open
        renderInput={(params) => (
          <TextField {...params} sx={hiddenPickerInputSx} tabIndex={-1} aria-hidden />
        )}
        PopperProps={{ disablePortal: true }}
        componentsProps={{ actionBar: { actions: [] } }}
      />
    </Box>
  );
}

function PopoverInlineTimePicker({ value, onChange }) {
  return (
    <Box sx={inlinePickerBoxSx}>
      <TimePicker
        value={value}
        onChange={onChange}
        ampm={false}
        minutesStep={5}
        views={['hours', 'minutes']}
        open
        renderInput={(params) => (
          <TextField {...params} sx={hiddenPickerInputSx} tabIndex={-1} aria-hidden />
        )}
        PopperProps={{ disablePortal: true }}
        componentsProps={{ actionBar: { actions: [] } }}
      />
    </Box>
  );
}

/**
 * Fecha, todo el día / hora inicio–fin y vencimiento (pills estilo Google Calendar).
 */
export default function TaskFormScheduleFields({
  day,
  onDayChange,
  time,
  onTimeChange,
  allDay,
  onAllDayChange,
  expanded = false,
  showTimeControls = false,
  durationMin = 60,
  onDurationChange,
  showDuration = false,
  showRecurrence = true,
  recurrenceRrule = null,
  onRecurrenceChange,
  fechaVencimiento,
  onFechaVencimientoChange,
  showVencimiento = true,
  errors = {},
}) {
  const datePillRef = useRef(null);
  const startPillRef = useRef(null);
  const endPillRef = useRef(null);
  const deadlinePillRef = useRef(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [deadlineExpanded, setDeadlineExpanded] = useState(
    Boolean(showVencimiento && fechaVencimiento),
  );
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const showTimePills = !allDay && (expanded || showTimeControls || showDuration);

  const startAt = useMemo(() => mergeDateAndTime(day, time), [day, time]);
  const endAt = useMemo(
    () => addMinutes(startAt, durationMin || 60),
    [startAt, durationMin],
  );

  const deadlineSummary = useMemo(
    () => formatDeadlineSummary(fechaVencimiento),
    [fechaVencimiento],
  );

  const handleEndTimeChange = (newEnd) => {
    if (!newEnd || !onDurationChange) return;
    const start = mergeDateAndTime(day, time);
    let mins = differenceInMinutes(newEnd, start);
    if (mins < 5) mins = 5;
    onDurationChange(mins);
  };

  const handleAllDayChange = (checked) => {
    onAllDayChange?.(checked);
    if (checked) {
      setStartOpen(false);
      setEndOpen(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <TaskFormRow icon={TaskFormIcons.schedule} showDivider={false}>
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.75} useFlexGap>
            <TaskFormPillButton
              ref={datePillRef}
              onClick={() => setDateOpen(true)}
              aria-label="Cambiar fecha"
            >
              {formatDatePill(day)}
            </TaskFormPillButton>

            {showTimePills && (
              <>
                <TaskFormPillButton
                  ref={startPillRef}
                  onClick={() => setStartOpen(true)}
                  aria-label="Hora de inicio"
                >
                  {formatTimePill(time)}
                </TaskFormPillButton>
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ px: 0.25, userSelect: 'none' }}
                >
                  –
                </Typography>
                <TaskFormPillButton
                  ref={endPillRef}
                  onClick={() => setEndOpen(true)}
                  aria-label="Hora de fin"
                >
                  {formatTimePill(endAt)}
                </TaskFormPillButton>
              </>
            )}
          </Stack>

          {onAllDayChange && (
            <FormControlLabel
              control={(
                <Checkbox
                  size="small"
                  checked={allDay}
                  onChange={(e) => handleAllDayChange(e.target.checked)}
                  sx={{ py: 0.25 }}
                />
              )}
              label="Todo el día"
              sx={{
                ml: 0,
                mr: 0,
                alignItems: 'center',
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                },
              }}
            />
          )}

          {showRecurrence && (
            <TaskFormRecurrencePicker
              value={recurrenceRrule}
              onChange={onRecurrenceChange}
            />
          )}
        </Stack>
      </TaskFormRow>

      <PickerPopover
        open={dateOpen}
        anchorEl={datePillRef.current}
        onClose={() => setDateOpen(false)}
      >
        <PopoverInlineDatePicker
          value={day}
          onChange={(v) => {
            if (v) {
              onDayChange(startOfDay(v));
              setDateOpen(false);
            }
          }}
        />
      </PickerPopover>

      {showTimePills && (
        <>
          <PickerPopover
            open={startOpen}
            anchorEl={startPillRef.current}
            onClose={() => setStartOpen(false)}
          >
            <PopoverInlineTimePicker
              value={time}
              onChange={(v) => {
                if (v) onTimeChange(v);
              }}
            />
          </PickerPopover>

          <PickerPopover
            open={endOpen}
            anchorEl={endPillRef.current}
            onClose={() => setEndOpen(false)}
          >
            <PopoverInlineTimePicker
              value={endAt}
              onChange={(v) => {
                if (v) handleEndTimeChange(v);
              }}
            />
          </PickerPopover>
        </>
      )}

      {showVencimiento && onFechaVencimientoChange && (
        <TaskFormRow icon={TaskFormIcons.deadline} showDivider={false}>
          {!deadlineExpanded && !fechaVencimiento ? (
            <TaskFormPrimaryLine onClick={() => setDeadlineExpanded(true)}>
              Agregar fecha límite
            </TaskFormPrimaryLine>
          ) : (
            <Box sx={{ width: '100%' }}>
              {deadlineSummary && !deadlineExpanded ? (
                <>
                  <TaskFormPrimaryLine onClick={() => setDeadlineExpanded(true)}>
                    {deadlineSummary}
                  </TaskFormPrimaryLine>
                  <TaskFormSecondaryLine>Fecha límite</TaskFormSecondaryLine>
                </>
              ) : (
                <>
                  <TaskFormSectionLabel>Fecha límite</TaskFormSectionLabel>
                  <TaskFormPillButton
                    ref={deadlinePillRef}
                    onClick={() => setDeadlineOpen(true)}
                    aria-label="Fecha límite"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {fechaVencimiento
                      ? formatDeadlineSummary(fechaVencimiento)
                      : 'Elegir fecha'}
                  </TaskFormPillButton>
                  <PickerPopover
                    open={deadlineOpen}
                    anchorEl={deadlinePillRef.current}
                    onClose={() => setDeadlineOpen(false)}
                  >
                    <PopoverInlineDatePicker
                      value={fechaVencimiento}
                      onChange={(v) => {
                        onFechaVencimientoChange(v);
                        if (v) setDeadlineExpanded(true);
                        setDeadlineOpen(false);
                      }}
                    />
                  </PickerPopover>
                </>
              )}
            </Box>
          )}
        </TaskFormRow>
      )}
    </LocalizationProvider>
  );
}
