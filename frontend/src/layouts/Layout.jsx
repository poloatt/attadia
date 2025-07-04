import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNavigation from '../components/BottomNavigation';
import Sidebar from '../components/Sidebar';

export function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { isOpen, isDesktop } = useSidebar();
  const { showSidebar, showEntityToolbarNavigation } = useUISettings();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <Header />
      {showSidebar && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: showEntityToolbarNavigation ? '45px' : '45px', // Mantener espacio suficiente debajo del header
          pb: showEntityToolbarNavigation ? '80px' : '90px', // Espacio adicional cuando toolbar está deshabilitada
          pl: 0, // Eliminado padding-left - la sidebar ya ocupa su espacio
          pr: 0, // Eliminado padding derecho explícitamente
          minHeight: '100vh',
          width: showSidebar ? 
            (isMobile ? `calc(100vw - 56px)` : '100%') : // En móvil, restar ancho de sidebar colapsada
            '100vw', // Sin sidebar ocupa todo el ancho
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'auto',
          position: 'relative', // Añadido para posicionar correctamente elementos hijos
          // Sin margin left porque la sidebar ya ocupa su espacio
          ml: 0
        }}
      >
        <Box sx={{ 
          width: '100%',
          maxWidth: '100%',
          mx: 0, // Eliminado el centrado automático
          px: isMobile ? 1 : 0, // Padding horizontal en móvil para evitar que el contenido toque los bordes
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: showEntityToolbarNavigation ? 0.5 : 0 // Reducir gap cuando toolbar está deshabilitada
        }}>
          <Outlet />
        </Box>
        <BottomNavigation />
        <Footer />
      </Box>
    </Box>
  );
}

export default Layout;
