import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Box, Tooltip, Badge } from '@mui/material';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { alpha } from '@mui/material/styles';
import StorageIcon from '@mui/icons-material/Storage';
import CircleIcon from '@mui/icons-material/Circle';
import MenuIcon from '@mui/icons-material/Menu';
import { useSidebar } from '../context/SidebarContext';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { BASE_URL, HEALTH_URL } from '../config';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { CircularProgress } from '@mui/material';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    backend: false,
    database: false,
    loading: true
  });

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const response = await fetch('/health', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text(); // Primero obtén el texto
        let data;
        try {
          data = JSON.parse(text); // Intenta parsearlo como JSON
        } catch (e) {
          console.error('Invalid JSON response:', text);
          throw new Error('Invalid JSON response');
        }
        
        setConnectionStatus({
          backend: true,
          database: data.database === 'connected',
          loading: false
        });
      } catch (error) {
        console.error('Error checking connections:', error);
        setConnectionStatus({
          backend: false,
          database: false,
          loading: false
        });
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para obtener el título de la página actual
  const getPageTitle = () => {
    const path = location.pathname.substring(1); // Elimina el '/' inicial
    if (path === '') return ''; // Si estamos en la raíz, no mostramos nada después de "present"
    return path.charAt(0).toUpperCase() + path.slice(1); // Capitaliza la primera letra
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = () => {
    console.log('Toggle sidebar:', !isOpen);
    toggleSidebar();
  };

  const getStatusIcon = (isConnected, isLoading) => {
    if (isLoading) {
      return <CircularProgress size={20} />;
    }
    return isConnected ? (
      <CheckCircleIcon sx={{ color: 'success.main' }} />
    ) : (
      <ErrorIcon sx={{ color: 'error.main' }} />
    );
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '48px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={isOpen ? "Ocultar menú" : "Mostrar menú"}>
            <IconButton
              onClick={handleToggle}
              size="small"
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon 
                sx={{ 
                  fontSize: 20,
                  transform: isOpen ? 'none' : 'rotate(180deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </IconButton>
          </Tooltip>
          <Typography 
            variant="subtitle1" 
            noWrap 
            component="div"
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            present
            {getPageTitle() && (
              <>
                <span style={{ margin: '0 4px', color: 'text.secondary' }}>/</span>
                <span style={{ color: 'text.secondary' }}>{getPageTitle()}</span>
              </>
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* API Status */}
            <Tooltip title={`API Status: ${connectionStatus.backend ? 'Connected' : 'Disconnected'}`}>
              <IconButton color="inherit" sx={{ mr: 1 }}>
                {getStatusIcon(connectionStatus.backend, connectionStatus.loading)}
              </IconButton>
            </Tooltip>

            {/* Database Status */}
            <Tooltip title={`Database Status: ${connectionStatus.database ? 'Connected' : 'Disconnected'}`}>
              <IconButton color="inherit" sx={{ mr: 2 }}>
                <Badge color={connectionStatus.database ? "success" : "error"} variant="dot">
                  <StorageIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenu}
            sx={{ 
              color: 'text.primary',
              padding: '4px'
            }}
          >
            {user?.avatar ? (
              <Avatar 
                src={user.avatar} 
                alt={user.name}
                sx={{ width: 24, height: 24 }}
              />
            ) : (
              <AccountCircleIcon sx={{ width: 24, height: 24 }} />
            )}
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 180,
                boxShadow: 'rgb(0 0 0 / 8%) 0px 3px 14px',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
              }
            }}
          >
            <MenuItem onClick={handleClose}>Perfil</MenuItem>
            <MenuItem onClick={handleClose}>Configuración</MenuItem>
            <MenuItem onClick={() => {
              handleClose();
              logout();
            }}>Cerrar Sesión</MenuItem>
          </Menu>
        </Box>
        
        {user ? (
          <IconButton onClick={logout} color="inherit">
            <LogoutIcon />
          </IconButton>
        ) : (
          <IconButton color="inherit">
            <LoginIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
} 