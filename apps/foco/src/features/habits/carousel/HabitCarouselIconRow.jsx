import React, { useEffect, useRef, useCallback, memo, useState, useMemo } from 'react';
import { Box, CircularProgress, Collapse, IconButton, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { resolveCarouselItemConfig } from '@shared/utils/habitVisibilityEngine';
import { getHabitSlotCopy } from '@shared/copy/agendaTerminology';
import HabitCarouselEmptyState from './HabitCarouselEmptyState';
import HabitCarouselIconButton from './HabitCarouselIconButton';
import { getHabitCarouselSurface } from './habitCarouselSurface';
import useHorizontalDragScroll from './hooks/useHorizontalDragScroll';

const MotionBox = motion.create(Box);

export { HabitCarouselIconButton };

function HabitCarouselScrollTrack({
  itemCount,
  fadeColor,
  theme,
  scrollTrackSx,
  enableDragScroll = true,
  bind = {},
  mergeScrollRef,
  observeKey = '',
  centerWhenFits = false,
  children,
}) {
  const edgeFadeRef = useRef(null);
  const [edgeState, setEdgeState] = useState({
    hasOverflow: false,
    atStart: true,
    atEnd: true,
    hintLeft: false,
    hintRight: false,
  });

  const updateEdgeState = useCallback(() => {
    const node = edgeFadeRef.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    const hasOverflow = scrollWidth > clientWidth + 2;
    const atStart = scrollLeft <= 4;
    const atEnd = scrollLeft >= scrollWidth - clientWidth - 4;
    setEdgeState({
      hasOverflow,
      atStart,
      atEnd,
      hintLeft: hasOverflow && !atStart,
      hintRight: hasOverflow && !atEnd,
    });
  }, []);

  useEffect(() => {
    const node = edgeFadeRef.current;
    if (!node) return undefined;
    updateEdgeState();
    node.addEventListener('scroll', updateEdgeState, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateEdgeState())
      : null;
    ro?.observe(node);
    return () => {
      node.removeEventListener('scroll', updateEdgeState);
      ro?.disconnect();
    };
  }, [itemCount, observeKey, updateEdgeState]);

  const showStartCap = edgeState.hasOverflow && edgeState.atStart;
  const showEndCap = edgeState.hasOverflow && edgeState.atEnd;

  const trackSx = useMemo(() => ({
    ...scrollTrackSx,
    justifyContent: centerWhenFits && !edgeState.hasOverflow ? 'center' : 'flex-start',
  }), [scrollTrackSx, centerWhenFits, edgeState.hasOverflow]);

  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        borderLeft: showStartCap ? `2px solid ${alpha(theme.palette.primary.main, 0.45)}` : 'none',
        borderRight: showEndCap ? `2px solid ${alpha(theme.palette.text.disabled, 0.35)}` : 'none',
        borderRadius: (showStartCap || showEndCap) ? 0.5 : 0,
        pl: showStartCap ? 0.5 : 0,
        pr: showEndCap ? 0.5 : 0,
        transition: 'border-color 0.15s ease, padding 0.15s ease',
      }}
    >
      {edgeState.hintLeft && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 20,
            zIndex: 2,
            pointerEvents: 'none',
            background: `linear-gradient(to right, ${fadeColor}, transparent)`,
          }}
        />
      )}
      {edgeState.hintRight && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 20,
            zIndex: 2,
            pointerEvents: 'none',
            background: `linear-gradient(to left, ${fadeColor}, transparent)`,
          }}
        />
      )}
      <Box
        sx={trackSx}
        ref={(node) => {
          edgeFadeRef.current = node;
          mergeScrollRef?.(node);
        }}
        {...(enableDragScroll ? bind : {})}
      >
        {children}
      </Box>
    </Box>
  );
}

function renderCarouselIcon({
  entry,
  index,
  sectionIconsMap,
  rutinaHoy,
  habitsPreferences,
  currentTimeOfDay,
  mode,
  dense,
  interactive,
  showCompletionState,
  bg,
  hoverBg,
  rail,
  size,
  onToggle,
  keySuffix = '',
}) {
  const { section, itemId, horario } = entry;
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
  const uniqueKey = `${section}.${itemId}.${horario || 'none'}${keySuffix ? `.${keySuffix}` : ''}.${index}`;

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
}

/**
 * Shell compartido del carrusel: drag scroll, íconos, bordes finitos.
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
  completedTodayItems = [],
  showCompletedToggle = false,
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
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  const completedDrag = useHorizontalDragScroll({ enabled: enableDragScroll });

  const { size, bg, hoverBg, rail, dividerColor } = getHabitCarouselSurface(theme, { dense });
  const panelBg = theme.palette.background.default;
  const fadeColor = panelBg;

  const handleConfigure = useCallback(() => {
    if (onConfigure) {
      onConfigure();
      return;
    }
    window.dispatchEvent(new CustomEvent('openHabitTemplates'));
  }, [onConfigure]);

  const handleCompletedToggle = useCallback((section, itemId, horario) => {
    if (completedDrag.dragRef.current.moved) return;
    onToggle?.(section, itemId, horario);
  }, [onToggle, completedDrag.dragRef]);

  const hasPending = pendingItems.length > 0;
  const hasCompleted = completedTodayItems.length > 0;
  const showToggle = showCompletedToggle && hasCompleted;

  const showCompletionState = mode === 'ahora';
  const slotCopy = getHabitSlotCopy(mode);

  const scrollTrackSx = useMemo(() => ({
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: dense ? 0.25 : 0.5,
    overflowX: 'auto',
    overflowY: 'hidden',
    touchAction: 'pan-x',
    overscrollBehaviorX: 'contain',
    WebkitOverflowScrolling: 'touch',
    cursor: enableDragScroll ? (isDragging ? 'grabbing' : 'grab') : 'auto',
    userSelect: enableDragScroll ? 'none' : 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  }), [dense, enableDragScroll, isDragging]);

  const completedScrollTrackSx = useMemo(() => ({
    ...scrollTrackSx,
    cursor: enableDragScroll
      ? (completedDrag.isDragging ? 'grabbing' : 'grab')
      : 'auto',
  }), [scrollTrackSx, enableDragScroll, completedDrag.isDragging]);

  if (variant !== 'iconsRow') return null;

  if (!hasPending && !hasCompleted) {
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

  const renderIconsRow = (items, { keySuffix, completionState, rowInteractive, rowOnToggle } = {}) => (
    <AnimatePresence mode="popLayout">
      {items.map((entry, index) => renderCarouselIcon({
        entry,
        index,
        sectionIconsMap,
        rutinaHoy,
        habitsPreferences,
        currentTimeOfDay,
        mode,
        dense,
        interactive: rowInteractive ?? interactive,
        showCompletionState: completionState ?? showCompletionState,
        bg,
        hoverBg,
        rail,
        size,
        onToggle: rowOnToggle ?? onToggle,
        keySuffix,
      }))}
    </AnimatePresence>
  );

  return (
    <Box
      role="region"
      aria-label={slotCopy.regionAriaLabel}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        pt: dense ? 0.25 : 0.5,
        pb: dense ? 0.25 : 0,
        ...(showDividers && {
          borderTop: '1px solid',
          borderColor: dividerColor,
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, minWidth: 0 }}>
        {hasPending ? (
          <HabitCarouselScrollTrack
            itemCount={pendingItems.length}
            fadeColor={fadeColor}
            theme={theme}
            scrollTrackSx={scrollTrackSx}
            enableDragScroll={enableDragScroll}
            centerWhenFits
            bind={bind}
            mergeScrollRef={(node) => {
              scrollRef.current = node;
              carouselRef.current = node;
            }}
          >
            {renderIconsRow(pendingItems)}
          </HabitCarouselScrollTrack>
        ) : (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              minHeight: size + 4,
              px: 0.5,
              color: 'text.secondary',
              typography: 'caption',
            }}
          >
            Todo al día
          </Box>
        )}

        {showToggle && (
          <Tooltip title={showCompletedPanel ? 'Ocultar completados hoy' : 'Ver completados hoy'}>
            <IconButton
              size="small"
              onClick={() => setShowCompletedPanel((open) => !open)}
              aria-expanded={showCompletedPanel}
              aria-label={showCompletedPanel ? 'Ocultar hábitos completados hoy' : 'Mostrar hábitos completados hoy'}
              sx={{
                alignSelf: 'center',
                flexShrink: 0,
                color: showCompletedPanel ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.primary, 0.06),
                },
              }}
            >
              {showCompletedPanel ? (
                <UnfoldLessIcon sx={{ fontSize: '1.1rem' }} />
              ) : (
                <UnfoldMoreIcon sx={{ fontSize: '1.1rem' }} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Collapse in={showCompletedPanel && hasCompleted} unmountOnExit>
        <Box
          sx={{
            borderTop: `1px solid ${rail}`,
            pt: 0.5,
            pb: 0.25,
          }}
        >
          <HabitCarouselScrollTrack
            itemCount={completedTodayItems.length}
            observeKey={showCompletedPanel ? 'open' : 'closed'}
            fadeColor={fadeColor}
            theme={theme}
            scrollTrackSx={completedScrollTrackSx}
            enableDragScroll={enableDragScroll}
            bind={completedDrag.bind}
            mergeScrollRef={(node) => {
              completedDrag.scrollRef.current = node;
            }}
          >
            {renderIconsRow(completedTodayItems, {
              keySuffix: 'done',
              completionState: true,
              rowOnToggle: handleCompletedToggle,
            })}
          </HabitCarouselScrollTrack>
        </Box>
      </Collapse>
    </Box>
  );
}

export default memo(HabitCarouselIconRow);
