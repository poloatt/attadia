import React, { useMemo } from 'react';

import { Box } from '@mui/material';

import { ALL_DAY_MAX_VISIBLE, calendarScrollAreaSx } from './calendarLayout';

import { splitEventsByDay } from './taskCalendarUtils';

import FocoTimeGrid from './FocoTimeGrid';

import FocoCalendarDateHeader from './FocoCalendarDateHeader';

import FocoCalendarContextBar from './FocoCalendarContextBar';

import FocoAllDayLane from './FocoAllDayLane';

import { useFocoSwipeNavigate } from './useFocoSwipeNavigate';



import CalendarDndContext from './dnd/CalendarDndContext';

export default function FocoDayView({

  date,

  events = [],

  onEventClick,

  onToggleComplete,

  onSlotClick,

  onEventMove,

  agendaView = 'ahora',

  showRutinaStrip = true,

  viewMode = 'day',

}) {

  const swipeRef = useFocoSwipeNavigate(viewMode);

  const dayEvents = useMemo(() => splitEventsByDay(events, date), [events, date]);

  const allDayEvents = dayEvents.filter((ev) => ev.allDay);

  const timedEvents = dayEvents.filter((ev) => !ev.allDay);



  return (

    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      <Box

        sx={{

          flexShrink: 0,

          borderBottom: 1,

          borderColor: 'divider',

          bgcolor: 'background.default',

        }}

      >

        <FocoCalendarDateHeader date={date} viewMode={viewMode} />

        <FocoAllDayLane

          events={allDayEvents}

          maxVisible={ALL_DAY_MAX_VISIBLE}

          onEventClick={onEventClick}

          onToggleComplete={onToggleComplete}

          compact

        />

      </Box>



      {showRutinaStrip && (

        <FocoCalendarContextBar targetDate={date} agendaView={agendaView} />

      )}



      <Box

        ref={swipeRef}

        sx={{

          ...calendarScrollAreaSx,

          touchAction: 'pan-y',

          flex: 1,

          minHeight: 0,

        }}

      >

        <CalendarDndContext onEventMove={onEventMove} enabled={Boolean(onEventMove)}>

          <FocoTimeGrid

            day={date}

            timedEvents={timedEvents}

            onSlotClick={onSlotClick}

            onEventClick={onEventClick}

            onToggleComplete={onToggleComplete}

            dndEnabled={Boolean(onEventMove)}

          />

        </CalendarDndContext>

      </Box>

    </Box>

  );

}


