import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Box } from '@mui/material';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { alpha } from '@mui/material/styles';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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