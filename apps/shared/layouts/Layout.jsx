import React from 'react';
import { Box } from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { Header, Toolbar } from '../navigation';
import { Footer } from '../navigation';
import { Sidebar, BottomNavigation } from '../navigation';
import { CustomSnackbarProvider } from '../components/common';
import { useEffect } from 'react';
import { FormManagerProvider } from '../context/FormContext';
import { GlobalFormEventListener } from '../context/GlobalFormEventListener';
import useResponsive from '../hooks/useResponsive';
import { useNavigationState } from '../utils/navigationUtils';
import { calculateTopPadding, HEADER_CONFIG, FOOTER_CONFIG, SPACING } from '../config/uiConstants.js';
import { RutinasProvider } from '../context/RutinasContext';

export function Layout() {
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Usar utilidad centralizada para navegación
  const { moduloActivo, nivel1Activo, nivel2 } = useNavigationState(currentPath);
  
  const { isOpen, isDesktop, sidebarWidth, collapsedWidth } = useSidebar();
  const { showEntityToolbarNavigation, showSidebarCollapsed } = useUISettings();
  const { user } = useAuth();

  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (!event.detail?.path) return;
      if (event.detail.path !== location.pathname) {
        navigate(event.detail.path, { state: { openAdd: true } });
      } else {
        window.dispatchEvent(new CustomEvent('openAddFormLocal'));
      }
    };
    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, [navigate, location.pathname]);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Usar constantes centralizadas para dimensiones
  // Mostrar siempre la Toolbar en desktop; respetar preferencia solo en móvil/tablet
  const showToolbar = isMobileOrTablet ? showEntityToolbarNavigation : true;
  const totalTopPadding = calculateTopPadding(showToolbar);
  
  // Padding superior para el main
  const mainTopPadding = totalTopPadding;

  // Determinar si se debe renderizar la sidebar
  const shouldRenderSidebar = !isMobileOrTablet || (isMobileOrTablet && showSidebarCollapsed && isOpen);

  // Calcular el margen para el contenido principal en desktop
  const getMainContentMargin = () => {
    if (isMobileOrTablet) {
      return 0; // En móvil/tablet, el contenido ocupa todo el ancho
    }
    // En desktop, siempre dejar espacio para la sidebar (colapsada o expandida)
    return isOpen ? sidebarWidth : collapsedWidth;
  };

  const mainContentMargin = getMainContentMargin();

  return (
    <FormManagerProvider>
      <GlobalFormEventListener />
      <Box sx={{ minHeight: '100vh', maxWidth: '100vw', bgcolor: 'background.default', position: 'relative' }}>
        {/* Header */}
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 1400 }}>
          <Header />
        </Box>
        {/* Toolbar + Sidebar + Main: envueltos por RutinasProvider cuando corresponde */}
        {currentPath.startsWith('/tiempo/rutinas') ? (
          <RutinasProvider>
            {/* Toolbar siempre se renderiza */}
            {showToolbar && (
              <Box sx={{ position: 'fixed', top: `${HEADER_CONFIG.height}px`, left: 0, width: '100vw', zIndex: 1399 }}>
                <Toolbar 
                  moduloActivo={moduloActivo}
                  nivel1={nivel2}
                  currentPath={currentPath}
                />
              </Box>
            )}
            {/* Sidebar */}
            {isOpen !== undefined && shouldRenderSidebar && (
              <Box
                sx={{
                  position: 'fixed',
                  top: `${totalTopPadding}px`,
                  left: 0,
                  height: isMobile
                    ? `calc(100vh - ${totalTopPadding}px - ${SPACING.bottomNavigationHeight}px)`
                    : `calc(100vh - ${totalTopPadding}px - ${FOOTER_CONFIG.height}px)`,
                  zIndex: 1100,
                  width: isOpen ? sidebarWidth : collapsedWidth,
                  transition: 'width 0.3s',
                  bgcolor: 'background.default',
                  borderRight: '1.5px solid #232323',
                  overflow: 'hidden',
                  display: 'block',
                }}
              >
                <Sidebar moduloActivo={moduloActivo} nivel1Activo={nivel1Activo} />
              </Box>
            )}
            {/* Main content */}
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: mainContentMargin,
                right: 0,
                bottom: 0,
                pt: `${mainTopPadding}px`,
                pb: `${FOOTER_CONFIG.height}px`,
                bgcolor: 'background.default',
                overflowY: 'auto',
                overflowX: 'hidden',
                zIndex: 1,
                scrollbarGutter: 'stable',
                transition: 'left 0.3s',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                minHeight: 0,
                border: 'none',
                outline: 'none',
              }}>
                <Outlet />
              </Box>
              {(isMobile || isTablet) && <BottomNavigation />}
              <CustomSnackbarProvider />
            </Box>
          </RutinasProvider>
        ) : (
          <>
            {/* Toolbar siempre se renderiza */}
            {showToolbar && (
              <Box sx={{ position: 'fixed', top: `${HEADER_CONFIG.height}px`, left: 0, width: '100vw', zIndex: 1399 }}>
                <Toolbar 
                  moduloActivo={moduloActivo}
                  nivel1={nivel2}
                  currentPath={currentPath}
                />
              </Box>
            )}
            {/* Sidebar */}
            {isOpen !== undefined && shouldRenderSidebar && (
              <Box
                sx={{
                  position: 'fixed',
                  top: `${totalTopPadding}px`,
                  left: 0,
                  height: isMobile
                    ? `calc(100vh - ${totalTopPadding}px - ${SPACING.bottomNavigationHeight}px)`
                    : `calc(100vh - ${totalTopPadding}px - ${FOOTER_CONFIG.height}px)`,
                  zIndex: 1100,
                  width: isOpen ? sidebarWidth : collapsedWidth,
                  transition: 'width 0.3s',
                  bgcolor: 'background.default',
                  borderRight: '1.5px solid #232323',
                  overflow: 'hidden',
                  display: 'block',
                }}
              >
                <Sidebar moduloActivo={moduloActivo} nivel1Activo={nivel1Activo} />
              </Box>
            )}
            {/* Main content */}
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: mainContentMargin,
                right: 0,
                bottom: 0,
                pt: `${mainTopPadding}px`,
                pb: `${FOOTER_CONFIG.height}px`,
                bgcolor: 'background.default',
                overflowY: 'auto',
                overflowX: 'hidden',
                zIndex: 1,
                scrollbarGutter: 'stable',
                transition: 'left 0.3s',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                minHeight: 0,
                border: 'none',
                outline: 'none',
              }}>
                <Outlet />
              </Box>
              {(isMobile || isTablet) && <BottomNavigation />}
              <CustomSnackbarProvider />
            </Box>
          </>
        )}
        {/* Footer */}
        <Box sx={{ position: 'fixed', left: 0, bottom: 0, width: '100vw', zIndex: 1300, height: `${FOOTER_CONFIG.height}px` }}>
          <Footer isDesktop={isDesktop} isSidebarOpen={isOpen && isDesktop} />
        </Box>
      </Box>
    </FormManagerProvider>
  );
}

export default Layout;
