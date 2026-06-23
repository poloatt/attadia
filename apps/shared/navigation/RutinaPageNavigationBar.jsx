import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useRutinas } from '../context/RutinasContext';
import { getRutinaNavigation } from './toolbarRegistry';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';
import useResponsive from '../hooks/useResponsive';
import {
  AGENDA_UNIFIED_BAR_CONFIG,
  RUTINA_NAVIGATION_BAR_CONFIG,
  isRutinasPath,
} from '../config/uiConstants';
import {
  rutinaPageContentShellSx,
} from '../styles/rutinaPageStyles';

export function RutinaNavigationContent({
  currentPath,
  pageBar = false,
}) {
  const RutinaNavigation = getRutinaNavigation();
  if (!RutinaNavigation || !isRutinasPath(currentPath)) {
    return null;
  }

  let rutina = null;
  let rutinas = [];
  let loading = false;

  try {
    const rutinasData = useRutinas();
    rutina = rutinasData.rutina;
    rutinas = rutinasData.rutinas;
    loading = rutinasData.loading;
  } catch {
    return null;
  }

  const currentPage = rutina ? rutinas.findIndex((r) => r._id === rutina._id) + 1 : 1;
  const totalPages = rutinas.length;

  const handleAdd = () => {
    window.dispatchEvent(new CustomEvent('addRutina'));
  };

  const handleSettings = () => {
    window.dispatchEvent(new CustomEvent('openHabitTemplates'));
  };

  return (
    <RutinaNavigation
      rutina={rutina}
      loading={loading}
      currentPage={currentPage}
      totalPages={totalPages}
      onAdd={handleAdd}
      onSettingsClick={handleSettings}
      navigationMode="rutina"
      pageBar={pageBar}
    />
  );
}

/**
 * Barra fija bajo AgendaUnifiedBar: navegación diaria entre registros de rutinas.
 */
export default function RutinaPageNavigationBar() {
  const { pathname } = useLocation();
  const { showSidebarCollapsed } = useUISettings();
  const { getMainMargin } = useSidebar();
  const { isMobileOrTablet } = useResponsive();

  if (!isRutinasPath(pathname)) return null;

  const mainMargin = getMainMargin(isMobileOrTablet, showSidebarCollapsed);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: AGENDA_UNIFIED_BAR_CONFIG.height,
        left: mainMargin,
        right: 0,
        height: RUTINA_NAVIGATION_BAR_CONFIG.height,
        zIndex: RUTINA_NAVIGATION_BAR_CONFIG.zIndex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'left 0.3s',
      }}
    >
      <Box
        sx={{
          ...rutinaPageContentShellSx,
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <RutinaNavigationContent currentPath={pathname} pageBar />
      </Box>
    </Box>
  );
}
