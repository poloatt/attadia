import React, { memo, useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  LinearProgress,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  NavigateBefore,
  NavigateNext,
  CalendarMonthOutlined as CalendarMonthIcon,
  DeleteOutline as DeleteIcon,
  AddOutlined as AddIcon,
  TuneOutlined as TuneIcon,
  CheckCircleOutline as RutinaIcon,
  FitnessCenter as HabitIcon
} from '@mui/icons-material';
import { parseAPIDate, formatDateForAPI } from '../utils/dateUtils.js';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  formatCalendarDayHeader,
  formatCalendarNavLabel,
  getTodayCalendarDate,
  isViewingTodayInCalendar,
  shiftCalendarDate,
} from '../utils/focoNavigationUtils.js';
import CalendarDatePickerPopover from '@foco/features/agenda/CalendarDatePickerPopover';
import AgendaCalendarDateHeader from '@foco/features/agenda/AgendaCalendarDateHeader';
import { useRutinas } from '../context/RutinasContext.jsx';
import { useHabits } from '../context/HabitsContext.jsx';
import { calculateCompletionPercentage, calculateVisibleItems } from '../utils/rutinaCalculations';
import { getRutinaDayMode } from '../utils/rutinasPageUtils.js';
import { NAV_TYPO } from '../config/uiConstants';
import { DATE_HEADER_MIN_HEIGHT } from '../utils/calendar/calendarLayout';
import HabitFormDialog from '../components/HabitFormDialog';
import TiempoToolbarActions from '@foco/features/toolbar/TiempoToolbarActions';
import useResponsive from '../hooks/useResponsive';

/** Ancho fijo del slot «Hoy» para que ‹ › no se desplacen. */
const HOY_BUTTON_SLOT_WIDTH = 52;
/** Ancho fijo del botón de vista día/semana. */
const VIEW_MODE_BUTTON_WIDTH = 64;

// Componente de navegación entre rutinas (compartido)
const RutinaNavigation = ({
  onAdd,
  rutina,
  loading = false,
  currentPage,
  totalPages,
  onSettingsClick,
  navigationMode = 'rutina',
  /** Barra superior unificada (/foco): una fila sin progress ni chips. */
  compactBar = false,
  /** Barra de página bajo AgendaUnifiedBar (solo /rutinas). */
  pageBar = false,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const { isMobile } = useResponsive();
  const { handlePrevious, handleNext, deleteRutina, rutinas, getRutinaById } = useRutinas();
  const { habits } = useHabits();
  
  // Estado para el picker de fecha
  const [datePickerAnchor, setDatePickerAnchor] = useState(null);
  const datePickerOpen = Boolean(datePickerAnchor);
  
  // Estado para el menú de agregar
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const addMenuOpen = Boolean(addMenuAnchor);
  
  // Estado para el diálogo de hábito
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);

  const isCalendarNav = navigationMode === 'day' || navigationMode === 'week';
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarViewMode, setCalendarViewMode] = useState(() => (
    navigationMode === 'day' ? 'day' : 'week'
  ));

  const effectiveCalendarMode = isCalendarNav ? calendarViewMode : navigationMode;

  useEffect(() => {
    if (!isCalendarNav) return undefined;
    const handleAgendaCalendarState = (event) => {
      const { date, viewMode: vm } = event.detail || {};
      if (date) setCalendarDate(new Date(date));
      if (vm === 'day' || vm === 'week') setCalendarViewMode(vm);
    };
    window.addEventListener('agendaCalendarState', handleAgendaCalendarState);
    return () => window.removeEventListener('agendaCalendarState', handleAgendaCalendarState);
  }, [isCalendarNav]);

  const handleToggleViewMode = useCallback(() => {
    window.dispatchEvent(new CustomEvent('agendaToggleViewMode'));
  }, []);

  const previousRutinaId = useRef(null);
  const logCount = useRef(0);
  const lastLogTime = useRef(Date.now());

  const limitedLog = useCallback((message, data = null) => {
    const now = Date.now();
    if (now - lastLogTime.current > 2000 || logCount.current < 1) {
      if (data) {
        console.log(`[RutinaNavigation] ${message}`, data);
      } else {
        console.log(`[RutinaNavigation] ${message}`);
      }
      lastLogTime.current = now;
      logCount.current = 0;
    } else {
      logCount.current++;
    }
  }, []);

  useEffect(() => {
    if (!previousRutinaId.current || previousRutinaId.current !== rutina?._id) {
      if (rutina?._id && process.env.NODE_ENV === 'development') {
        // log suprimido
      }
      previousRutinaId.current = rutina?._id;
      logCount.current = 0;
    }
  }, [rutina?._id, currentPage, totalPages, loading]);

  const dispatchCalendarNavigate = useCallback((direction, date) => {
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: {
        direction,
        date: (date || new Date()).toISOString(),
      },
    }));
  }, []);

  const onPrevious = useCallback(() => {
    if (loading) return;
    if (isCalendarNav) {
      const nextDate = shiftCalendarDate(calendarDate, effectiveCalendarMode, 'prev');
      setCalendarDate(nextDate);
      dispatchCalendarNavigate('prev', nextDate);
      return;
    }
    limitedLog('Click anterior', { currentPage, totalPages, loading });
    if (currentPage <= 1) return;
    handlePrevious();
  }, [
    calendarDate,
    currentPage,
    dispatchCalendarNavigate,
    handlePrevious,
    isCalendarNav,
    limitedLog,
    loading,
    effectiveCalendarMode,
    totalPages,
  ]);

  const onNext = useCallback(() => {
    if (loading) return;
    if (isCalendarNav) {
      const nextDate = shiftCalendarDate(calendarDate, effectiveCalendarMode, 'next');
      setCalendarDate(nextDate);
      dispatchCalendarNavigate('next', nextDate);
      return;
    }
    limitedLog('Click siguiente', { currentPage, totalPages, loading });
    if (currentPage >= totalPages) return;
    handleNext();
  }, [
    calendarDate,
    currentPage,
    dispatchCalendarNavigate,
    handleNext,
    isCalendarNav,
    limitedLog,
    loading,
    effectiveCalendarMode,
    totalPages,
  ]);

  const prevDisabled = isCalendarNav ? loading : (currentPage <= 1 || loading);
  const nextDisabled = isCalendarNav ? loading : (currentPage >= totalPages || loading);

  const goToToday = () => {
    const today = getTodayCalendarDate();
    setCalendarDate(today);
    dispatchCalendarNavigate('today', today);
  };

  const handleDelete = () => {
    if (rutina && window.confirm('¿Seguro que desea eliminar esta rutina?')) {
      deleteRutina(rutina._id);
    }
  };

  // Handler para abrir el picker de fecha
  const handleDateClick = (event) => {
    setDatePickerAnchor(event.currentTarget);
  };

  // Handler para cerrar el picker
  const handleDatePickerClose = () => {
    setDatePickerAnchor(null);
  };

  // Handler para cuando se selecciona una fecha
  const handleDateChange = useCallback(async (newDate) => {
    if (!newDate) return;

    try {
      if (isCalendarNav) {
        const picked = startOfDay(newDate);
        setCalendarDate(picked);
        dispatchCalendarNavigate('pick', picked);
        handleDatePickerClose();
        return;
      }

      const dateStr = formatDateForAPI(newDate);
      if (!dateStr || !rutinas || rutinas.length === 0) {
        handleDatePickerClose();
        return;
      }

      const target = rutinas.find((r) => {
        try {
          return formatDateForAPI(parseAPIDate(r.fecha)) === dateStr;
        } catch {
          return false;
        }
      });

      if (target?._id) {
        await getRutinaById(target._id);
      } else {
        window.dispatchEvent(new CustomEvent('navigate', {
          detail: { direction: 'today', date: dateStr },
        }));
      }

      handleDatePickerClose();
    } catch (error) {
      console.error('Error al navegar a fecha:', error);
      handleDatePickerClose();
    }
  }, [dispatchCalendarNavigate, getRutinaById, isCalendarNav, rutinas]);

  // Obtener la fecha actual de la rutina para el picker
  const currentDate = useMemo(() => {
    if (isCalendarNav) return calendarDate;
    if (!rutina?.fecha) return new Date();
    try {
      return parseAPIDate(rutina.fecha);
    } catch {
      return new Date();
    }
  }, [calendarDate, isCalendarNav, rutina?.fecha]);

  const navDateLabel = useMemo(() => {
    if (isCalendarNav) {
      return formatCalendarNavLabel(calendarDate, effectiveCalendarMode);
    }
    if (!rutina?.fecha) return '';
    try {
      return format(parseAPIDate(rutina.fecha), 'dd MMM yy', { locale: es });
    } catch {
      return '';
    }
  }, [calendarDate, isCalendarNav, effectiveCalendarMode, rutina?.fecha]);


  // Estilo común para botones (igual que AgendaToolbarRight)
  const commonButtonSx = useMemo(() => ({
    width: { xs: 32, sm: 26 },
    height: { xs: 32, sm: 26 },
    padding: { xs: 0.25, sm: 0.125 },
    minWidth: { xs: 32, sm: 26 },
    minHeight: { xs: 32, sm: 26 },
    '& .MuiSvgIcon-root': {
      fontSize: { xs: '1.1rem', sm: '1.1rem' }
    },
    '&:hover': { 
      backgroundColor: 'action.hover' 
    }
  }), []);

  const { completionPercentage, totalVisible, totalCompleted } = useMemo(() => {
    if (!rutina) return { completionPercentage: 0, totalVisible: 0, totalCompleted: 0 };
    const completionPercentage = calculateCompletionPercentage(rutina, habits);
    const { visibleItems, completedItems } = calculateVisibleItems(rutina, {}, habits);
    return {
      completionPercentage,
      totalVisible: visibleItems.length,
      totalCompleted: completedItems.length
    };
  }, [rutina, habits]);

  const progressColor = completionPercentage > 75
    ? 'success'
    : completionPercentage > 40
      ? 'primary'
      : 'warning';

  const completionLabel = totalVisible > 0
    ? `${completionPercentage}%`
    : '—';

  const completionTooltip = totalVisible > 0
    ? `${totalCompleted}/${totalVisible} completados`
    : 'Sin ítems activos';

  const dayHeader = formatCalendarDayHeader(isCalendarNav ? calendarDate : null);
  const viewingToday = isCalendarNav
    ? isViewingTodayInCalendar(currentDate, effectiveCalendarMode)
    : (() => {
      if (!rutina?.fecha) return false;
      try {
        const todayStr = formatDateForAPI(getTodayCalendarDate());
        return formatDateForAPI(parseAPIDate(rutina.fecha)) === todayStr;
      } catch {
        return false;
      }
    })();
  const compactCalendar = compactBar && isCalendarNav;
  const hideCompactDateInBar = compactCalendar && isMobile;

  const rutinaPositionLabel = !isCalendarNav && totalPages > 0
    ? `${currentPage} / ${totalPages}`
    : '';

  const prevTooltip = isCalendarNav
    ? (effectiveCalendarMode === 'week' ? 'Semana anterior' : 'Día anterior')
    : 'Día anterior';
  const nextTooltip = isCalendarNav
    ? (effectiveCalendarMode === 'week' ? 'Semana siguiente' : 'Día siguiente')
    : 'Día más reciente';

  const navChevrons = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <Tooltip title={prevTooltip}>
        <span>
          <IconButton
            size="small"
            onClick={onPrevious}
            disabled={prevDisabled}
            sx={{
              ...commonButtonSx,
              color: prevDisabled ? 'text.disabled' : 'text.secondary',
              '&:hover': {
                backgroundColor: prevDisabled ? 'transparent' : 'action.hover',
                color: prevDisabled ? 'text.disabled' : 'text.primary',
              },
            }}
            aria-label="Anterior"
            data-testid="prev-button"
          >
            <NavigateBefore />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={nextTooltip}>
        <span>
          <IconButton
            size="small"
            onClick={onNext}
            disabled={nextDisabled}
            sx={{
              ...commonButtonSx,
              color: nextDisabled ? 'text.disabled' : 'text.secondary',
              '&:hover': {
                backgroundColor: nextDisabled ? 'transparent' : 'action.hover',
                color: nextDisabled ? 'text.disabled' : 'text.primary',
              },
            }}
            aria-label="Siguiente"
            data-testid="next-button"
          >
            <NavigateNext />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );

  const viewModeLabel = effectiveCalendarMode === 'week' ? 'Día' : 'Semana';
  const viewModeTooltip = effectiveCalendarMode === 'week' ? 'Ver día' : 'Ver semana';

  const showViewModeInDateCluster = !hideCompactDateInBar && !isMobile && isCalendarNav && !compactCalendar;
  const viewModeButton = showViewModeInDateCluster ? (
    <Tooltip title={viewModeTooltip}>
      <span style={{ display: 'inline-flex' }}>
        <Button
          size="small"
          variant="text"
          onClick={handleToggleViewMode}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            minWidth: VIEW_MODE_BUTTON_WIDTH,
            width: VIEW_MODE_BUTTON_WIDTH,
            flexShrink: 0,
            px: 0.75,
            py: 0.25,
            lineHeight: 1.2,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
          aria-label={viewModeTooltip}
        >
          {viewModeLabel}
        </Button>
      </span>
    </Tooltip>
  ) : null;

  const dateLabelButton = !hideCompactDateInBar ? (
    <Tooltip title="Elegir fecha">
      <span style={{ display: 'inline-flex', minWidth: 0 }}>
      <ButtonBase
        onClick={handleDateClick}
        disabled={loading}
        sx={{
          borderRadius: 1.5,
          px: compactCalendar ? { xs: 0.5, sm: 0.75 } : { xs: 0.75, sm: 1.25 },
          py: 0.25,
          minWidth: 0,
          maxWidth: compactCalendar ? { xs: 120, sm: 200, md: 280 } : undefined,
          flex: compactCalendar ? '0 1 auto' : 1,
          overflow: 'hidden',
          '&:hover': { bgcolor: loading ? 'transparent' : 'action.hover' },
        }}
        aria-label="Elegir fecha"
      >
        {effectiveCalendarMode === 'day' ? (
          isXs && !compactCalendar ? (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography component="span" sx={{ fontSize: '1.35rem', fontWeight: 500, lineHeight: 1 }}>
                {dayHeader.dayNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                {dayHeader.monthYear}
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
                textTransform: 'capitalize',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {`${dayHeader.dayNumber} ${dayHeader.monthYear}`}
            </Typography>
          )
        ) : (
          <Typography
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
              textTransform: 'capitalize',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {navDateLabel}
          </Typography>
        )}
      </ButtonBase>
      </span>
    </Tooltip>
  ) : null;

  const calendarIconButton = !hideCompactDateInBar && !compactCalendar ? (
    <Tooltip title="Elegir fecha">
      <span>
        <IconButton
          size="small"
          onClick={handleDateClick}
          disabled={loading}
          sx={{ ...commonButtonSx, flexShrink: 0 }}
          aria-label="Elegir fecha"
        >
          <CalendarMonthIcon />
        </IconButton>
      </span>
    </Tooltip>
  ) : null;

  const showHoyInBar = !hideCompactDateInBar;
  const hoyButtonSlot = showHoyInBar ? (
    <Box
      sx={{
        width: HOY_BUTTON_SLOT_WIDTH,
        minWidth: HOY_BUTTON_SLOT_WIDTH,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Tooltip title={viewingToday ? 'Ya estás en hoy' : 'Ir a hoy'}>
        <span>
          <Button
            size="small"
            variant="text"
            onClick={goToToday}
            disabled={loading || viewingToday}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: HOY_BUTTON_SLOT_WIDTH,
              px: compactCalendar ? 0.75 : 1,
              py: 0.25,
              lineHeight: 1.2,
              color: viewingToday ? 'text.disabled' : 'text.secondary',
              '&.Mui-disabled': {
                color: 'text.disabled',
              },
            }}
          >
            Hoy
          </Button>
        </span>
      </Tooltip>
    </Box>
  ) : null;

  const datePickerPopover = showHoyInBar ? (
    <CalendarDatePickerPopover
      open={datePickerOpen}
      anchorEl={datePickerAnchor}
      onClose={handleDatePickerClose}
      value={currentDate}
      onChange={handleDateChange}
    />
  ) : null;

  const dateCluster = !hideCompactDateInBar ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.375,
        minWidth: 0,
        overflow: 'hidden',
        flexShrink: 1,
      }}
    >
      {hoyButtonSlot}
      {navChevrons}
      {dateLabelButton}
      {viewModeButton}
      {datePickerPopover}
    </Box>
  ) : null;

  const rutinaNavHandlers = useMemo(() => ({
    // Lista ordenada: índice 0 = más reciente. ‹ = más antiguo, › = más reciente.
    onPrevious: onNext,
    onNext: onPrevious,
    prevTooltip: 'Día anterior',
    nextTooltip: 'Día más reciente',
    prevDisabled: nextDisabled,
    nextDisabled: prevDisabled,
  }), [onPrevious, onNext, prevDisabled, nextDisabled]);

  const rutinaDayMode = useMemo(
    () => (rutina?.fecha ? getRutinaDayMode(rutina.fecha) : null),
    [rutina?.fecha],
  );

  const rutinaPositionSubtitle = rutinaPositionLabel
    ? `registro ${rutinaPositionLabel.replace(' / ', ' de ')}`
    : '';

  if (pageBar && !isCalendarNav) {
    return (
      <>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ width: '100%', minHeight: DATE_HEADER_MIN_HEIGHT }}>
            <AgendaCalendarDateHeader
              mode="rutina"
              date={currentDate}
              onDateClick={handleDateClick}
              loading={loading}
              viewingToday={viewingToday}
              positionLabel={rutinaPositionSubtitle}
              navHandlers={rutinaNavHandlers}
              pickerOpen={datePickerOpen}
              pickerAnchor={datePickerAnchor}
              onPickerClose={handleDatePickerClose}
              onDateChange={handleDateChange}
              completionPercentage={completionPercentage}
              completionColor={progressColor}
              completionTooltip={completionTooltip}
              dayMode={rutinaDayMode}
              hideOuterBorder
            />
          </Box>
        </Box>
        <HabitFormDialog
          open={habitDialogOpen}
          onClose={() => setHabitDialogOpen(false)}
        />
      </>
    );
  }

  if (compactCalendar) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-start',
          width: '100%',
          minWidth: 0,
          gap: isMobile ? 0.75 : { xs: 0.5, sm: 1 },
          overflow: 'hidden',
          // Date nav only on the left; let AgendaUnifiedBar centered actions receive clicks
          pointerEvents: 'none',
          '& > *': { pointerEvents: 'auto' },
        }}
      >
        {!isMobile && dateCluster}
      </Box>
    );
  }

  return (
    <Box sx={{
      mb: pageBar ? 0 : 1,
      width: '100%',
      height: pageBar ? '100%' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <LinearProgress
        variant="determinate"
        value={completionPercentage}
        color={progressColor}
        aria-label="Progreso de completitud de la rutina"
        sx={{ height: 2, borderRadius: 0, mb: pageBar ? 0 : 1, flexShrink: 0 }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 0.02, sm: 0.1 },
          px: pageBar ? 0 : { xs: 0.25, sm: 0.5 },
          py: pageBar ? 0 : 0.5,
          width: '100%',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Izquierda: atrás + fecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 }, minWidth: 0, flex: (isCalendarNav || pageBar) ? 1 : undefined }}>
          {!isCalendarNav && (
            <Tooltip title={prevTooltip}>
              <span>
                <IconButton
                  size="small"
                  onClick={onPrevious}
                  disabled={prevDisabled}
                  sx={{
                    ...commonButtonSx,
                    color: prevDisabled ? 'text.disabled' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: prevDisabled ? 'transparent' : 'action.hover',
                      color: prevDisabled ? 'text.disabled' : 'text.primary',
                    },
                  }}
                  aria-label="Ir a la rutina anterior"
                  data-testid="prev-button"
                >
                  <NavigateBefore />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {isCalendarNav ? (
            <>
              {hoyButtonSlot}
              {navChevrons}
              {dateLabelButton}
              {viewModeButton}
              {datePickerPopover}
            </>
          ) : (
            <Tooltip title={viewingToday ? 'Ya estás en hoy' : 'Ir a hoy'}>
              <Typography
                variant={isXs ? NAV_TYPO.captionVariant : NAV_TYPO.itemVariant}
                component="div"
                onClick={goToToday}
                sx={{
                  fontWeight: 700,
                  ...(isXs ? {} : NAV_TYPO.compactBodySx),
                  lineHeight: 1.2,
                  color: viewingToday ? 'primary.main' : 'text.secondary',
                  minWidth: 0,
                  maxWidth: { xs: 96, sm: 160, md: 240 },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: viewingToday ? 'default' : 'pointer',
                  '&:hover': viewingToday
                    ? {}
                    : { color: 'text.primary', textDecoration: 'underline' },
                }}
              >
                {navDateLabel}
                {rutinaPositionLabel ? (
                  <Box
                    component="span"
                    sx={{ ml: 0.5, color: 'text.disabled', fontWeight: 500, fontSize: '0.7rem' }}
                  >
                    ({rutinaPositionLabel})
                  </Box>
                ) : null}
              </Typography>
            </Tooltip>
          )}
        </Box>

        {/* Centro: acciones agenda o rutinas legacy (no pageBar) */}
        {(!pageBar || isCalendarNav) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.02, sm: 0.1 }, flex: 1, justifyContent: 'center', minWidth: 0 }}>
          {isCalendarNav && (
            <TiempoToolbarActions section="foco" dense />
          )}
          {!isCalendarNav && !pageBar && (
            <>
          <Tooltip title="Elegir fecha">
            <span>
              <IconButton
                size="small"
                onClick={handleDateClick}
                disabled={loading}
                sx={commonButtonSx}
                aria-label="Elegir fecha"
              >
                <CalendarMonthIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <CalendarDatePickerPopover
            open={datePickerOpen}
            anchorEl={datePickerAnchor}
            onClose={handleDatePickerClose}
            value={currentDate}
            onChange={handleDateChange}
          />
          {onSettingsClick && (
            <Tooltip title="Personalizar hábitos">
              <span>
                <IconButton size="small" onClick={onSettingsClick} disabled={loading} sx={commonButtonSx} aria-label="Personalizar hábitos">
                  <TuneIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
            </>
          )}
          {!isCalendarNav && !pageBar && (
            <>
          <Tooltip title="Agregar">
            <span>
              <IconButton 
                size="small" 
                onClick={(e) => setAddMenuAnchor(e.currentTarget)} 
                disabled={loading} 
                sx={{
                  ...commonButtonSx,
                  color: loading ? 'text.disabled' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: loading ? 'transparent' : 'action.hover',
                    color: loading ? 'text.disabled' : 'text.primary'
                  }
                }} 
                aria-label="Agregar"
              >
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          {/* Menú de agregar */}
          <Menu
            anchorEl={addMenuAnchor}
            open={addMenuOpen}
            onClose={() => setAddMenuAnchor(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                minWidth: 180
              }
            }}
          >
            <MenuItem
              onClick={() => {
                setAddMenuAnchor(null);
                if (onAdd) onAdd();
              }}
            >
              <ListItemIcon>
                <RutinaIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Rutina</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchor(null);
                setHabitDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <HabitIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Hábito</ListItemText>
            </MenuItem>
          </Menu>
          <Tooltip title="Eliminar">
            <span>
              <IconButton 
                size="small" 
                onClick={handleDelete} 
                disabled={loading || !rutina} 
                sx={{
                  ...commonButtonSx,
                  color: (loading || !rutina) ? 'text.disabled' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: (loading || !rutina) ? 'transparent' : 'action.hover',
                    color: (loading || !rutina) ? 'text.disabled' : 'text.primary'
                  }
                }} 
                aria-label="Eliminar rutina"
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
            </>
          )}
        </Box>
        )}

        {/* Derecha: acciones + porcentaje + siguiente */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 }, minWidth: 0 }}>
          {pageBar && !isCalendarNav && (
            <Tooltip title="Eliminar rutina">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  disabled={loading || !rutina}
                  sx={{
                    ...commonButtonSx,
                    color: (loading || !rutina) ? 'text.disabled' : 'text.secondary',
                  }}
                  aria-label="Eliminar rutina"
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title={completionTooltip}>
            <Chip
              size="small"
              label={completionLabel}
              variant="outlined"
              color={progressColor}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                fontWeight: 500,
                minWidth: { xs: 0, sm: 50 },
                height: 22,
                '& .MuiChip-label': { px: 1, ...NAV_TYPO.chipLabelSx }
              }}
            />
          </Tooltip>

          {/* En xs el Chip se ocultaba y el usuario se quedaba sin feedback de % */}
          <Tooltip title={completionTooltip}>
            <Typography
              variant={NAV_TYPO.captionVariant}
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                color: progressColor === 'success' 
                  ? 'success.main' 
                  : progressColor === 'warning' 
                    ? 'warning.main' 
                    : 'primary.main',
                fontWeight: 600,
                ...(isXs ? {} : NAV_TYPO.compactBodySx),
                lineHeight: 1.2,
                minWidth: 24,
                justifyContent: 'flex-end'
              }}
            >
              {completionLabel}
            </Typography>
          </Tooltip>
          {!isCalendarNav && (
            <Tooltip title={nextTooltip}>
              <span>
                <IconButton
                  size="small"
                  onClick={onNext}
                  disabled={nextDisabled}
                  sx={{
                    ...commonButtonSx,
                    color: nextDisabled ? 'text.disabled' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: nextDisabled ? 'transparent' : 'action.hover',
                      color: nextDisabled ? 'text.disabled' : 'text.primary',
                    },
                  }}
                  aria-label="Ir a la rutina siguiente"
                  data-testid="next-button"
                >
                  <NavigateNext />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Diálogo de formulario de hábito */}
      <HabitFormDialog
        open={habitDialogOpen}
        onClose={() => setHabitDialogOpen(false)}
      />
    </Box>
  );
};

export default memo(RutinaNavigation);
export { RutinaNavigation };


