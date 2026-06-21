import React, { useMemo, useRef, useState } from 'react';
import {
  Stack,
  Typography,
} from '@mui/material';
import { addMinutes, differenceInMinutes, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { isSameDayAsToday } from '@shared/utils/agendaRules';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  TaskFormRow,
  TaskFormAllDaySwitch,
  TaskFormPillButton,
  taskFormDatePillSx,
  taskFormPillRowSx,
  taskFormScheduleStackSx,
  taskFormTimeSeparatorSx,
  TASK_FORM_PILL_GAP,
} from './taskFormUi';
import { TaskFormIcons } from './taskFormIcons';
import { TaskFormDeadlinePill } from './TaskFormDeadlineField';
import { PickerPopover, PopoverInlineDatePicker, PopoverInlineTimePicker } from './taskFormPickers';

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

/**
 * Fecha, hora inicio–fin y todo el día (pills estilo Google Calendar).
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
  showDeadline = false,
  deadline = null,
  onDeadlineChange,
  deadlinePlaceholder = 'Agregar fecha límite',
  errors = {},
}) {
  const datePillRef = useRef(null);
  const startPillRef = useRef(null);
  const endPillRef = useRef(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const scheduleToday = isSameDayAsToday(day) || (deadline && isSameDayAsToday(deadline));
  const showTimePills = !allDay && (expanded || showTimeControls || showDuration || scheduleToday);

  const startAt = useMemo(() => mergeDateAndTime(day, time), [day, time]);
  const endAt = useMemo(
    () => addMinutes(startAt, durationMin || 60),
    [startAt, durationMin],
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

  const enableTimedScheduleIfToday = (date) => {
    if (date && isSameDayAsToday(date) && allDay && onAllDayChange) {
      onAllDayChange(false);
    }
  };

  const handleDayChange = (v) => {
    if (!v) return;
    const nextDay = startOfDay(v);
    onDayChange(nextDay);
    enableTimedScheduleIfToday(nextDay);
    setDateOpen(false);
  };

  const handleDeadlineChange = (v) => {
    onDeadlineChange?.(v);
    enableTimedScheduleIfToday(v);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <TaskFormRow icon={TaskFormIcons.schedule} showDivider={false} align="flex-start">
        <Stack spacing={TASK_FORM_PILL_GAP} sx={taskFormScheduleStackSx}>
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            gap={TASK_FORM_PILL_GAP}
            useFlexGap
            sx={taskFormPillRowSx}
          >
            <TaskFormPillButton
              ref={datePillRef}
              variant="schedule"
              onClick={() => setDateOpen(true)}
              aria-label="Cambiar fecha"
              sx={taskFormDatePillSx}
            >
              {formatDatePill(day)}
            </TaskFormPillButton>

            {showTimePills && (
              <>
                <TaskFormPillButton
                  ref={startPillRef}
                  variant="schedule"
                  onClick={() => setStartOpen(true)}
                  aria-label="Hora de inicio"
                >
                  {formatTimePill(time)}
                </TaskFormPillButton>
                <Typography
                  component="span"
                  variant="body2"
                  sx={taskFormTimeSeparatorSx}
                >
                  –
                </Typography>
                <TaskFormPillButton
                  ref={endPillRef}
                  variant="schedule"
                  onClick={() => setEndOpen(true)}
                  aria-label="Hora de fin"
                >
                  {formatTimePill(endAt)}
                </TaskFormPillButton>
              </>
            )}

            {onAllDayChange && (
              <TaskFormAllDaySwitch
                checked={allDay}
                onChange={handleAllDayChange}
              />
            )}
          </Stack>

          {showDeadline && !allDay && (
            <TaskFormDeadlinePill
              value={deadline}
              onChange={handleDeadlineChange}
              placeholder={deadlinePlaceholder}
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
          onChange={handleDayChange}
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
    </LocalizationProvider>
  );
}
