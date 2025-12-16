import React, { memo, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton, Typography, Chip, Tooltip, LinearProgress, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  NavigateBefore,
  NavigateNext,
  TodayOutlined as TodayIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  AddOutlined as AddIcon
} from '@mui/icons-material';
import { parseAPIDate } from '../utils/dateUtils.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRutinas } from '../context/RutinasContext.jsx';
import { calculateCompletionPercentage } from '../utils/rutinaCalculations';
import { NAV_TYPO } from '../config/uiConstants';

// Componente de navegación entre rutinas (compartido)
const RutinaNavigation = ({
  onEdit,
  onAdd,
  rutina,
  loading = false,
  currentPage,
  totalPages
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const { handlePrevious, handleNext, deleteRutina } = useRutinas();

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

  const completionPercentage = rutina ? calculateCompletionPercentage(rutina) : 0;
  const progressColor = completionPercentage > 75
    ? 'success'
    : completionPercentage > 40
      ? 'primary'
      : 'warning';

  return (
    <Box sx={{ mb: 1 }}>
      <LinearProgress
        variant="determinate"
        value={completionPercentage}
        color={progressColor}
        sx={{ height: 2, borderRadius: 0, mb: 1 }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isXs ? 0.5 : 1,
          px: isXs ? 0.25 : 0.5,
          py: 0.5,
          width: '100%',
          flexWrap: 'nowrap',
          overflow: 'hidden'
        }}
      >
        {/* Izquierda: atrás + fecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Tooltip title="Rutina más reciente">
            <span>
              <IconButton
                size="small"
                onClick={onPrevious}
                disabled={currentPage <= 1 || loading}
                sx={{ p: isXs ? '1px' : '2px' }}
                data-testid="prev-button"
              >
                <NavigateBefore sx={{ color: '#888 !important', fontSize: isXs ? '1rem' : '1.2rem', '&:hover': { color: '#fff !important' } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Typography
            variant={isXs ? NAV_TYPO.captionVariant : NAV_TYPO.itemVariant}
            component="div"
            sx={{
              fontWeight: 700,
              ...(isXs ? {} : NAV_TYPO.compactBodySx),
              lineHeight: 1.2,
              letterSpacing: '0.01em',
              color: '#aaa',
              minWidth: 0,
              maxWidth: { xs: 96, sm: 160, md: 240 },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {rutina ? format(parseAPIDate(rutina.fecha), 'dd MMM yy', { locale: es }) : ''}
          </Typography>
        </Box>

        {/* Centro: acciones */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isXs ? 0.5 : 0.75, flex: 1, justifyContent: 'center', minWidth: 0 }}>
          <Tooltip title="Ir a hoy">
            <span>
              <IconButton size="small" onClick={goToToday} disabled={loading} sx={{ p: isXs ? '1px' : '2px' }}>
                <TodayIcon sx={{ color: loading ? 'rgba(136,136,136,0.3) !important' : '#888 !important', fontSize: isXs ? '1rem' : undefined, '&:hover': { color: '#fff !important' } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Agregar nueva rutina">
            <span>
              <IconButton size="small" onClick={onAdd} disabled={loading} sx={{ p: isXs ? '1px' : '2px' }}>
                <AddIcon fontSize="small" sx={{ color: loading ? 'rgba(136,136,136,0.3) !important' : '#888 !important', fontSize: isXs ? '1rem' : undefined, '&:hover': { color: '#fff !important' } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Editar">
            <span>
              <IconButton size="small" onClick={() => rutina && onEdit && onEdit(rutina)} disabled={loading || !rutina} sx={{ p: isXs ? '1px' : '2px' }}>
                <EditIcon fontSize="small" sx={{ color: (loading || !rutina) ? 'rgba(136,136,136,0.3) !important' : '#888 !important', fontSize: isXs ? '1rem' : undefined, '&:hover': { color: '#fff !important' } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Eliminar">
            <span>
              <IconButton size="small" onClick={handleDelete} disabled={loading || !rutina} sx={{ p: isXs ? '1px' : '2px' }}>
                <DeleteIcon fontSize="small" sx={{ color: (loading || !rutina) ? 'rgba(136,136,136,0.3) !important' : '#888 !important', fontSize: isXs ? '1rem' : undefined, '&:hover': { color: '#fff !important' } }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Derecha: porcentaje + siguiente */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isXs ? 0.5 : 0.75, minWidth: 0 }}>
          <Chip
            size="small"
            label={`${completionPercentage}%`}
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
          <Tooltip title="Rutina siguiente">
            <span>
              <IconButton
                size="small"
                onClick={onNext}
                disabled={currentPage >= totalPages || loading}
                sx={{ p: isXs ? '1px' : '2px' }}
                data-testid="next-button"
              >
                <NavigateNext sx={{ color: '#888 !important', fontSize: isXs ? '1rem' : '1.2rem', '&:hover': { color: '#fff !important' } }} />
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


