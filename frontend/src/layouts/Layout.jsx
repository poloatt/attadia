import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SettingsOutlined as SettingsIcon } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';

const menuItems = [
  { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
  { text: 'Perfil', icon: <PersonIcon />, path: '/perfil' }
];

export function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
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
      <Drawer
        variant="permanent"
        anchor="right"
        open={isOpen}
        onClose={() => toggleSidebar()}
        sx={{
          '& .MuiDrawer-paper': {
            width: isOpen ? 240 : 0,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            backgroundColor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider',
            position: 'fixed',
            height: '100vh',
            top: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.drawer,
            visibility: isOpen ? 'visible' : 'hidden'
          },
        }}
      >
        <Box sx={{ height: '40px' }} /> {/* Ajustado a 40px para coincidir con el header */}
        <List sx={{ p: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 40,
                  justifyContent: isOpen ? 'initial' : 'center',
                  px: isOpen ? 2.5 : 1.5,
                  borderRadius: 1,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': {
                      fontSize: 20,
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '48px',
          pb: '24px',
          pr: {
            xs: 0,
            sm: isOpen ? '240px' : 0
          },
          transition: 'padding-right 0.3s ease',
          minHeight: '100vh',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'auto'
        }}
      >
        <Box sx={{ 
          width: '100%',
          maxWidth: {
            xs: '100%',
            sm: '100%',
            md: '1200px'
          },
          mx: 'auto',
          px: {
            xs: 2,
            sm: 3,
            md: 4
          },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

export default Layout;
