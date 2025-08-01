import React, { memo, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton, Typography, Chip, Tooltip, Button, LinearProgress } from '@mui/material';
import { 
  NavigateBefore, 
  NavigateNext, 
  TodayOutlined as TodayIcon, 
  EditOutlined as EditIcon, 
  DeleteOutline as DeleteIcon,
  AddOutlined as AddIcon
} from '@mui/icons-material';
import { formatFechaDisplay } from '../../utils/iconConfig';
import { useRutinas } from '../../context/RutinasContext';
import { useRutinasStatistics } from '../../context/RutinasStatisticsContext';
import { useSnackbar } from 'notistack';
import { getNormalizedToday, toISODateString } from '../../utils/dateUtils';

/**
 * Componente para la navegación entre rutinas
 * Muestra controles para moverse entre rutinas y la fecha actual
 */
const RutinaNavigation = ({ 
  onEdit, 
  onAdd,
  rutina,
  loading = false,
  currentPage,
  totalPages
}) => {
  const { 
    handlePrevious, 
    handleNext,
    deleteRutina
  } = useRutinas();
  
  // Usar el contexto de estadísticas para obtener el cálculo de completitud
  const { calculateCompletionPercentage } = useRutinasStatistics();
  
  const { enqueueSnackbar } = useSnackbar();
  
  // Usar useRef para controlar la frecuencia de los logs
  const previousRutinaId = useRef(null);
  const logLimitTimer = useRef(null);
  const logCount = useRef(0);
  const lastLogTime = useRef(Date.now());

  // Función para controlar logs, evitando spam
  const limitedLog = useCallback((message, data = null) => {
    const now = Date.now();
    // Solo permitir un log cada 2 segundos para el mismo mensaje
    if (now - lastLogTime.current > 2000 || logCount.current < 1) {
      if (data) {
        console.log(`[RutinaNavigation] ${message}`, data);
      } else {
        console.log(`[RutinaNavigation] ${message}`);
      }
      lastLogTime.current = now;
      logCount.current = 0;
    } else {
      // Contar logs suprimidos para debuggear si es necesario
      logCount.current++;
    }
  }, []);

  // Monitorear cambios en props críticas
  useEffect(() => {
    // Evitar logs excesivos
    if (logLimitTimer.current) {
      clearTimeout(logLimitTimer.current);
    }
    
    // Solo mostrar logs cuando cambia la rutina
    if (!previousRutinaId.current || previousRutinaId.current !== rutina?._id) {
      limitedLog("Estado actual:", { 
        rutinaId: rutina?._id,
        currentPage, 
        totalPages,
        loading, 
        fecha: rutina?.fecha
      });
      previousRutinaId.current = rutina?._id;
      logCount.current = 0;
    }
  }, [rutina, currentPage, totalPages, loading, limitedLog]);

  // Función para navegar hacia atrás
  const onPrevious = () => {
    console.log('[RutinaNavigation] Navegando al registro anterior desde posición', currentPage, 'de', totalPages);
    if (currentPage <= 1) {
      console.warn('[RutinaNavigation] No se puede navegar hacia atrás - ya estás en el registro más reciente');
      return;
    }
    if (loading) {
      console.warn('[RutinaNavigation] No se puede navegar mientras se está cargando');
      return;
    }
    handlePrevious();
  };

  // Función para navegar hacia adelante
  const onNext = () => {
    console.log('[RutinaNavigation] Navegando al registro siguiente desde posición', currentPage, 'de', totalPages);
    if (currentPage >= totalPages) {
      console.warn('[RutinaNavigation] No se puede navegar hacia adelante - ya estás en el registro más antiguo');
      return;
    }
    if (loading) {
      console.warn('[RutinaNavigation] No se puede navegar mientras se está cargando');
      return;
    }
    handleNext();
  };

  // Función para ir a la rutina de hoy
  const goToToday = () => {
    // Implementar lógica para ir a la rutina de hoy si existe
    console.log('[RutinaNavigation] Buscando la rutina para la fecha actual');
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { direction: 'today', date: new Date().toISOString().split('T')[0] }
    }));
  };

  // Manejador para eliminar rutina
  const handleDelete = () => {
    if (window.confirm('¿Seguro que desea eliminar esta rutina?')) {
      deleteRutina(rutina._id);
    }
  };

  // Calcular porcentaje de completitud
  const completionPercentage = rutina ? calculateCompletionPercentage(rutina) : 0;
  
  // Logs optimizados para depuración
  useEffect(() => {
    if (rutina && logCount.current <= 1) {
      limitedLog("Datos de completitud:", {
        rutina_id: rutina._id,
        completitud_original: rutina.completitud,
        completionPercentage
      });
    }
  }, [rutina, completionPercentage, limitedLog]);

  // Determinar el color de la barra de progreso según el porcentaje
  const progressColor = completionPercentage > 75 
    ? "success" 
    : completionPercentage > 40 
      ? "primary" 
      : "warning";

  return (
    <Box sx={{ mb: 1 }}>
      {/* Barra de progreso de completitud en el borde superior */}
      <LinearProgress 
        variant="determinate" 
        value={completionPercentage} 
        color={progressColor}
        sx={{ 
          height: 2, 
          borderRadius: 0,
          mb: 1
        }}
      />
      
      {/* Controles de navegación y acciones */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 1,
          px: 0.5,
          position: 'relative',
          width: '100%',
          height: '40px'
        }}
      >
        {/* Lado izquierdo con fecha y controles de navegación - posicionado absolutamente */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          minWidth: '140px', 
          justifyContent: 'flex-start',
          position: 'absolute',
          left: 0
        }}>
          <Typography variant="body2" component="div" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#aaa', textShadow: '0 0 2px #000', minWidth: '60px' }}>
            {rutina ? formatFechaDisplay(rutina.fecha) : ''}
          </Typography>
          
          {/* Mover algunos controles al lado izquierdo para balance visual */}
          <Tooltip title="Rutina más reciente">
            <span>
              <IconButton 
                size="small" 
                onClick={onPrevious}
                disabled={currentPage <= 1 || loading}
                sx={{ padding: '2px' }}
                data-testid="prev-button"
              >
                <NavigateBefore 
                  sx={{ 
                    color: '#888 !important',
                    fontSize: '1.2rem',
                    textShadow: '0 0 2px #000',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#fff !important', textShadow: '0 0 4px #000' }
                  }} 
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Centro con controles principales - centrado absolutamente */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.75, 
          justifyContent: 'center',
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }}>
          <Tooltip title="Ir a hoy">
            <span>
              <IconButton 
                size="small" 
                onClick={goToToday}
                disabled={loading}
                sx={{ padding: '2px' }}
              >
                <TodayIcon sx={{ color: loading ? 'rgba(136,136,136,0.3) !important' : '#888 !important', textShadow: '0 0 2px #000', transition: 'color 0.2s', '&:hover': { color: '#fff !important', textShadow: '0 0 4px #000' } }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Agregar nueva rutina">
            <span>
              <IconButton 
                size="small" 
                onClick={onAdd}
                disabled={loading}
                sx={{ padding: '2px' }}
              >
                <AddIcon fontSize="small" sx={{ color: loading ? 'rgba(136,136,136,0.3) !important' : '#888 !important', textShadow: '0 0 2px #000', transition: 'color 0.2s', '&:hover': { color: '#fff !important', textShadow: '0 0 4px #000' } }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Editar">
            <span>
              <IconButton 
                size="small" 
                onClick={() => rutina && onEdit(rutina)}
                disabled={loading || !rutina}
                sx={{ padding: '2px' }}
              >
                <EditIcon fontSize="small" sx={{ color: (loading || !rutina) ? 'rgba(136,136,136,0.3) !important' : '#888 !important', textShadow: '0 0 2px #000', transition: 'color 0.2s', '&:hover': { color: '#fff !important', textShadow: '0 0 4px #000' } }} />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Eliminar">
            <span>
              <IconButton 
                size="small" 
                onClick={handleDelete}
                disabled={loading || !rutina}
                sx={{ padding: '2px' }}
              >
                <DeleteIcon fontSize="small" sx={{ color: (loading || !rutina) ? 'rgba(136,136,136,0.3) !important' : '#888 !important', textShadow: '0 0 2px #000', transition: 'color 0.2s', '&:hover': { color: '#fff !important', textShadow: '0 0 4px #000' } }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Lado derecho con porcentaje y navegación siguiente - posicionado absolutamente */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          minWidth: '140px', 
          justifyContent: 'flex-end',
          position: 'absolute',
          right: 0
        }}>
          <Chip 
            size="small"
            label={`${completionPercentage}%`} 
            variant="outlined"
            color={progressColor}
            sx={{
              fontWeight: 500,
              minWidth: '50px',
              height: '22px',
              '& .MuiChip-label': {
                padding: '0 8px',
                fontSize: '0.75rem'
              }
            }}
          />
          
          {/* Mover la flecha siguiente al lado derecho para balance */}
          <Tooltip title="Rutina siguiente">
            <span>
              <IconButton 
                size="small" 
                onClick={onNext}
                disabled={currentPage >= totalPages || loading}
                sx={{ padding: '2px' }}
                data-testid="next-button"
              >
                <NavigateNext 
                  sx={{ 
                    color: '#888 !important',
                    fontSize: '1.2rem',
                    textShadow: '0 0 2px #000',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#fff !important', textShadow: '0 0 4px #000' }
                  }} 
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

// Exportar componente memo para prevenir renders innecesarios
export const MemoizedRutinaNavigation = memo(RutinaNavigation);

// Mantener la exportación original para compatibilidad
export { RutinaNavigation }; 
