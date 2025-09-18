import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Box,
  Button,
  IconButton,
  Tooltip,
  Checkbox,
  Typography,
  Chip,
  Fab,
} from '@mui/material';
import useResponsive from '../hooks/useResponsive';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  TaskOutlined as TaskIcon,
  FolderOutlined as ProjectIcon,
  ArchiveOutlined as ArchiveIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  AccessTimeOutlined as TimeIcon,
  Delete as DeleteIcon,
  CheckBoxOutlined as MultiSelectIcon,
} from '@mui/icons-material';
import { Toolbar } from '../navigation';
import { SystemButtons } from '../components/common/SystemButtons';
import TareasTable from '../components/proyectos/TareasTable';
import TareaForm from '../components/proyectos/TareaForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Archivo() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [selectedTareas, setSelectedTareas] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const { setTitle, setActions } = useNavigationBar();
  const location = useLocation();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();
  const { updateWithHistory } = usePageWithHistory(
    // Función para recargar datos
    async () => {
      await fetchProyectos();
      await fetchTareas();
    },
    // Función para manejar errores
    (error) => {
      console.error('Error al revertir acción:', error);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    }
  );

  useEffect(() => {
    setTitle('Archivo de Tareas');
    
    // Solo mostrar iconos en desktop
    if (!isMobile) {
      const actions = [];
      
      if (!isMultiSelectMode) {
        // Icono para activar selección múltiple usando componente modular
        actions.push({
          component: (
            <SystemButtons.MultiSelectButton 
              onActivate={handleActivateMultiSelect}
            />
          ),
          onClick: handleActivateMultiSelect
        });
      } else {
        // Opciones cuando está activo el modo selección múltiple usando componentes modulares
        actions.push({
          component: (
            <SystemButtons.MultiSelectDeleteButton 
              onDelete={handleDeleteSelected}
              selectedCount={selectedTareas.length}
            />
          ),
          onClick: handleDeleteSelected
        });
        
        // Botón para cancelar selección múltiple usando componente modular
        actions.push({
          component: (
            <SystemButtons.MultiSelectCancelButton 
              onCancel={handleDeactivateMultiSelect}
            />
          ),
          onClick: handleDeactivateMultiSelect
        });
      }
      
      setActions(actions);
    } else {
      setActions([]);
    }
  }, [setTitle, setActions, isMobile, isMultiSelectMode, selectedTareas.length]);

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

  const handleDeleteSelected = async () => {
    if (selectedTareas.length === 0) return;
    
    try {
      // Eliminar todas las tareas seleccionadas
      await Promise.all(
        selectedTareas.map(id => clienteAxios.delete(`/api/tareas/${id}`))
      );
      
      enqueueSnackbar(`${selectedTareas.length} tarea(s) eliminada(s) exitosamente`, { variant: 'success' });
      setSelectedTareas([]);
      setIsMultiSelectMode(false);
      await fetchTareas();
    } catch (error) {
      console.error('Error al eliminar tareas:', error);
      enqueueSnackbar('Error al eliminar las tareas', { variant: 'error' });
    }
  };

  // Escuchar eventos de la navegación de proyectos
  useEffect(() => {
    // En la página de archivo, los eventos de agregar no hacen nada
    // pero podríamos redirigir a las páginas correspondientes
    const handleAddProject = () => {
      navigate('/tiempo/proyectos');
    };

    const handleAddTask = () => {
      navigate('/tiempo/tareas');
    };

    const handleDeleteSelectedTasks = () => {
      handleDeleteSelected();
    };

    window.addEventListener('addProject', handleAddProject);
    window.addEventListener('addTask', handleAddTask);
    window.addEventListener('deleteSelectedTasks', handleDeleteSelectedTasks);
    
    return () => {
      window.removeEventListener('addProject', handleAddProject);
      window.removeEventListener('addTask', handleAddTask);
      window.removeEventListener('deleteSelectedTasks', handleDeleteSelectedTasks);
    };
  }, [navigate, handleDeleteSelected]);

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
        response = await clienteAxios.put(`/api/tareas/${editingTarea._id}`, datosAEnviar);
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
      await clienteAxios.delete(`/api/tareas/${id}`);
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

  const handleBack = () => {
    navigate('/tiempo/rutinas');
  };

  // Funciones para selección múltiple
  const handleActivateMultiSelect = () => {
    setIsMultiSelectMode(true);
  };

  const handleDeactivateMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedTareas([]);
  };

  const handleSelectTarea = (tareaId) => {
    setSelectedTareas(prev => {
      if (prev.includes(tareaId)) {
        return prev.filter(id => id !== tareaId);
      } else {
        return [...prev, tareaId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTareas.length === tareas.length) {
      setSelectedTareas([]);
    } else {
      setSelectedTareas(tareas.map(tarea => tarea._id));
    }
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Eliminar <Toolbar /> */}


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
            isArchive={true}
            showValues={showValues}
            updateWithHistory={updateWithHistory}
            isMultiSelectMode={isMultiSelectMode}
            selectedTareas={selectedTareas}
            onSelectTarea={handleSelectTarea}
            onActivateMultiSelect={handleActivateMultiSelect}
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

        {/* Barra flotante minimalista para selección múltiple */}
        {isMultiSelectMode && (
          <Box
            sx={{
              position: 'fixed',
              bottom: isMobile ? 100 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: 3,
              zIndex: 1000,
              minWidth: 200,
              justifyContent: 'center'
            }}
          >
            <Chip
              label={`${selectedTareas.length} seleccionadas`}
              size="small"
              color="primary"
              variant="outlined"
            />
            
            <IconButton
              size="small"
              onClick={handleDeactivateMultiSelect}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Archivo; 