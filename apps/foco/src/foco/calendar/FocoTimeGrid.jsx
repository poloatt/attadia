import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { isSameDay, isToday } from 'date-fns';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  getGridHeightPx,
  HOUR_LABELS,
  SLOT_HEIGHT_PX,
  TIME_COLUMN_WIDTH,
} from './calendarLayout';
import FocoEventBlock from './FocoEventBlock';
import {
  clampEventToDay,
  formatHourLabel,
  layoutTimedEventsForDay,
} from './taskCalendarUtils';

function NowIndicator() {
  const theme = useTheme();
  const now = new Date();
  const hour = now.getHours();
  if (hour < DAY_START_HOUR || hour > DAY_END_HOUR) return null;

  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const nowMins = (hour - DAY_START_HOUR) * 60 + now.getMinutes();
  const topPct = (nowMins / totalMinutes) * 100;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${topPct}%`,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          height: 2,
          bgcolor: theme.palette.error.main,
          borderRadius: 1,
        }}
      />
    </Box>
  );
}

export default function FocoTimeGrid({
  day,
  timedEvents = [],
  onSlotClick,
  onEventClick,
  onToggleComplete,
  showNowIndicator = true,
  showTimeColumn = true,
}) {
  const theme = useTheme();
  const gridHeight = getGridHeightPx();
  const isDayToday = isToday(day);

  const dayTimed = timedEvents
    .filter((ev) => !ev.allDay)
    .map((ev) => clampEventToDay(ev, day))
    .filter((ev) => isSameDay(ev.start, day));

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
      {showTimeColumn && (
        <Box
          sx={{
            width: TIME_COLUMN_WIDTH,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            position: 'relative',
            height: gridHeight,
          }}
        >
          {HOUR_LABELS.map((hour) => (
            <Box
              key={hour}
              sx={{
                height: SLOT_HEIGHT_PX,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                pr: 0.5,
                pt: 0.25,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {formatHourLabel(hour)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          position: 'relative',
          height: gridHeight,
        }}
      >
        {HOUR_LABELS.map((hour) => (
          <Box
            key={`slot-${hour}`}
            onClick={() => onSlotClick?.(day, hour)}
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (hour - DAY_START_HOUR) * SLOT_HEIGHT_PX,
              height: SLOT_HEIGHT_PX,
              borderTop: 1,
              borderColor: 'divider',
              cursor: onSlotClick ? 'pointer' : 'default',
              '&:hover': onSlotClick
                ? { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                : undefined,
            }}
          />
        ))}

        {showNowIndicator && isDayToday && <NowIndicator />}

        {layoutTimedEventsForDay(dayTimed).map(({ event: ev, style }, idx) => (
          <Box
            key={`${ev.task._id || ev.task.id || 'ev'}-${idx}`}
            sx={{
              position: 'absolute',
              top: style.top,
              height: style.height,
              left: style.left,
              width: style.width,
              zIndex: 1,
              overflow: 'hidden',
            }}
          >
            <FocoEventBlock
              event={ev}
              compact
              onClick={onEventClick}
              onToggleComplete={onToggleComplete}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
