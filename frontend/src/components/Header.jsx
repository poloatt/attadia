import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Box, 
  Tooltip
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import { useSidebar } from '../context/SidebarContext';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const path = location.pathname === '/' ? 'inicio' : location.pathname.slice(1);

  const handleAuthClick = () => {
    navigate('/login');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#0A0A0A',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
        height: '48px'
      }}
    >
      <Toolbar 
        sx={{ 
          justifyContent: 'space-between', 
          minHeight: '48px !important',
          px: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': {
                '& .MuiTypography-root': {
                  color: 'rgba(255, 255, 255, 0.9)'
                }
              }
            }}
            onClick={handleHomeClick}
          >
            <Typography 
              variant="subtitle1" 
              noWrap 
              component="div"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'color 0.2s'
              }}
            >
              Present
              <Box 
                component="span" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  mx: 0.5 
                }}
              >
                /
              </Box>
              {path}
            </Typography>
          </Box>
        </Box>

        {/* Auth Button */}
        {!user ? (
          <Tooltip title="Iniciar Sesión / Registrarse">
            <IconButton 
              size="small" 
              onClick={handleAuthClick}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            >
              <PersonOutlineIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip title={user.email}>
              <IconButton
                size="small"
                onClick={handleMenu}
                sx={{ ml: 1 }}
              >
                <Avatar 
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem'
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ 
                mt: 1,
                '& .MuiPaper-root': {
                  backgroundColor: '#0A0A0A',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <MenuItem 
                onClick={handleLogout}
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">Cerrar Sesión</Typography>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
} 