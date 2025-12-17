import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Typography,
  Tooltip,
  LinearProgress,
  Stack,
  Menu,
  MenuItem,
  Checkbox,
  TextField,
  Divider,
  Chip,
  TableHead,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useResponsive } from '@shared/hooks';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayCircle as InProgressIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, isThisYear, addMonths, isBefore, addDays, addWeeks, isWeekend, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import TareaActions from './TareaActions';
import { useValuesVisibility } from '@shared/context/ValuesVisibilityContext';
import RutinasPendientesHoy from '../rutinas/RutinasPendientesHoy';
import { getAgendaBucket, getAgendaSortKey, isTaskCompleted, parseTaskDate } from '@shared/utils';

const normalizeEstado = (estado) => String(estado || '').toUpperCase();

// Escala de grises unificada (match con RutinasPendientesHoy)
const getGreySurfaceTokens = (theme) => {
  const layoutBg = theme.palette.background.default;
  // Un tono más oscuro que el background del layout (para que el divider "aparezca" pero siga siendo sutil)
  const layoutDividerColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.black, 0.35)
    : alpha(theme.palette.common.black, 0.12);
  const surfaceBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.035)
    : alpha(theme.palette.common.black, 0.03);
  // Divider "de sección" (dentro del bloque). Útil para headers/bandas.
  const sectionDividerColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.10)
    : alpha(theme.palette.common.black, 0.10);
  const hoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.055)
    : alpha(theme.palette.common.black, 0.045);
  return { layoutBg, layoutDividerColor, surfaceBg, sectionDividerColor, hoverBg };
};

const getEstadoTokens = (theme, estado) => {
  const e = normalizeEstado(estado);
  const main = (() => {
    if (e === 'COMPLETADA') return theme.palette.success.main;
    if (e === 'EN_PROGRESO') return theme.palette.info.main;
    if (e === 'CANCELADA') return theme.palette.error.main;
    return theme.palette.warning.main; // PENDIENTE/default
  })();

  return {
    main,
    softBg: theme.palette.mode === 'dark' ? alpha(main, 0.10) : alpha(main, 0.08),
    softBorder: theme.palette.mode === 'dark' ? alpha(main, 0.35) : alpha(main, 0.28),
  };
};

const getPeriodo = (tarea, isArchive = false, agendaView = 'ahora') => {
  if (isArchive) {
    // Lógica para archivo (tareas completadas)
    const fechaReferencia = parseTaskDate(
      tarea?.fechaVencimiento || tarea?.fechaFin || tarea?.vencimiento || tarea?.dueDate || tarea?.fecha ||
      tarea?.fechaInicio || tarea?.inicio || tarea?.start
    );
    
    if (!fechaReferencia) return 'SIN FECHA';
    if (isToday(fechaReferencia)) return 'HOY';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(fechaReferencia, today) && isThisWeek(fechaReferencia)) return 'ESTA SEMANA';
    if (isBefore(fechaReferencia, today) && isThisMonth(fechaReferencia)) return 'ESTE MES';
    if (isBefore(fechaReferencia, addMonths(today, -3))) return 'ÚLTIMO TRIMESTRE';
    if (isBefore(fechaReferencia, addMonths(today, -12))) return 'ÚLTIMO AÑO';
    return 'MÁS ANTIGUO';
  } else {
    // Regla unificada: bucket depende de la ancla (due si existe, si no start) y de la vista (AHORA/LUEGO).
    return getAgendaBucket(tarea, agendaView);
  }
};

const ordenarTareas = (tareas) => {
  return tareas.sort((a, b) => {
    const aRef = getAgendaSortKey(a);
    const bRef = getAgendaSortKey(b);
    // SIN FECHA al final
    if (!aRef && !bRef) return 0;
    if (!aRef) return 1;
    if (!bRef) return -1;
    return aRef - bRef;
  });
};

export const TareaRow = ({ tarea, onEdit, onDelete, onUpdateEstado, isArchive = false, showValues, updateWithHistory, isMultiSelectMode = false, selectedTareas = [], onSelectTarea, onActivateMultiSelect }) => {
  const [open, setOpen] = useState(false);
  const [estadoLocal, setEstadoLocal] = useState(tarea.estado);
  const [subtareasLocal, setSubtareasLocal] = useState(tarea.subtareas || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressActivated, setLongPressActivated] = useState(false);
  const [showMultiSelectHint, setShowMultiSelectHint] = useState(false);
  const { isMobile, theme } = useResponsive();
  const { enqueueSnackbar } = useSnackbar();
  const { maskText } = useValuesVisibility();

  useEffect(() => {
    setEstadoLocal(tarea.estado);
    setSubtareasLocal(tarea.subtareas || []);
  }, [tarea]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Escuchar evento para mostrar pista visual de selección múltiple
  useEffect(() => {
    const handleShowMultiSelectHint = (event) => {
      const { active } = event.detail;
      setShowMultiSelectHint(active);
      
      // Auto-ocultar después de 5 segundos
      if (active) {
        setTimeout(() => {
          setShowMultiSelectHint(false);
        }, 5000);
      }
    };

    window.addEventListener('showMultiSelectHint', handleShowMultiSelectHint);
    
    return () => {
      window.removeEventListener('showMultiSelectHint', handleShowMultiSelectHint);
    };
  }, []);

  // Funciones para manejar presión larga - Desktop (Mouse)
  const handleMouseDown = (e) => {
    // Solo en desktop, usar presión larga para activar selección múltiple
    if (isMobile || selectedTareas.length > 0) return;
    
    setIsLongPressing(true);
    setLongPressActivated(false);
    const timer = setTimeout(() => {
      // Seleccionar automáticamente esta tarea
      if (onSelectTarea) {
        onSelectTarea(tarea._id);
        setLongPressActivated(true); // Marcar que la presión larga se activó
      }
    }, 500); // 500ms para activar presión larga en desktop
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    // Resetear longPressActivated inmediatamente para evitar conflictos con clicks
    setLongPressActivated(false);
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    // Resetear longPressActivated inmediatamente para evitar conflictos
    setLongPressActivated(false);
  };

  // Funciones para touch events - Mobile/Tablet
  const handleTouchStart = (e) => {
    // Solo en mobile/tablet, usar presión larga para activar selección múltiple
    if (!isMobile || selectedTareas.length > 0) return;
    
    setIsLongPressing(true);
    setLongPressActivated(false);
    const timer = setTimeout(() => {
      // Seleccionar automáticamente esta tarea
      if (onSelectTarea) {
        onSelectTarea(tarea._id);
        setLongPressActivated(true); // Marcar que la presión larga se activó
      }
    }, 300); // 300ms para activar presión larga en mobile (más rápido)
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    // Resetear longPressActivated inmediatamente para evitar conflictos
    setLongPressActivated(false);
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    // Resetear longPressActivated inmediatamente para evitar conflictos
    setLongPressActivated(false);
  };

  const handleSubtareaToggle = async (subtareaId, completada) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      console.log('🔄 Actualizando subtarea:', { subtareaId, completada });
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      // Actualizar estado local inmediatamente
      const nuevasSubtareas = subtareasLocal.map(st => 
        st._id === subtareaId ? { ...st, completada: !completada } : st
      );
      setSubtareasLocal(nuevasSubtareas);
      
      // Determinar nuevo estado basado en subtareas
      const todasCompletadas = nuevasSubtareas.every(st => st.completada);
      const algunaCompletada = nuevasSubtareas.some(st => st.completada);
      let nuevoEstado = 'PENDIENTE';
      if (todasCompletadas) {
        nuevoEstado = 'COMPLETADA';
      } else if (algunaCompletada) {
        nuevoEstado = 'EN_PROGRESO';
      }
      setEstadoLocal(nuevoEstado);

      console.log('📝 Enviando actualización:', { subtareas: nuevasSubtareas });
      
      const response = await updateWithHistory(tarea._id, {
        subtareas: nuevasSubtareas
      }, tareaOriginal);
      
      console.log('✅ Respuesta recibida:', response);
      
      if (response) {
        // Actualizar estado global
        if (onUpdateEstado) {
          onUpdateEstado(response);
        }
      }
    } catch (error) {
      // Revertir cambios locales en caso de error
      setSubtareasLocal(tarea.subtareas || []);
      setEstadoLocal(tarea.estado);
      console.error('❌ Error al actualizar subtarea:', error);
      enqueueSnackbar('Error al actualizar subtarea', { variant: 'error' });
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 300);
    }
  };

  const handleEstadoClick = async (event) => {
    event.stopPropagation();
    const estados = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'];
    const currentIndex = estados.indexOf(estadoLocal);
    const nuevoEstado = estados[(currentIndex + 1) % estados.length];
    
    try {
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      const response = await updateWithHistory(tarea._id, { estado: nuevoEstado }, tareaOriginal);
      setEstadoLocal(nuevoEstado);
      if (onUpdateEstado) {
        onUpdateEstado(response);
      }
      enqueueSnackbar('Estado actualizado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const getEstadoIcon = (estado) => {
    const { main } = getEstadoTokens(theme, estado);
    switch (normalizeEstado(estado)) {
      case 'COMPLETADA':
        return <CompletedIcon sx={{ color: main }} />;
      case 'EN_PROGRESO':
        return <InProgressIcon sx={{ color: main }} />;
      case 'PENDIENTE':
        return <PendingIcon sx={{ color: main }} />;
      case 'CANCELADA':
        return <PendingIcon sx={{ color: main }} />;
      default:
        return <PendingIcon sx={{ color: main }} />;
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return 'Completada';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'PENDIENTE':
        return 'Pendiente';
      default:
        return estado;
    }
  };

  const getSubtareasProgress = () => {
    if (!subtareasLocal?.length) return 0;
    const completadas = subtareasLocal.filter(st => st.completada).length;
    return (completadas / subtareasLocal.length) * 100;
  };

  const handlePush = async (tarea) => {
    const today = new Date();
    let nuevaFecha;
    
    switch (tarea.pushCount % 4) {
      case 0: // Próximo día hábil
        nuevaFecha = addDays(today, 1);
        while (isWeekend(nuevaFecha)) {
          nuevaFecha = addDays(nuevaFecha, 1);
        }
        break;
      case 1: // Próxima semana
        nuevaFecha = addWeeks(today, 1);
        break;
      case 2: // Próximo mes
        nuevaFecha = startOfMonth(addMonths(today, 1));
        break;
      case 3: // Hoy
        nuevaFecha = today;
        break;
    }

    try {
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      const updated = await updateWithHistory(tarea._id, { fechaInicio: nuevaFecha.toISOString(), pushCount: (tarea.pushCount || 0) + 1 }, tareaOriginal);
      if (onUpdateEstado) onUpdateEstado(updated);
      enqueueSnackbar('Fecha actualizada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar fecha:', error);
      enqueueSnackbar('Error al actualizar fecha', { variant: 'error' });
    }
  };

  const handleDelegate = (tarea) => {
    // Por implementar
    enqueueSnackbar('Función por implementar', { variant: 'info' });
  };

  const handleTogglePriority = async (tarea) => {
    try {
      const nuevaPrioridad = tarea.prioridad === 'ALTA' ? 'BAJA' : 'ALTA';
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      const updated = await updateWithHistory(tarea._id, { prioridad: nuevaPrioridad }, tareaOriginal);
      if (onUpdateEstado) onUpdateEstado(updated);
      enqueueSnackbar('Prioridad actualizada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar prioridad:', error);
      enqueueSnackbar('Error al actualizar prioridad', { variant: 'error' });
    }
  };

  const handleComplete = async (tarea) => {
    try {
      // Marcar todas las subtareas como completadas
      const nuevasSubtareas = tarea.subtareas.map(st => ({
        ...st,
        completada: true
      }));

      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      const response = await updateWithHistory(tarea._id, { subtareas: nuevasSubtareas }, tareaOriginal);
      
      if (onUpdateEstado) {
        onUpdateEstado(response);
      }
      enqueueSnackbar('Tarea completada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al completar tarea:', error);
      enqueueSnackbar('Error al completar tarea', { variant: 'error' });
    }
  };

  const handleReactivate = async (tarea) => {
    try {
      // Marcar todas las subtareas como no completadas
      const nuevasSubtareas = tarea.subtareas.map(st => ({
        ...st,
        completada: false
      }));

      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      const response = await updateWithHistory(tarea._id, { subtareas: nuevasSubtareas }, tareaOriginal);
      
      if (onUpdateEstado) {
        onUpdateEstado(response);
      }
      enqueueSnackbar('Tarea reactivada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al reactivar tarea:', error);
      enqueueSnackbar('Error al reactivar tarea', { variant: 'error' });
    }
  };

  const handleCancel = async (tarea) => {
    try {
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tarea };
      
      const updated = await updateWithHistory(tarea._id, { estado: 'CANCELADA', completada: false }, tareaOriginal);
      if (onUpdateEstado) onUpdateEstado(updated);
      enqueueSnackbar('Tarea cancelada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al cancelar tarea:', error);
      enqueueSnackbar('Error al cancelar tarea', { variant: 'error' });
    }
  };

  // Función para manejar click normal (no presión larga)
  const handleRowClick = (e) => {
    // Si el click viene del checkbox, no hacer nada adicional
    if (e.target.closest('.MuiCheckbox-root')) {
      return;
    }
    
    // Si estamos en modo selección múltiple, solo manejar selección
    if (isMultiSelectMode) {
      e.stopPropagation();
      if (onSelectTarea) {
        onSelectTarea(tarea._id);
      }
      return;
    }
    
    // Si hay tareas seleccionadas (incluso si es solo esta), manejar como selección múltiple
    if (selectedTareas.length > 0) {
      e.stopPropagation();
      if (onSelectTarea) {
        onSelectTarea(tarea._id);
      }
      return;
    }
    
    // Si la presión larga ya se activó, no hacer nada más
    if (longPressActivated) {
      e.stopPropagation();
      return;
    }
    
    // Si estamos en proceso de presión larga, no hacer nada
    if (isLongPressing || longPressTimer) {
      e.stopPropagation();
      return;
    }
    
    // Solo hacer toggle del colapse si no hay selecciones activas y no fue presión larga
    setOpen(!open);
  };

  const estadoTokens = getEstadoTokens(theme, estadoLocal);
  const selectionAccent = theme.palette.info.main;
  const { hoverBg: rowHoverBg, layoutDividerColor, surfaceBg } = getGreySurfaceTokens(theme);

  return (
    <>
      <TableRow 
        sx={{ 
          // Divider minimal entre rows (controlado y consistente)
          // Usar el background del layout para que "se difumine" con el resto de la app
          '& > *': { borderBottom: `1px solid ${layoutDividerColor}` },
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: rowHoverBg
          },
          position: 'relative',
          // Compactación real: MUI suele imponer mínimos "táctiles" en IconButton/TableCell
          '& .MuiIconButton-root': {
            p: 0,
            m: 0,
            width: isMobile ? 22 : 18,
            height: isMobile ? 22 : 18,
            minWidth: 0,
            minHeight: 0,
          },
          '& .MuiSvgIcon-root': {
            fontSize: isMobile ? '1.1rem' : '1rem',
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${layoutDividerColor} !important`,
            // +20% aprox de alto (subiendo padding vertical)
            py: isMobile ? 0.14 : 0.07,
            px: isMobile ? 0.75 : 1,
            lineHeight: 1,
          },
          // Fondo base: "surface" (para contrastar con layoutBg). Estados/selección encima.
          bgcolor: isLongPressing
            ? alpha(selectionAccent, 0.16)
            : (selectedTareas.includes(tarea._id) ? alpha(selectionAccent, 0.12) : surfaceBg),
          transition: 'background-color 0.2s ease',
          ...(selectedTareas.length > 0 && {
            // Sin sombras: usar outline (no afecta layout)
            outline: selectedTareas.includes(tarea._id) ? '2px solid' : 'none',
            outlineColor: selectedTareas.includes(tarea._id) ? selectionAccent : 'transparent',
            outlineOffset: '-2px',
            borderRadius: 1
          }),
          // Indicación visual cuando el modo selección múltiple está activo
          ...(showMultiSelectHint && selectedTareas.length === 0 && {
            outline: '2px dashed',
            outlineColor: selectionAccent,
            outlineOffset: '-2px',
            borderRadius: 1,
            backgroundColor: alpha(selectionAccent, 0.06),
            '&:hover': {
              backgroundColor: alpha(selectionAccent, 0.10),
              outlineColor: alpha(selectionAccent, 0.9)
            }
          }),
          // Animación sutil cuando hay selecciones activas pero esta tarea no está seleccionada
          ...(selectedTareas.length > 0 && !selectedTareas.includes(tarea._id) && {
            animation: 'subtlePulse 3s infinite'
          }),
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            // Sin cortes para que no aparezcan “rayitas” en el borde inferior
            bottom: 0,
            width: 4,
            backgroundColor: estadoTokens.main
          },
          ...(isLongPressing && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(selectionAccent, 0.10),
              // Sin bordes (evita líneas fuertes en algunos DPI/zoom)
              outline: '2px solid',
              outlineColor: selectionAccent,
              outlineOffset: '-2px',
              borderRadius: 1,
              pointerEvents: 'none'
            }
          })
        }}
        onClick={handleRowClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <TableCell sx={{ py: 0.3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.25 : 0.35, minHeight: 0 }}>
            {/* Checkbox de selección múltiple */}
            {selectedTareas.length > 0 && (
              <Checkbox
                checked={selectedTareas.includes(tarea._id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectTarea(tarea._id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                size={isMobile ? "medium" : "small"}
                sx={{
                  padding: isMobile ? 0.25 : 0.125,
                  color: 'text.secondary',
                  '&.Mui-checked': {
                    color: selectionAccent
                  },
                  // En mobile, hacer el checkbox más visible
                  ...(isMobile && {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.5rem'
                    }
                  })
                }}
              />
            )}
            
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
              sx={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: 'text.secondary'
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
            {tarea.prioridad === 'ALTA' && (
              <Typography 
                color="error" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.7rem' : '0.85rem',
                  lineHeight: 1
                }}
              >
                !
              </Typography>
            )}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <Typography 
                variant={isMobile ? "body2" : "body2"} 
                sx={{ 
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  // Un toque más grande (sin volver a inflar la altura de la row)
                  fontSize: isMobile ? '0.76rem' : '0.82rem',
                  lineHeight: 1.02
                }}
              >
                {showValues ? tarea.titulo : maskText(tarea.titulo)}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ width: isMobile ? 80 : 120, py: 0.3 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: isMobile ? '0.6rem' : '0.7rem',
              lineHeight: 1.1
            }}
          >
            {tarea.fechaVencimiento ? format(new Date(tarea.fechaVencimiento), isMobile ? 'dd/MM' : 'dd MMM', { locale: es }).toUpperCase() : '---'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'none !important' },
        }}
      >
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: 'none' }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ 
              p: isMobile ? 1 : 2, 
              // Nivel anidado (detalle colapsado): fondo sutil + rail de estado para clarificar pertenencia
              bgcolor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.03)
                : alpha(theme.palette.common.black, 0.03),
              borderLeft: `2px solid ${estadoTokens.softBorder}`,
              ml: 0.5,
              pl: isMobile ? 1 : 1.5,
              maxHeight: isMobile ? '250px' : '300px', 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: isMobile ? '4px' : '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)',
              },
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center', width: '100%', display: 'block' }}>
                {format(new Date(tarea.fechaInicio), 'dd MMM yyyy', { locale: es })}
                {tarea.fechaVencimiento && (
                  <> → {format(new Date(tarea.fechaVencimiento), 'dd MMM yyyy', { locale: es })}</>
                )}
              </Typography>

              {tarea.descripcion && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}
                >
                  {showValues ? tarea.descripcion : maskText(tarea.descripcion)}
                </Typography>
              )}

              {tarea.subtareas?.length > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="body2">
                      Subtareas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subtareasLocal.filter(st => st.completada).length}/{subtareasLocal.length} completadas
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getSubtareasProgress()} 
                    sx={{ 
                      height: 2,
                      borderRadius: 1,
                      mb: 0.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.14),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: isArchive ? theme.palette.success.main : theme.palette.info.main
                      }
                    }}
                  />
                  <Box sx={{ pl: 0 }}>
                    {subtareasLocal.map((subtarea, index) => (
                      <Box 
                        key={subtarea._id || index}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          mb: 0.25,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            borderRadius: 1
                          }
                        }}
                      >
                        <Checkbox
                          checked={subtarea.completada}
                          onChange={() => !isUpdating && handleSubtareaToggle(subtarea._id, subtarea.completada)}
                          disabled={isUpdating}
                          size="small"
                          sx={{
                            padding: 0.25,
                            color: 'text.secondary',
                            '&.Mui-checked': {
                              color: isArchive ? theme.palette.success.main : theme.palette.info.main
                            },
                            '& .MuiSvgIcon-root': {
                              borderRadius: '50%'
                            },
                            '&:hover': {
                              backgroundColor: 'transparent'
                            }
                          }}
                          icon={<PendingIcon sx={{ fontSize: '1.2rem' }} />}
                          checkedIcon={<CompletedIcon sx={{ 
                            fontSize: '1.2rem', 
                            backgroundColor: 'background.default',
                            color: isArchive ? theme.palette.success.main : theme.palette.info.main,
                            borderRadius: '50%',
                            border: '2px solid', 
                            borderColor: isArchive ? theme.palette.success.main : theme.palette.info.main
                          }} />}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: subtarea.completada ? 'line-through' : 'none',
                            color: subtarea.completada ? 'text.secondary' : 'text.primary',
                            flex: 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => !isUpdating && handleSubtareaToggle(subtarea._id, subtarea.completada)}
                        >
                          {showValues ? subtarea.titulo : maskText(subtarea.titulo)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {tarea.archivos?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Archivos Adjuntos
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {tarea.archivos.map((archivo, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.03)
                            : alpha(theme.palette.common.black, 0.03),
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          '&:hover': {
                            borderColor: selectionAccent,
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <Typography variant="body2">
                          {archivo.nombre}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              <TareaActions 
                tarea={tarea}
                onEdit={onEdit}
                onDelete={onDelete}
                onPush={handlePush}
                onDelegate={handleDelegate}
                onTogglePriority={handleTogglePriority}
                onComplete={handleComplete}
                onReactivate={handleReactivate}
                onCancel={handleCancel}
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const TareasTable = ({ tareas, onEdit, onDelete, onUpdateEstado, isArchive = false, showValues, updateWithHistory, isMultiSelectMode = false, selectedTareas = [], onSelectTarea, onActivateMultiSelect, groupingEnabled = true, agendaView = 'ahora' }) => {
  const { isMobile, theme } = useResponsive();
  const { maskText } = useValuesVisibility();
  const { layoutBg, surfaceBg, sectionDividerColor } = getGreySurfaceTokens(theme);
  const groupTitleBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.06)
    : alpha(theme.palette.common.black, 0.06);
  const groupSubBg = surfaceBg;
  const groupDividerColor = sectionDividerColor;
  const shouldShowRutinas = !isArchive && agendaView === 'ahora';

  // Importante:
  // - En la vista principal (Tareas.jsx) ya filtramos (AHORA/LUEGO + mostrar completadas) con `useAgendaFilter`.
  // - Si aquí re-filtramos completadas, rompemos el toggle de "mostrar completadas".
  // Por eso, solo filtramos en "Archivo" y, en caso normal, respetamos la lista entrante.
  const tareasAMostrar = isArchive
    ? (Array.isArray(tareas) ? tareas.filter(tarea => isTaskCompleted(tarea)) : [])
    : (Array.isArray(tareas) ? tareas : []);

  // Render plano sin agrupación cuando groupingEnabled es false
  if (!groupingEnabled) {
    return (
      // Usar la misma "surface" que RutinasPendientesHoy para que no choque con el theme paper
      // El contenedor usa el background del layout; las filas tienen su surfaceBg.
      <Stack spacing={isMobile ? 1 : 2}>
        {shouldShowRutinas && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: layoutBg,
              borderRadius: 1,
              overflow: 'hidden',
              mx: isMobile ? 0 : 'auto',
              width: '100%',
              border: 'none'
            }}
          >
            <Box
              sx={{
                px: isMobile ? 1 : 2,
                py: 0.25,
                bgcolor: groupSubBg,
                borderTop: '1px solid',
                borderColor: groupDividerColor,
                borderLeft: `3px solid ${alpha(theme.palette.text.primary, 0.10)}`
              }}
            >
              <RutinasPendientesHoy variant="iconsRow" showDividers={false} />
            </Box>
          </Paper>
        )}

        <TableContainer sx={{ bgcolor: layoutBg }}>
          <Table
            size="small"
            sx={{
              // Evitar borderBottom default (lo controlamos por-row)
              '& .MuiTableCell-root': { borderBottom: 'none' },
            }}
          >
            <TableBody>
              {tareasAMostrar.map((tarea) => (
                <TareaRow
                  key={tarea._id || tarea.id}
                  tarea={tarea}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateEstado={onUpdateEstado}
                  isArchive={isArchive}
                  showValues={showValues}
                  updateWithHistory={updateWithHistory}
                  isMultiSelectMode={isMultiSelectMode}
                  selectedTareas={selectedTareas}
                  onSelectTarea={onSelectTarea}
                  onActivateMultiSelect={onActivateMultiSelect}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  }

  // Agrupar tareas por período
  const tareasAgrupadas = tareasAMostrar.reduce((grupos, tarea) => {
    const periodo = getPeriodo(tarea, isArchive, agendaView);
    if (!grupos[periodo]) grupos[periodo] = [];
    grupos[periodo].push(tarea);
    return grupos;
  }, {});

  // Ordenar tareas dentro de cada grupo
  Object.keys(tareasAgrupadas).forEach(periodo => {
    tareasAgrupadas[periodo] = ordenarTareas(tareasAgrupadas[periodo]);
  });

  // Ordenar períodos según si es archivo o no
  const ordenPeriodosArchivo = ['HOY', 'ESTA SEMANA', 'ESTE MES', 'ÚLTIMO TRIMESTRE', 'ÚLTIMO AÑO', 'MÁS ANTIGUO', 'SIN FECHA'];
  const ordenPeriodosActivasAhora = ['HOY', 'MAÑANA', 'ESTA SEMANA', 'ESTE MES', 'PRÓXIMO TRIMESTRE', 'ESTE AÑO', 'MÁS ADELANTE', 'SIN FECHA'];
  const ordenPeriodosActivasLuego = ['ESTA SEMANA', 'ESTE MES', 'PRÓXIMO MES', 'PRÓXIMO TRIMESTRE', 'ESTE AÑO', 'MÁS ADELANTE', 'SIN FECHA'];
  
  const ordenPeriodosActivas = agendaView === 'luego' ? ordenPeriodosActivasLuego : ordenPeriodosActivasAhora;
  const ordenPeriodos = isArchive ? ordenPeriodosArchivo : ordenPeriodosActivas;
  const periodosOrdenados = Object.keys(tareasAgrupadas).sort(
    (a, b) => ordenPeriodos.indexOf(a) - ordenPeriodos.indexOf(b)
  );
  const hasHoyPeriodo = Object.prototype.hasOwnProperty.call(tareasAgrupadas, 'HOY');

  return (
    <Stack spacing={isMobile ? 1 : 2}>
      {/* Rutinas (independiente de si existen tareas HOY) */}
      {shouldShowRutinas && !hasHoyPeriodo && (
        <Paper
          elevation={0}
          sx={{
            bgcolor: layoutBg,
            borderRadius: 1,
            overflow: 'hidden',
            mx: isMobile ? 0 : 'auto',
            width: '100%',
            border: 'none'
          }}
        >
          <Box
            sx={{
              px: isMobile ? 1 : 2,
              py: 0.25,
              bgcolor: groupSubBg,
              borderTop: '1px solid',
              borderColor: groupDividerColor,
              borderLeft: `3px solid ${alpha(theme.palette.text.primary, 0.10)}`
            }}
          >
            <RutinasPendientesHoy variant="iconsRow" showDividers={false} />
          </Box>
        </Paper>
      )}

      {periodosOrdenados.map((periodo) => (
        <Paper 
          key={periodo} 
          elevation={0}
          sx={{ 
            // Igualar al background general del layout (para que los dividers sean “cortes” suaves)
            bgcolor: layoutBg, 
            borderRadius: 1,
            overflow: 'hidden',
            mx: isMobile ? 0 : 'auto',
            width: '100%',
            // Simplificar look: sin "recuadro" (borde/sombra). Nos quedamos con dividers internos.
            border: 'none'
          }}
        >
          <Box sx={{ borderBottom: '1px solid', borderColor: groupDividerColor }}>
            {/* Banda 1: título del grupo (más oscura) */}
            <Box
              sx={{
                px: isMobile ? 1 : 2,
                py: isMobile ? 0.5 : 0.75,
                bgcolor: groupTitleBg,
                borderLeft: `3px solid ${alpha(theme.palette.text.primary, 0.18)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant={isMobile ? "body2" : "subtitle2"} sx={{ fontWeight: 600 }}>
                  {periodo}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {tareasAgrupadas[periodo].length}
                </Typography>
              </Box>
            </Box>

            {/* Banda 2: sector Rutinas (no tintar el anidado; solo una base suave) */}
            {shouldShowRutinas && periodo === 'HOY' && (
              <Box
                sx={{
                  px: isMobile ? 1 : 2,
                  py: 0.25,
                  bgcolor: groupSubBg,
                  borderTop: '1px solid',
                  borderColor: groupDividerColor,
                  borderLeft: `3px solid ${alpha(theme.palette.text.primary, 0.10)}`
                }}
              >
                <RutinasPendientesHoy variant="iconsRow" showDividers={false} />
              </Box>
            )}
          </Box>

          <TableContainer sx={{ bgcolor: layoutBg }}>
            <Table
              size="small"
              sx={{
                '& .MuiTableCell-root': { borderBottom: 'none' },
              }}
            >
              <TableBody>
                {tareasAgrupadas[periodo].map((tarea) => (
                  <TareaRow
                    key={tarea._id || tarea.id}
                    tarea={tarea}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdateEstado={onUpdateEstado}
                    isArchive={isArchive}
                    showValues={showValues}
                    updateWithHistory={updateWithHistory}
                    isMultiSelectMode={isMultiSelectMode}
                    selectedTareas={selectedTareas}
                    onSelectTarea={onSelectTarea}
                    onActivateMultiSelect={onActivateMultiSelect}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Stack>
  );
};

export default TareasTable;

// Definiciones de animaciones CSS para selección múltiple
const styles = `
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }
  
  @keyframes subtlePulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.9;
    }
    100% {
      opacity: 1;
    }
  }
`;

// Inyectar estilos en el documento
if (typeof document !== 'undefined') {
  const existing = document.getElementById('tareas-table-animations');
  if (!existing) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'tareas-table-animations';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
} 
