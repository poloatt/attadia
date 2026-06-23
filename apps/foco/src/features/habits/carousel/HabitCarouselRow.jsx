import React, { useMemo, useRef } from 'react';
import { useRutinas, useHabits } from '@shared/context';
import {
  buildHabitSectionIconsMap,
  resolveRutinaForDate,
} from '@shared/utils/habitSectionIcons';
import { getNormalizedToday } from '@shared/utils/dateUtils';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { isSameDay } from 'date-fns';
import useHorizontalDragScroll from './hooks/useHorizontalDragScroll';
import useCarouselRutinaBoot from './hooks/useCarouselRutinaBoot';
import useHabitCarouselItems from './useHabitCarouselItems';
import useHabitCarouselToggle from './useHabitCarouselToggle';
import HabitCarouselIconRow from './HabitCarouselIconRow';

/**
 * Carrusel de hábitos embebido (Ahora / Luego).
 * @param {'ahora'|'luego'} mode
 */
export default function HabitCarouselRow({
  mode = 'ahora',
  variant = 'iconsRow',
  dense = true,
  showDividers = true,
  enableDragScroll = true,
  interactive = true,
  targetDate,
}) {
  const {
    rutina,
    rutinas,
    loading: rutinasLoading,
    error: rutinasError,
    markItemComplete,
    patchRutinaSection,
  } = useRutinas();
  const { habits, loading: habitsLoading } = useHabits();
  const carouselRef = useRef(null);

  const { scrollRef, dragRef, isDragging, bind } = useHorizontalDragScroll({
    enabled: enableDragScroll,
    thresholdPx: 12,
  });

  const resolvedTargetDate = useMemo(
    () => targetDate || getNormalizedToday(),
    [targetDate],
  );
  const isTargetToday = useMemo(
    () => isSameDay(resolvedTargetDate, getNormalizedToday()),
    [resolvedTargetDate],
  );
  const currentTimeOfDay = isTargetToday ? getCurrentTimeOfDay() : 'MAÑANA';
  const isInteractive = interactive && isTargetToday;

  const rutinaHoy = useMemo(
    () => resolveRutinaForDate({ rutina, rutinas, targetDate: resolvedTargetDate }),
    [rutina, rutinas, resolvedTargetDate],
  );

  useCarouselRutinaBoot(resolvedTargetDate);

  const sectionIconsMap = useMemo(
    () => buildHabitSectionIconsMap(habits),
    [habits],
  );

  const hasConfiguredHabits = useMemo(
    () => Object.values(habits || {}).some(
      (section) => Array.isArray(section) && section.some((h) => h?.activo !== false),
    ),
    [habits],
  );

  const { pendingItems, carouselItems, shouldUseInfiniteCarousel } = useHabitCarouselItems(mode, {
    rutinaHoy,
    sectionIconsMap,
    habits,
    currentTimeOfDay,
  });

  const handleToggle = useHabitCarouselToggle({
    mode,
    interactive: isInteractive,
    dragRef,
    rutinaHoy,
    markItemComplete,
    patchRutinaSection,
    currentTimeOfDay,
  });

  return (
    <HabitCarouselIconRow
      mode={mode}
      variant={variant}
      dense={dense}
      showDividers={showDividers}
      enableDragScroll={enableDragScroll}
      interactive={isInteractive}
      carouselItems={carouselItems}
      pendingItems={pendingItems}
      shouldUseInfiniteCarousel={shouldUseInfiniteCarousel}
      rutinaHoy={rutinaHoy}
      sectionIconsMap={sectionIconsMap}
      currentTimeOfDay={currentTimeOfDay}
      rutinasLoading={rutinasLoading}
      habitsLoading={habitsLoading}
      rutinasError={rutinasError}
      hasConfiguredHabits={hasConfiguredHabits}
      scrollRef={scrollRef}
      carouselRef={carouselRef}
      isDragging={isDragging}
      bind={bind}
      onToggle={handleToggle}
    />
  );
}
