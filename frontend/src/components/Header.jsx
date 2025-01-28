import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Box, Tooltip } from '@mui/material';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { alpha } from '@mui/material/styles';
import StorageIcon from '@mui/icons-material/Storage';
import CircleIcon from '@mui/icons-material/Circle';
import MenuIcon from '@mui/icons-material/Menu';
import { useSidebar } from '../context/SidebarContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    api: false,
    database: false
  });

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        setConnectionStatus({
          api: response.ok,
          database: data.database === 'connected'
        });
      } catch (error) {
        setConnectionStatus({
          api: false,
          database: false
        });
      }
    };

    // Verificar conexión inicial
    checkConnections();

    // Configurar verificación periódica cada 30 segundos
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
            <Tooltip title="Estado de la API">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircleIcon 
                  sx={{ 
                    width: 8,
                    height: 8,
                    color: connectionStatus.api ? 'success.main' : 'error.main',
                    filter: (theme) => `drop-shadow(0 0 1px ${connectionStatus.api ? theme.palette.success.main : theme.palette.error.main})`
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: connectionStatus.api ? 'success.main' : 'error.main',
                    fontSize: '0.7rem',
                  }}
                >
                  API
                </Typography>
              </Box>
            </Tooltip>

            {/* Database Status */}
            <Tooltip title="Estado de la Base de Datos">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircleIcon 
                  sx={{ 
                    width: 8,
                    height: 8,
                    color: connectionStatus.database ? 'success.main' : 'error.main',
                    filter: (theme) => `drop-shadow(0 0 1px ${connectionStatus.database ? theme.palette.success.main : theme.palette.error.main})`
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: connectionStatus.database ? 'success.main' : 'error.main',
                    fontSize: '0.7rem',
                  }}
                >
                  DB
                </Typography>
              </Box>
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
      </Toolbar>
    </AppBar>
  );
} 