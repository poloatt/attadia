import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CheckCircle,
  CheckCircleOutline,
  DeleteOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import { SystemButtons } from '@shared/components/common/SystemButtons';
import { ToolbarAddButton } from '@shared/components/common/ToolbarAddButton';
import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';

/**
 * Acciones de contexto del módulo Tiempo (no navegación).
 * Usar en RutinaNavigation (/foco) o en el centro de Objetivos/Tareas en desktop.
 */
export default function TiempoToolbarActions({ section: sectionProp, dense = false }) {
  const { pathname } = useLocation();
  const section = sectionProp || matchTiempoSection(pathname);
  const [showCompleted, setShowCompleted] = useState(false);
  const [hasSelectedItems, setHasSelectedItems] = useState(false);

  useEffect(() => {
    const handleSetShowCompleted = (event) => {
      const { value } = event.detail || {};
      if (typeof value === 'boolean') setShowCompleted(value);
    };
    window.addEventListener('setShowCompleted', handleSetShowCompleted);
    return () => window.removeEventListener('setShowCompleted', handleSetShowCompleted);
  }, []);

  useEffect(() => {
    const handleSelectionChange = (event) => {
      setHasSelectedItems(!!event.detail?.hasSelections);
    };
    window.addEventListener('selectionChanged', handleSelectionChange);
    return () => window.removeEventListener('selectionChanged', handleSelectionChange);
  }, []);

  const commonButtonSx = useMemo(() => ({
    width: dense ? { xs: 32, sm: 26 } : { xs: 32, sm: 26 },
    height: dense ? { xs: 32, sm: 26 } : { xs: 32, sm: 26 },
    padding: { xs: 0.25, sm: 0.125 },
    minWidth: { xs: 32, sm: 26 },
    minHeight: { xs: 32, sm: 26 },
    '& .MuiSvgIcon-root': {
      fontSize: { xs: '1.1rem', sm: '1.1rem' },
    },
    '&:hover': { backgroundColor: 'action.hover' },
  }), [dense]);

  const actions = useMemo(() => {
    const list = [
      {
        key: 'personalizarRutina',
        icon: <TuneOutlined />,
        label: 'Personalizar rutina',
        tooltip: 'Personalizar mi rutina',
        color: 'text.secondary',
        hoverColor: 'text.primary',
        buttonSx: commonButtonSx,
        onClick: () => window.dispatchEvent(new CustomEvent('openHabitTemplates')),
      },
      {
        key: 'sync',
        icon: (
          <SystemButtons.SyncButton
            tooltip="Sincronizar"
            buttonSx={commonButtonSx}
            onClick={() => window.dispatchEvent(new CustomEvent('openGoogleTasksConfig'))}
          />
        ),
        label: 'Sincronizar',
      },
      {
        key: 'deleteSelected',
        icon: <DeleteOutlined />,
        label: 'Eliminar',
        tooltip: section === 'objetivos' ? 'Eliminar objetivos seleccionados' : 'Eliminar seleccionadas',
        color: 'error.main',
        hoverColor: 'error.main',
        buttonSx: commonButtonSx,
        show: hasSelectedItems,
        onClick: () => {
          if (section === 'objetivos') {
            window.dispatchEvent(new CustomEvent('deleteSelectedObjetivos'));
          } else {
            window.dispatchEvent(new CustomEvent('deleteSelectedTasks'));
          }
        },
      },
    ];

    if (section === 'tareas') {
      list.push({
        key: 'toggleCompleted',
        icon: showCompleted ? <CheckCircle /> : <CheckCircleOutline />,
        label: showCompleted ? 'Ocultar completadas' : 'Mostrar completadas',
        tooltip: showCompleted ? 'Ocultar completadas' : 'Mostrar completadas',
        color: 'primary.main',
        hoverColor: 'primary.main',
        buttonSx: commonButtonSx,
        onClick: () => {
          const next = !showCompleted;
          setShowCompleted(next);
          window.dispatchEvent(new CustomEvent('setShowCompleted', { detail: { value: next } }));
        },
      });
    }

    const addTooltip = section === 'objetivos'
      ? 'Nuevo objetivo'
      : section === 'foco'
        ? 'Crear evento, tarea o hábito'
        : 'Nueva tarea';

    list.push({
      key: 'add',
      icon: (
        <ToolbarAddButton
          buttonSx={commonButtonSx}
          aria-label={addTooltip}
          onClick={(e) => {
            if (section === 'objetivos') {
              window.dispatchEvent(new CustomEvent('addObjetivo'));
            } else {
              window.dispatchEvent(new CustomEvent('addTask', {
                detail: section === 'foco' ? { anchorEl: e?.currentTarget } : {},
              }));
            }
          }}
        />
      ),
      label: addTooltip,
    });

    return list;
  }, [commonButtonSx, hasSelectedItems, section, showCompleted]);

  if (!section) return null;

  return (
    <SystemButtons
      actions={actions}
      gap={dense ? { xs: 0.02, sm: 0.1 } : { xs: 0.02, sm: 0.1 }}
    />
  );
}
