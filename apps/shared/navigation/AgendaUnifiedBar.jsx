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
import { resolveAttaBranchHubPath, resolveFocoBranchHubPath } from './appNavResolver';
import { isAttaToolbarPath, isPulsoToolbarPath } from './unifiedBarPaths';
import { matchTiempoSection, isAgendaCalendarPath, isFocoHubPath } from './tiempoToolbarPaths';

const AGENDA_VIEW_TOGGLE_RESERVE = 96;

function RutinaNavigationSlot({ currentPath }) {
  const RutinaNavigation = getRutinaNavigation();
  if (
    !RutinaNavigation
    || !(currentPath.startsWith('/rutinas')
      || currentPath.startsWith('/tiempo/rutinas')
      || isAgendaCalendarPath(currentPath))
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
    window.dispatchEvent(new CustomEvent('openHabitTemplates'));
  };

  return (
    <RutinaNavigation
      rutina={rutina}
      loading={loading}
      currentPage={currentPage}
      totalPages={totalPages}
      onAdd={handleAdd}
      onSettingsClick={isAgendaCalendarPath(currentPath) ? undefined : handleSettings}
      navigationMode={isAgendaCalendarPath(currentPath) ? 'week' : 'rutina'}
      compactBar={isAgendaCalendarPath(currentPath)}
    />
  );
}

function shouldShowRutinaNavigation(currentPath) {
  return (
    currentPath.startsWith('/tiempo/rutinas')
    || currentPath.startsWith('/rutinas')
    || isAgendaCalendarPath(currentPath)
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
  const AgendaViewToggle = getAgendaBarSlot('agendaViewToggle');

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
  const tiempoSection = matchTiempoSection(path);
  const isAgendaPath = isAgendaCalendarPath(path);
  const isHubPath = isFocoHubPath(path);
  const isAttaPath = isAttaToolbarPath(path);
  const isPulsoPath = isPulsoToolbarPath(path);
  const mobileAgendaBar = isAgendaPath && isMobile;
  const showRutinaNavInBar = showCenter
    && shouldShowRutinaNavigation(path)
    && !mobileAgendaBar;
  const useCenterActionsOverlay = isHubPath || isAgendaPath || isAttaPath || isPulsoPath;
  // Foco: acciones en overlay + navegación de fecha/semana en el grid (no ocultar RutinaNavigation).
  const hideGridCenter = useCenterActionsOverlay && !showRutinaNavInBar;

  const gridColumns = mobileAgendaBar
    ? '1fr'
    : (showCenter || RightComp ? '1fr auto' : '1fr');

  const showAttaBranchBack = isAttaPath && !!resolveAttaBranchHubPath(path);
  const showFocoBranchBack = !!resolveFocoBranchHubPath(path);
  const TOOLBAR_BACK_SLOT_WIDTH = 34;
  const showBranchBack = showAttaBranchBack || showFocoBranchBack;
  const MOBILE_LEFT_INSET = 8;
  const baseCenterInsetLeft = isMobileOrTablet
    ? MOBILE_LEFT_INSET
    : (mainMargin < collapsedWidth ? collapsedWidth : mainMargin);
  const centerActionsInsetLeft = showBranchBack
    ? baseCenterInsetLeft + TOOLBAR_BACK_SLOT_WIDTH
    : baseCenterInsetLeft;
  const showAttaBranchSwitcher = isAttaPath && !isMobile && RightComp;
  const showAhoraLuegoToggle = isMobile && (tiempoSection === 'tareas' || tiempoSection === 'hub') && AgendaViewToggle;
  const showSemanaDiaToggle = isAgendaPath && FocoViewModeToggle;
  const agendaViewToggleReserve = (showAhoraLuegoToggle || showSemanaDiaToggle)
    ? AGENDA_VIEW_TOGGLE_RESERVE
    : 0;
  const gridMarginRight = collapsedWidth + agendaViewToggleReserve;
  const centerOverlayRight = showAttaBranchSwitcher
    ? collapsedWidth + 96 + agendaViewToggleReserve
    : gridMarginRight;

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
            right: `${centerOverlayRight}px`,
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
          {isHubPath && FocoCenterActions && <FocoCenterActions section="hub" dense />}
          {isAgendaPath && FocoCenterActions && <FocoCenterActions section="agenda" dense />}
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
        {!isMobileOrTablet && (
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
        )}
        {LeftComp && <LeftComp hasSelectedItems={hasSelectedItems} />}
      </Box>

      {(showAhoraLuegoToggle || showSemanaDiaToggle) && (
        <Box
          sx={{
            position: 'absolute',
            right: `${collapsedWidth}px`,
            top: 0,
            height: AGENDA_UNIFIED_BAR_CONFIG.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 1,
            zIndex: 4,
          }}
        >
          {showAhoraLuegoToggle && <AgendaViewToggle />}
          {showSemanaDiaToggle && <FocoViewModeToggle />}
        </Box>
      )}

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
          ml: `${baseCenterInsetLeft}px`,
          mr: `${gridMarginRight}px`,
          display: 'grid',
          gridTemplateColumns: gridColumns,
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          px: { xs: 0.5, sm: 1, md: 1.5 },
          position: 'relative',
        }}
      >
        {showCenter && !mobileAgendaBar && !hideGridCenter && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isAgendaPath && !isMobile ? 'flex-start' : 'center',
              minWidth: 0,
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 2,
              gridColumn: isAgendaPath && !isMobile ? '1 / 2' : undefined,
            }}
          >
            {showRutinaNavInBar ? (
              <RutinaNavigationSlot currentPath={path} />
            ) : CenterComp ? (
              <CenterComp hasSelectedItems={hasSelectedItems} />
            ) : null}
          </Box>
        )}

        {showRightNav && (RightComp || (isAgendaPath && !isMobile)) && (
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
            {RightComp && !showAttaBranchSwitcher && (
              <RightComp hasSelectedItems={hasSelectedItems} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
