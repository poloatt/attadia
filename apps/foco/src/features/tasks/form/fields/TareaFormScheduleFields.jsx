import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { addMinutes, differenceInMinutes, isSameDay, startOfDay } from 'date-fns';
import { isSameDayAsToday } from '@shared/utils/agendaRules';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { mergeDateAndTime, formatDatePill, formatTimePill } from '../utils/tareaFormDateUtils';
import {
  TareaFormRow,
  TareaFormAllDaySwitch,
  TareaFormPillButton,
  tareaFormDatePillSx,
  tareaFormPillRowSx,
  tareaFormScheduleStackSx,
  tareaFormTimeSeparatorSx,
  tareaFormRowWithActionSx,
  tareaFormRowContentGutterSx,
  tareaFormHeaderActionSpacerSx,
  TAREA_FORM_PILL_GAP,
} from '@shared/components/forms/tareaFormUi';
import { TareaFormIcons } from '@shared/components/forms/tareaFormIcons';
import { TareaFormDeadlineClearButton, TareaFormDeadlinePill } from './TareaFormDeadlineField';
import { PickerPopover, PopoverInlineDatePicker, PopoverInlineTimePicker } from '@shared/components/forms/tareaFormPickers';

/**
 * Fecha, hora inicio–fin y todo el día (pills estilo Google Calendar).
 */
export default function TareaFormScheduleFields({
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

  const showDeadlineRow = showDeadline && !allDay;
  const endTimeBesideDeadline = showDeadlineRow && Boolean(deadline);
  const showEndTimeOnRow1 = showTimePills && !endTimeBesideDeadline;

  const endTimeAt = useMemo(() => {
    if (!deadline) return endAt;
    const hasExplicitTime = deadline.getHours() !== 0 || deadline.getMinutes() !== 0;
    if (hasExplicitTime) return deadline;
    return mergeDateAndTime(startOfDay(deadline), endAt);
  }, [deadline, endAt]);

  const handleEndTimeChange = (newEnd) => {
    if (!newEnd) return;

    if (deadline && onDeadlineChange) {
      onDeadlineChange(mergeDateAndTime(startOfDay(deadline), newEnd));
      if (onDurationChange && isSameDay(startOfDay(deadline), startOfDay(day))) {
        const start = mergeDateAndTime(day, time);
        let mins = differenceInMinutes(newEnd, start);
        if (mins < 5) mins = 5;
        onDurationChange(mins);
      }
      return;
    }

    if (!onDurationChange) return;
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
    if (!v) {
      onDeadlineChange?.(null);
      return;
    }
    const preservedTime = deadline || endAt;
    onDeadlineChange?.(mergeDateAndTime(startOfDay(v), preservedTime));
    enableTimedScheduleIfToday(v);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <TareaFormRow icon={TareaFormIcons.schedule} showDivider={false} align="flex-start">
        <Stack spacing={TAREA_FORM_PILL_GAP} sx={tareaFormScheduleStackSx}>
          <Box sx={tareaFormRowWithActionSx}>
            <Stack
              direction="row"
              flexWrap="wrap"
              alignItems="center"
              gap={TAREA_FORM_PILL_GAP}
              useFlexGap
              sx={{ flex: 1, minWidth: 0, ...tareaFormPillRowSx, width: 'auto' }}
            >
              <TareaFormPillButton
                ref={datePillRef}
                variant="schedule"
                onClick={() => setDateOpen(true)}
                aria-label="Cambiar fecha"
                sx={tareaFormDatePillSx}
              >
                {formatDatePill(day)}
              </TareaFormPillButton>

              {showTimePills && (
                <TareaFormPillButton
                  ref={startPillRef}
                  variant="schedule"
                  onClick={() => setStartOpen(true)}
                  aria-label="Hora de inicio"
                >
                  {formatTimePill(time)}
                </TareaFormPillButton>
              )}

              {showEndTimeOnRow1 && (
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    sx={tareaFormTimeSeparatorSx}
                  >
                    –
                  </Typography>
                  <TareaFormPillButton
                    ref={endPillRef}
                    variant="schedule"
                    onClick={() => setEndOpen(true)}
                    aria-label="Hora de fin"
                  >
                    {formatTimePill(endAt)}
                  </TareaFormPillButton>
                </>
              )}
            </Stack>

            {onAllDayChange ? (
              <TareaFormAllDaySwitch
                checked={allDay}
                onChange={handleAllDayChange}
                disabled={isSameDayAsToday(day)}
              />
            ) : (
              <Box sx={tareaFormHeaderActionSpacerSx} aria-hidden />
            )}
          </Box>

          {showDeadlineRow && (
            <Stack
              direction="row"
              flexWrap="wrap"
              alignItems="center"
              gap={TAREA_FORM_PILL_GAP}
              useFlexGap
              sx={{ ...tareaFormPillRowSx, ...tareaFormRowContentGutterSx }}
            >
              <TareaFormDeadlinePill
                value={deadline}
                onChange={handleDeadlineChange}
                placeholder={deadlinePlaceholder}
                showClear={!endTimeBesideDeadline}
              />
              {endTimeBesideDeadline && (
                <>
                  <TareaFormPillButton
                    ref={endPillRef}
                    variant="schedule"
                    onClick={() => setEndOpen(true)}
                    aria-label="Hora de fin"
                  >
                    {formatTimePill(endTimeAt)}
                  </TareaFormPillButton>
                  <TareaFormDeadlineClearButton onClear={() => handleDeadlineChange(null)} />
                </>
              )}
            </Stack>
          )}
        </Stack>
      </TareaFormRow>

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
      )}

      {(showEndTimeOnRow1 || endTimeBesideDeadline) && (
        <PickerPopover
          open={endOpen}
          anchorEl={endPillRef.current}
          onClose={() => setEndOpen(false)}
        >
          <PopoverInlineTimePicker
            value={endTimeAt}
            onChange={(v) => {
              if (v) handleEndTimeChange(v);
            }}
          />
        </PickerPopover>
      )}
    </LocalizationProvider>
  );
}
