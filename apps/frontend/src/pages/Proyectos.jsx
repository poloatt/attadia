import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Box,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import useResponsive from '../hooks/useResponsive';
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
import { Toolbar } from '../navigation';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import ProyectosGrid from '../components/proyectos/ProyectosGrid';
import ProyectoForm from '../components/proyectos/ProyectoForm';
import { useNavigationBar } from '../context/NavigationBarContext';
import TareaForm from '../components/proyectos/TareaForm';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { usePageWithHistory, useGlobalActionHistory } from '../hooks/useGlobalActionHistory';
import { useNavigate } from 'react-router-dom';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isTareaFormOpen, setIsTareaFormOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  // 1. Definir fetchProyectos primero
  const fetchProyectos = useCallback(async () => {
    try {
      console.log('Solicitando proyectos con tareas...');
      // Agregar timestamp para evitar cache
      const response = await clienteAxios.get(`/api/proyectos?populate=tareas&_t=${Date.now()}`);
      console.log('Respuesta completa:', response.data);
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
    }
  }, [enqueueSnackbar]);

  // 2. Historial de proyectos (ruta actual)
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    fetchProyectos,
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

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  // Escuchar eventos del Header
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'proyecto') {
        setEditingProyecto(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de deshacer específicos para proyectos
    const handleUndoAction = (event) => {
      const action = event.detail;
      handleUndoAction(action);
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

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    window.addEventListener('undoAction_proyecto', handleUndoAction);
    window.addEventListener('undoAction_tarea', handleUndoTareaAction);
    
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('undoAction_proyecto', handleUndoAction);
      window.removeEventListener('undoAction_tarea', handleUndoTareaAction);
    };
  }, [fetchProyectos]);

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
          />
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
      </Box>
    </Box>
  );
}

export default Proyectos;
