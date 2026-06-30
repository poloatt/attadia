import React, { useCallback, useEffect } from 'react';
import { Box, Button, ButtonBase, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material';
import { CalendarMonthOutlined } from '@mui/icons-material';
import { isToday, startOfDay } from 'date-fns';
import { useResponsive } from '@shared/hooks';
import CalendarDateHeroContent, {
  RutinaCompletionPctChip,
  DAY_MODE_LABEL,
  getRutinaProgressBarSx,
} from '@shared/components/calendar/CalendarDateHeroContent';
import { useTheme } from '@mui/material/styles';
import {
  isViewingTodayInCalendar,
} from '@shared/utils/focoNavigationUtils';
import { formatDateForAPI, getNormalizedToday } from '@shared/utils/dateUtils';
import CalendarDatePickerPopover from './CalendarDatePickerPopover';
import AgendaCalendarNavChevrons from './AgendaCalendarNavChevrons';
import { useAgendaCalendarDatePicker } from './useAgendaCalendarDatePicker';
import { DATE_HEADER_MIN_HEIGHT } from './calendarLayout';

/** Iconos de la fila de acciones del encabezado (alineados a 26px). */
const dateHeaderIconButtonSx = {
  width: 26,
  height: 26,
  minWidth: 26,
  minHeight: 26,
  p: 0.125,
  color: 'text.secondary',
  flexShrink: 0,
  '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
};

const dateHeaderHoyButtonSx = {
  textTransform: 'none',
  flexShrink: 0,
  fontWeight: 600,
  minWidth: 0,
  minHeight: 26,
  height: 26,
  px: { xs: 0.5, sm: 0.75 },
  py: 0,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
};

/**
 * Encabezado de fecha estilo Google Calendar (Agenda móvil).
 * mode="rutina" reutiliza el mismo layout para navegar registros diarios de hábitos.
 */
export default function AgendaCalendarDateHeader({
  date,
  viewMode = 'day',
  mode = 'agenda',
  onDateClick,
  loading = false,
  viewingToday: viewingTodayProp,
  pickerOpen: pickerOpenProp,
  pickerAnchor: pickerAnchorProp,
  onPickerClose,
  onDateChange,
  navHandlers = null,
  trailingActions = null,
  completionPercentage,
  completionColor = 'primary',
  completionTooltip = '',
  dayMode = null,
  hideOuterBorder = false,
  bleedProgressBar = false,
  onGoToToday = null,
}) {
  const isRutina = mode === 'rutina';
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const showPickerActions = isRutina || isMobile;
  const {
    pickerAnchor: internalPickerAnchor,
    pickerOpen: internalPickerOpen,
    openPicker,
    closePicker,
    handleDatePicked,
  } = useAgendaCalendarDatePicker();

  const pickerOpen = pickerOpenProp ?? internalPickerOpen;
  const pickerAnchor = pickerAnchorProp ?? internalPickerAnchor;
  const closePickerHandler = onPickerClose ?? closePicker;
  const handleDatePickedHandler = onDateChange ?? handleDatePicked;

  const normalized = startOfDay(date || new Date());
  const today = isToday(normalized);
  const viewingToday = viewingTodayProp ?? isViewingTodayInCalendar(normalized, viewMode);

  const goToToday = useCallback(() => {
    if (onGoToToday) {
      onGoToToday();
      return;
    }
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: {
        direction: 'today',
        date: formatDateForAPI(getNormalizedToday()),
      },
    }));
  }, [onGoToToday]);

  const handleToggleView = useCallback(() => {
    window.dispatchEvent(new CustomEvent('agendaToggleViewMode'));
  }, []);

  useEffect(() => {
    if (!showPickerActions) return undefined;
    window.addEventListener('scroll', closePickerHandler, true);
    return () => window.removeEventListener('scroll', closePickerHandler, true);
  }, [showPickerActions, closePickerHandler]);

  const heroOnClick = isRutina ? onDateClick : handleToggleView;
  const heroTooltip = isRutina
    ? 'Elegir fecha'
    : (viewMode === 'week' ? 'Ver día' : 'Ver semana');
  const heroAriaLabel = isRutina
    ? 'Elegir fecha'
    : (viewMode === 'week' ? 'Cambiar a vista diaria' : 'Cambiar a vista semanal');

  const showProgress = isRutina && typeof completionPercentage === 'number';
  const progressValue = showProgress ? Math.min(100, Math.max(0, completionPercentage)) : 0;
  const isRutinaNarrow = isRutina && isMobile;
  const rutinaPctLabel = showProgress ? `${completionPercentage}%` : '—';

  const rutinaModeLabel = isRutina && dayMode && dayMode !== 'today'
    ? DAY_MODE_LABEL[dayMode]
    : null;

  return (
    <Box
      sx={{
        flexShrink: 0,
        minHeight: DATE_HEADER_MIN_HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 0,
        py: isRutina ? (isRutinaNarrow ? 0.5 : 0.75) : 1,
        width: '100%',
        bgcolor: 'background.default',
        borderBottom: hideOuterBorder ? 0 : (today || viewingToday ? 2 : 1),
        borderColor: today || viewingToday ? 'primary.main' : 'divider',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: isRutinaNarrow ? 'column' : 'row',
          alignItems: isRutinaNarrow ? 'stretch' : 'center',
          gap: isRutina ? { xs: 0.25, sm: 0.375 } : 0.5,
          width: '100%',
          minWidth: 0,
          overflow: isRutinaNarrow ? 'visible' : (isRutina ? 'hidden' : 'visible'),
        }}
      >
        {rutinaModeLabel ? (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              fontWeight: 400,
              lineHeight: 1.2,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {rutinaModeLabel}
          </Typography>
        ) : null}
        <Tooltip title={heroTooltip}>
          <span
            style={{
              display: 'inline-flex',
              flex: isRutinaNarrow ? undefined : '0 1 auto',
              minWidth: 0,
              width: isRutinaNarrow ? '100%' : undefined,
              paddingRight: rutinaModeLabel ? 52 : undefined,
            }}
          >
            <ButtonBase
              onClick={heroOnClick}
              disabled={isRutina && loading}
              aria-label={heroAriaLabel}
              sx={{
                borderRadius: 2,
                px: isRutina ? 0 : 1,
                py: isRutina ? 0 : 0.5,
                textAlign: 'left',
                flex: isRutinaNarrow ? 1 : undefined,
                width: isRutinaNarrow ? '100%' : undefined,
                justifyContent: 'flex-start',
                '&:hover': { bgcolor: loading && isRutina ? 'transparent' : 'action.hover' },
              }}
            >
              <CalendarDateHeroContent
                date={normalized}
                subtitle=""
                variant={isRutina ? 'rutina' : 'default'}
                completionPercentage={completionPercentage}
                completionColor={completionColor}
                completionTooltip={completionTooltip}
                dayMode={dayMode}
                loading={loading}
              />
            </ButtonBase>
          </span>
        </Tooltip>
        {showPickerActions && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isRutinaNarrow ? 'flex-end' : 'flex-end',
              gap: { xs: 0.125, sm: 0.25 },
              flexShrink: 0,
              height: 26,
              width: isRutinaNarrow ? '100%' : undefined,
              minWidth: 0,
              ml: isRutina && !isRutinaNarrow ? 'auto' : undefined,
              pr: isRutina ? 0 : undefined,
            }}
          >
            {isRutina ? (
              <>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: { xs: 0.25, sm: 0.25 },
                    flexShrink: 0,
                  }}
                >
                {isRutinaNarrow && showProgress && (
                  <Tooltip title={completionTooltip}>
                    <span style={{ display: 'inline-flex', flexShrink: 0, marginRight: 2 }}>
                      <RutinaCompletionPctChip
                        label={rutinaPctLabel}
                        subtle
                      />
                    </span>
                  </Tooltip>
                )}
                <Tooltip title={viewingToday ? 'Ya estás en hoy' : 'Ir a hoy'}>
                  <span style={{ display: 'inline-flex' }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={goToToday}
                      disabled={loading || viewingToday}
                      sx={{
                        ...dateHeaderHoyButtonSx,
                        color: viewingToday ? 'text.disabled' : 'text.secondary',
                        '&.Mui-disabled': { color: 'text.disabled' },
                      }}
                    >
                      Hoy
                    </Button>
                  </span>
                </Tooltip>
                <AgendaCalendarNavChevrons
                  viewMode={viewMode}
                  buttonSx={dateHeaderIconButtonSx}
                  compact={false}
                  navHandlers={navHandlers}
                />
                </Box>
              </>
            ) : (
              <>
                <AgendaCalendarNavChevrons
                  viewMode={viewMode}
                  compact
                  navHandlers={null}
                />
                <Tooltip title="Elegir fecha">
                  <span style={{ display: 'inline-flex' }}>
                    <IconButton
                      size="small"
                      onClick={onDateClick ?? openPicker}
                      disabled={loading}
                      sx={dateHeaderIconButtonSx}
                      aria-label="Elegir fecha"
                    >
                      <CalendarMonthOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={viewingToday ? 'Ya estás en hoy' : 'Ir a hoy'}>
                  <span style={{ display: 'inline-flex' }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={goToToday}
                      disabled={loading || viewingToday}
                      sx={{
                        ...dateHeaderHoyButtonSx,
                        color: viewingToday ? 'text.disabled' : 'text.secondary',
                        '&.Mui-disabled': { color: 'text.disabled' },
                      }}
                    >
                      Hoy
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
            {trailingActions}
          </Box>
        )}
      </Box>
      {showProgress && (
        <LinearProgress
          variant="determinate"
          value={progressValue}
          aria-label="Progreso de completitud de la rutina"
          sx={isRutina
            ? getRutinaProgressBarSx(theme, { bleedProgressBar })
            : {
              width: '100%',
              height: 4,
              borderRadius: 0,
              mt: 0.5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: 0 },
            }}
          {...(!isRutina ? { color: completionColor } : {})}
        />
      )}
      {showPickerActions && (
        <CalendarDatePickerPopover
          open={pickerOpen}
          anchorEl={pickerAnchor}
          onClose={closePickerHandler}
          value={normalized}
          onChange={handleDatePickedHandler}
        />
      )}
    </Box>
  );
}
