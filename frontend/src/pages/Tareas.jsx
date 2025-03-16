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
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import TareasTable from '../components/proyectos/TareasTable';
import TareaForm from '../components/proyectos/TareaForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useLocation } from 'react-router-dom';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();

  useEffect(() => {
    setTitle('Tareas');
    setActions([
      {
        component: (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTarea(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nueva Tarea
          </Button>
        ),
        onClick: () => {}
      }
    ]);
  }, [setTitle, setActions]);

  const fetchProyectos = useCallback(async () => {
    try {
      // Obtener proyectos con sus tareas incluidas
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
      const response = await clienteAxios.get('/api/tareas');
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
      
      // Primero actualizamos los proyectos para obtener la nueva estructura
      await fetchProyectos();
      // Luego actualizamos las tareas
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
        title="Tareas"
        icon={<TaskIcon />}
        onAdd={() => {
          setEditingTarea(null);
          setIsFormOpen(true);
        }}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTarea(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nueva Tarea
          </Button>
        }
        navigationItems={[
          { 
            icon: <ProjectIcon sx={{ fontSize: 21.6 }} />, 
            label: 'Proyectos', 
            to: '/proyectos',
            current: location.pathname === '/proyectos'
          },
          {
            icon: <ArchiveIcon sx={{ fontSize: 21.6 }} />,
            label: 'Archivo',
            to: '/archivo',
            current: location.pathname === '/archivo'
          }
        ]}
      />

      <Box 
        sx={{ 
          py: 2,
          height: 'calc(100vh - 140px)', // Altura calculada restando el espacio del toolbar y otros elementos
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
        }}
      >
        <TareasTable
          tareas={tareas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateEstado={handleUpdateEstado}
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

export default Tareas;