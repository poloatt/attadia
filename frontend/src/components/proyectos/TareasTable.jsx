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
  useTheme,
  Tooltip,
  LinearProgress,
  Stack,
  Menu,
  MenuItem,
  Checkbox,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayCircle as InProgressIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clienteAxios from '../../config/axios';
import { useSnackbar } from 'notistack';

const TareaRow = ({ tarea, onEdit, onDelete, onUpdateEstado }) => {
  const [open, setOpen] = useState(false);
  const [estadoLocal, setEstadoLocal] = useState(tarea.estado);
  const [subtareasLocal, setSubtareasLocal] = useState(tarea.subtareas || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setEstadoLocal(tarea.estado);
    setSubtareasLocal(tarea.subtareas || []);
  }, [tarea.estado, tarea.subtareas]);

  const handleEstadoClick = async (event) => {
    event.stopPropagation();
    const estados = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'];
    const currentIndex = estados.indexOf(estadoLocal);
    const nuevoEstado = estados[(currentIndex + 1) % estados.length];
    
    try {
      const response = await clienteAxios.patch(`/tareas/${tarea._id}/estado`, { estado: nuevoEstado });
      setEstadoLocal(nuevoEstado);
      if (onUpdateEstado) {
        onUpdateEstado(response.data);
      }
      enqueueSnackbar('Estado actualizado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const handleSubtareaToggle = async (subtareaId, completada) => {
    if (isUpdating) return; // Prevenir múltiples solicitudes
    
    try {
      setIsUpdating(true);
      const response = await clienteAxios.patch(`/tareas/${tarea._id}/subtareas`, {
        subtareaId,
        completada: !completada
      });
      
      if (response.data) {
        const tareaActualizada = response.data;
        // Actualizar el estado local de las subtareas
        setSubtareasLocal(tareaActualizada.subtareas);
        // Actualizar el estado de la tarea
        setEstadoLocal(tareaActualizada.estado);
        if (onUpdateEstado) {
          onUpdateEstado(tareaActualizada);
        }
      }
    } catch (error) {
      console.error('Error al actualizar subtarea:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al actualizar subtarea', 
        { variant: 'error' }
      );
    } finally {
      setIsUpdating(false);
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
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: getEstadoColor(estadoLocal)
          }
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={(e) => handleEstadoClick(e)}
              size="small"
              sx={{
                p: 0.25,
                color: getEstadoColor(estadoLocal),
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              {getEstadoIcon(estadoLocal)}
            </IconButton>
            {tarea.prioridad === 'ALTA' && (
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
            <Typography 
              variant="body2" 
              sx={{ 
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {tarea.titulo}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ width: 120, py: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(tarea);
                }}
                sx={{ color: 'text.secondary', p: 0.25 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tarea._id || tarea.id);
                }}
                sx={{ color: 'error.main', p: 0.25 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 0.5, px: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
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
                  {tarea.descripcion}
                </Typography>
              )}

              {tarea.subtareas?.length > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="subtitle2">
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
                        backgroundColor: '#2D5C2E',
                        borderRadius: 1
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
                              color: '#2D5C2E'
                            },
                            '& .MuiSvgIcon-root': {
                              borderRadius: '50%'
                            },
                            '&:hover': {
                              backgroundColor: 'transparent'
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
                          onClick={() => !isUpdating && handleSubtareaToggle(subtarea._id, subtarea.completada)}
                        >
                          {subtarea.titulo}
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
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const TareasTable = ({ tareas, onEdit, onDelete, onUpdateEstado }) => {
  return (
    <TableContainer component={Paper} sx={{ bgcolor: 'grey.900', borderRadius: 1 }}>
      <Table>
        <TableBody>
          {tareas.map((tarea) => (
            <TareaRow
              key={tarea._id || tarea.id}
              tarea={tarea}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateEstado={onUpdateEstado}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TareasTable; 