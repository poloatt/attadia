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
  FolderOutlined as ProjectIcon,
  TaskOutlined as TaskIcon,
  ArchiveOutlined as ArchiveIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  AccessTimeOutlined as TimeIcon,
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import ProyectosGrid from '../components/proyectos/ProyectosGrid';
import ProyectoForm from '../components/proyectos/ProyectoForm';
import { useNavigationBar } from '../context/NavigationBarContext';
import TareaForm from '../components/proyectos/TareaForm';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useNavigate } from 'react-router-dom';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isTareaFormOpen, setIsTareaFormOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/tiempo');
  };

  useEffect(() => {
    setTitle('Proyectos');
    setActions([
      {
        component: (
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
        ),
        onClick: () => {}
      }
    ]);
  }, [setTitle, setActions]);

  const fetchProyectos = useCallback(async () => {
    try {
      console.log('Solicitando proyectos con tareas...');
      const response = await clienteAxios.get('/api/proyectos?populate=tareas');
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

  // Escuchar evento del Header para abrir formulario cuando EntityToolbar esté oculto
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'proyecto') {
        setEditingProyecto(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
    };
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      const dataToSend = {
        ...formData,
        fechaInicio: formData.fechaInicio ? formData.fechaInicio.toISOString() : new Date().toISOString(),
        fechaFin: formData.fechaFin ? formData.fechaFin.toISOString() : null,
      };

      let response;
      if (editingProyecto) {
        response = await clienteAxios.put(`/api/proyectos/${editingProyecto._id || editingProyecto.id}`, dataToSend);
        enqueueSnackbar('Proyecto actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/api/proyectos', dataToSend);
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
      await clienteAxios.delete(`/api/proyectos/${id}`);
      enqueueSnackbar('Proyecto eliminado exitosamente', { variant: 'success' });
      await fetchProyectos();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      enqueueSnackbar('Error al eliminar el proyecto', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchProyectos]);

  const handleUpdateTarea = useCallback(async (tareaActualizada) => {
    setProyectos(prevProyectos => 
      prevProyectos.map(proyecto => {
        if (proyecto._id === tareaActualizada.proyecto) {
          return {
            ...proyecto,
            tareas: proyecto.tareas.map(tarea => 
              tarea._id === tareaActualizada._id ? tareaActualizada : tarea
            )
          };
        }
        return proyecto;
      })
    );

    // Refrescar los datos después de un breve delay para asegurar sincronización
    setTimeout(async () => {
      try {
        const response = await clienteAxios.get('/api/proyectos?populate=tareas');
        if (response.data && response.data.docs) {
          setProyectos(response.data.docs);
        }
      } catch (error) {
        console.error('Error al actualizar proyectos:', error);
        enqueueSnackbar('Error al sincronizar datos', { variant: 'error' });
      }
    }, 1000);
  }, [enqueueSnackbar]);

  const handleAddTarea = (proyecto) => {
    setSelectedProyecto(proyecto);
    setIsTareaFormOpen(true);
  };

  const handleTareaSubmit = async (formData) => {
    try {
      const datosAEnviar = {
        ...formData,
        proyecto: selectedProyecto._id
      };

      const response = await clienteAxios.post('/api/tareas', datosAEnviar);
      enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      setIsTareaFormOpen(false);
      setSelectedProyecto(null);
      await fetchProyectos();
    } catch (error) {
      console.error('Error al crear tarea:', error);
      enqueueSnackbar('Error al crear la tarea', { variant: 'error' });
    }
  };

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
        showBackButton={true}
        onBack={handleBack}
        actions={
          <>
            <Tooltip title={showValues ? "Ocultar valores" : "Mostrar valores"}>
              <IconButton 
                onClick={toggleValuesVisibility}
                sx={{ color: 'white' }}
              >
                {showValues ? <HideValuesIcon /> : <ShowValuesIcon />}
              </IconButton>
            </Tooltip>
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
          </>
        }
        navigationItems={[
          { 
            icon: <TaskIcon sx={{ fontSize: 21.6 }} />, 
            label: 'Tareas', 
            to: '/tareas',
            current: location.pathname === '/tareas'
          },
          {
            icon: <ArchiveIcon sx={{ fontSize: 21.6 }} />,
            label: 'Archivo',
            to: '/archivo',
            current: location.pathname === '/archivo'
          }
        ]}
        entityName="proyecto"
      />

      <Box 
        sx={{ 
          py: 2,
          height: 'calc(100vh - 190px)', // Aumentado para evitar que pase por debajo de BottomNavigation
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
        <ProyectosGrid
          proyectos={proyectos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setEditingProyecto(null);
            setIsFormOpen(true);
          }}
          onUpdateTarea={handleUpdateTarea}
          onAddTarea={handleAddTarea}
          showValues={showValues}
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

      {isTareaFormOpen && (
        <TareaForm
          open={isTareaFormOpen}
          onClose={() => {
            setIsTareaFormOpen(false);
            setSelectedProyecto(null);
          }}
          onSubmit={handleTareaSubmit}
          initialData={{ proyecto: selectedProyecto }}
          isEditing={false}
          proyectos={[selectedProyecto]}
        />
      )}
    </Container>
  );
}

export default Proyectos;
