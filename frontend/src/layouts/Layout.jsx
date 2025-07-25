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
  const { showEntityToolbarNavigation } = useUISettings();
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
  const collapsedWidth = 56;
  const mainMargin = isDesktop && isOpen ? sidebarWidth : (isDesktop ? collapsedWidth : 0);
  const footerHeight = 48; // Ajusta según el alto real de tu Footer

  return (
    <FormManagerProvider>
      <GlobalFormEventListener />
      <Box sx={{ minHeight: '100vh', maxWidth: '100vw', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 1400 }}>
          <Header />
        </Box>
        {/* Toolbar */}
        {showToolbar && (
          <Box sx={{ position: 'fixed', top: `${headerHeight}px`, left: 0, width: '100vw', zIndex: 1399 }}>
            <Toolbar />
          </Box>
        )}
        {/* Sidebar */}
        {isOpen !== undefined && (
          <Box
            sx={{
              position: 'fixed',
              top: `${totalTopPadding}px`,
              left: 0,
              height: `calc(100vh - ${totalTopPadding}px - ${footerHeight}px)` ,
              zIndex: 1100,
              width: isDesktop && isOpen ? sidebarWidth : (isDesktop ? collapsedWidth : 0),
              transition: 'width 0.3s',
              bgcolor: 'background.default',
              borderRight: isDesktop ? '1.5px solid #232323' : 'none',
              overflow: 'hidden',
              display: isOpen || isDesktop ? 'block' : 'none',
            }}
          >
            <Sidebar />
          </Box>
        )}
        {/* Main content */}
        <Box
          sx={{
            flexGrow: 1,
            width: '100%', // Solo width 100%, sin calc
            minHeight: '100vh',
            ml: mainMargin, // Solo margin-left para sidebar
            pt: `${totalTopPadding}px`,
            pb: `${footerHeight}px`,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 1,
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
