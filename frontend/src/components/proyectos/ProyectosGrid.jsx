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
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EmptyState from '../EmptyState';
import clienteAxios from '../../config/axios';
import { useSnackbar } from 'notistack';

const TareaItem = ({ tarea, onUpdateTarea }) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tareaLocal, setTareaLocal] = useState(tarea);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setTareaLocal(tarea);
  }, [tarea]);

  const handleSubtareaToggle = async (subtareaId, completada) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Actualizar estado local inmediatamente
      const nuevasSubtareas = tareaLocal.subtareas.map(st => 
        st._id === subtareaId ? { ...st, completada: !completada } : st
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

      const response = await clienteAxios.patch(`/tareas/${tarea._id}/subtareas`, {
        subtareaId,
        completada: !completada
      });
      
      if (response.data) {
        // Actualizar estado global con la respuesta del servidor
        if (onUpdateTarea) {
          onUpdateTarea(response.data);
        }
        enqueueSnackbar('Subtarea actualizada exitosamente', { variant: 'success' });
      }
    } catch (error) {
      // Revertir estado local en caso de error
      setTareaLocal(tarea);
      console.error('Error al actualizar subtarea:', error);
      enqueueSnackbar('Error al actualizar subtarea', { variant: 'error' });
    } finally {
      // Asegurar que el estado de actualización se resetee después de un tiempo
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
        border: '1px solid',
        borderColor: 'grey.800',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: getEstadoColor(tareaLocal.estado)
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
            {tareaLocal.titulo}
          </Typography>
        </Box>
        <Typography 
          variant="caption" 
          sx={{ 
            px: 1, 
            py: 0.5, 
            backgroundColor: 'background.paper',
            borderRadius: 1,
            color: getEstadoColor(tareaLocal.estado)
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
              {tareaLocal.descripcion}
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
                    backgroundColor: '#2D5C2E'
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
                      onChange={() => handleSubtareaToggle(subtarea._id, subtarea.completada)}
                      size="small"
                      sx={{
                        padding: 0.25,
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: '#2D5C2E'
                        }
                      }}
                      icon={<PendingIcon sx={{ fontSize: '1.2rem' }} />}
                      checkedIcon={<CompletedIcon sx={{ fontSize: '1.2rem' }} />}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: subtarea.completada ? 'line-through' : 'none',
                        color: subtarea.completada ? 'text.secondary' : 'text.primary',
                        flex: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSubtareaToggle(subtarea._id, subtarea.completada)}
                    >
                      {subtarea.titulo}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

const ProyectoItem = ({ proyecto, onEdit, onDelete, onUpdateTarea }) => {
  const [expanded, setExpanded] = useState(false);
  const proyectoId = proyecto._id || proyecto.id;

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
            label={`${proyecto.tareas.length}`}
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
            onClick={(e) => {
              e.stopPropagation();
              onEdit(proyecto);
            }}
            sx={{ color: 'text.secondary' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(proyectoId);
            }}
            sx={{ color: '#8B0000' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 2 }}>
          {Array.isArray(proyecto.tareas) && proyecto.tareas.length > 0 ? (
            <Stack spacing={1}>
              {proyecto.tareas.map((tarea) => (
                <TareaItem
                  key={tarea._id || tarea.id}
                  tarea={tarea}
                  onUpdateTarea={onUpdateTarea}
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

const ProyectosGrid = ({ proyectos, onEdit, onDelete, onAdd, onUpdateTarea }) => {
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
        />
      ))}
    </Stack>
  );
};

export default ProyectosGrid; 