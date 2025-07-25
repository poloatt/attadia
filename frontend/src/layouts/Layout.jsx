import { Box, useTheme, useMediaQuery } from '@mui/material';
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
import { modulos } from '../navigation/menuStructure';

export function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  // Lógica para encontrar el módulo activo
  const moduloActivo = modulos.find(modulo =>
    modulo.subItems?.some(sub => currentPath.startsWith(sub.path)) ||
    currentPath.startsWith(modulo.path)
  );
  // Encontrar el nivel 1 activo dentro del módulo activo
  const nivel1Activo = moduloActivo?.subItems?.find(
    sub => currentPath.startsWith(sub.path)
  );
  // Los hijos de nivel 2 (si existen)
  const nivel2 = nivel1Activo?.subItems || [];
  const { isOpen, sidebarWidth, collapsedWidth } = useSidebar();
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

  // Calcular el padding-top para header + toolbar (ambos fijos y globales)
  const headerHeight = 40;
  const toolbarHeight = 40;
  const showToolbar = showEntityToolbarNavigation;
  const totalTopPadding = headerHeight + (showToolbar ? toolbarHeight : 0);
  // Elimina isDesktop, isMobile, isTablet y toda lógica condicional relacionada
  // Usa solo isOpen y sidebarWidth/collapsedWidth del contexto para calcular el margen y el ancho
  // En móvil, si la sidebar está oculta, el margen debe ser 0
  // En desktop solo depende de isOpen; en móvil/tablet solo hay margen si la sidebar está visible y extendida
  const mainMargin =
    (!isMobile && !isTablet)
      ? (isOpen ? sidebarWidth : collapsedWidth)
      : ((showSidebarCollapsed && isOpen) ? sidebarWidth : 0);
  const footerHeight = 48; // Ajusta según el alto real de tu Footer

  // Padding superior para el main: header + toolbar si está visible
  const mainTopPadding = showToolbar ? headerHeight + toolbarHeight : headerHeight;

  // Determinar si se debe renderizar la sidebar
  const shouldRenderSidebar =
    (!isMobile && !isTablet) ||
    ((isMobile || isTablet) && showSidebarCollapsed && isOpen);

  return (
    <FormManagerProvider>
      <GlobalFormEventListener />
      <Box sx={{ minHeight: '100vh', maxWidth: '100vw', bgcolor: 'background.default', position: 'relative' }}>
        {/* Header */}
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 1400 }}>
          <Header />
        </Box>
        {/* Toolbar */}
        {showToolbar && (
          <Box sx={{ position: 'fixed', top: `${headerHeight}px`, left: 0, width: '100vw', zIndex: 1399 }}>
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
                ? `calc(100vh - ${totalTopPadding}px - 89px)`
                : `calc(100vh - ${totalTopPadding}px - ${footerHeight}px)`,
              zIndex: 1100,
              width: isOpen ? sidebarWidth : collapsedWidth,
              transition: 'width 0.3s',
              bgcolor: 'background.default',
              borderRight: '1.5px solid #232323',
              overflow: 'hidden',
              display: 'block',
            }}
          >
            <Sidebar moduloActivo={moduloActivo} />
          </Box>
        )}
        {/* Main content */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: mainMargin,
            right: 0,
            bottom: 0,
            pt: `${mainTopPadding}px`, // <-- AJUSTADO PARA INCLUIR TOOLBAR SI ESTÁ VISIBLE
            pb: `${footerHeight}px`,
            bgcolor: 'background.default',
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 1,
            scrollbarGutter: 'stable',
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
        {/* Footer */}
        <Box sx={{ position: 'fixed', left: 0, bottom: 0, width: '100vw', zIndex: 1300, height: `${footerHeight}px` }}>
          <Footer isDesktop={isDesktop} isSidebarOpen={isOpen && isDesktop} />
        </Box>
      </Box>
    </FormManagerProvider>
  );
}

export default Layout;
