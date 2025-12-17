import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const TareasSection = ({ tareas = [], onChange }) => {
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    estado: 'PENDIENTE',
    subtareas: []
  });
  const [expandedTarea, setExpandedTarea] = useState(null);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  const handleAddTarea = () => {
    if (nuevaTarea.titulo.trim()) {
      onChange([...tareas, { ...nuevaTarea, id: Date.now() }]);
      setNuevaTarea({
        titulo: '',
        descripcion: '',
        estado: 'PENDIENTE',
        subtareas: []
      });
    }
  };

  const handleDeleteTarea = (tareaId) => {
    onChange(tareas.filter(t => t.id !== tareaId));
  };

  const handleAddSubtarea = (tareaIndex) => {
    if (nuevaSubtarea.trim()) {
      const nuevasTareas = [...tareas];
      nuevasTareas[tareaIndex].subtareas.push({
        titulo: nuevaSubtarea,
        completada: false,
        id: Date.now()
      });
      onChange(nuevasTareas);
      setNuevaSubtarea('');
    }
  };

  const handleToggleSubtarea = (tareaIndex, subtareaIndex) => {
    const nuevasTareas = [...tareas];
    nuevasTareas[tareaIndex].subtareas[subtareaIndex].completada = 
      !nuevasTareas[tareaIndex].subtareas[subtareaIndex].completada;
    onChange(nuevasTareas);
  };

  const handleDeleteSubtarea = (tareaIndex, subtareaIndex) => {
    const nuevasTareas = [...tareas];
    nuevasTareas[tareaIndex].subtareas.splice(subtareaIndex, 1);
    onChange(nuevasTareas);
  };

  const handleChangeTareaEstado = (tareaIndex, nuevoEstado) => {
    const nuevasTareas = [...tareas];
    nuevasTareas[tareaIndex].estado = nuevoEstado;
    onChange(nuevasTareas);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      PENDIENTE: '#FFA726',
      EN_PROGRESO: '#42A5F5',
      COMPLETADA: '#66BB6A'
    };
    return colors[estado] || '#757575';
  };

  const calcularProgresoTarea = (tarea) => {
    if (!tarea.subtareas.length) return 0;
    const completadas = tarea.subtareas.filter(st => st.completada).length;
    return Math.round((completadas / tarea.subtareas.length) * 100);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Tareas
      </Typography>

      {/* Formulario para nueva tarea */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          value={nuevaTarea.titulo}
          onChange={(e) => setNuevaTarea(prev => ({ ...prev, titulo: e.target.value }))}
          placeholder="Título de la tarea"
          InputProps={{
            startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        <TextField
          size="small"
          value={nuevaTarea.descripcion}
          onChange={(e) => setNuevaTarea(prev => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Descripción (opcional)"
          multiline
          rows={2}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            value={nuevaTarea.estado}
            onChange={(e) => setNuevaTarea(prev => ({ ...prev, estado: e.target.value }))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
            <MenuItem value="EN_PROGRESO">En Progreso</MenuItem>
            <MenuItem value="COMPLETADA">Completada</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddTarea}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 0 }}
          >
            Agregar Tarea
          </Button>
        </Box>
      </Stack>

      {/* Lista de tareas */}
      <List dense disablePadding sx={{ width: '100%' }}>
        {tareas.map((tarea, tareaIndex) => (
          <Box key={tarea.id} sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <ListItem
              dense
              disableGutters
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDeleteTarea(tarea.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              }
              sx={{ 
                borderLeft: 3, 
                borderColor: getEstadoColor(tarea.estado, 'TAREA'),
                px: 1,
                py: 0.5,
                minHeight: 40,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ lineHeight: 1.1 }}>
                      {tarea.titulo}
                    </Typography>
                    <Chip 
                      label={`${calcularProgresoTarea(tarea)}%`}
                      size="small"
                      sx={{ 
                        height: 18,
                        fontSize: '0.72rem',
                                        backgroundColor: `${getEstadoColor(tarea.estado, 'TAREA')}20`,
                color: getEstadoColor(tarea.estado, 'TAREA'),
                        borderRadius: 1
                      }}
                    />
                  </Box>
                }
                secondary={tarea.descripcion}
                secondaryTypographyProps={{
                  sx: { lineHeight: 1.1, mt: 0.25, fontSize: '0.78rem' }
                }}
                sx={{ mr: 1 }}
              />
              <TextField
                select
                size="small"
                value={tarea.estado}
                onChange={(e) => handleChangeTareaEstado(tareaIndex, e.target.value)}
                sx={{ 
                  width: 130,
                  mr: 1,
                  '& .MuiInputBase-root': { height: 34 },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: getEstadoColor(tarea.estado, 'TAREA')
                    }
                  }
                }}
              >
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="EN_PROGRESO">En Progreso</MenuItem>
                <MenuItem value="COMPLETADA">Completada</MenuItem>
              </TextField>
              <IconButton 
                size="small"
                onClick={() => setExpandedTarea(expandedTarea === tarea.id ? null : tarea.id)}
                sx={{
                  transform: expandedTarea === tarea.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </ListItem>

            <Collapse in={expandedTarea === tarea.id}>
              <Box sx={{ pl: 1, pr: 1, pb: 1.5 }}>
                {/* Lista de subtareas */}
                <List dense disablePadding>
                  {tarea.subtareas.map((subtarea, subtareaIndex) => (
                    <ListItem
                      key={subtarea.id}
                      dense
                      disableGutters
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDeleteSubtarea(tareaIndex, subtareaIndex)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{ px: 1, py: 0.25 }}
                    >
                      <Checkbox
                        edge="start"
                        checked={subtarea.completada}
                        onChange={() => handleToggleSubtarea(tareaIndex, subtareaIndex)}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleOutlineIcon />}
                        sx={{ py: 0, my: 0 }}
                      />
                      <ListItemText 
                        primary={subtarea.titulo}
                        sx={{
                          textDecoration: subtarea.completada ? 'line-through' : 'none',
                          color: subtarea.completada ? 'text.disabled' : 'text.primary'
                        }}
                        primaryTypographyProps={{ sx: { lineHeight: 1.1, fontSize: '0.85rem' } }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Formulario para nueva subtarea */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    value={nuevaSubtarea}
                    onChange={(e) => setNuevaSubtarea(e.target.value)}
                    placeholder="Nueva subtarea"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtarea(tareaIndex)}
                    fullWidth
                    sx={{ '& .MuiInputBase-root': { height: 34 } }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleAddSubtarea(tareaIndex)}
                    sx={{ borderRadius: 0 }}
                  >
                    Agregar
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default TareasSection; 
