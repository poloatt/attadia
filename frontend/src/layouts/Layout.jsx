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

export function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, sidebarWidth } = useSidebar();
  const { showSidebar, showEntityToolbarNavigation } = useUISettings();
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
  const totalTopPadding = headerHeight + toolbarHeight;

  return (
    <FormManagerProvider>
      <GlobalFormEventListener />
      {/* Header fijo arriba, siempre visible y con zIndex alto */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 1301 }}>
        <Header />
      </Box>
      {/* Toolbar fijo debajo del Header */}
      <Box sx={{ position: 'fixed', top: '40px', left: 0, width: '100vw', zIndex: 1300 }}>
        <Toolbar />
      </Box>
      {/* Layout principal: Sidebar fija a la izquierda, contenido principal a la derecha */}
      <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        maxWidth: '100vw',
        bgcolor: 'background.default',
        pt: `${totalTopPadding}px`, // Padding top para dejar espacio a header+toolbar
      }}>
        {/* Sidebar fija a la izquierda */}
        {showSidebar && (
          <Box
            sx={{
              position: 'fixed',
              top: `${totalTopPadding}px`,
              left: 0,
              height: 'calc(100vh - ' + totalTopPadding + 'px)',
              zIndex: 1100,
              width: isDesktop ? (isOpen ? sidebarWidth : 56) : 0,
              transition: 'width 0.3s',
              bgcolor: 'background.default',
              borderRight: isDesktop ? '1.5px solid #232323' : 'none',
              overflow: 'hidden',
              display: { xs: showSidebar ? 'block' : 'none', md: 'block' },
            }}
          >
            <Sidebar />
          </Box>
        )}
        {/* Contenido principal */}
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            minHeight: '100vh',
            ml: isDesktop ? (isOpen ? sidebarWidth : 56) : 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            border: 'none',
            outline: 'none',
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
            maxWidth: isDesktop ? 1200 : isTablet ? 900 : '100%',
            mx: isDesktop || isTablet ? 'auto' : 0,
            px: { xs: 1, sm: 2, md: 3 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            minHeight: 0,
            border: 'none',
            outline: 'none',
          }}>
            <Outlet />
          </Box>
          {/* Mostrar BottomNavigation solo en mobile/tablet */}
          {(isMobile || isTablet) && <BottomNavigation />}
          <Box sx={{ position: 'fixed', left: 0, bottom: 0, width: '100vw', zIndex: 1300 }}>
            <Footer isDesktop={isDesktop} isSidebarOpen={isOpen && showSidebar && isDesktop} />
          </Box>
          <CustomSnackbarProvider />
        </Box>
      </Box>
    </FormManagerProvider>
  );
}

export default Layout;
