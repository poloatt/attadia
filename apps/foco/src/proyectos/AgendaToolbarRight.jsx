import React, { useEffect, useMemo, useState } from 'react';
import { AddOutlined, CheckCircle, CheckCircleOutline, DeleteOutlined } from '@mui/icons-material';
import { SystemButtons } from '@shared/components/common/SystemButtons';

/**
 * Acciones del lado derecho para Agenda/Tareas.
 * Mantiene estado local solo para reflejar el icono de completadas,
 * pero el estado real lo consume `useAgendaFilter` a través de eventos.
 */
export default function AgendaToolbarRight({ hasSelectedItems }) {
  const [showCompleted, setShowCompleted] = useState(false);

  // Mantener sync si el estado cambia desde otro lugar
  useEffect(() => {
    const handleSetShowCompleted = (event) => {
      const { value } = event.detail || {};
      if (typeof value === 'boolean') setShowCompleted(value);
    };
    window.addEventListener('setShowCompleted', handleSetShowCompleted);
    return () => window.removeEventListener('setShowCompleted', handleSetShowCompleted);
  }, []);

  const commonButtonSx = useMemo(() => ({
    width: { xs: 32, sm: 26 },
    height: { xs: 32, sm: 26 },
    padding: { xs: 0.25, sm: 0.125 },
    minWidth: { xs: 32, sm: 26 },
    minHeight: { xs: 32, sm: 26 },
    '& .MuiSvgIcon-root': {
      fontSize: { xs: '1.1rem', sm: '1.1rem' }
    },
    '&:hover': { backgroundColor: 'action.hover' }
  }), []);

  const actions = useMemo(() => ([
    {
      key: 'sync',
      icon: (
        <SystemButtons.SyncButton
          tooltip="Sincronizar"
          buttonSx={commonButtonSx}
          onClick={() => window.dispatchEvent(new CustomEvent('openGoogleTasksConfig'))}
        />
      ),
      label: 'Sincronizar'
    },
    {
      key: 'rutinas',
      icon: <SystemButtons.RutinasButton buttonSx={{ ...commonButtonSx, color: 'primary.main' }} />,
      label: 'Rutinas',
      tooltip: 'Rutinas',
      // Ya es un IconButton (isButtonComponent), no necesita onClick aquí
    },
    {
      key: 'deleteSelected',
      icon: <DeleteOutlined />,
      label: 'Eliminar',
      tooltip: 'Eliminar seleccionadas',
      color: 'error.main',
      hoverColor: 'error.main',
      buttonSx: commonButtonSx,
      show: hasSelectedItems, // Solo mostrar si hay selección activa
      onClick: () => window.dispatchEvent(new CustomEvent('deleteSelectedTasks'))
    },
    {
      key: 'toggleCompleted',
      icon: showCompleted ? <CheckCircle /> : <CheckCircleOutline />,
      label: showCompleted ? 'Ocultar completadas' : 'Mostrar completadas',
      tooltip: showCompleted ? 'Ocultar completadas' : 'Mostrar completadas',
      color: 'primary.main', // Mismo color que sync para armonía visual
      hoverColor: 'primary.main',
      buttonSx: commonButtonSx,
      onClick: () => {
        const next = !showCompleted;
        setShowCompleted(next);
        window.dispatchEvent(new CustomEvent('setShowCompleted', { detail: { value: next } }));
      }
    },
    {
      key: 'addTask',
      icon: <AddOutlined />,
      label: 'Nueva Tarea',
      tooltip: 'Nueva Tarea',
      color: 'primary.main', // Mismo color que sync para armonía visual
      hoverColor: 'primary.main',
      buttonSx: commonButtonSx,
      onClick: () => window.dispatchEvent(new CustomEvent('addTask'))
    }
  ]), [commonButtonSx, hasSelectedItems, showCompleted]);

  return (
    <SystemButtons 
      actions={actions} 
      gap={{ xs: 0.02, sm: 0.1 }}
      // No agregar marginRight aquí porque el contenedor padre (Toolbar) ya tiene right: { xs: 1, sm: 2, md: 3 }
      // que alinea correctamente con el padding de la página principal
    />
  );
}


