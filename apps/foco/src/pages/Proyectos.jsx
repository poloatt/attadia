import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container,
  Box,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
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
import { Toolbar } from '@shared/navigation';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import ProyectosGrid from '../proyectos/ProyectosGrid';
import ProyectoForm from '../proyectos/ProyectoForm';
import { useNavigationBar } from '@shared/context';
import TareaForm from '../proyectos/TareaForm';
import { useValuesVisibility } from '@shared/context';
import { usePageWithHistory, useGlobalActionHistory } from '@shared/hooks';
import { useNavigate } from 'react-router-dom';
import { SystemButtons } from '@shared/components/common/SystemButtons';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isTareaFormOpen, setIsTareaFormOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [selectedProyectos, setSelectedProyectos] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  // 1. Definir fetchProyectos primero con debounce
  const fetchProyectosRef = useRef(null);
  const fetchProyectos = useCallback(async () => {
    // Cancelar llamada anterior si existe
    if (fetchProyectosRef.current) {
      clearTimeout(fetchProyectosRef.current);
    }
    
    return new Promise((resolve, reject) => {
      fetchProyectosRef.current = setTimeout(async () => {
        try {
          // Agregar timestamp para evitar cache
          const response = await clienteAxios.get(`/api/proyectos?populate=tareas&_t=${Date.now()}`);
          setProyectos(response.data.docs || []);
          setLoading(false);
          resolve(response.data);
        } catch (error) {
          console.error('Error:', error);
          enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
          setProyectos([]);
          setLoading(false);
          reject(error);
        }
      }, 100); // Debounce de 100ms
    });
  }, [enqueueSnackbar]);

  // Función estable para el historial
  const fetchProyectosStable = useCallback(async () => {
    try {
      const response = await clienteAxios.get(`/api/proyectos?populate=tareas&_t=${Date.now()}`);
      setProyectos(response.data.docs || []);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
      setLoading(false);
      throw error;
    }
  }, [enqueueSnackbar]);

  // 2. Historial de proyectos (ruta actual)
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    fetchProyectosStable,
    (error) => {
      console.error('Error al revertir acción:', error);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    }
  );

  // 3. Historial de tareas (ruta '/tareas')
  const { updateWithHistory: updateTareaWithHistory } = useGlobalActionHistory(
    undefined, // No hace falta fetch para tareas aquí
    (error) => {
      enqueueSnackbar('Error al revertir acción de tarea', { variant: 'error' });
    },
    '/tareas' // Forzar el entityType a 'tarea'
  );

  const handleBack = () => {
            navigate('/tiempo/rutinas');
  };

  // Funciones para selección múltiple
  const handleSelectProyecto = useCallback((proyectoId) => {
    setSelectedProyectos(prev => {
      const newSelection = prev.includes(proyectoId) 
        ? prev.filter(id => id !== proyectoId)
        : [...prev, proyectoId];
      
      // Comunicar el estado de selección al Toolbar
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: newSelection.length > 0 } 
      }));
      
      return newSelection;
    });
  }, []);

  const handleSelectAllProyectos = useCallback(() => {
    if (selectedProyectos.length === proyectos.length) {
      setSelectedProyectos([]);
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
    } else {
      setSelectedProyectos(proyectos.map(proyecto => proyecto._id));
      // Comunicar que hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: true } 
      }));
    }
  }, [selectedProyectos.length, proyectos]);

  const handleDeactivateMultiSelect = useCallback(() => {
    setSelectedProyectos([]);
    // Comunicar que no hay selecciones
    window.dispatchEvent(new CustomEvent('selectionChanged', { 
      detail: { hasSelections: false } 
    }));
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedProyectos.length === 0) return;
    
    try {
      // Eliminar todas las tareas seleccionadas usando el sistema de historial
      const results = await Promise.allSettled(
        selectedProyectos.map(id => deleteWithHistory(id))
      );
      
      // Contar eliminaciones exitosas y fallidas
      const successful = results.filter(result => 
        result.status === 'fulfilled' && 
        (result.value?.success !== false)
      ).length;
      
      const failed = results.length - successful;
      
      // Actualizar estado local inmediatamente removiendo los proyectos eliminados
      setProyectos(prevProyectos => 
        prevProyectos.filter(proyecto => !selectedProyectos.includes(proyecto._id))
      );
      
      // Mostrar mensaje apropiado
      if (successful > 0) {
        enqueueSnackbar(`${successful} proyecto(s) eliminado(s) exitosamente`, { variant: 'success' });
      }
      
      if (failed > 0) {
        enqueueSnackbar(`${failed} proyecto(s) ya fueron eliminados`, { variant: 'warning' });
      }
      
      setSelectedProyectos([]);
      
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
      
      // Recargar datos después de un breve delay para asegurar sincronización
      setTimeout(() => {
        fetchProyectos();
      }, 500);
      
    } catch (error) {
      console.error('Error al eliminar proyectos:', error);
      enqueueSnackbar('Error al eliminar los proyectos', { variant: 'error' });
    }
  }, [selectedProyectos, deleteWithHistory, enqueueSnackbar, fetchProyectos]);

  useEffect(() => {
    setTitle('Proyectos');
    
    // Solo mostrar iconos en desktop
    if (!isMobile) {
      const actions = [];
      
      // Botón "Nuevo Proyecto" siempre visible
      actions.push({
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
      });
      
      // Si hay proyectos seleccionados, mostrar botones de selección múltiple
      if (selectedProyectos.length > 0) {
        // Botón seleccionar todas/deseleccionar todas
        actions.push({
          component: (
            <Button
              variant="outlined"
              onClick={handleSelectAllProyectos}
              sx={{ borderRadius: 0 }}
            >
              {selectedProyectos.length === proyectos.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
            </Button>
          ),
          onClick: handleSelectAllProyectos
        });
        
        // Botón de delete
        actions.push({
          component: (
            <SystemButtons.MultiSelectDeleteButton 
              onDelete={handleDeleteSelected}
              selectedCount={selectedProyectos.length}
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
      } else if (proyectos.length > 0) {
        // Si no hay selecciones pero hay proyectos, mostrar botón para seleccionar todas
        actions.push({
          component: (
            <Button
              variant="outlined"
              onClick={handleSelectAllProyectos}
              sx={{ borderRadius: 0 }}
            >
              Seleccionar Todas
            </Button>
          ),
          onClick: handleSelectAllProyectos
        });
      }
      
      setActions(actions);
    } else {
      // En móvil, solo mostrar el botón "Nuevo Proyecto"
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
    }
  }, [setTitle, setActions, isMobile, selectedProyectos.length, proyectos.length, handleSelectAllProyectos, handleDeleteSelected, handleDeactivateMultiSelect]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  // Escuchar eventos del Header y navegación
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'proyecto') {
        setEditingProyecto(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de la navegación de proyectos
    const handleAddProject = () => {
      setEditingProyecto(null);
      setIsFormOpen(true);
    };

    const handleAddTask = () => {
      setSelectedProyecto(null);
      setIsTareaFormOpen(true);
    };

    // Escuchar eventos de deshacer específicos para proyectos
    const handleUndoAction = (event) => {
      const action = event.detail;
      console.log('Undo de proyecto detectado:', action);
      // Refrescar proyectos después del undo
      setTimeout(() => {
        fetchProyectos();
      }, 500);
    };

    // Escuchar eventos de deshacer específicos para tareas
    const handleUndoTareaAction = (event) => {
      const action = event.detail;
      console.log('Undo de tarea detectado:', action);
      // Refrescar proyectos después del undo de tarea
      setTimeout(() => {
        fetchProyectos();
      }, 500);
    };

    // Manejar eliminación de proyectos seleccionados desde el Toolbar
    const handleDeleteSelectedProyectos = () => {
      handleDeleteSelected();
    };


    // Manejar seleccionar todas desde el Toolbar
    const handleSelectAllProyectosFromToolbar = () => {
      handleSelectAllProyectos();
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    window.addEventListener('addProject', handleAddProject);
    window.addEventListener('addTask', handleAddTask);
    window.addEventListener('undoAction_proyecto', handleUndoAction);
    window.addEventListener('undoAction_tarea', handleUndoTareaAction);
    window.addEventListener('deleteSelectedProyectos', handleDeleteSelectedProyectos);
    window.addEventListener('selectAllProyectos', handleSelectAllProyectosFromToolbar);
    
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('addProject', handleAddProject);
      window.removeEventListener('addTask', handleAddTask);
      window.removeEventListener('undoAction_proyecto', handleUndoAction);
      window.removeEventListener('undoAction_tarea', handleUndoTareaAction);
      window.removeEventListener('deleteSelectedProyectos', handleDeleteSelectedProyectos);
      window.removeEventListener('selectAllProyectos', handleSelectAllProyectosFromToolbar);
    };
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchProyectos();
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
        // Usar la función con historial automático
        response = await updateWithHistory(
          editingProyecto._id || editingProyecto.id, 
          dataToSend, 
          editingProyecto
        );
        enqueueSnackbar('Proyecto actualizado exitosamente', { variant: 'success' });
      } else {
        // Usar la función con historial automático
        response = await createWithHistory(dataToSend);
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
      // Usar la función con historial automático
      await deleteWithHistory(id);
      enqueueSnackbar('Proyecto eliminado exitosamente', { variant: 'success' });
      await fetchProyectos();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      enqueueSnackbar('Error al eliminar el proyecto', { variant: 'error' });
    }
  }, [deleteWithHistory, enqueueSnackbar, fetchProyectos]);

  const handleUpdateTarea = useCallback((tareaActualizada) => {
    setProyectos(prevProyectos =>
      prevProyectos.map(proyecto => {
        // Soportar tanto _id como id en proyecto de la tarea actualizada
        const proyectoIdTarea = tareaActualizada.proyecto?._id || tareaActualizada.proyecto;
        if (proyecto._id === proyectoIdTarea) {
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
  }, []);

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
              updateWithHistory={updateWithHistory}
              updateTareaWithHistory={updateTareaWithHistory}
              isMultiSelectMode={selectedProyectos.length > 0}
              selectedProyectos={selectedProyectos}
              onSelectProyecto={handleSelectProyecto}
            />
          )}
        </Box>
        <ProyectoForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          isEditing={!!editingProyecto}
          initialData={editingProyecto}
          createWithHistory={createWithHistory}
          updateWithHistory={updateWithHistory}
          deleteWithHistory={deleteWithHistory}
        />
        
        {/* Formulario de tarea cuando se abre desde la navegación */}
        {isTareaFormOpen && (
          <TareaForm
            open={isTareaFormOpen}
            onClose={() => {
              setIsTareaFormOpen(false);
              setSelectedProyecto(null);
            }}
            onSubmit={handleTareaSubmit}
            isEditing={false}
            initialData={null}
            proyectos={proyectos}
            onProyectosUpdate={fetchProyectos}
          />
        )}
        
        {/* Barra flotante minimalista para selección múltiple */}
        {selectedProyectos.length > 0 && (
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
              label={`${selectedProyectos.length} seleccionados`}
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

export default Proyectos;
