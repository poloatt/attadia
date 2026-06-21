import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
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
  TaskOutlined as TaskIcon,
  ArchiveOutlined as ArchiveIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  AccessTimeOutlined as TimeIcon,
} from '@mui/icons-material';
import clienteAxios from '@shared/config/axios';
import { fetchObjetivosLight, fetchTasksByObjetivo } from '../features/tasks/api/tasksApi';
import { useSnackbar } from 'notistack';
import ObjetivosGrid from '../objetivos/ObjetivosGrid';
import ObjetivoForm from '../objetivos/ObjetivoForm';
import { useNavigationBar } from '@shared/context';
import { TareaForm, GoogleTasksConfig } from '../features/tasks/form';
import { HabitsManagerHost } from '../features/habits';
import { useValuesVisibility } from '@shared/context';
import { usePageWithHistory, useGlobalActionHistory } from '@shared/hooks';
import { useNavigate } from 'react-router-dom';
import { SystemButtons } from '@shared/components/common/SystemButtons';

export function Objetivos() {
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingObjetivo, setEditingObjetivo] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isTareaFormOpen, setIsTareaFormOpen] = useState(false);
  const [selectedObjetivo, setSelectedObjetivo] = useState(null);
  const [selectedObjetivos, setSelectedObjetivos] = useState([]);
  const [isGoogleTasksConfigOpen, setIsGoogleTasksConfigOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  // 1. fetchObjetivos: fetch directo (sin debounce artificial) con dedup in-flight
  //    para coalescer llamadas concurrentes (montaje + eventos) sin añadir latencia.
  const fetchObjetivosInFlightRef = useRef(null);
  const fetchObjetivos = useCallback(async () => {
    if (fetchObjetivosInFlightRef.current) {
      return fetchObjetivosInFlightRef.current;
    }

    const run = (async () => {
      try {
        const docs = await fetchObjetivosLight();
        setObjetivos(docs.map((o) => ({ ...o, tareas: o.tareas || [] })));
        setLoading(false);
        return { docs };
      } catch (error) {
        console.error('Error:', error);
        enqueueSnackbar('Error al cargar Objetivos', { variant: 'error' });
        setObjetivos([]);
        setLoading(false);
        throw error;
      }
    })();

    fetchObjetivosInFlightRef.current = run;
    try {
      return await run;
    } finally {
      fetchObjetivosInFlightRef.current = null;
    }
  }, [enqueueSnackbar]);

  // Función estable para el historial
  const fetchObjetivosStable = useCallback(async () => {
    try {
      const docs = await fetchObjetivosLight();
      setObjetivos(docs.map((o) => ({ ...o, tareas: o.tareas || [] })));
      setLoading(false);
      return { docs };
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar Objetivos', { variant: 'error' });
      setObjetivos([]);
      setLoading(false);
      throw error;
    }
  }, [enqueueSnackbar]);

  // 2. Historial de objetivos (ruta actual)
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    fetchObjetivosStable,
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
  const handleSelectobjetivo = useCallback((objetivoId) => {
    setSelectedObjetivos(prev => {
      const newSelection = prev.includes(objetivoId) 
        ? prev.filter(id => id !== objetivoId)
        : [...prev, objetivoId];
      
      // Comunicar el estado de selección al Toolbar
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: newSelection.length > 0 } 
      }));
      
      return newSelection;
    });
  }, []);

  const handleSelectAllObjetivos = useCallback(() => {
    if (selectedObjetivos.length === objetivos.length) {
      setSelectedObjetivos([]);
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
    } else {
      setSelectedObjetivos(objetivos.map(objetivo => objetivo._id));
      // Comunicar que hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: true } 
      }));
    }
  }, [selectedObjetivos.length, objetivos]);

  const handleDeactivateMultiSelect = useCallback(() => {
    setSelectedObjetivos([]);
    // Comunicar que no hay selecciones
    window.dispatchEvent(new CustomEvent('selectionChanged', { 
      detail: { hasSelections: false } 
    }));
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedObjetivos.length === 0) return;
    
    try {
      // Eliminar todas las tareas seleccionadas usando el sistema de historial
      const results = await Promise.allSettled(
        selectedObjetivos.map(id => deleteWithHistory(id))
      );
      
      // Contar eliminaciones exitosas y fallidas
      const successful = results.filter(result => 
        result.status === 'fulfilled' && 
        (result.value?.success !== false)
      ).length;
      
      const failed = results.length - successful;
      
      // Actualizar estado local inmediatamente removiendo los objetivos eliminados
      setObjetivos(prevObjetivos => 
        prevObjetivos.filter(objetivo => !selectedObjetivos.includes(objetivo._id))
      );
      
      // Mostrar mensaje apropiado
      if (successful > 0) {
        enqueueSnackbar(`${successful} objetivo(s) eliminado(s) exitosamente`, { variant: 'success' });
      }
      
      if (failed > 0) {
        enqueueSnackbar(`${failed} objetivo(s) ya fueron eliminados`, { variant: 'warning' });
      }
      
      setSelectedObjetivos([]);
      
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
      
      // Recargar datos después de un breve delay para asegurar sincronización
      setTimeout(() => {
        fetchObjetivos();
      }, 500);
      
    } catch (error) {
      console.error('Error al eliminar objetivos:', error);
      enqueueSnackbar('Error al eliminar los Objetivos', { variant: 'error' });
    }
  }, [selectedObjetivos, deleteWithHistory, enqueueSnackbar, fetchObjetivos]);

  useLayoutEffect(() => {
    setTitle('Objetivos');
    
    // Solo mostrar iconos en desktop
    if (!isMobile) {
      const actions = [];
      
      // Botón "Nuevo objetivo" siempre visible
      actions.push({
        component: (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingObjetivo(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nuevo objetivo
          </Button>
        ),
        onClick: () => {}
      });
      
      // Si hay objetivos seleccionados, mostrar botones de selección múltiple
      if (selectedObjetivos.length > 0) {
        // Botón seleccionar todas/deseleccionar todas
        actions.push({
          component: (
            <Button
              variant="outlined"
              onClick={handleSelectAllObjetivos}
              sx={{ borderRadius: 0 }}
            >
              {selectedObjetivos.length === objetivos.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
            </Button>
          ),
          onClick: handleSelectAllObjetivos
        });
        
        // Botón de delete
        actions.push({
          component: (
            <SystemButtons.MultiSelectDeleteButton 
              onDelete={handleDeleteSelected}
              selectedCount={selectedObjetivos.length}
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
      // En móvil, solo mostrar el botón "Nuevo objetivo"
      setActions([
        {
          component: (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingObjetivo(null);
                setIsFormOpen(true);
              }}
              sx={{ borderRadius: 0 }}
            >
              Nuevo objetivo
            </Button>
          ),
          onClick: () => {}
        }
      ]);
    }
  }, [setTitle, setActions, isMobile, selectedObjetivos.length, objetivos.length, handleSelectAllObjetivos, handleDeleteSelected, handleDeactivateMultiSelect]);

  useEffect(() => {
    fetchObjetivos();
  }, [fetchObjetivos]);

  // Escuchar eventos del Header y navegación
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'OBJETIVO') {
        setEditingObjetivo(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de la navegación de Objetivos
    const handleaddObjetivo = () => {
      setEditingObjetivo(null);
      setIsFormOpen(true);
    };

    const handleAddTask = () => {
      setSelectedObjetivo(null);
      setIsTareaFormOpen(true);
    };

    // Escuchar eventos de deshacer específicos para Objetivos
    const handleUndoAction = (event) => {
      const action = event.detail;
      console.log('Undo de objetivo detectado:', action);
      // Refrescar objetivos después del undo
      setTimeout(() => {
        fetchObjetivos();
      }, 500);
    };

    // Escuchar eventos de deshacer específicos para tareas
    const handleUndoTareaAction = (event) => {
      const action = event.detail;
      console.log('Undo de tarea detectado:', action);
      // Refrescar objetivos después del undo de tarea
      setTimeout(() => {
        fetchObjetivos();
      }, 500);
    };

    // Manejar eliminación de objetivos seleccionados desde el Toolbar
    const handleDeleteSelectedObjetivos = () => {
      handleDeleteSelected();
    };


    // Manejar seleccionar todas desde el Toolbar
    const handleSelectAllObjetivosFromToolbar = () => {
      handleSelectAllObjetivos();
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    window.addEventListener('addObjetivo', handleaddObjetivo);
    window.addEventListener('addTask', handleAddTask);
    window.addEventListener('undoAction_objetivo', handleUndoAction);
    window.addEventListener('undoAction_tarea', handleUndoTareaAction);
    window.addEventListener('deleteSelectedObjetivos', handleDeleteSelectedObjetivos);
    window.addEventListener('selectAllObjetivos', handleSelectAllObjetivosFromToolbar);
    const handleOpenGoogleTasksConfig = () => setIsGoogleTasksConfigOpen(true);
    const handleGoogleTasksSyncCompleted = () => fetchObjetivos();
    window.addEventListener('openGoogleTasksConfig', handleOpenGoogleTasksConfig);
    window.addEventListener('googleTasksSyncCompleted', handleGoogleTasksSyncCompleted);

    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('addObjetivo', handleaddObjetivo);
      window.removeEventListener('addTask', handleAddTask);
      window.removeEventListener('undoAction_objetivo', handleUndoAction);
      window.removeEventListener('undoAction_tarea', handleUndoTareaAction);
      window.removeEventListener('deleteSelectedObjetivos', handleDeleteSelectedObjetivos);
      window.removeEventListener('selectAllObjetivos', handleSelectAllObjetivosFromToolbar);
      window.removeEventListener('openGoogleTasksConfig', handleOpenGoogleTasksConfig);
      window.removeEventListener('googleTasksSyncCompleted', handleGoogleTasksSyncCompleted);
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
      if (editingObjetivo) {
        // Usar la función con historial automático
        response = await updateWithHistory(
          editingObjetivo._id || editingObjetivo.id, 
          dataToSend, 
          editingObjetivo
        );
        enqueueSnackbar('objetivo actualizado exitosamente', { variant: 'success' });
      } else {
        // Usar la función con historial automático
        response = await createWithHistory(dataToSend);
        enqueueSnackbar('objetivo creado exitosamente', { variant: 'success' });
      }
      
      setIsFormOpen(false);
      setEditingObjetivo(null);
      await fetchObjetivos();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar el objetivo', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((objetivo) => {
    setEditingObjetivo(objetivo);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      // Usar la función con historial automático
      await deleteWithHistory(id);
      enqueueSnackbar('objetivo eliminado exitosamente', { variant: 'success' });
      await fetchObjetivos();
    } catch (error) {
      console.error('Error al eliminar objetivo:', error);
      enqueueSnackbar('Error al eliminar el objetivo', { variant: 'error' });
    }
  }, [deleteWithHistory, enqueueSnackbar, fetchObjetivos]);

  const handleLoadObjetivoTareas = useCallback(async (objetivoId) => {
    const existing = objetivos.find((o) => String(o._id || o.id) === String(objetivoId));
    if (existing?.tareas?.length) return;
    try {
      const tareas = await fetchTasksByObjetivo(objetivoId);
      setObjetivos((prev) => prev.map((o) => (
        String(o._id || o.id) === String(objetivoId) ? { ...o, tareas } : o
      )));
    } catch (error) {
      console.error('Error al cargar tareas del objetivo:', error);
      enqueueSnackbar('Error al cargar tareas del objetivo', { variant: 'error' });
    }
  }, [objetivos, enqueueSnackbar]);

  const handleUpdateTarea = useCallback((tareaActualizada) => {
    setObjetivos((prevObjetivos) =>
      prevObjetivos.map((objetivo) => {
        const objetivoIdTarea = tareaActualizada.objetivo?._id || tareaActualizada.objetivo;
        if (objetivo._id === objetivoIdTarea) {
          const tareas = Array.isArray(objetivo.tareas) ? objetivo.tareas : [];
          return {
            ...objetivo,
            tareas: tareas.map((tarea) =>
              (tarea._id === tareaActualizada._id ? tareaActualizada : tarea),
            ),
          };
        }
        return objetivo;
      }),
    );
  }, []);

  const handleAddTarea = (objetivo) => {
    setSelectedObjetivo(objetivo);
    setIsTareaFormOpen(true);
  };

  const handleTareaSubmit = async (formData) => {
    try {
      const datosAEnviar = {
        ...formData,
        objetivo: selectedObjetivo._id
      };

      await clienteAxios.post('/api/tareas', datosAEnviar);
      enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      const objetivoId = selectedObjetivo?._id || selectedObjetivo?.id;
      setIsTareaFormOpen(false);
      setSelectedObjetivo(null);
      await fetchObjetivos();
      if (objetivoId) {
        const tareas = await fetchTasksByObjetivo(objetivoId);
        setObjetivos((prev) => prev.map((o) => (
          String(o._id || o.id) === String(objetivoId) ? { ...o, tareas } : o
        )));
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      enqueueSnackbar('Error al crear la tarea', { variant: 'error' });
    }
  };

  const filteredobjetivos = Objetivos;

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
            pb: isMobile ? 4 : 6, // Agregar padding bottom más extenso
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
            <ObjetivosGrid
              objetivos={objetivos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={() => {
                setEditingObjetivo(null);
                setIsFormOpen(true);
              }}
              onUpdateTarea={handleUpdateTarea}
              onLoadObjetivoTareas={handleLoadObjetivoTareas}
              onAddTarea={handleAddTarea}
              showValues={showValues}
              updateWithHistory={updateWithHistory}
              updateTareaWithHistory={updateTareaWithHistory}
              isMultiSelectMode={selectedObjetivos.length > 0}
              selectedObjetivos={selectedObjetivos}
              onSelectobjetivo={handleSelectobjetivo}
            />
          )}
        </Box>
        <ObjetivoForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          isEditing={!!editingObjetivo}
          initialData={editingObjetivo}
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
              setSelectedObjetivo(null);
            }}
            onSubmit={handleTareaSubmit}
            isEditing={false}
            initialData={null}
            Objetivos={objetivos}
            onObjetivosUpdate={fetchObjetivos}
          />
        )}
        
        {/* Barra flotante minimalista para selección múltiple */}
        {selectedObjetivos.length > 0 && (
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
              label={`${selectedObjetivos.length} seleccionados`}
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

        <HabitsManagerHost />
        <GoogleTasksConfig
          open={isGoogleTasksConfigOpen}
          onClose={() => setIsGoogleTasksConfigOpen(false)}
        />
      </Box>
    </Box>
  );
}

export default Objetivos;
