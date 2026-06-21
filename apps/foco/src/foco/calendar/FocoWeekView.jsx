import React, { useCallback, useMemo } from 'react';

import { Box, ButtonBase, Typography } from '@mui/material';

import { alpha, useTheme } from '@mui/material/styles';

import { format, isSameDay, isToday } from 'date-fns';

import { es } from 'date-fns/locale';

import { getTodayCalendarDate } from '@shared/utils/focoNavigationUtils';

import FocoWeekHeaderNavColumn from './FocoWeekHeaderNavColumn';

import {

  ALL_DAY_MAX_VISIBLE,

  calendarGridColumns,

  calendarScrollAreaSx,

  DATE_HEADER_MIN_HEIGHT,

  getGridHeightPx,

  HOUR_LABELS,

  SLOT_HEIGHT_PX,

} from './calendarLayout';

import { formatHourLabel, splitEventsByDay } from './taskCalendarUtils';

import FocoTimeGrid from './FocoTimeGrid';

import FocoCalendarContextBar from './FocoCalendarContextBar';

import FocoAllDayLane from './FocoAllDayLane';

import { useFocoSwipeNavigate } from './useFocoSwipeNavigate';



import CalendarDndContext from './dnd/CalendarDndContext';

export default function FocoWeekView({

  weekDays = [],

  events = [],

  selectedDate,

  onEventClick,

  onToggleComplete,

  onSlotClick,

  onEventMove,

  agendaView = 'ahora',

  showRutinaStrip = true,

}) {

  const swipeRef = useFocoSwipeNavigate('week');

  const theme = useTheme();

  const gridHeight = getGridHeightPx();



  const handleDayHeaderClick = useCallback(() => {

    window.dispatchEvent(new CustomEvent('navigate', {

      detail: { direction: 'today', date: getTodayCalendarDate().toISOString() },

    }));

    window.dispatchEvent(new CustomEvent('focoToggleViewMode'));

  }, []);



  const allDayByDay = useMemo(() => weekDays.map((day) => {

    const dayEv = splitEventsByDay(events, day);

    return dayEv.filter((ev) => ev.allDay);

  }), [weekDays, events]);



  const timedByDay = useMemo(() => weekDays.map((day) => {

    const dayEv = splitEventsByDay(events, day);

    return dayEv.filter((ev) => !ev.allDay);

  }), [weekDays, events]);



  return (

    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      <Box

        sx={{

          display: 'grid',

          gridTemplateColumns: calendarGridColumns(7),

          flexShrink: 0,

          minHeight: DATE_HEADER_MIN_HEIGHT,

          boxSizing: 'border-box',

          borderBottom: 1,

          borderColor: 'divider',

          alignItems: 'stretch',

        }}

      >

        <FocoWeekHeaderNavColumn selectedDate={selectedDate} />

        {weekDays.map((day, idx) => {

          const active = selectedDate && isSameDay(day, selectedDate);

          const today = isToday(day);

          const allDay = allDayByDay[idx];

          return (

            <Box

              key={day.toISOString()}

              sx={{

                display: 'flex',

                flexDirection: 'column',

                borderLeft: 1,

                borderColor: 'divider',

                minWidth: 0,

                bgcolor: today

                  ? alpha(theme.palette.primary.main, 0.12)

                  : active

                    ? alpha(theme.palette.action.selected, 0.5)

                    : 'transparent',

              }}

            >

              <ButtonBase

                onClick={handleDayHeaderClick}

                aria-label="Ir a hoy en vista diaria"

                sx={{

                  display: 'flex',

                  flexDirection: 'column',

                  alignItems: 'center',

                  justifyContent: 'center',

                  width: '100%',

                  flexShrink: 0,

                  py: 0.5,

                  borderRadius: 0,

                  '&:hover': {

                    bgcolor: alpha(theme.palette.action.hover, 0.4),

                  },

                }}

              >

                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>

                  {format(day, 'EEE', { locale: es })}

                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: today ? 700 : 500 }}>

                  {format(day, 'd')}

                </Typography>

              </ButtonBase>

              <FocoAllDayLane

                events={allDay}

                maxVisible={ALL_DAY_MAX_VISIBLE}

                onEventClick={onEventClick}

                onToggleComplete={onToggleComplete}

                compact

              />

            </Box>

          );

        })}

      </Box>



      {showRutinaStrip && (

        <FocoCalendarContextBar targetDate={selectedDate} agendaView={agendaView} />

      )}



      <Box

        ref={swipeRef}

        sx={{

          ...calendarScrollAreaSx,

          touchAction: 'pan-y',

        }}

      >

        <CalendarDndContext onEventMove={onEventMove} enabled={Boolean(onEventMove)}>

          <Box

            sx={{

              display: 'grid',

              gridTemplateColumns: calendarGridColumns(7),

              minHeight: gridHeight,

            }}

          >

            <Box sx={{ borderRight: 1, borderColor: 'divider', height: gridHeight }}>

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



            {weekDays.map((day, idx) => (

              <Box

                key={`grid-${day.toISOString()}`}

                sx={{

                  borderLeft: 1,

                  borderColor: 'divider',

                  height: gridHeight,

                  position: 'relative',

                  minWidth: 0,

                  bgcolor: isToday(day)

                    ? alpha(theme.palette.primary.main, 0.03)

                    : 'transparent',

                }}

              >

                <FocoTimeGrid

                  day={day}

                  timedEvents={timedByDay[idx]}

                  onSlotClick={onSlotClick}

                  onEventClick={onEventClick}

                  onToggleComplete={onToggleComplete}

                  showNowIndicator={isToday(day)}

                  showTimeColumn={false}

                  dndEnabled={Boolean(onEventMove)}

                />

              </Box>

            ))}

          </Box>

        </CalendarDndContext>

      </Box>

    </Box>

  );
}

