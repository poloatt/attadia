import React, { useEffect, useState } from 'react';
import { Box } from '../utils/materialImports';
import { useLocation } from 'react-router-dom';
import { AGENDA_UNIFIED_BAR_CONFIG } from '../config/uiConstants';
import { SystemButtons, MenuButton } from '../components/common/SystemButtons';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';
import useResponsive from '../hooks/useResponsive';
import { useRutinas } from '../context/RutinasContext';
import {
  resolveToolbarLeftByPath,
  resolveToolbarCenterByPath,
  resolveToolbarCenterDesktop,
  resolveToolbarRightByPath,
} from './toolbarModules';
import { getAgendaBarSlot, getRutinaNavigation } from './toolbarRegistry';
import { resolveAttaBranchHubPath } from './appNavResolver';
import { isAttaToolbarPath, isPulsoToolbarPath } from './unifiedBarPaths';

function RutinaNavigationSlot({ currentPath }) {
  const RutinaNavigation = getRutinaNavigation();
  if (
    !RutinaNavigation
    || !(currentPath.startsWith('/rutinas')
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
 * Barra superior unificada (Foco / Atta / Pulso):
 * izquierda: menú; centro: acciones; derecha: subpáginas + apps.
 */
export default function AgendaUnifiedBar({ currentPath = '' }) {
  const { showEntityToolbarNavigation, showSidebarCollapsed } = useUISettings();
  const { collapsedWidth, getMainMargin } = useSidebar();
  const { isMobile, isMobileOrTablet } = useResponsive();
  const location = useLocation();
  const path = currentPath || location.pathname;
  const [hasSelectedItems, setHasSelectedItems] = useState(false);

  const LeftComp = resolveToolbarLeftByPath(path);
  const RightComp = resolveToolbarRightByPath(path);
  const CenterComp = resolveToolbarCenterByPath(path);
  const showCenterOnDesktop = resolveToolbarCenterDesktop(path);
  const mainMargin = getMainMargin(isMobileOrTablet, showSidebarCollapsed);
  const FocoCenterActions = getAgendaBarSlot('focoCenterActions');
  const FocoViewModeToggle = getAgendaBarSlot('focoViewModeToggle');

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
  const isAttaPath = isAttaToolbarPath(path);
  const isPulsoPath = isPulsoToolbarPath(path);
  const mobileFocoBar = isFocoPath && isMobile;
  const showRutinaNavInBar = showCenter
    && shouldShowRutinaNavigation(path)
    && !mobileFocoBar;
  const useCenterActionsOverlay = isFocoPath || isAttaPath || isPulsoPath;
  // Foco: acciones en overlay + navegación de fecha/semana en el grid (no ocultar RutinaNavigation).
  const hideGridCenter = useCenterActionsOverlay && !showRutinaNavInBar;

  const gridColumns = mobileFocoBar
    ? '1fr'
    : (showCenter || RightComp ? '1fr auto' : '1fr');

  const baseCenterInsetLeft = isMobile && mainMargin < collapsedWidth
    ? collapsedWidth
    : mainMargin;
  const showAttaBranchBack = isAttaPath && !!resolveAttaBranchHubPath(path);
  const ATTA_BACK_SLOT_WIDTH = 34;
  const centerActionsInsetLeft = showAttaBranchBack
    ? baseCenterInsetLeft + ATTA_BACK_SLOT_WIDTH
    : baseCenterInsetLeft;
  const showAttaBranchSwitcher = isAttaPath && !isMobile && RightComp;

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
      {useCenterActionsOverlay && (
        <Box
          sx={{
            position: 'absolute',
            left: `${centerActionsInsetLeft}px`,
            right: showAttaBranchSwitcher ? `${collapsedWidth + 96}px` : `${collapsedWidth}px`,
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
          {isFocoPath && FocoCenterActions && <FocoCenterActions section="foco" dense />}
          {isAttaPath && CenterComp && <CenterComp hasSelectedItems={hasSelectedItems} />}
          {isPulsoPath && CenterComp && <CenterComp hasSelectedItems={hasSelectedItems} />}
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: -1, sm: -2, md: -3 },
          top: 0,
          height: AGENDA_UNIFIED_BAR_CONFIG.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 0.25,
          pl: 0,
          zIndex: 4,
        }}
      >
        <Box
          sx={{
            width: collapsedWidth,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MenuButton />
        </Box>
        {LeftComp && <LeftComp hasSelectedItems={hasSelectedItems} />}
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

      {showAttaBranchSwitcher && (
        <Box
          sx={{
            position: 'absolute',
            right: `${collapsedWidth}px`,
            top: 0,
            height: AGENDA_UNIFIED_BAR_CONFIG.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            zIndex: 4,
            px: 0.5,
          }}
        >
          <RightComp hasSelectedItems={hasSelectedItems} />
        </Box>
      )}

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
        {showCenter && !mobileFocoBar && !hideGridCenter && (
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
            ) : CenterComp ? (
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
            {isFocoPath && !isMobile && FocoViewModeToggle && <FocoViewModeToggle />}
            {RightComp && !showAttaBranchSwitcher && (
              <RightComp hasSelectedItems={hasSelectedItems} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
