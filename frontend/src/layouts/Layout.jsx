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
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, isDesktop } = useSidebar();
  const { showSidebar, showEntityToolbarNavigation } = useUISettings();
  const { user } = useAuth();

  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (!event.detail?.path) return;
      if (event.detail.path !== location.pathname) {
        // Navegar a la ruta destino y pasar openAdd
        navigate(event.detail.path, { state: { openAdd: true } });
      } else {
        // Si ya estamos en la ruta, dispara un evento local para la página
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
  const toolbarHeight = 40; // 40px tanto en mobile como en desktop para evitar superposición
  const totalTopPadding = headerHeight + toolbarHeight;

  return (
    <FormManagerProvider>
      <GlobalFormEventListener />
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden',
        border: 'none',
        outline: 'none'
      }}>
        <Header />
        <Toolbar />
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: `${totalTopPadding}px`,
            pb: isMobile ? '88px' : '70px',
            minHeight: '100vh',
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
            position: 'relative',
            ml: 0,
            border: 'none',
            outline: 'none',
            // Estilos para el scrollbar
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
            maxWidth: { xs: '100%', sm: '100%', md: 1200, lg: 1440 }, // Limita el ancho en desktop
            mx: 'auto',
            px: { xs: 1, sm: 2, md: 3, lg: 4 }, // Padding horizontal adaptable
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            minHeight: 0,
            border: 'none',
            outline: 'none'
          }}>
            <Outlet />
          </Box>
          {/* Mostrar BottomNavigation en mobile, Footer siempre */}
          {isMobile && <BottomNavigation />}
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
