import React, { memo, useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Typography, Chip, Tooltip, LinearProgress, useMediaQuery, Popover } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  NavigateBefore,
  NavigateNext,
  TodayOutlined as TodayIcon,
  DeleteOutline as DeleteIcon,
  AddOutlined as AddIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import { parseAPIDate, formatDateForAPI } from '../utils/dateUtils.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRutinas } from '../context/RutinasContext.jsx';
import { calculateCompletionPercentage, calculateVisibleItems } from '../utils/rutinaCalculations';
import { NAV_TYPO } from '../config/uiConstants';
import { useActionHistory } from '../context/ActionHistoryContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';

// Componente de navegación entre rutinas (compartido)
const RutinaNavigation = ({
  onAdd,
  rutina,
  loading = false,
  currentPage,
  totalPages
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const { handlePrevious, handleNext, deleteRutina, rutinas, getRutinaById } = useRutinas();
  const { 
    canUndo, 
    undoLastAction, 
    getUndoCount
  } = useActionHistory();
  
  // Estado para el picker de fecha
  const [datePickerAnchor, setDatePickerAnchor] = useState(null);
  const datePickerOpen = Boolean(datePickerAnchor);

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

  const onPrevious = useCallback(() => {
    limitedLog('Click anterior', { currentPage, totalPages, loading });
    if (currentPage <= 1 || loading) return;
    handlePrevious();
  }, [currentPage, totalPages, loading, handlePrevious, limitedLog]);

  const onNext = useCallback(() => {
    limitedLog('Click siguiente', { currentPage, totalPages, loading });
    if (currentPage >= totalPages || loading) return;
    handleNext();
  }, [currentPage, totalPages, loading, handleNext, limitedLog]);

  const prevDisabled = currentPage <= 1 || loading;
  const nextDisabled = currentPage >= totalPages || loading;

  const goToToday = () => {
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { direction: 'today', date: new Date().toISOString().split('T')[0] }
    }));
  };

  const handleDelete = () => {
    if (rutina && window.confirm('¿Seguro que desea eliminar esta rutina?')) {
      deleteRutina(rutina._id);
    }
  };

  const handleUndo = () => {
    if (canUndo()) {
      const lastAction = undoLastAction();
      if (lastAction) {
        window.dispatchEvent(new CustomEvent('undoAction', {
          detail: lastAction
        }));
      }
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
      const dateStr = formatDateForAPI(newDate);
      if (!dateStr || !rutinas || rutinas.length === 0) {
        handleDatePickerClose();
        return;
      }

      // Buscar rutina con esa fecha
      const target = rutinas.find(r => {
        try {
          return formatDateForAPI(parseAPIDate(r.fecha)) === dateStr;
        } catch {
          return false;
        }
      });

      if (target?._id) {
        // Si existe, navegar a esa rutina
        await getRutinaById(target._id);
      } else {
        // Si no existe, disparar evento para crear nueva rutina con esa fecha
        window.dispatchEvent(new CustomEvent('navigate', {
          detail: { direction: 'today', date: dateStr }
        }));
      }
      
      handleDatePickerClose();
    } catch (error) {
      console.error('Error al navegar a fecha:', error);
      handleDatePickerClose();
    }
  }, [rutinas, getRutinaById]);

  // Obtener la fecha actual de la rutina para el picker
  const currentDate = useMemo(() => {
    if (!rutina?.fecha) return new Date();
    try {
      return parseAPIDate(rutina.fecha);
    } catch {
      return new Date();
    }
  }, [rutina?.fecha]);

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
    const completionPercentage = calculateCompletionPercentage(rutina);
    const { visibleItems, completedItems } = calculateVisibleItems(rutina);
    return {
      completionPercentage,
      totalVisible: visibleItems.length,
      totalCompleted: completedItems.length
    };
  }, [rutina]);

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

  return (
    <Box sx={{ mb: 1 }}>
      <LinearProgress
        variant="determinate"
        value={completionPercentage}
        color={progressColor}
        aria-label="Progreso de completitud de la rutina"
        sx={{ height: 2, borderRadius: 0, mb: 1 }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 0.02, sm: 0.1 },
          px: { xs: 0.25, sm: 0.5 },
          py: 0.5,
          width: '100%',
          flexWrap: 'nowrap',
          overflow: 'hidden'
        }}
      >
        {/* Izquierda: atrás + fecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 }, minWidth: 0 }}>
          <Tooltip title="Rutina más reciente">
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
                    color: prevDisabled ? 'text.disabled' : 'text.primary'
                  }
                }}
                aria-label="Ir a la rutina anterior"
                data-testid="prev-button"
              >
                <NavigateBefore />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ir a hoy">
            <Typography
              variant={isXs ? NAV_TYPO.captionVariant : NAV_TYPO.itemVariant}
              component="div"
              onClick={goToToday}
              sx={{
                fontWeight: 700,
                ...(isXs ? {} : NAV_TYPO.compactBodySx),
                lineHeight: 1.2,
                letterSpacing: '0.01em',
                color: 'text.secondary',
                minWidth: 0,
                maxWidth: { xs: 96, sm: 160, md: 240 },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                  color: 'text.primary',
                  textDecoration: 'underline'
                }
              }}
            >
              {rutina ? format(parseAPIDate(rutina.fecha), 'dd MMM yy', { locale: es }) : ''}
            </Typography>
          </Tooltip>
        </Box>

        {/* Centro: acciones */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.02, sm: 0.1 }, flex: 1, justifyContent: 'center', minWidth: 0 }}>
          <Tooltip title="Seleccionar fecha">
            <span>
              <IconButton 
                size="small" 
                onClick={handleDateClick} 
                disabled={loading} 
                sx={{
                  ...commonButtonSx,
                  color: loading ? 'text.disabled' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: loading ? 'transparent' : 'action.hover',
                    color: loading ? 'text.disabled' : 'text.primary'
                  }
                }} 
                aria-label="Seleccionar fecha"
              >
                <TodayIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          {/* Popover con DatePicker */}
          <Popover
            open={datePickerOpen}
            anchorEl={datePickerAnchor}
            onClose={handleDatePickerClose}
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
                borderRadius: 0,
                bgcolor: 'background.default',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <Box sx={{
                '& .MuiPickersCalendarHeader-root': {
                  backgroundColor: 'transparent',
                },
                '& .MuiPickersDay-root': {
                  color: 'text.primary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
              }}>
                <StaticDatePicker
                  displayStaticWrapperAs="mobile"
                  value={currentDate}
                  onChange={handleDateChange}
                  views={['year', 'month', 'day']}
                  openTo="day"
                  showToolbar={false}
                  componentsProps={{ actionBar: { actions: [] } }}
                />
              </Box>
            </LocalizationProvider>
          </Popover>
          {/* Botón Undo - solo mostrar si hay acciones para deshacer */}
          {canUndo() && getUndoCount() > 0 && (
            <Tooltip title={canUndo() ? `Deshacer última acción (${getUndoCount()} disponible${getUndoCount() > 1 ? 's' : ''})` : 'No hay acciones para deshacer'}>
              <span>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={handleUndo}
                    disabled={!canUndo() || loading}
                    sx={{ 
                      ...commonButtonSx,
                      position: 'relative',
                      color: (!canUndo() || loading) ? 'text.disabled' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: (!canUndo() || loading) ? 'transparent' : 'action.hover',
                        color: (!canUndo() || loading) ? 'text.disabled' : 'text.primary'
                      }
                    }}
                    aria-label="Deshacer última acción"
                  >
                    <UndoIcon />
                    {canUndo() && getUndoCount() > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: '#fff',
                          lineHeight: 1,
                          backgroundColor: '#888',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(0,0,0,0.2)'
                        }}
                      >
                        {getUndoCount() > 99 ? '99+' : getUndoCount()}
                      </span>
                    )}
                  </IconButton>
                </Box>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Agregar nueva rutina">
            <span>
              <IconButton 
                size="small" 
                onClick={onAdd} 
                disabled={loading} 
                sx={{
                  ...commonButtonSx,
                  color: loading ? 'text.disabled' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: loading ? 'transparent' : 'action.hover',
                    color: loading ? 'text.disabled' : 'text.primary'
                  }
                }} 
                aria-label="Agregar nueva rutina"
              >
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>
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
        </Box>

        {/* Derecha: porcentaje + siguiente */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 }, minWidth: 0 }}>
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
          <Tooltip title="Rutina siguiente">
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
                    color: nextDisabled ? 'text.disabled' : 'text.primary'
                  }
                }}
                aria-label="Ir a la rutina siguiente"
                data-testid="next-button"
              >
                <NavigateNext />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(RutinaNavigation);
export { RutinaNavigation };


