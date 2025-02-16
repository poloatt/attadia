import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Grid, Card, CardContent, Typography, IconButton, Chip, Stack } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  AssignmentOutlined as TaskIcon,
  FolderOutlined as ProjectIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Label as LabelIcon,
  CheckCircleOutline as CompletedIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
import TareaForm from '../components/proyectos/TareaForm';

export function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchTareas = useCallback(async () => {
    try {
      console.log('Solicitando tareas...');
      const response = await clienteAxios.get('/tareas');
      console.log('Tareas recibidas:', response.data);
      setTareas(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar tareas', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchProyectos = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/proyectos');
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTareas();
    fetchProyectos();
  }, [fetchTareas, fetchProyectos]);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      console.log('Datos del formulario recibidos:', formData);
      
      // Verificar autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      // Validar que el proyecto exista
      const proyectoSeleccionado = proyectos.find(p => 
        p._id === formData.proyecto || 
        p.id === formData.proyecto
      );

      if (!proyectoSeleccionado) {
        throw new Error('El proyecto seleccionado no existe');
      }

      const datosAEnviar = {
        ...formData,
        proyecto: proyectoSeleccionado._id || proyectoSeleccionado.id
      };

      console.log('Enviando datos al servidor:', datosAEnviar);
      console.log('URL de la petición:', editingTarea ? 
        `/tareas/${editingTarea._id || editingTarea.id}` : 
        '/tareas'
      );

      let response;
      if (editingTarea) {
        response = await clienteAxios.put(`/tareas/${editingTarea._id || editingTarea.id}`, datosAEnviar);
        console.log('Respuesta de actualización:', response.data);
        
        // Actualizar la tarea en el estado local
        setTareas(prev => prev.map(tarea => 
          (tarea._id || tarea.id) === (editingTarea._id || editingTarea.id) 
            ? response.data 
            : tarea
        ));
        
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/tareas', datosAEnviar);
        console.log('Respuesta de creación:', response.data);
        
        // Agregar la nueva tarea al estado local
        setTareas(prev => [...prev, response.data]);
        
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }

      // Cerrar el formulario
      setIsFormOpen(false);
      setEditingTarea(null);
      
      // Recargar las tareas para asegurar sincronización
      await fetchTareas();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Manejar error de autenticación
      if (error.response?.status === 401) {
        enqueueSnackbar('Sesión expirada. Por favor, inicia sesión nuevamente.', { 
          variant: 'error',
          autoHideDuration: 5000
        });
        window.location.href = '/login';
        return;
      }
      
      const mensajeError = error.response?.data?.error || error.message || 'Error al guardar la tarea';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTareas, editingTarea, proyectos]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/tareas/${id}`);
      enqueueSnackbar('Tarea eliminada exitosamente', { variant: 'success' });
      fetchTareas();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      enqueueSnackbar('Error al eliminar la tarea', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTareas]);

  const handleOpenForm = useCallback(async () => {
    try {
      console.log('Abriendo formulario...');
      await fetchProyectos();
      setEditingTarea(null);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error al abrir formulario:', error);
      enqueueSnackbar('Error al cargar datos del formulario', { variant: 'error' });
    }
  }, [fetchProyectos, enqueueSnackbar]);

  const getEstadoColor = (estado) => {
    const colors = {
      PENDIENTE: '#FFA726',
      EN_PROGRESO: '#42A5F5',
      COMPLETADA: '#66BB6A',
      CANCELADA: '#EF5350'
    };
    return colors[estado] || '#757575';
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      BAJA: '#66BB6A',
      MEDIA: '#FFA726',
      ALTA: '#EF5350'
    };
    return colors[prioridad] || '#757575';
  };

  return (
    <Container maxWidth="xl">
      <EntityToolbar 
        title="Tareas"
        icon={<TaskIcon />}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
            sx={{ borderRadius: 0 }}
          >
            Nueva Tarea
          </Button>
        }
        navigationItems={[
          { 
            icon: <ProjectIcon />, 
            label: 'Proyectos', 
            to: '/proyectos',
            current: false
          }
        ]}
        showAddButton={true}
        onAdd={handleOpenForm}
        entityName="tarea"
      />

      {tareas.length === 0 ? (
        <EmptyState 
          icon={<TaskIcon sx={{ fontSize: 48 }} />}
          title="No hay tareas"
          description="Comienza creando una nueva tarea"
          actionText="Nueva Tarea"
          onActionClick={handleOpenForm}
        />
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {tareas.map((tarea) => (
            <Grid item xs={12} sm={6} md={4} key={tarea.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderLeft: 3,
                  borderColor: getEstadoColor(tarea.estado),
                  borderRadius: 0
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {tarea.titulo}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={tarea.estado}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getEstadoColor(tarea.estado)}20`,
                            color: getEstadoColor(tarea.estado),
                            borderRadius: 1
                          }}
                        />
                        <Chip 
                          label={tarea.prioridad}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getPrioridadColor(tarea.prioridad)}20`,
                            color: getPrioridadColor(tarea.prioridad),
                            borderRadius: 1
                          }}
                        />
                      </Box>
                    </Box>

                    {tarea.descripcion && (
                      <Typography variant="body2" color="text.secondary">
                        {tarea.descripcion}
                      </Typography>
                    )}

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Proyecto
                      </Typography>
                      <Chip
                        icon={<ProjectIcon />}
                        label={tarea.proyecto?.nombre || 'Sin proyecto'}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>

                    {/* Fechas */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Inicio
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(tarea.fechaInicio).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      {tarea.fechaVencimiento && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Vencimiento
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {new Date(tarea.fechaVencimiento).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Subtareas */}
                    {tarea.subtareas?.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Subtareas
                        </Typography>
                        <Stack spacing={1}>
                          {tarea.subtareas.map((subtarea, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <CompletedIcon 
                                sx={{ 
                                  fontSize: 16,
                                  color: subtarea.completada ? 'success.main' : 'text.secondary'
                                }}
                              />
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
                        </Stack>
                      </Box>
                    )}

                    {/* Etiquetas */}
                    {tarea.etiquetas?.length > 0 && (
                      <Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {tarea.etiquetas.map((etiqueta, index) => (
                            <Chip
                              key={index}
                              icon={<LabelIcon />}
                              label={etiqueta}
                              size="small"
                              sx={{ borderRadius: 1 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Acciones */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1 }}>
                      <IconButton 
                        onClick={() => {
                          setEditingTarea(tarea);
                          setIsFormOpen(true);
                        }}
                        size="small"
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main', backgroundColor: 'transparent' }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(tarea.id)}
                        size="small"
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main', backgroundColor: 'transparent' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <TareaForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTarea(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTarea}
        isEditing={!!editingTarea}
        proyectos={proyectos}
      />
    </Container>
  );
}

export default Tareas;