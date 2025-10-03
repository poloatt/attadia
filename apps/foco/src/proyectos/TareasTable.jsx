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
import { useResponsive } from '@shared/hooks';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayCircle as InProgressIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { format, isToday, isThisWeek, isThisMonth, isThisYear, addMonths, isBefore, addDays, addWeeks, isWeekend, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import TareaActions from './TareaActions';
import { useValuesVisibility } from '@shared/context/ValuesVisibilityContext';

const getPeriodo = (tarea, isArchive = false) => {
  // Si no hay fecha de inicio, categorizar como "Sin Fecha"
  if (!tarea.fechaInicio) {
    console.log(`📅 "${tarea.titulo}" → "Sin Fecha" (no tiene fechaInicio)`);
    return 'Sin Fecha';
  }
  
  const fechaInicio = new Date(tarea.fechaInicio);
  const fechaFin = tarea.fechaVencimiento ? new Date(tarea.fechaVencimiento) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Debug eliminado - enfocándonos en la sincronización

  if (isArchive) {
    // Lógica para archivo (tareas completadas)
    const fechaReferencia = fechaFin || fechaInicio;
    
    if (isToday(fechaReferencia)) return 'Hoy';
    if (isBefore(fechaReferencia, today) && isThisWeek(fechaReferencia)) return 'Esta Semana';
    if (isBefore(fechaReferencia, today) && isThisMonth(fechaReferencia)) return 'Este Mes';
    if (isBefore(fechaReferencia, addMonths(today, -3))) return 'Último Trimestre';
    if (isBefore(fechaReferencia, addMonths(today, -12))) return 'Último Año';
    return 'Más Antiguo';
  } else {
    // Lógica para tareas activas (no completadas)
    
    // Tareas sin fecha de vencimiento que empezaron antes de hoy → van a "Hoy"
    if (!tarea.completada && fechaInicio < today && !fechaFin) {
      return 'Hoy';
    }
    
    // Tareas sin fecha de vencimiento que empezaron hoy → van a "Hoy"  
    if (!tarea.completada && isToday(fechaInicio) && !fechaFin) {
      return 'Hoy';
    }

    const fechaReferencia = fechaFin || fechaInicio;

    if (isToday(fechaReferencia)) {
      return 'Hoy';
    }
    if (isThisWeek(fechaReferencia)) {
      return 'Esta Semana';
    }
    if (isThisMonth(fechaReferencia)) {
      return 'Este Mes';
    }
    if (isBefore(fechaReferencia, addMonths(new Date(), 3))) {
      return 'Próximo Trimestre';
    }
    if (isThisYear(fechaReferencia)) {
      return 'Este Año';
    }
    return 'Más Adelante';
  }
};

const ordenarTareas = (tareas) => {
  return tareas.sort((a, b) => {
    const fechaA = a.fechaVencimiento ? new Date(a.fechaVencimiento) : new Date(a.fechaInicio);
    const fechaB = b.fechaVencimiento ? new Date(b.fechaVencimiento) : new Date(b.fechaInicio);
    return fechaA - fechaB;
  });
};

const TareaRow = ({ tarea, onEdit, onDelete, onUpdateEstado, isArchive = false, showValues, updateWithHistory, isMultiSelectMode = false, selectedTareas = [], onSelectTarea, onActivateMultiSelect }) => {
  const [open, setOpen] = useState(false);
  const [estadoLocal, setEstadoLocal] = useState(tarea.estado);
  const [subtareasLocal, setSubtareasLocal] = useState(tarea.subtareas || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
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
    // Solo resetear longPressActivated después de un delay para evitar conflictos
    setTimeout(() => {
      setLongPressActivated(false);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    // Solo resetear longPressActivated después de un delay para evitar conflictos
    setTimeout(() => {
      setLongPressActivated(false);
    }, 100);
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
    // Solo resetear longPressActivated después de un delay para evitar conflictos
    setTimeout(() => {
      setLongPressActivated(false);
    }, 100);
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    // Solo resetear longPressActivated después de un delay para evitar conflictos
    setTimeout(() => {
      setLongPressActivated(false);
    }, 100);
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return '#2D5C2E';
      case 'EN_PROGRESO':
        return '#1B4A75';
      case 'PENDIENTE':
        return '#8F7F3D';
      default:
        return '#8F7F3D';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return <CompletedIcon sx={{ color: '#2D5C2E' }} />;
      case 'EN_PROGRESO':
        return <InProgressIcon sx={{ color: '#1B4A75' }} />;
      case 'PENDIENTE':
        return <PendingIcon sx={{ color: '#8C4E0B' }} />;
      default:
        return <PendingIcon sx={{ color: '#8C4E0B' }} />;
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
    // Si estamos en modo selección múltiple, solo manejar selección
    if (isMultiSelectMode) {
      e.stopPropagation();
      if (onSelectTarea) {
        onSelectTarea(tarea._id);
      }
      return;
    }
    
    // Si hay tareas seleccionadas, manejar como selección múltiple
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
    
    // Solo hacer toggle del colapse si no hay selecciones activas y no fue presión larga
    if (!longPressTimer && !isLongPressing && selectedTareas.length === 0) {
      // En mobile, verificar si es doble tap para activar selección múltiple
      if (isMobile) {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTapTime;
        
        if (timeDiff < 300 && timeDiff > 0) {
          // Doble tap detectado - activar selección múltiple
          e.stopPropagation();
          if (onSelectTarea) {
            onSelectTarea(tarea._id);
          }
          setLastTapTime(0); // Reset para evitar triple tap
          return;
        } else {
          // Tap simple - hacer toggle del colapse
          setLastTapTime(currentTime);
          setOpen(!open);
        }
      } else {
        // En desktop, hacer toggle del colapse normalmente
        setOpen(!open);
      }
    }
  };

  return (
    <>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          position: 'relative',
          height: '38px',
          bgcolor: isLongPressing ? 'action.selected' : (selectedTareas.includes(tarea._id) ? 'action.selected' : 'background.paper'),
          transition: 'background-color 0.2s ease',
          ...(selectedTareas.length > 0 && {
            border: '1px solid',
            borderColor: selectedTareas.includes(tarea._id) ? 'primary.main' : 'transparent',
            borderRadius: 1
          }),
          // Indicación visual cuando el modo selección múltiple está activo
          ...(showMultiSelectHint && selectedTareas.length === 0 && {
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 1,
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderColor: 'primary.dark'
            }
          }),
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: getEstadoColor(estadoLocal, 'TAREA')
          },
          ...(isLongPressing && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              border: '2px solid',
              borderColor: 'primary.main',
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
        <TableCell sx={{ py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
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
                  padding: isMobile ? 0.5 : 0.25,
                  color: 'text.secondary',
                  '&.Mui-checked': {
                    color: 'primary.main'
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
                p: isMobile ? 0.125 : 0.25,
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
                  fontSize: isMobile ? '0.8rem' : '1rem',
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
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }}
              >
                {showValues ? tarea.titulo : maskText(tarea.titulo)}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ width: isMobile ? 80 : 120, py: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: isMobile ? '0.65rem' : '0.75rem'
            }}
          >
            {tarea.fechaVencimiento ? format(new Date(tarea.fechaVencimiento), isMobile ? 'dd/MM' : 'dd MMM', { locale: es }).toUpperCase() : '---'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ 
              p: isMobile ? 1 : 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
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
                      backgroundColor: theme.palette.grey[800],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: isArchive ? '#2D5C2E' : '#1B4A75'
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
                              color: isArchive ? '#2D5C2E' : 'grey.800'
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
                            color: isArchive ? '#2D5C2E' : 'grey.800',
                            borderRadius: '50%',
                            border: '2px solid', 
                            borderColor: isArchive ? '#2D5C2E' : 'grey.800'
                          }} />}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: subtarea.completada ? 'line-through' : 'none',
                            color: subtarea.completada ? (isArchive ? '#2D5C2E' : 'grey.800') : 'text.primary',
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
                          bgcolor: 'grey.900',
                          border: 1,
                          borderColor: 'grey.800',
                          borderRadius: 1,
                          '&:hover': {
                            borderColor: 'primary.main',
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

const TareasTable = ({ tareas, onEdit, onDelete, onUpdateEstado, isArchive = false, showValues, updateWithHistory, isMultiSelectMode = false, selectedTareas = [], onSelectTarea, onActivateMultiSelect }) => {
  const { isMobile, theme } = useResponsive();
  const { maskText } = useValuesVisibility();

  // Debug temporal para ver qué está pasando
  console.log('🔍 DEBUG TEMPORAL - Tareas recibidas:', {
    total: tareas.length,
    tareas: tareas.map(t => ({
      titulo: t.titulo,
      completada: t.completada,
      estado: t.estado,
      fechaInicio: t.fechaInicio
    })),
    isArchive
  });

  // Filtrar tareas según si es archivo o no
  const tareasAMostrar = isArchive 
    ? tareas.filter(tarea => tarea.completada) 
    : tareas.filter(tarea => !tarea.completada);
    
  console.log('🔍 DEBUG TEMPORAL - Después del filtro:', {
    mostradas: tareasAMostrar.length,
    tareas: tareasAMostrar.map(t => ({
      titulo: t.titulo,
      completada: t.completada,
      estado: t.estado
    }))
  });

  // Agrupar tareas por período
  const tareasAgrupadas = tareasAMostrar.reduce((grupos, tarea) => {
    const periodo = getPeriodo(tarea, isArchive);
    if (!grupos[periodo]) grupos[periodo] = [];
    grupos[periodo].push(tarea);
    return grupos;
  }, {});

  // Ordenar tareas dentro de cada grupo
  Object.keys(tareasAgrupadas).forEach(periodo => {
    tareasAgrupadas[periodo] = ordenarTareas(tareasAgrupadas[periodo]);
  });

  // Ordenar períodos según si es archivo o no
  const ordenPeriodosArchivo = ['Hoy', 'Esta Semana', 'Este Mes', 'Último Trimestre', 'Último Año', 'Más Antiguo', 'Sin Fecha'];
  const ordenPeriodosActivas = ['Hoy', 'Esta Semana', 'Este Mes', 'Próximo Trimestre', 'Este Año', 'Más Adelante', 'Sin Fecha'];
  
  const ordenPeriodos = isArchive ? ordenPeriodosArchivo : ordenPeriodosActivas;
  const periodosOrdenados = Object.keys(tareasAgrupadas).sort(
    (a, b) => ordenPeriodos.indexOf(a) - ordenPeriodos.indexOf(b)
  );

  return (
    <Stack spacing={isMobile ? 1 : 2}>
      {periodosOrdenados.map((periodo) => (
        <Paper 
          key={periodo} 
          sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            overflow: 'hidden',
            mx: isMobile ? 0 : 'auto',
            width: '100%'
          }}
        >
          <Box
            sx={{
              px: isMobile ? 1 : 2,
              py: isMobile ? 0.5 : 1,
              bgcolor: '#141414',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant={isMobile ? "body2" : "subtitle2"} sx={{ fontWeight: 500 }}>
              {periodo} ({tareasAgrupadas[periodo].length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
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
