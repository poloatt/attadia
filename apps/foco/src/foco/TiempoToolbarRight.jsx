import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SystemButtons } from '@shared/components/common/SystemButtons';
import { getIconByKey } from '@shared/navigation/menuIcons';
import { getTiempoNavTargets } from '@shared/navigation/tiempoNavConfig';
import useResponsive from '@shared/hooks/useResponsive';
import { matchTiempoSection } from './tiempoToolbarPaths';

/** Toolbar derecha: solo navegación entre Agenda / objetivos / Tareas (desktop). */
export default function TiempoToolbarRight() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isMobile } = useResponsive();
  const section = matchTiempoSection(pathname);

  const commonButtonSx = useMemo(() => ({
    width: { xs: 32, sm: 26 },
    height: { xs: 32, sm: 26 },
    padding: { xs: 0.25, sm: 0.125 },
    minWidth: { xs: 32, sm: 26 },
    minHeight: { xs: 32, sm: 26 },
    '& .MuiSvgIcon-root': {
      fontSize: { xs: '1.1rem', sm: '1.1rem' },
    },
    '&:hover': { backgroundColor: 'action.hover' },
  }), []);

  const navActions = useMemo(() => {
    if (isMobile || !section) return [];

    const targets = getTiempoNavTargets();
    const navButton = (key, targetKey) => {
      const target = targets[targetKey];
      if (!target) return null;
      const isActive = section === targetKey;
      const Icon = getIconByKey(target.iconKey);
      return {
        key,
        icon: <Icon />,
        label: target.label,
        tooltip: isActive ? target.label : `Ir a ${target.label}`,
        color: isActive ? 'primary.main' : 'text.secondary',
        hoverColor: 'primary.main',
        buttonSx: {
          ...commonButtonSx,
          ...(isActive && {
            bgcolor: 'action.selected',
            '&:hover': { bgcolor: 'action.selected' },
          }),
        },
        onClick: () => {
          if (!isActive) navigate(target.path);
        },
      };
    };

    return [
      navButton('navFoco', 'foco'),
      navButton('navObjetivos', 'objetivos'),
      navButton('navTareas', 'tareas'),
    ].filter(Boolean);
  }, [commonButtonSx, isMobile, navigate, section]);

  if (navActions.length === 0) return null;

  return (
    <SystemButtons
      actions={navActions}
      gap={{ xs: 0.02, sm: 0.1 }}
    />
  );
}
