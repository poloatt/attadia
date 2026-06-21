import React from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useCalendarDragEnd } from './useCalendarDragEnd';

export default function CalendarDndContext({ children, onEventMove, enabled = true }) {
  const handleDragEnd = useCalendarDragEnd(onEventMove);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  if (!enabled || !onEventMove) {
    return children;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      {children}
    </DndContext>
  );
}
