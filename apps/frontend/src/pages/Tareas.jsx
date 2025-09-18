import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container,
  Box,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Fab,
  Typography,
} from '@mui/material';
import useResponsive from '../hooks/useResponsive';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  TaskOutlined as TaskIcon,
  FolderOutlined as ProjectIcon,
  ArchiveOutlined as ArchiveIcon,
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
import GoogleTasksConfig from '../components/proyectos/GoogleTasksConfig';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

export function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [isGoogleTasksConfigOpen, setIsGoogleTasksConfigOpen] = useState(false);
  const [selectedTareas, setSelectedTareas] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const location = useLocation();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  // Funciones para selección múltiple
  const handleDeactivateMultiSelect = () => {
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

  const handleDeleteSelected = async () => {
    if (selectedTareas.length === 0) return;
    
    try {
      // Eliminar todas las tareas seleccionadas usando el sistema de historial
      await Promise.all(
        selectedTareas.map(id => deleteWithHistory(id))
      );
      
      enqueueSnackbar(`${selectedTareas.length} tarea(s) eliminada(s) exitosamente`, { variant: 'success' });
      setSelectedTareas([]);
    } catch (error) {
      console.error('Error al eliminar tareas:', error);
      enqueueSnackbar('Error al eliminar las tareas', { variant: 'error' });
    }
  };

  useEffect(() => {
    setTitle('Tareas');
    
    // Solo mostrar iconos en desktop
    if (!isMobile) {
      const actions = [];
      
      // Botón "Nueva Tarea" siempre visible
      actions.push({
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
      });
      
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
      // En móvil, solo mostrar el botón "Nueva Tarea"
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
    }
  }, [setTitle, setActions, isMobile, selectedTareas.length]);

  const fetchProyectosRef = useRef(null);
  const fetchProyectos = useCallback(async () => {
    // Cancelar llamada anterior si existe
    if (fetchProyectosRef.current) {
      clearTimeout(fetchProyectosRef.current);
    }
    
    return new Promise((resolve, reject) => {
      fetchProyectosRef.current = setTimeout(async () => {
        try {
          // Obtener proyectos con sus tareas incluidas
          const response = await clienteAxios.get(`/api/proyectos?populate=tareas&_t=${Date.now()}`);
          setProyectos(response.data.docs || []);
          resolve(response.data);
        } catch (error) {
          console.error('Error:', error);
          enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
          setProyectos([]);
          reject(error);
        }
      }, 100); // Debounce de 100ms
    });
  }, [enqueueSnackbar]);

  const fetchTareasRef = useRef(null);
  const fetchTareas = useCallback(async () => {
    // Cancelar llamada anterior si existe
    if (fetchTareasRef.current) {
      clearTimeout(fetchTareasRef.current);
    }

    return new Promise((resolve, reject) => {
      fetchTareasRef.current = setTimeout(async () => {
        try {
          // Agregar timestamp para evitar cache
          const response = await clienteAxios.get(`/api/tareas?_t=${Date.now()}`);
          setTareas(response.data.docs || []);
          setLoading(false);
          resolve(response.data);
        } catch (error) {
          console.error('Error:', error);
          enqueueSnackbar('Error al cargar tareas', { variant: 'error' });  
          setTareas([]);
          setLoading(false);
          reject(error);
        }
      }, 100); // Debounce de 100ms
    });
  }, [enqueueSnackbar]);

  // Usar el sistema automático de historial
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
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
    fetchTareas();
    fetchProyectos();
  }, [fetchTareas, fetchProyectos]);

  // Escuchar eventos del Header y navegación
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'tarea') {
        setEditingTarea(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de la navegación de proyectos
    const handleAddTask = () => {
      setEditingTarea(null);
      setIsFormOpen(true);
    };

    // Escuchar eventos de deshacer específicos para tareas
    const handleUndoTareaAction = (event) => {
      const action = event.detail;
      console.log('Undo de tarea detectado en página de Tareas:', action);
      // Refrescar tareas después del undo
      setTimeout(() => {
        fetchTareas();
        fetchProyectos();
      }, 500);
    };

    const handleOpenGoogleTasksConfig = () => {
      setIsGoogleTasksConfigOpen(true);
    };

    // Manejar la sincronización completada de Google Tasks
    const handleGoogleTasksSyncCompleted = (event) => {
      console.log('🔄 Sincronización de Google Tasks completada, recargando tareas...', event.detail);
      
      // Recargar tareas y proyectos después de la sincronización
      setTimeout(() => {
        fetchTareas();
        fetchProyectos();
      }, 500);
      
      // Mostrar notificación adicional
      const { results } = event.detail;
      if (results.fromGoogle?.created > 0 || results.fromGoogle?.updated > 0) {
        enqueueSnackbar(
          `Se han sincronizado ${results.fromGoogle.created + results.fromGoogle.updated} tareas desde Google Tasks`, 
          { variant: 'info' }
        );
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);   
    window.addEventListener('addTask', handleAddTask);
    window.addEventListener('undoAction_tarea', handleUndoTareaAction);
    window.addEventListener('openGoogleTasksConfig', handleOpenGoogleTasksConfig);
    window.addEventListener('googleTasksSyncCompleted', handleGoogleTasksSyncCompleted);

    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('addTask', handleAddTask);
      window.removeEventListener('undoAction_tarea', handleUndoTareaAction);    
      window.removeEventListener('openGoogleTasksConfig', handleOpenGoogleTasksConfig);
      window.removeEventListener('googleTasksSyncCompleted', handleGoogleTasksSyncCompleted);
    };
  }, [fetchTareas, fetchProyectos]);

  const handleFormSubmit = async (formData) => {
    try {
      const datosAEnviar = {
        ...formData,
        proyecto: formData.proyecto?._id || formData.proyecto
      };

      if (editingTarea) {
        // Usar la función con historial automático
        const updatedTarea = await updateWithHistory(editingTarea._id, datosAEnviar, editingTarea);
        
        // Actualizar estado local inmediatamente
        setTareas(prevTareas => 
          prevTareas.map(tarea => 
            tarea._id === editingTarea._id ? updatedTarea : tarea
          )
        );
        
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        // Usar la función con historial automático
        const newTarea = await createWithHistory(datosAEnviar);
        
        // Agregar la nueva tarea al estado local
        setTareas(prevTareas => [newTarea, ...prevTareas]);
        
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }

      setIsFormOpen(false);
      setEditingTarea(null);
      
      // Recargar datos después de un breve delay para asegurar sincronización
      setTimeout(() => {
        fetchTareas();
        fetchProyectos();
      }, 500);
    } catch (error) {
      console.error('Error al guardar tarea:', error.response?.data || error.message);
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
      // Usar la función con historial automático
      await deleteWithHistory(id);
      enqueueSnackbar('Tarea eliminada exitosamente', { variant: 'success' });
      // Los datos se recargan automáticamente después de la acción
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      enqueueSnackbar('Error al eliminar la tarea', { variant: 'error' });
    }
  }, [deleteWithHistory, enqueueSnackbar]);

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

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Eliminar <Toolbar /> */}
        <Box 
          sx={{ 
            py: isMobile ? 1 : 2,
            px: isMobile ? 0 : 1,
            height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 190px)',
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TareasTable
              tareas={tareas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateEstado={handleUpdateEstado}
              isArchive={false}
              showValues={showValues}
              updateWithHistory={updateWithHistory}
              isMultiSelectMode={selectedTareas.length > 0}
              selectedTareas={selectedTareas}
              onSelectTarea={handleSelectTarea}
              onActivateMultiSelect={() => {}} // Ya no necesitamos esta función
            />
          )}
        </Box>
        {isFormOpen && (
          <TareaForm
            open={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleFormSubmit}
            isEditing={!!editingTarea}
            initialData={editingTarea}
            proyectos={proyectos}
            onProyectosUpdate={fetchProyectos}
            createWithHistory={createWithHistory}
            updateWithHistory={updateWithHistory}
            deleteWithHistory={deleteWithHistory}
          />
        )}
        
        {/* Modal de configuración de Google Tasks */}
        <GoogleTasksConfig
          open={isGoogleTasksConfigOpen}
          onClose={() => setIsGoogleTasksConfigOpen(false)}
        />

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

export default Tareas;