import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentIcon from '@mui/icons-material/Assignment';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Transacciones', icon: <AccountBalanceWalletIcon />, path: '/transacciones' },
  { text: 'Propiedades', icon: <HomeIcon />, path: '/propiedades' },
  { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
  { text: 'Rutinas', icon: <FitnessCenterIcon />, path: '/rutinas' },
  { text: 'Lab', icon: <ScienceIcon />, path: '/lab' },
  { text: 'Proyectos', icon: <AssignmentIcon />, path: '/proyectos' },
];

export function Layout({ children }) {
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
        sx={{
          '& .MuiDrawer-paper': {
            width: isOpen ? 240 : 56,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'fixed',
            height: '100vh',
            top: 0,
            left: 0,
            zIndex: (theme) => theme.zIndex.drawer
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
          pl: isOpen ? '240px' : '56px',
          transition: 'padding-left 0.3s ease',
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
          flexDirection: 'column'
        }}>
          {children}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

export default Layout;
