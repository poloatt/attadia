import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Task as TaskIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ProyectoCard = ({ proyecto, onEdit, onDelete }) => {
  const getEstadoColor = (estado) => {
    const colors = {
      PENDIENTE: '#FFA726',
      EN_PROGRESO: '#42A5F5',
      COMPLETADO: '#66BB6A'
    };
    return colors[estado] || '#757575';
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="h6" component="div">
          {proyecto.titulo}
        </Typography>
        <Chip 
          label={proyecto.estado}
          size="small"
          sx={{ 
            backgroundColor: `${getEstadoColor(proyecto.estado)}20`,
            color: getEstadoColor(proyecto.estado),
            borderRadius: 1
          }}
        />
      </Box>

      {proyecto.descripcion && (
        <Typography variant="body2" color="text.secondary">
          {proyecto.descripcion}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TaskIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {proyecto.tareas?.length || 0} tareas
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {new Date(proyecto.fechaInicio).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1 }}>
        <Tooltip title="Editar">
          <IconButton 
            onClick={onEdit}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'primary.main', backgroundColor: 'transparent' }
            }}
          >
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton 
            onClick={onDelete}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'error.main', backgroundColor: 'transparent' }
            }}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
};

export default ProyectoCard; 
