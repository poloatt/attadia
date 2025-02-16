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
  AssignmentOutlined as TaskIcon,
  FolderOutlined as ProjectIcon,
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import TareasTable from '../components/proyectos/TareasTable';
import TareaForm from '../components/proyectos/TareaForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';

export function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchProyectos = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/proyectos');
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
    }
  }, [enqueueSnackbar]);

  const fetchTareas = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/tareas');
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
      if (editingTarea) {
        response = await clienteAxios.put(`/tareas/${editingTarea.id}`, formData);
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/tareas', formData);
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingTarea(null);
      await fetchTareas();
    } catch (error) {
      console.error('Error:', error);
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
            icon: <ProjectIcon />, 
            label: 'Proyectos', 
            to: '/proyectos',
            current: false
          }
        ]}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Filtros">
            <IconButton size="small">
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </EntityToolbar>

      <Box sx={{ py: 2 }}>
        <TareasTable
          tareas={tareas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateEstado={handleUpdateEstado}
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
        />
      )}
    </Container>
  );
}

export default Tareas;