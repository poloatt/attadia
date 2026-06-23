import React, { useEffect, useRef, useCallback, memo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveCarouselItemConfig } from '@shared/utils/habitVisibilityEngine';
import { getHabitSlotCopy } from '@shared/copy/agendaTerminology';
import HabitCarouselEmptyState from './HabitCarouselEmptyState';
import HabitCarouselIconButton from './HabitCarouselIconButton';
import { getHabitCarouselSurface } from './habitCarouselSurface';

const MotionBox = motion.create(Box);

export { HabitCarouselIconButton };

/**
 * Shell compartido del carrusel: drag scroll, íconos, efecto infinito.
 * @param {'ahora'|'luego'} mode
 */
function HabitCarouselIconRow({
  mode = 'ahora',
  variant = 'iconsRow',
  dense = true,
  showDividers = true,
  enableDragScroll = true,
  interactive = true,
  carouselItems,
  pendingItems,
  shouldUseInfiniteCarousel,
  rutinaHoy,
  sectionIconsMap,
  habitsPreferences = {},
  currentTimeOfDay,
  rutinasLoading,
  habitsLoading,
  rutinasError,
  hasConfiguredHabits = true,
  scrollRef,
  carouselRef,
  isDragging,
  bind,
  onToggle,
  onConfigure,
}) {
  const theme = useTheme();
  const isScrollingRef = useRef(false);

  const { size, bg, hoverBg, rail, dividerColor } = getHabitCarouselSurface(theme, { dense });

  const handleConfigure = useCallback(() => {
    if (onConfigure) {
      onConfigure();
      return;
    }
    window.dispatchEvent(new CustomEvent('openHabitTemplates'));
  }, [onConfigure]);

  useEffect(() => {
    if (!shouldUseInfiniteCarousel || !carouselRef.current) return;

    const container = carouselRef.current;

    const initCarousel = () => {
      const scrollWidth = container.scrollWidth;
      const setWidth = scrollWidth / 3;
      container.scrollLeft = setWidth;
    };

    requestAnimationFrame(() => {
      setTimeout(initCarousel, 100);
    });

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const setWidth = scrollWidth / 3;
      const startPosition = setWidth;
      const endPosition = setWidth * 2;

      if (scrollLeft >= endPosition - 50) {
        isScrollingRef.current = true;
        container.scrollLeft = startPosition + (scrollLeft - endPosition);
        setTimeout(() => { isScrollingRef.current = false; }, 50);
      } else if (scrollLeft <= 50) {
        isScrollingRef.current = true;
        container.scrollLeft = endPosition - (50 - scrollLeft);
        setTimeout(() => { isScrollingRef.current = false; }, 50);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [shouldUseInfiniteCarousel, pendingItems.length, carouselRef]);

  if (variant !== 'iconsRow') return null;

  if (carouselItems.length === 0) {
    if (rutinasLoading || habitsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 36 }}>
          <CircularProgress size={18} aria-label="Cargando hábitos" />
        </Box>
      );
    }

    if (rutinasError) {
      return <HabitCarouselEmptyState variant="error" mode={mode} />;
    }

    if (!hasConfiguredHabits) {
      return (
        <HabitCarouselEmptyState
          variant="noHabits"
          mode={mode}
          onConfigure={handleConfigure}
        />
      );
    }

    return <HabitCarouselEmptyState variant="allDone" mode={mode} />;
  }

  const showCompletionState = mode === 'ahora';
  const uniqueItems = shouldUseInfiniteCarousel ? carouselItems : pendingItems;

  const slotCopy = getHabitSlotCopy(mode);

  return (
    <Box
      role="region"
      aria-label={slotCopy.regionAriaLabel}
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dense ? 0.25 : 0.5,
        pt: dense ? 0.25 : 0.5,
        pb: dense ? 0.25 : 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        touchAction: 'pan-x',
        cursor: enableDragScroll ? (isDragging ? 'grabbing' : 'grab') : 'auto',
        userSelect: enableDragScroll ? 'none' : 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        ...(showDividers && {
          borderTop: '1px solid',
          borderColor: dividerColor,
        }),
      }}
      ref={(node) => {
        scrollRef.current = node;
        carouselRef.current = node;
      }}
      {...bind}
    >
      <AnimatePresence mode="popLayout">
        {(shouldUseInfiniteCarousel ? carouselItems : uniqueItems).map(({ section, itemId, horario }, index) => {
          const Icon = sectionIconsMap.iconsMap[section]?.[itemId];
          const label = sectionIconsMap.labelsMap[section]?.[itemId] || itemId;
          if (!Icon) return null;

          const itemConfig = resolveCarouselItemConfig(
            section,
            itemId,
            rutinaHoy,
            habitsPreferences,
          );
          const itemValue = rutinaHoy?.[section]?.[itemId];
          const uniqueKey = shouldUseInfiniteCarousel
            ? `${section}.${itemId}.${index}`
            : `${section}.${itemId}`;

          return (
            <MotionBox
              key={uniqueKey}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              sx={{ display: 'inline-flex', flex: '0 0 auto' }}
            >
              <HabitCarouselIconButton
                section={section}
                itemId={itemId}
                Icon={Icon}
                label={label}
                itemConfig={itemConfig}
                itemValue={itemValue}
                currentTimeOfDay={currentTimeOfDay}
                rutinaHoy={rutinaHoy}
                mode={mode}
                displayHorario={horario || null}
                dense={dense}
                interactive={interactive}
                showCompletionState={showCompletionState}
                bg={bg}
                hoverBg={hoverBg}
                rail={rail}
                size={size}
                onToggle={onToggle}
              />
            </MotionBox>
          );
        })}
      </AnimatePresence>
    </Box>
  );
}

export default memo(HabitCarouselIconRow);
