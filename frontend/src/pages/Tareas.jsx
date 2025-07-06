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
  TaskOutlined as TaskIcon,
  FolderOutlined as ProjectIcon,
  ArchiveOutlined as ArchiveIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  AccessTimeOutlined as TimeIcon,
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import TareasTable from '../components/proyectos/TareasTable';
import TareaForm from '../components/proyectos/TareaForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useActionHistory } from '../context/ActionHistoryContext';

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
  const { addAction } = useActionHistory();
  const navigate = useNavigate();

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

  // Escuchar eventos del Header
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'tarea') {
        setEditingTarea(null);
        setIsFormOpen(true);
      }
    };

    const handleUndoAction = (event) => {
      const action = event.detail;
      if (action.type === 'tarea') {
        handleUndoAction(action);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    window.addEventListener('undoAction', handleUndoAction);
    
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('undoAction', handleUndoAction);
    };
  }, []);

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
        
        // Guardar estado anterior para poder revertir
        const previousState = { ...editingTarea };
        
        response = await clienteAxios.put(`/api/tareas/${editingTarea._id}`, datosAEnviar);
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
        
        // Registrar acción para poder revertir
        addAction({
          type: 'tarea',
          action: 'update',
          entityId: editingTarea._id,
          previousState,
          currentState: response.data,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Creando nueva tarea');
        response = await clienteAxios.post('/api/tareas', datosAEnviar);
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
        
        // Registrar acción para poder revertir
        addAction({
          type: 'tarea',
          action: 'create',
          entityId: response.data._id,
          previousState: null,
          currentState: response.data,
          timestamp: new Date().toISOString()
        });
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
      // Buscar la tarea antes de eliminarla para poder revertir
      const tareaToDelete = tareas.find(t => t._id === id);
      if (!tareaToDelete) {
        throw new Error('Tarea no encontrada');
      }
      
      await clienteAxios.delete(`/api/tareas/${id}`);
      enqueueSnackbar('Tarea eliminada exitosamente', { variant: 'success' });
      
      // Registrar acción para poder revertir
      addAction({
        type: 'tarea',
        action: 'delete',
        entityId: id,
        previousState: tareaToDelete,
        currentState: null,
        timestamp: new Date().toISOString()
      });
      
      await fetchTareas();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      enqueueSnackbar('Error al eliminar la tarea', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTareas, tareas, addAction]);

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

  // Función para manejar la reversión de acciones
  const handleUndoAction = async (action) => {
    try {
      switch (action.action) {
        case 'create':
          // Revertir creación: eliminar la tarea
          await clienteAxios.delete(`/api/tareas/${action.entityId}`);
          enqueueSnackbar('Creación de tarea revertida', { variant: 'success' });
          break;
          
        case 'update':
          // Revertir actualización: restaurar estado anterior
          await clienteAxios.put(`/api/tareas/${action.entityId}`, action.previousState);
          enqueueSnackbar('Actualización de tarea revertida', { variant: 'success' });
          break;
          
        case 'delete':
          // Revertir eliminación: recrear la tarea
          await clienteAxios.post('/api/tareas', action.previousState);
          enqueueSnackbar('Eliminación de tarea revertida', { variant: 'success' });
          break;
          
        default:
          console.warn('Tipo de acción no soportado para revertir:', action.action);
          return;
      }
      
      // Actualizar datos después de revertir
      await fetchTareas();
      await fetchProyectos();
      
    } catch (error) {
      console.error('Error al revertir acción:', error);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    }
  };

  const handleBack = () => {
    navigate('/tiempo');
  };

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <Container maxWidth={isMobile ? "sm" : "xl"} sx={{ px: isMobile ? 1 : 3 }}>
        <EntityToolbar 
          title="Tareas"
          icon={<TaskIcon sx={{ fontSize: 20 }} />}
          onAdd={() => {
            setEditingTarea(null);
            setIsFormOpen(true);
          }}
          showBackButton={true}
          onBack={handleBack}
          navigationItems={[
            { 
              icon: <ProjectIcon sx={{ fontSize: 20 }} />, 
              label: 'Proyectos', 
              to: '/proyectos',
              current: location.pathname === '/proyectos'
            },
            {
              icon: <ArchiveIcon sx={{ fontSize: 20 }} />,
              label: 'Archivo',
              to: '/archivo',
              current: location.pathname === '/archivo'
            }
          ]}
          entityName="tarea"
        />

        <Box 
          sx={{ 
            py: isMobile ? 1 : 2,
            px: isMobile ? 0 : 1,
            height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 190px)', // Ajustado para móvil
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: isMobile ? '4px' : '8px',
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
    </Box>
  );
}

export default Tareas;