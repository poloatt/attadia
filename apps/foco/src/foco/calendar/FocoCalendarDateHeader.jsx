import React, { useCallback, useEffect } from 'react';
import { Box, Button, ButtonBase, IconButton, Tooltip, Typography } from '@mui/material';
import { CalendarMonthOutlined } from '@mui/icons-material';
import { isToday, startOfDay } from 'date-fns';
import { useResponsive } from '@shared/hooks';
import {
  formatCalendarDayHeader,
  getTodayCalendarDate,
  isViewingTodayInCalendar,
} from '@shared/utils/focoNavigationUtils';
import CalendarDatePickerPopover from './CalendarDatePickerPopover';
import FocoCalendarNavChevrons from './FocoCalendarNavChevrons';
import { useFocoCalendarDatePicker } from './useFocoCalendarDatePicker';
import { DATE_HEADER_MIN_HEIGHT } from './calendarLayout';

/**
 * Encabezado de fecha en el calendario.
 * Clic en la fecha alterna día/semana; icono de calendario abre el selector.
 */
export default function FocoCalendarDateHeader({ date, viewMode = 'day' }) {
  const { isMobile } = useResponsive();
  const showPickerActions = isMobile;
  const {
    pickerAnchor,
    pickerOpen,
    openPicker,
    closePicker,
    handleDatePicked,
  } = useFocoCalendarDatePicker();
  const normalized = startOfDay(date || new Date());
  const { weekday, dayNumber, monthYear } = formatCalendarDayHeader(normalized);
  const today = isToday(normalized);
  const viewingToday = isViewingTodayInCalendar(normalized, viewMode);

  const goToToday = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { direction: 'today', date: getTodayCalendarDate().toISOString() },
    }));
  }, []);

  const handleToggleView = useCallback(() => {
    window.dispatchEvent(new CustomEvent('focoToggleViewMode'));
  }, []);

  useEffect(() => {
    if (!showPickerActions) return undefined;
    window.addEventListener('scroll', closePicker, true);
    return () => window.removeEventListener('scroll', closePicker, true);
  }, [showPickerActions, closePicker]);

  return (
    <Box
      sx={{
        flexShrink: 0,
        minHeight: DATE_HEADER_MIN_HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 1, sm: 2 },
        py: 1,
        bgcolor: 'background.default',
        borderBottom: today ? 2 : 1,
        borderColor: today ? 'primary.main' : 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Tooltip title={viewMode === 'week' ? 'Ver día' : 'Ver semana'}>
          <ButtonBase
            onClick={handleToggleView}
            aria-label={viewMode === 'week' ? 'Cambiar a vista diaria' : 'Cambiar a vista semanal'}
            sx={{
              borderRadius: 2,
              px: 1,
              py: 0.5,
              textAlign: 'left',
              flex: 1,
              justifyContent: 'flex-start',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  display: 'block',
                  lineHeight: 1.2,
                }}
              >
                {weekday}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'text.primary',
                  }}
                >
                  {dayNumber}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                >
                  {monthYear}
                </Typography>
              </Box>
            </Box>
          </ButtonBase>
        </Tooltip>
        {showPickerActions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
            <FocoCalendarNavChevrons viewMode={viewMode} />
            <Tooltip title="Elegir fecha">
              <IconButton
                size="small"
                onClick={openPicker}
                aria-label="Elegir fecha"
              >
                <CalendarMonthOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={viewingToday ? 'Ya estás en hoy' : 'Ir a hoy'}>
              <span>
                <Button
                  size="small"
                  variant="text"
                  onClick={goToToday}
                  disabled={viewingToday}
                  sx={{
                    textTransform: 'none',
                    flexShrink: 0,
                    fontWeight: 600,
                    minHeight: 0,
                    px: 0.75,
                    py: 0.25,
                    lineHeight: 1.2,
                    color: viewingToday ? 'text.disabled' : 'text.secondary',
                    '&.Mui-disabled': { color: 'text.disabled' },
                  }}
                >
                  Hoy
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
      {showPickerActions && (
        <CalendarDatePickerPopover
          open={pickerOpen}
          anchorEl={pickerAnchor}
          onClose={closePicker}
          value={normalized}
          onChange={handleDatePicked}
        />
      )}
    </Box>
  );
}
