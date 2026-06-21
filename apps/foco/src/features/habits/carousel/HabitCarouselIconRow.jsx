import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import { getHorarioToShow } from '@shared/utils/habitTimeLogic';

/**
 * Shell compartido del carrusel: drag scroll, íconos, efecto infinito.
 * @param {'ahora'|'luego'} mode
 */
export default function HabitCarouselIconRow({
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
  scrollRef,
  carouselRef,
  isDragging,
  bind,
  onToggle,
}) {
  const theme = useTheme();
  const isScrollingRef = useRef(false);

  const size = dense ? 28 : 32;
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

  useEffect(() => {
    if (!shouldUseInfiniteCarousel || !carouselRef.current) return;

    const container = carouselRef.current;

    const initCarousel = () => {
      const scrollWidth = container.scrollWidth;
      const setWidth = scrollWidth / 3;
      const startPosition = setWidth;
      container.scrollLeft = startPosition;
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
          <CircularProgress size={18} />
        </Box>
      );
    }
    return null;
  }

  const showCompletionState = mode === 'ahora';

  return (
    <Box
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
      {carouselItems.map(({ section, itemId }, index) => {
        const Icon = sectionIconsMap.iconsMap[section]?.[itemId];
        const label = sectionIconsMap.labelsMap[section]?.[itemId] || itemId;
        if (!Icon) return null;

        const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
        const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
        const itemValue = rutinaHoy?.[section]?.[itemId];
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

        const uniqueKey = shouldUseInfiniteCarousel
          ? `${section}.${itemId}.${index}`
          : `${section}.${itemId}`;

        return (
          <Tooltip key={uniqueKey} title={label} arrow placement="top">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(section, itemId);
                  }}
                  sx={{
                    width: size,
                    height: size,
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
      })}
    </Box>
  );
}
