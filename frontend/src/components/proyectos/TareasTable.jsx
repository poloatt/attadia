import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
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
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CheckCircleOutline as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  AttachFile as AttachFileIcon,
  FlagOutlined as LowPriorityIcon,
  Flag as MediumPriorityIcon,
  Report as HighPriorityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente para una fila de tarea
const TareaRow = ({ tarea, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return <CompletedIcon sx={{ color: '#66BB6A' }} />;
      case 'EN_PROGRESO':
        return <ScheduleIcon sx={{ color: '#42A5F5' }} />;
      default:
        return <PendingIcon sx={{ color: '#FFA726' }} />;
    }
  };

  const getPrioridadIcon = (prioridad) => {
    switch (prioridad) {
      case 'ALTA':
        return <HighPriorityIcon sx={{ color: '#EF5350' }} />;
      case 'MEDIA':
        return <MediumPriorityIcon sx={{ color: '#FFA726' }} />;
      case 'BAJA':
        return <LowPriorityIcon sx={{ color: '#66BB6A' }} />;
      default:
        return <MediumPriorityIcon sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const getSubtareasProgress = () => {
    if (!tarea.subtareas?.length) return 0;
    const completadas = tarea.subtareas.filter(st => st.completada).length;
    return (completadas / tarea.subtareas.length) * 100;
  };

  return (
    <>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell padding="checkbox">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`Estado: ${tarea.estado.toLowerCase()}`}>
                {getEstadoIcon(tarea.estado)}
              </Tooltip>
              <Tooltip title={`Prioridad: ${tarea.prioridad.toLowerCase()}`}>
                {getPrioridadIcon(tarea.prioridad)}
              </Tooltip>
            </Box>
            <Typography>{tarea.titulo}</Typography>
            {tarea.archivos?.length > 0 && (
              <Tooltip title={`${tarea.archivos.length} archivos adjuntos`}>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <AttachFileIcon 
                    fontSize="small" 
                    sx={{ color: 'text.secondary', transform: 'rotate(45deg)' }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    {tarea.archivos.length}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Inicio: {format(new Date(tarea.fechaInicio), 'dd MMM yyyy', { locale: es })}
              </Typography>
            </Box>
            {tarea.fechaVencimiento && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Vence: {format(new Date(tarea.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                </Typography>
              </Box>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              {/* Descripción */}
              {tarea.descripcion && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
                >
                  {tarea.descripcion}
                </Typography>
              )}

              {/* Subtareas y Progreso */}
              {tarea.subtareas?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">
                      Subtareas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tarea.subtareas.filter(st => st.completada).length}/{tarea.subtareas.length} completadas
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getSubtareasProgress()} 
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      mb: 2,
                      backgroundColor: theme.palette.grey[800],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.success.main,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Box sx={{ pl: 2 }}>
                    {tarea.subtareas.map((subtarea, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          mb: 0.5
                        }}
                      >
                        {subtarea.completada ? (
                          <CompletedIcon 
                            fontSize="small" 
                            sx={{ color: theme.palette.success.main }} 
                          />
                        ) : (
                          <PendingIcon 
                            fontSize="small" 
                            sx={{ color: theme.palette.grey[400] }} 
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: subtarea.completada ? 'line-through' : 'none',
                            color: subtarea.completada ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {subtarea.titulo}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Archivos adjuntos */}
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
                        <AttachFileIcon 
                          fontSize="small" 
                          sx={{ transform: 'rotate(45deg)' }}
                        />
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

const TareasTable = ({ tareas, onEdit, onDelete }) => {
  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 0,
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" width={50} />
            <TableCell>Tarea</TableCell>
            <TableCell width={200}>Fechas</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tareas.map((tarea) => (
            <TareaRow 
              key={tarea.id} 
              tarea={tarea}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TareasTable; 