import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SettingsOutlined as SettingsIcon } from '@mui/icons-material';

const menuItems = [
  { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' }
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Drawer
        variant="permanent"
        anchor="right"
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
        <Box sx={{ height: '48px' }} />
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
          pr: isOpen ? '240px' : 0,
          transition: 'padding-right 0.3s ease',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ 
          p: 2,
          height: 'calc(100vh - 80px)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '40px'
        }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

export default Layout;
