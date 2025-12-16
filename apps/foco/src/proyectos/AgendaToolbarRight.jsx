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
    width: 28,
    height: 28,
    padding: 0.25,
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

  return <SystemButtons actions={actions} gap={0.125} />;
}


