import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarTodayOutlined,
  DeleteOutlined,
  Google as GoogleIcon,
  TuneOutlined,
} from '@mui/icons-material';
import { SystemButtons } from '@shared/components/common/SystemButtons';
import { ToolbarAddButton } from '@shared/components/common/ToolbarAddButton';
import { getIconByKey } from '@shared/navigation/menuIcons';
import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';
import { TIEMPO_ICON_KEYS } from '@shared/navigation/tiempoIconKeys';
import focoConfig from '../../config/app';

const TareasMenuIcon = getIconByKey(TIEMPO_ICON_KEYS.tareas);

/**
 * Acciones de contexto del módulo Tiempo (no navegación).
 * Usar en overlay móvil del Hub/Agenda o en el centro de Objetivos/Tareas en desktop.
 */
export default function TiempoToolbarActions({ section: sectionProp, dense = false }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const section = sectionProp || matchTiempoSection(pathname);
  const [hasSelectedItems, setHasSelectedItems] = useState(false);

  const isQuickCreateSection = section === 'hub' || section === 'agenda' || section === 'foco';

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
    color: 'text.secondary',
    '& .MuiSvgIcon-root': {
      fontSize: { xs: '1.1rem', sm: '1.1rem' },
    },
    '&:hover': {
      backgroundColor: 'action.hover',
      color: 'text.primary',
    },
  }), [dense]);

  const actions = useMemo(() => {
    const list = [
      {
        key: 'personalizarRutina',
        icon: <TuneOutlined />,
        label: 'Personalizar rutina',
        tooltip: 'Personalizar mi rutina',
        buttonSx: commonButtonSx,
        onClick: () => window.dispatchEvent(new CustomEvent('openHabitTemplates')),
      },
      {
        key: 'googleTasks',
        icon: <GoogleIcon />,
        label: 'Google Tasks',
        tooltip: 'Google Tasks',
        buttonSx: commonButtonSx,
        onClick: () => window.dispatchEvent(new CustomEvent('openGoogleTasksConfig')),
      },
      ...(section === 'hub' || section === 'tareas' ? [{
        key: 'navAgenda',
        icon: <CalendarTodayOutlined />,
        label: 'Ir a Agenda',
        tooltip: 'Ir a Agenda',
        buttonSx: commonButtonSx,
        onClick: () => navigate(focoConfig.routes.agenda),
      }] : []),
      ...(section === 'agenda' ? [{
        key: 'navTareas',
        icon: <TareasMenuIcon />,
        label: 'Ir a Tareas',
        tooltip: 'Ir a Tareas',
        buttonSx: commonButtonSx,
        onClick: () => navigate(focoConfig.routes.tareas),
      }] : []),
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

    const addTooltip = section === 'objetivos'
      ? 'Nuevo objetivo'
      : isQuickCreateSection
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
                detail: isQuickCreateSection ? { anchorEl: e?.currentTarget } : {},
              }));
            }
          }}
        />
      ),
      label: addTooltip,
    });

    return list;
  }, [commonButtonSx, hasSelectedItems, isQuickCreateSection, navigate, section]);

  if (!section) return null;

  return (
    <SystemButtons
      actions={actions}
      gap={dense ? { xs: 0.02, sm: 0.1 } : { xs: 0.02, sm: 0.1 }}
    />
  );
}
