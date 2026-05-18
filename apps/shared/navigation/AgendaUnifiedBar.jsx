import React, { useEffect, useState } from 'react';
import { Box } from '../utils/materialImports';
import { useLocation } from 'react-router-dom';
import { AGENDA_UNIFIED_BAR_CONFIG } from '../config/uiConstants';
import { SystemButtons, MenuButton } from '../components/common/SystemButtons';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';
import useResponsive from '../hooks/useResponsive';
import { useRutinas } from '../context/RutinasContext';
import RutinaNavigation from './RutinaNavigation.jsx';
import {
  resolveToolbarCenterByPath,
  resolveToolbarCenterDesktop,
  resolveToolbarRightByPath,
} from './toolbarModules';
import FocoViewModeToggle from '../../foco/src/foco/FocoViewModeToggle.jsx';
import TiempoToolbarActions from '../../foco/src/foco/TiempoToolbarActions.jsx';

function RutinaNavigationSlot({ currentPath }) {
  if (
    !(currentPath.startsWith('/rutinas')
      || currentPath.startsWith('/tiempo/rutinas')
      || currentPath.startsWith('/foco'))
  ) {
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
    window.dispatchEvent(new CustomEvent('openHabitsManager'));
  };

  return (
    <RutinaNavigation
      rutina={rutina}
      loading={loading}
      currentPage={currentPage}
      totalPages={totalPages}
      onAdd={handleAdd}
      onSettingsClick={currentPath.startsWith('/foco') ? undefined : handleSettings}
      navigationMode={currentPath.startsWith('/foco') ? 'week' : 'rutina'}
      compactBar={currentPath.startsWith('/foco')}
    />
  );
}

function shouldShowRutinaNavigation(currentPath) {
  return (
    currentPath.startsWith('/tiempo/rutinas')
    || currentPath.startsWith('/rutinas')
    || currentPath.startsWith('/foco')
  );
}

/**
 * Barra superior unificada del módulo Agenda (estilo Google Calendar):
 * izquierda: menú; centro: navegación de fecha y acciones; derecha: secciones + apps.
 */
export default function AgendaUnifiedBar({ currentPath = '' }) {
  const { showEntityToolbarNavigation, showSidebarCollapsed } = useUISettings();
  const { collapsedWidth, getMainMargin } = useSidebar();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const location = useLocation();
  const path = currentPath || location.pathname;
  const [hasSelectedItems, setHasSelectedItems] = useState(false);

  const RightComp = resolveToolbarRightByPath(path);
  const CenterComp = resolveToolbarCenterByPath(path);
  const showCenterOnDesktop = resolveToolbarCenterDesktop(path);
  const mainMargin = getMainMargin(isMobileOrTablet, showSidebarCollapsed);

  const showCenter =
  shouldShowRutinaNavigation(path)
    || (CenterComp && (isMobileOrTablet || showCenterOnDesktop));

  useEffect(() => {
    const handleSelectionChange = (event) => {
      setHasSelectedItems(!!event.detail?.hasSelections);
    };
    window.addEventListener('selectionChanged', handleSelectionChange);
    return () => window.removeEventListener('selectionChanged', handleSelectionChange);
  }, []);

  const showRightNav = !isMobile || showEntityToolbarNavigation;
  const isFocoPath = path.startsWith('/foco');
  const mobileFocoBar = isFocoPath && isMobile;
  const showRutinaNavInBar = showCenter
    && shouldShowRutinaNavigation(path)
    && !mobileFocoBar;

  const gridColumns = mobileFocoBar
    ? '1fr'
    : (showCenter ? '1fr auto' : '1fr');

  const focoActionsInsetLeft = isMobile && mainMargin < collapsedWidth
    ? collapsedWidth
    : mainMargin;

  return (
    <Box
      sx={{
        width: '100%',
        height: AGENDA_UNIFIED_BAR_CONFIG.height,
        bgcolor: '#181818',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {isFocoPath && (
        <Box
          sx={{
            position: 'absolute',
            left: `${focoActionsInsetLeft}px`,
            right: `${collapsedWidth}px`,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 3,
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          <TiempoToolbarActions section="foco" dense />
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: -1, sm: -2, md: -3 },
          top: 0,
          width: collapsedWidth,
          height: AGENDA_UNIFIED_BAR_CONFIG.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <MenuButton />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          right: { xs: -1, sm: -2, md: -3 },
          top: 0,
          width: collapsedWidth,
          height: AGENDA_UNIFIED_BAR_CONFIG.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <SystemButtons.AppsButton />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          ml: `${mainMargin}px`,
          mr: `${collapsedWidth}px`,
          display: 'grid',
          gridTemplateColumns: gridColumns,
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          px: { xs: 0.5, sm: 1, md: 1.5 },
          position: 'relative',
        }}
      >
        {showCenter && !mobileFocoBar && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isFocoPath && !isMobile ? 'flex-start' : 'center',
              minWidth: 0,
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 2,
              gridColumn: isFocoPath && !isMobile ? '1 / 2' : undefined,
            }}
          >
            {showRutinaNavInBar ? (
              <RutinaNavigationSlot currentPath={path} />
            ) : !shouldShowRutinaNavigation(path) && CenterComp ? (
              <CenterComp hasSelectedItems={hasSelectedItems} />
            ) : null}
          </Box>
        )}

        {showRightNav && (RightComp || (isFocoPath && !isMobile)) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexShrink: 0,
              gap: 0.25,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {isFocoPath && !isMobile && <FocoViewModeToggle />}
            {RightComp && <RightComp hasSelectedItems={hasSelectedItems} />}
          </Box>
        )}
      </Box>
    </Box>
  );
}
