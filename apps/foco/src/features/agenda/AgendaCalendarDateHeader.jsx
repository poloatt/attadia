import React, { useCallback, useEffect } from 'react';
import { Box, Button, ButtonBase, IconButton, LinearProgress, Tooltip } from '@mui/material';
import { CalendarMonthOutlined } from '@mui/icons-material';
import { isToday, startOfDay } from 'date-fns';
import { useResponsive } from '@shared/hooks';
import CalendarDateHeroContent from '@shared/components/calendar/CalendarDateHeroContent';
import {
  getTodayCalendarDate,
  isViewingTodayInCalendar,
} from '@shared/utils/focoNavigationUtils';
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
  px: 0.75,
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
  positionLabel = '',
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
}) {
  const isRutina = mode === 'rutina';
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
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { direction: 'today', date: getTodayCalendarDate().toISOString() },
    }));
  }, []);

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
        py: isRutina ? 0.75 : 1,
        width: '100%',
        bgcolor: 'background.default',
        borderBottom: hideOuterBorder ? 0 : (today || viewingToday ? 2 : 1),
        borderColor: today || viewingToday ? 'primary.main' : 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: isRutina ? 'center' : 'flex-start', gap: 0.5 }}>
        <Tooltip title={heroTooltip}>
          <span style={{ display: 'inline-flex', flex: 1, minWidth: 0 }}>
            <ButtonBase
              onClick={heroOnClick}
              disabled={isRutina && loading}
              aria-label={heroAriaLabel}
              sx={{
                borderRadius: 2,
                px: isRutina ? 0 : 1,
                py: 0.5,
                textAlign: 'left',
                flex: 1,
                justifyContent: 'flex-start',
                '&:hover': { bgcolor: loading && isRutina ? 'transparent' : 'action.hover' },
              }}
            >
              <CalendarDateHeroContent
                date={normalized}
                subtitle={isRutina ? positionLabel : ''}
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
              gap: 0.25,
              flexShrink: 0,
              height: 26,
              pr: isRutina ? 0 : undefined,
            }}
          >
            {isRutina ? (
              <>
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
          color={completionColor}
          aria-label="Progreso de completitud de la rutina"
          sx={{
            width: '100%',
            height: 4,
            borderRadius: 0,
            mt: 0.5,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { borderRadius: 0 },
          }}
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
