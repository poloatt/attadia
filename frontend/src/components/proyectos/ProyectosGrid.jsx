import React, { useState } from 'react';
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
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import EmptyState from '../EmptyState';

const ProyectoItem = ({ proyecto, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  // Asegurarse de que el proyecto tenga un ID válido
  const proyectoId = proyecto._id || proyecto.id;

  // Debug log para ver la estructura del proyecto
  console.log('Proyecto:', proyecto);
  console.log('Tareas del proyecto:', proyecto.tareas);

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
            <Stack spacing={0.5}>
              {proyecto.tareas.map((tarea) => {
                const tareaId = tarea._id || tarea.id;
                console.log('Renderizando tarea:', tarea);
                return (
                  <Paper
                    key={tareaId}
                    elevation={0}
                    sx={{
                      p: 0.75,
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
                        backgroundColor: tarea.estado === 'COMPLETADA' 
                          ? '#2D5C2E' 
                          : tarea.estado === 'EN_PROGRESO' 
                            ? '#1B4A75' 
                            : '#8C4E0B'
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {tarea.titulo}
                        </Typography>
                        {tarea.descripcion && (
                          <Typography variant="caption" color="text.secondary">
                            {tarea.descripcion}
                          </Typography>
                        )}
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          backgroundColor: 'background.paper',
                          borderRadius: 1,
                          color: tarea.estado === 'COMPLETADA' 
                            ? '#2D5C2E' 
                            : tarea.estado === 'EN_PROGRESO' 
                              ? '#1B4A75' 
                              : '#8C4E0B'
                        }}
                      >
                        {tarea.estado === 'COMPLETADA' 
                          ? 'Completada' 
                          : tarea.estado === 'EN_PROGRESO' 
                            ? 'En Progreso' 
                            : 'Pendiente'}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
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

const ProyectosGrid = ({ proyectos, onEdit, onDelete, onAdd }) => {
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
          key={proyecto.id}
          proyecto={proyecto}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Stack>
  );
};

export default ProyectosGrid; 