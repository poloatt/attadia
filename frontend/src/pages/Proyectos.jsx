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
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon,
  AssignmentOutlined as ProjectIcon,
  TaskAltOutlined as TaskIcon,
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import ProyectosGrid from '../components/proyectos/ProyectosGrid';
import ProyectoForm from '../components/proyectos/ProyectoForm';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchProyectos = useCallback(async () => {
    try {
      console.log('Solicitando proyectos con tareas...');
      const response = await clienteAxios.get('/proyectos?populate=tareas');
      console.log('Respuesta completa:', response.data);
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  const handleFormSubmit = async (formData) => {
    try {
      const dataToSend = {
        ...formData,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin ? formData.fechaFin.toISOString() : null,
      };

      let response;
      if (editingProyecto) {
        response = await clienteAxios.put(`/proyectos/${editingProyecto.id}`, dataToSend);
        enqueueSnackbar('Proyecto actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/proyectos', dataToSend);
        enqueueSnackbar('Proyecto creado exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingProyecto(null);
      await fetchProyectos();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar el proyecto', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((proyecto) => {
    setEditingProyecto(proyecto);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/proyectos/${id}`);
      enqueueSnackbar('Proyecto eliminado exitosamente', { variant: 'success' });
      await fetchProyectos();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      enqueueSnackbar('Error al eliminar el proyecto', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchProyectos]);

  const filteredProyectos = proyectos;

  return (
    <Container maxWidth="xl">
      <EntityToolbar 
        title="Proyectos"
        icon={<ProjectIcon />}
        onAdd={() => {
          setEditingProyecto(null);
          setIsFormOpen(true);
        }}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProyecto(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nuevo Proyecto
          </Button>
        }
        navigationItems={[
          { 
            icon: <TaskIcon />, 
            label: 'Tareas', 
            to: '/tareas',
            current: false
          }
        ]}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Cambiar vista">
            <IconButton
              size="small"
              onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Filtros">
            <IconButton size="small">
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </EntityToolbar>

      <Box sx={{ py: 2 }}>
        <ProyectosGrid
          proyectos={filteredProyectos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => setIsFormOpen(true)}
        />
      </Box>

      {isFormOpen && (
        <ProyectoForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProyecto(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingProyecto}
          isEditing={!!editingProyecto}
        />
      )}
    </Container>
  );
}

export default Proyectos;
