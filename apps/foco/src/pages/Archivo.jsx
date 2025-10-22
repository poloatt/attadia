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
import { useResponsive } from '@shared/hooks';
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
import { Toolbar, SystemButtons } from '@shared/navigation';
import TareasTable from '../proyectos/TareasTable';
import TareaForm from '../proyectos/TareaForm';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import { useNavigationBar } from '@shared/context';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageWithHistory } from '@shared/hooks';
import { useValuesVisibility } from '@shared/context';

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
      
      // Si hay tareas seleccionadas, mostrar botón de delete
      if (selectedTareas.length > 0) {
        actions.push({
          component: (
            <SystemButtons.MultiSelectDeleteButton 
              onDelete={handleDeleteSelected}
              selectedCount={selectedTareas.length}
            />
          ),
          onClick: handleDeleteSelected
        });
        
        // Botón para limpiar selección
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
  }, [setTitle, setActions, isMobile, selectedTareas.length]);

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
  }, []);

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
      
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
      
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
    // Comunicar que no hay selecciones
    window.dispatchEvent(new CustomEvent('selectionChanged', { 
      detail: { hasSelections: false } 
    }));
  };

  const handleSelectTarea = (tareaId) => {
    setSelectedTareas(prev => {
      const newSelection = prev.includes(tareaId) 
        ? prev.filter(id => id !== tareaId)
        : [...prev, tareaId];
      
      // Comunicar el estado de selección al Toolbar
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: newSelection.length > 0 } 
      }));
      
      return newSelection;
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
            isMultiSelectMode={selectedTareas.length > 0}
            selectedTareas={selectedTareas}
            onSelectTarea={handleSelectTarea}
            onActivateMultiSelect={() => {}} // Ya no necesitamos esta función
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
        {selectedTareas.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: isMobile ? 100 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: isMobile ? 3 : 2,
              px: isMobile ? 3 : 2,
              py: isMobile ? 1.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 2 : 1,
              boxShadow: 3,
              zIndex: 1000,
              minWidth: isMobile ? 250 : 200,
              justifyContent: 'center',
              // En mobile, hacer la barra más grande y fácil de tocar
              ...(isMobile && {
                '& *': {
                  fontSize: '1rem !important'
                }
              })
            }}
          >
            <Chip
              label={`${selectedTareas.length} seleccionadas`}
              size={isMobile ? "medium" : "small"}
              color="primary"
              variant="outlined"
              sx={{
                fontSize: isMobile ? '0.9rem' : '0.75rem',
                height: isMobile ? 32 : 24
              }}
            />
            
            <IconButton
              size={isMobile ? "medium" : "small"}
              onClick={handleDeactivateMultiSelect}
              sx={{ 
                color: 'text.secondary',
                fontSize: isMobile ? '1.2rem' : '1rem',
                padding: isMobile ? 1 : 0.5,
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