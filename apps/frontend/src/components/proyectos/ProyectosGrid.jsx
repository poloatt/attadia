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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '../common';
import clienteAxios from '../../config/axios';
import { useSnackbar } from 'notistack';
import TareaActions from './TareaActions';
import { addDays, addWeeks, addMonths, isWeekend, startOfMonth } from 'date-fns';
import useResponsive from '../../hooks/useResponsive';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';

const TareaItem = ({ tarea, onUpdateTarea, showValues, updateTareaWithHistory }) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tareaLocal, setTareaLocal] = useState(tarea);
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useResponsive();
  const { maskText } = useValuesVisibility();

  useEffect(() => {
    setTareaLocal(tarea);
    console.log('🔄 TareaItem recibió nueva tarea:', tarea);
  }, [tarea]);

  const handleSubtareaToggle = async (subtareaId) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      // Buscar el estado actual de la subtarea
      const subtareaActual = tareaLocal.subtareas.find(st => st._id === subtareaId);
      const completadaActual = subtareaActual?.completada ?? false;

      console.log('🔄 Actualizando subtarea en ProyectosGrid:', { subtareaId, completadaActual });

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

      const response = await updateTareaWithHistory(tarea._id, {
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

      const response = await updateTareaWithHistory(tarea._id, {
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
      const updated = await updateTareaWithHistory(tarea._id, { prioridad: nuevaPrioridad }, tareaOriginal);
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
      
      console.log('🔄 Completando tarea en ProyectosGrid');
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
      const nuevasSubtareas = tareaLocal.subtareas.map(st => ({
        ...st,
        completada: true
      }));

      const response = await updateTareaWithHistory(tarea._id, {
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
      
      console.log('🔄 Reactivando tarea en ProyectosGrid');
      
      // Guardar el estado original ANTES de cualquier cambio
      const tareaOriginal = { ...tareaLocal };
      
      const nuevasSubtareas = tareaLocal.subtareas.map(st => ({
        ...st,
        completada: false
      }));

      const response = await updateTareaWithHistory(tarea._id, {
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
      
      const response = await updateTareaWithHistory(tarea._id, {
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return '#2D5C2E';
      case 'EN_PROGRESO':
        return '#1B4A75';
      case 'PENDIENTE':
        return '#8C4E0B';
      default:
        return '#8C4E0B';
    }
  };

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
                          backgroundColor: getEstadoColor(tareaLocal.estado, 'TAREA')
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
          sx={{ 
            color: getEstadoColor(tareaLocal.estado, 'TAREA')
          }}
        >
          {tareaLocal.estado === 'COMPLETADA' 
            ? 'Completada' 
            : tareaLocal.estado === 'EN_PROGRESO' 
              ? 'En Progreso' 
              : 'Pendiente'}
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
                    backgroundColor: tareaLocal.estado === 'EN_PROGRESO' ? '#1B4A75' : '#2D5C2E'
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
            onEdit={() => {}} // No implementado en ProyectosGrid
            onDelete={() => {}} // No implementado en ProyectosGrid
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

const ProyectoItem = ({ proyecto, onEdit, onDelete, onUpdateTarea, onAddTarea, showValues, updateWithHistory, updateTareaWithHistory }) => {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const proyectoId = proyecto._id || proyecto.id;

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    onEdit(proyecto);
    handleMenuClose();
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    onDelete(proyectoId);
    handleMenuClose();
  };

  const handleInlineEdit = async (updates) => {
    try {
      const updated = await updateWithHistory(proyecto._id || proyecto.id, updates, proyecto);
      // Actualizar estado local si es necesario
      // ...
      enqueueSnackbar('Proyecto actualizado exitosamente', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al actualizar el proyecto', { variant: 'error' });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        position: 'relative',
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
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            {proyecto.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {proyecto.descripcion}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={`${proyecto.tareas.filter(t => !t.completada).length}`}
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
          onAddTarea(proyecto);
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
          {Array.isArray(proyecto.tareas) && proyecto.tareas.length > 0 ? (
            <Stack spacing={1}>
              {[...proyecto.tareas]
                .sort((a, b) => {
                  // Primero ordenar por estado
                  const estadoOrden = {
                    'EN_PROGRESO': 0,
                    'PENDIENTE': 1,
                    'COMPLETADA': 2
                  };
                  
                  if (estadoOrden[a.estado] !== estadoOrden[b.estado]) {
                    return estadoOrden[a.estado] - estadoOrden[b.estado];
                  }

                  // Si tienen el mismo estado, ordenar por fecha
                  const fechaA = a.fechaVencimiento ? new Date(a.fechaVencimiento) : new Date(a.fechaInicio);
                  const fechaB = b.fechaVencimiento ? new Date(b.fechaVencimiento) : new Date(b.fechaInicio);
                  return fechaA - fechaB;
                })
                .map((tarea) => (
                  <TareaItem
                    key={tarea._id || tarea.id}
                    tarea={tarea}
                    onUpdateTarea={onUpdateTarea}
                    showValues={showValues}
                    updateTareaWithHistory={updateTareaWithHistory}
                  />
                ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No hay tareas asignadas a este proyecto
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

const ProyectosGrid = ({ proyectos, onEdit, onDelete, onAdd, onUpdateTarea, onAddTarea, showValues, updateWithHistory, updateTareaWithHistory }) => {
  const { maskText } = useValuesVisibility();

  if (proyectos.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <EmptyState onAdd={onAdd} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {proyectos.map((proyecto) => (
        <ProyectoItem
          key={proyecto._id || proyecto.id}
          proyecto={proyecto}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateTarea={onUpdateTarea}
          onAddTarea={onAddTarea}
          showValues={showValues}
          updateWithHistory={updateWithHistory}
          updateTareaWithHistory={updateTareaWithHistory}
        />
      ))}
    </Stack>
  );
};

export default ProyectosGrid; 