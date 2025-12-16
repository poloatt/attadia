import React, { useEffect, useMemo, useState } from 'react';
import { AddOutlined, CheckCircle, CheckCircleOutline, DeleteOutlined } from '@mui/icons-material';
import { SystemButtons } from '@shared/components/common/SystemButtons';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

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
    width: 32,
    height: 32,
    padding: 0.5,
    '&:hover': { backgroundColor: 'action.hover' }
  }), []);

  const actions = useMemo(() => ([
    {
      key: 'googleTasks',
      icon: <GoogleIcon />,
      label: 'Google Tasks',
      tooltip: 'Configurar Google Tasks',
      color: 'primary.main',
      hoverColor: 'primary.main',
      buttonSx: commonButtonSx,
      onClick: () => window.dispatchEvent(new CustomEvent('openGoogleTasksConfig'))
    },
    {
      key: 'archivo',
      icon: <SystemButtons.ArchiveButton />,
      label: 'Archivo',
      tooltip: 'Archivo',
      // Ya es un IconButton (isButtonComponent), no necesita onClick aquí
      buttonSx: commonButtonSx
    },
    {
      key: 'deleteSelected',
      icon: <DeleteOutlined />,
      label: 'Eliminar',
      tooltip: hasSelectedItems ? 'Eliminar seleccionadas' : 'Selecciona elementos para eliminar',
      color: 'error.main',
      hoverColor: 'error.main',
      buttonSx: { ...commonButtonSx, opacity: hasSelectedItems ? 1 : 0.3 },
      disabled: !hasSelectedItems,
      onClick: () => window.dispatchEvent(new CustomEvent('deleteSelectedTasks'))
    },
    {
      key: 'toggleCompleted',
      icon: showCompleted ? <CheckCircle /> : <CheckCircleOutline />,
      label: showCompleted ? 'Ocultar completadas' : 'Mostrar completadas',
      tooltip: showCompleted ? 'Ocultar completadas' : 'Mostrar completadas',
      color: showCompleted ? 'primary.main' : 'text.secondary',
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
      color: 'text.secondary',
      hoverColor: 'primary.main',
      buttonSx: commonButtonSx,
      onClick: () => window.dispatchEvent(new CustomEvent('addTask'))
    }
  ]), [commonButtonSx, hasSelectedItems, showCompleted]);

  return <SystemButtons actions={actions} gap={0.25} />;
}


