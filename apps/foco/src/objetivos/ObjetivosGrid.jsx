import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Stack,
  Divider,
  Chip,
  LinearProgress,
  Checkbox,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
} from '@mui/icons-material';
 import { TableContainer, Table, TableBody } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '@shared/components/common';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import TareaActions from './TareaActions';
import { TareaRow } from './TareasTable';
import { addDays, addWeeks, addMonths, isWeekend, startOfMonth } from 'date-fns';
import { useResponsive } from '@shared/hooks';
import { useValuesVisibility } from '@shared/context';
import { getEstadoColor } from '@shared/components/common/StatusSystem';
import { isTaskCompleted, parseTaskDate } from '@shared/utils';

const TareaItem = ({ tarea, onUpdateTarea, showValues, updateTareaWithHistory }) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tareaLocal, setTareaLocal] = useState(tarea);
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useResponsive();
  const { maskText } = useValuesVisibility();

  useEffect(() => {
    setTareaLocal(tarea);
  }, [tarea]);

  const handleSubtareaToggle = async (subtareaId) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      // Buscar el estado actual de la subtarea
      const subtareaActual = tareaLocal.subtareas.find(st => st._id === subtareaId);
      const completadaActual = subtareaActual?.completada ?? false;

      console.log('🔄 Actualizando subtarea en ObjetivosGrid:', { subtareaId, completadaActual });

      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };

      // Actualizar estado local inmediatamente
      const nuevasSubtareas = tareaLocal.subtareas.map(st =>
        st._id === subtareaId ? { ...st, completada: !completadaActual } : st
      );

      // Determinar nuevo estado basado en subtareas
      const todasCompletadas = nuevasSubtareas.every(st => st.completada);
      const algunaCompletada = nuevasSubtareas.some(st => st.completada);
      let nuevoEstado = 'PENDIENTE';
      if (todasCompletadas) {
        nuevoEstado = 'COMPLETADA';
      } else if (algunaCompletada) {
        nuevoEstado = 'EN_PROGRESO';
      }

      // Actualizar estado local con todos los cambios
      const tareaActualizada = {
        ...tareaLocal,
        estado: nuevoEstado,
        subtareas: nuevasSubtareas,
        completada: todasCompletadas
      };
      setTareaLocal(tareaActualizada);

      console.log('📝 Enviando actualización:', { subtareas: nuevasSubtareas });

      const tareaId = tarea._id || tarea.id;
      if (!tareaId) {
        throw new Error('ID de tarea no encontrado');
      }
      const response = await updateTareaWithHistory(tareaId, {
        subtareas: nuevasSubtareas
      }, tareaOriginal);

      console.log('✅ Respuesta recibida:', response);

      if (response) {
        // Actualizar estado local con los datos del servidor
        setTareaLocal(response);

        // Actualizar estado global con la respuesta del servidor
        if (onUpdateTarea) {
          onUpdateTarea(response);
        }
      }
    } catch (error) {
      // Revertir estado local en caso de error
      setTareaLocal(tarea);
      console.error('❌ Error al actualizar subtarea:', error);
      enqueueSnackbar('Error al actualizar subtarea', { variant: 'error' });
    } finally {
      // Asegurar que el estado de actualización se resetee después de un tiempo
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  const handlePush = async (tarea) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
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

      const tareaId = tarea._id || tarea.id;
      if (!tareaId) {
        throw new Error('ID de tarea no encontrado');
      }
      const response = await updateTareaWithHistory(tareaId, {
        fechaInicio: nuevaFecha.toISOString(),
        pushCount: (tarea.pushCount || 0) + 1
      }, tareaOriginal);
      
      if (response) {
        if (onUpdateTarea) {
          onUpdateTarea(response);
        }
        enqueueSnackbar('Fecha actualizada exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error al actualizar fecha:', error);
      enqueueSnackbar('Error al actualizar fecha', { variant: 'error' });
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  const handleDelegate = (tarea) => {
    // Por implementar
    enqueueSnackbar('Función por implementar', { variant: 'info' });
  };

  const handleTogglePriority = async () => {
    try {
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
      const nuevaPrioridad = tarea.prioridad === 'ALTA' ? 'BAJA' : 'ALTA';
      const tareaId = tarea._id || tarea.id;
      if (!tareaId) {
        throw new Error('ID de tarea no encontrado');
      }
      const updated = await updateTareaWithHistory(tareaId, { prioridad: nuevaPrioridad }, tareaOriginal);
      if (onUpdateTarea) onUpdateTarea(updated);
    } catch (error) {
      console.error('Error al actualizar prioridad:', error);
      enqueueSnackbar('Error al actualizar prioridad', { variant: 'error' });
    }
  };

  const handleComplete = async (tarea) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      console.log('🔄 Completando tarea en ObjetivosGrid');
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
      const nuevasSubtareas = tareaLocal.subtareas.map(st => ({
        ...st,
        completada: true
      }));

      const tareaId = tarea._id || tarea.id;
      if (!tareaId) {
        throw new Error('ID de tarea no encontrado');
      }
      const response = await updateTareaWithHistory(tareaId, {
        subtareas: nuevasSubtareas
      }, tareaOriginal);
      
      console.log('✅ Respuesta recibida:', response);
      
      if (response) {
        // Actualizar estado local con los datos del servidor
        setTareaLocal(response);
        
        if (onUpdateTarea) {
          onUpdateTarea(response);
        }
        enqueueSnackbar('Tarea completada exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('❌ Error al completar tarea:', error);
      enqueueSnackbar('Error al completar tarea', { variant: 'error' });
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  const handleReactivate = async (tarea) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      console.log('🔄 Reactivando tarea en ObjetivosGrid');
      console.log('🔍 Tarea recibida:', tarea);
      console.log('🔍 Tarea ID:', tarea._id || tarea.id);
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
      const nuevasSubtareas = tareaLocal.subtareas.map(st => ({
        ...st,
        completada: false
      }));

      const tareaId = tarea._id || tarea.id;
      if (!tareaId) {
        throw new Error('ID de tarea no encontrado');
      }

      const response = await updateTareaWithHistory(tareaId, {
        subtareas: nuevasSubtareas
      }, tareaOriginal);
      
      console.log('✅ Respuesta recibida:', response);
      
      if (response) {
        // Actualizar estado local con los datos del servidor
        setTareaLocal(response);
        
        if (onUpdateTarea) {
          onUpdateTarea(response);
        }
        enqueueSnackbar('Tarea reactivada exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('❌ Error al reactivar tarea:', error);
      enqueueSnackbar('Error al reactivar tarea', { variant: 'error' });
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  const handleCancel = async (tarea) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
      const tareaId = tarea._id || tarea.id;
      if (!tareaId) {
        throw new Error('ID de tarea no encontrado');
      }
      const response = await updateTareaWithHistory(tareaId, {
        estado: 'CANCELADA',
        completada: false
      }, tareaOriginal);
      
      if (response) {
        if (onUpdateTarea) {
          onUpdateTarea(response);
        }
        enqueueSnackbar('Tarea cancelada exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error al cancelar tarea:', error);
      enqueueSnackbar('Error al cancelar tarea', { variant: 'error' });
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  // Determinar si la tarea está retrasada para usar el color correcto
  const isRetrasada = (() => {
    if (isTaskCompleted(tareaLocal)) return false;
    const fechaVencimiento = parseTaskDate(tareaLocal?.fechaVencimiento || tareaLocal?.fechaFin || tareaLocal?.vencimiento || tareaLocal?.dueDate);
    if (fechaVencimiento) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const vencimiento = new Date(fechaVencimiento);
      vencimiento.setHours(0, 0, 0, 0);
      return vencimiento < today;
    }
    return false;
  })();
  
  // Usar estado 'RETRASADA' para el color si la tarea está retrasada, sino usar el estado real
  const estadoParaColor = isRetrasada ? 'RETRASADA' : tareaLocal.estado;

  const getSubtareasProgress = () => {
    if (!tareaLocal.subtareas?.length) return 0;
    const completadas = tareaLocal.subtareas.filter(st => st.completada).length;
    return (completadas / tareaLocal.subtareas.length) * 100;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: 'grey.900',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: getEstadoColor(estadoParaColor, 'TAREA')
        }
      }}
    >
      <Box
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={() => setOpen(!open)}
      >
        <IconButton
          size="small"
          sx={{
            p: 0.25,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: 'text.secondary'
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
        {tareaLocal.prioridad === 'ALTA' && (
          <Typography 
            color="error" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: '1rem',
              lineHeight: 1
            }}
          >
            !
          </Typography>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">
            {showValues ? tareaLocal.titulo : maskText(tareaLocal.titulo)}
          </Typography>
        </Box>
        <Typography 
          variant="caption" 
          sx={{ color: 'text.secondary', minWidth: 80, textAlign: 'right' }}
        >
          {tareaLocal.fechaVencimiento
            ? format(new Date(tareaLocal.fechaVencimiento), 'dd MMM yyyy', { locale: es })
            : '—'}
        </Typography>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ py: 1, px: 2 }}>
          {tareaLocal.descripcion && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 1, whiteSpace: 'pre-wrap' }}
            >
              {showValues ? tareaLocal.descripcion : maskText(tareaLocal.descripcion)}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            {format(new Date(tareaLocal.fechaInicio), 'dd MMM yyyy', { locale: es })}
            {tareaLocal.fechaVencimiento && (
              <> → {format(new Date(tareaLocal.fechaVencimiento), 'dd MMM yyyy', { locale: es })}</>
            )}
          </Typography>

          {tareaLocal.subtareas?.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Subtareas ({tareaLocal.subtareas.filter(st => st.completada).length}/{tareaLocal.subtareas.length})
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getSubtareasProgress()} 
                sx={{ 
                  height: 2,
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'grey.800',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: isRetrasada
                      ? getEstadoColor('RETRASADA', 'TAREA')
                      : (tareaLocal.estado === 'EN_PROGRESO' 
                        ? getEstadoColor('EN_PROGRESO', 'TAREA')
                        : getEstadoColor('COMPLETADA', 'TAREA'))
                  }
                }}
              />
              <Stack spacing={0.5}>
                {tareaLocal.subtareas.map((subtarea) => (
                  <Box 
                    key={subtarea._id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      p: 0.5,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <Checkbox
                      checked={subtarea.completada}
                      onChange={() => handleSubtareaToggle(subtarea._id)}
                      size="small"
                      sx={{
                        padding: 0.25,
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: 'grey.800'
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
                        color: 'grey.800',
                        borderRadius: '50%',
                        border: '2px solid', 
                        borderColor: 'grey.800'
                      }} />}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: subtarea.completada ? 'line-through' : 'none',
                        color: subtarea.completada ? 'grey.800' : 'text.primary',
                        flex: 1,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtareaToggle(subtarea._id);
                      }}
                    >
                      {showValues ? subtarea.titulo : maskText(subtarea.titulo)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <TareaActions 
            tarea={tareaLocal}
            onEdit={() => {}} // No implementado en ObjetivosGrid
            onDelete={() => {}} // No implementado en ObjetivosGrid
            onPush={handlePush}
            onDelegate={handleDelegate}
            onTogglePriority={handleTogglePriority}
            onComplete={handleComplete}
            onReactivate={handleReactivate}
            onCancel={handleCancel}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

const ObjetivoItem = ({ 
  objetivo, 
  onEdit, 
  onDelete, 
  onUpdateTarea, 
  onAddTarea,
  onLoadObjetivoTareas,
  showValues, 
  updateWithHistory, 
  updateTareaWithHistory,
  isMultiSelectMode,
  isSelected,
  onSelect
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [expanded, setExpanded] = useState(false);
  const [tareasLoading, setTareasLoading] = useState(false);
  const tareas = Array.isArray(objetivo.tareas) ? objetivo.tareas : [];
  const [anchorEl, setAnchorEl] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressActivated, setLongPressActivated] = useState(false);
  const objetivoId = objetivo._id || objetivo.id;

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  // Handlers para selección múltiple
  const handleLongPressStart = (event) => {
    event.preventDefault();
    setLongPressActivated(false);
    const timer = setTimeout(() => {
      if (onSelect) {
        onSelect(objetivoId);
        setLongPressActivated(true);
      }
    }, 500); // 500ms para presión larga
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressActivated(false);
  };

  const handleClick = (event) => {
    // Si el click viene del checkbox, no hacer nada adicional
    if (event.target.closest('.MuiCheckbox-root')) {
      return;
    }
    
    // Si estamos en modo selección múltiple, manejar selección
    if (isMultiSelectMode && onSelect) {
      event.preventDefault();
      onSelect(objetivoId);
      return;
    }
    
    // Si hay objetivos seleccionados, manejar como selección múltiple
    if (isSelected) {
      event.preventDefault();
      onSelect(objetivoId);
      return;
    }
    
    // Si la presión larga ya se activó, no hacer nada más
    if (longPressActivated) {
      event.preventDefault();
      return;
    }
    
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded && onLoadObjetivoTareas && tareas.length === 0) {
      setTareasLoading(true);
      Promise.resolve(onLoadObjetivoTareas(objetivoId)).finally(() => setTareasLoading(false));
    }
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    onEdit(objetivo);
    handleMenuClose();
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    onDelete(objetivoId);
    handleMenuClose();
  };

  const handleInlineEdit = async (updates) => {
    try {
      const updated = await updateWithHistory(objetivo._id || objetivo.id, updates, objetivo);
      // Actualizar estado local si es necesario
      // ...
      enqueueSnackbar('objetivo actualizado exitosamente', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al actualizar el objetivo', { variant: 'error' });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        position: 'relative',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'transparent',
        borderRadius: 1,
        // Animación sutil cuando hay selecciones activas pero este objetivo no está seleccionado
        ...(isMultiSelectMode && !isSelected && {
          animation: 'subtlePulse 3s infinite'
        }),
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: 'primary.main'
        }
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={handleClick}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        {/* Checkbox para selección múltiple */}
        {isMultiSelectMode && (
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect && onSelect(objetivoId)}
            size="small"
            sx={{
              padding: 0.5,
              color: 'text.secondary',
              '&.Mui-checked': {
                color: 'primary.main'
              }
            }}
          />
        )}
        
        <IconButton
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            {objetivo.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {objetivo.descripcion}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={tareasLoading ? '…' : `${tareas.filter((t) => !t.completada).length}`}
            sx={{
              height: 20,
              backgroundColor: 'grey.800',
              '& .MuiChip-label': {
                px: 1,
                fontSize: '0.75rem'
              }
            }}
          />
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ color: 'text.secondary' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }
          }
        }}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          onAddTarea(objetivo);
        }}>
          <AddIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          Nueva Tarea
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: '#8B0000' }} />
          Eliminar
        </MenuItem>
      </Menu>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ 
          p: 2, 
          maxHeight: '300px', 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
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
          {tareasLoading ? (
            <Typography variant="body2" color="text.secondary" align="center">
              Cargando tareas…
            </Typography>
          ) : tareas.length > 0 ? (
            <TableContainer component={Box} sx={{ width: '100%' }}>
              <Table sx={{ width: '100%' }} size="small">
                <TableBody>
              {[...tareas]
                    .filter(t => !t.completada)
                .sort((a, b) => {
                      const estadoOrden = { 'EN_PROGRESO': 0, 'PENDIENTE': 1, 'COMPLETADA': 2 };
                  if (estadoOrden[a.estado] !== estadoOrden[b.estado]) {
                    return estadoOrden[a.estado] - estadoOrden[b.estado];
                  }
                  const fechaA = a.fechaVencimiento ? new Date(a.fechaVencimiento) : new Date(a.fechaInicio);
                  const fechaB = b.fechaVencimiento ? new Date(b.fechaVencimiento) : new Date(b.fechaInicio);
                  return fechaA - fechaB;
                })
                .map((tarea) => (
                      <TareaRow
                    key={tarea._id || tarea.id}
                    tarea={tarea}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onUpdateEstado={onUpdateTarea}
                        isArchive={false}
                    showValues={showValues}
                        updateWithHistory={updateTareaWithHistory}
                        isMultiSelectMode={false}
                        selectedTareas={[]}
                        onSelectTarea={() => {}}
                        onActivateMultiSelect={() => {}}
                  />
                ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No hay tareas asignadas a este objetivo
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

const ObjetivosGrid = ({ 
  objetivos = [], 
  onEdit, 
  onDelete, 
  onAdd, 
  onUpdateTarea, 
  onAddTarea,
  onLoadObjetivoTareas,
  showValues, 
  updateWithHistory, 
  updateTareaWithHistory,
  isMultiSelectMode,
  selectedObjetivos,
  onSelectobjetivo
}) => {
  const { maskText } = useValuesVisibility();

  if (!objetivos.length) {
    return (
      <Box sx={{ p: 2 }}>
        <EmptyState onAdd={onAdd} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {objetivos.map((objetivo) => (
        <ObjetivoItem
          key={objetivo._id || objetivo.id}
          objetivo={objetivo}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateTarea={onUpdateTarea}
          onAddTarea={onAddTarea}
          onLoadObjetivoTareas={onLoadObjetivoTareas}
          showValues={showValues}
          updateWithHistory={updateWithHistory}
          updateTareaWithHistory={updateTareaWithHistory}
          isMultiSelectMode={isMultiSelectMode}
          isSelected={selectedObjetivos?.includes(objetivo._id || objetivo.id) || false}
          onSelect={onSelectobjetivo}
        />
      ))}
    </Stack>
  );
};

export default ObjetivosGrid;

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
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 