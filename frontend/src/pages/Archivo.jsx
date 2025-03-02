import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  TaskAltOutlined as TaskIcon,
  AssignmentOutlined as ProjectIcon,
  ArchiveOutlined as ArchiveIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import TareasTable from '../components/proyectos/TareasTable';
import TareaForm from '../components/proyectos/TareaForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useLocation } from 'react-router-dom';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Archivo() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setTitle, setActions } = useNavigationBar();
  const location = useLocation();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();

  useEffect(() => {
    setTitle('Archivo de Tareas');
    setActions([]);
  }, [setTitle, setActions]);

  const fetchProyectos = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/proyectos?populate=tareas');
      console.log('Proyectos con tareas:', response.data);
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
    }
  }, [enqueueSnackbar]);

  const fetchTareas = useCallback(async () => {
    try {
      // Modificamos la llamada para obtener solo tareas completadas
      const response = await clienteAxios.get('/api/tareas?estado=COMPLETADA');
      setTareas(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar tareas', { variant: 'error' });
      setTareas([]);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTareas();
    fetchProyectos();
  }, [fetchTareas, fetchProyectos]);

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      const datosAEnviar = {
        ...formData,
        proyecto: formData.proyecto?._id || formData.proyecto
      };

      console.log('Datos a enviar:', datosAEnviar);

      if (editingTarea) {
        console.log('Actualizando tarea:', editingTarea._id);
        response = await clienteAxios.put(`/tareas/${editingTarea._id}`, datosAEnviar);
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        console.log('Creando nueva tarea');
        response = await clienteAxios.post('/api/tareas', datosAEnviar);
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }

      console.log('Respuesta del servidor:', response.data);
      
      setIsFormOpen(false);
      setEditingTarea(null);
      
      await fetchProyectos();
      await fetchTareas();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la tarea', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((tarea) => {
    setEditingTarea(tarea);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/tareas/${id}`);
      enqueueSnackbar('Tarea eliminada exitosamente', { variant: 'success' });
      await fetchTareas();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      enqueueSnackbar('Error al eliminar la tarea', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTareas]);

  const handleUpdateEstado = (tareaActualizada) => {
    setTareas(prevTareas => 
      prevTareas.map(tarea => 
        tarea._id === tareaActualizada._id ? tareaActualizada : tarea
      )
    );
    if (editingTarea && editingTarea._id === tareaActualizada._id) {
      setEditingTarea(tareaActualizada);
    }
  };

  return (
    <Container maxWidth="xl">
      <EntityToolbar 
        title="Archivo"
        icon={<ArchiveIcon sx={{ fontSize: 20 }} />}
        showAddButton={false}
        navigationItems={[
          { 
            icon: <ProjectIcon sx={{ fontSize: 20 }} />, 
            label: 'Proyectos', 
            to: '/proyectos',
            current: location.pathname === '/proyectos'
          },
          {
            icon: <TaskIcon sx={{ fontSize: 20 }} />,
            label: 'Tareas',
            to: '/tareas',
            current: location.pathname === '/tareas'
          }
        ]}
      />

      <Box sx={{ py: 2 }}>
        <TareasTable
          tareas={tareas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateEstado={handleUpdateEstado}
          isArchive={true}
          showValues={showValues}
        />
      </Box>

      {isFormOpen && (
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
          onProyectosUpdate={fetchProyectos}
        />
      )}
    </Container>
  );
}

export default Archivo; 