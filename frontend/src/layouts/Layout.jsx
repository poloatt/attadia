import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/header';
import Footer from '../components/Footer';
import { Sidebar, BottomNavigation } from '../navigation';
import { CustomSnackbarProvider } from '../components/common/snackbarUtils.jsx';

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
      overflow: 'hidden',
      border: 'none',
      outline: 'none'
    }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: showEntityToolbarNavigation ? '45px' : '45px',
          pb: isMobile ? '88px' : '70px',
          minHeight: '100vh',
          height: '100vh',
          width: isOpen && showSidebar ? 
            (isMobile ? `calc(100vw - 56px)` : '100%') :
            '100vw',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflowY: 'auto',
          position: 'relative',
          ml: 0,
          border: 'none',
          outline: 'none'
        }}
      >
        <Box sx={{ 
          width: '100%',
          maxWidth: '100%',
          mx: 0,
          px: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: showEntityToolbarNavigation ? 0.5 : 0,
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
  );
}

export default Layout;
