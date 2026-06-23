import React, { useEffect, useRef, useCallback, memo } from 'react';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import { getHorarioToShow } from '@shared/utils/habitTimeLogic';
import HabitCarouselEmptyState from './HabitCarouselEmptyState';

const MotionBox = motion(Box);

function HabitCarouselIconButton({
  section,
  itemId,
  Icon,
  label,
  itemConfig,
  itemValue,
  currentTimeOfDay,
  rutinaHoy,
  dense,
  interactive,
  showCompletionState,
  bg,
  hoverBg,
  rail,
  size,
  onToggle,
}) {
  const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
  const completadoHoy = itemValue !== undefined ? itemValue : false;
  const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
  const frecuencia = Number(itemConfig.frecuencia || 1);

  const horarioToShow = getHorarioToShow(
    horariosConfig,
    currentTimeOfDay,
    completadoHoy,
    tipo,
    frecuencia,
  );

  const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
  const isBooleanFormat = typeof itemValue === 'boolean';
  const hasMultipleHorarios = horariosConfig.length > 1;

  let isCompleted = false;
  if (showCompletionState) {
    if (hasMultipleHorarios && isObjectFormat && horarioToShow) {
      isCompleted = itemValue[horarioToShow] === true;
    } else if (hasMultipleHorarios && isObjectFormat) {
      isCompleted = Object.values(itemValue).some(Boolean);
    } else if (isObjectFormat) {
      isCompleted = Object.values(itemValue).some(Boolean);
    } else if (isBooleanFormat) {
      isCompleted = itemValue === true;
    }
  }

  const statusLabel = isCompleted ? 'completado' : 'pendiente';

  return (
    <Tooltip title={label} arrow placement="top">
      <span style={{ display: 'inline-flex' }}>
        <HabitCounterBadge
          config={itemConfig}
          currentTimeOfDay={currentTimeOfDay}
          size={dense ? 'small' : 'medium'}
          rutina={rutinaHoy}
          section={section}
          itemId={itemId}
        >
          <IconButton
            size="small"
            disabled={!interactive}
            aria-label={`${label}, ${statusLabel}`}
            aria-pressed={isCompleted}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(section, itemId);
            }}
            sx={{
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
              p: 0,
              borderRadius: '50%',
              bgcolor: isCompleted ? 'action.selected' : bg,
              color: isCompleted ? 'primary.main' : 'text.secondary',
              border: '1px solid',
              borderColor: isCompleted ? 'primary.main' : rail,
              flex: '0 0 auto',
              touchAction: 'pan-x',
              transition: showCompletionState ? 'all 0.2s ease' : undefined,
              '&:hover': {
                bgcolor: isCompleted ? 'action.selected' : hoverBg,
                color: isCompleted ? 'primary.main' : 'text.primary',
              },
            }}
          >
            <Icon sx={{ fontSize: dense ? '1.1rem' : '1.2rem' }} />
          </IconButton>
        </HabitCounterBadge>
      </span>
    </Tooltip>
  );
}

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

  const size = dense ? 32 : 36;
  const surfaceBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.035)
    : alpha(theme.palette.common.black, 0.03);
  const dividerColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.10)
    : alpha(theme.palette.common.black, 0.10);
  const bg = surfaceBg;
  const hoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.055)
    : alpha(theme.palette.common.black, 0.045);
  const rail = dividerColor;

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

  return (
    <Box
      role="region"
      aria-label={mode === 'luego' ? 'Hábitos para más tarde' : 'Hábitos para ahora'}
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
        {(shouldUseInfiniteCarousel ? carouselItems : uniqueItems).map(({ section, itemId }, index) => {
          const Icon = sectionIconsMap.iconsMap[section]?.[itemId];
          const label = sectionIconsMap.labelsMap[section]?.[itemId] || itemId;
          if (!Icon) return null;

          const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
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
