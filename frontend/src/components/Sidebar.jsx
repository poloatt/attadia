import { Drawer, Box, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { 
  DashboardOutlined,
  AssignmentOutlined,
  Settings as SettingsIcon
} from '@mui/icons-material';

export default function Sidebar() {
  const { isOpen, menuItems } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ 
      width: isOpen ? 240 : 56,
      transition: 'width 0.3s ease',
      flexShrink: 0 
    }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 'auto',
          '& .MuiDrawer-paper': {
            position: 'fixed',
            width: isOpen ? 240 : 56,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <List sx={{ p: 1, flex: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.title} disablePadding>
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
                  primary={item.title} 
                  sx={{ 
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    m: 0,
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mx: 1 }} />
        
        <List sx={{ p: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/configuracion'}
              onClick={() => navigate('/configuracion')}
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
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Configuración" 
                sx={{ 
                  opacity: isOpen ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  m: 0,
                }} 
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
} 