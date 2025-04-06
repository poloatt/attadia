import React from 'react';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  AccountBalanceWalletOutlined as WalletIcon,
  HealthAndSafety as HealthIcon,
  AccessTimeOutlined as TimeIcon
} from '@mui/icons-material';

/**
 * Componente de navegación inferior con diseño geométrico
 * Este componente muestra botones para acceder rápidamente a Dashboard, Rutinas y Tareas
 */
export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navegación directa a las páginas
  const navigateTo = (path) => {
    console.log('Navegando a:', path);
    // Intentar usar un enfoque alternativo de navegación
    window.location.href = path;
  };

  // Verificar si estamos en una ruta específica
  const isActive = (path) => {
    // Eliminar el log que está causando demasiadas salidas
    // console.log('Verificando ruta activa:', path, 'actual:', location.pathname);
    
    // Mejorar la lógica de comparación
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    
    if (path === '/rutinas') {
      // Considerar como activo para rutinas y páginas relacionadas
      return location.pathname === '/rutinas' || 
             location.pathname.startsWith('/rutinas/') ||
             location.pathname === '/lab' || 
             location.pathname === '/dieta' || 
             location.pathname === '/datacorporal';
    }
    
    if (path === '/tiempo') {
      return location.pathname === '/tiempo' ||
             location.pathname.startsWith('/tiempo/');
    }
    
    return location.pathname === path;
  };

  // Lista de elementos de navegación con nuevos nombres
  const navItems = [
    { icon: <WalletIcon />, label: 'Assets', path: '/dashboard' },
    { icon: <HealthIcon />, label: 'Health', path: '/rutinas' },
    { icon: <TimeIcon />, label: 'Time', path: '/tiempo' }
  ];

  return (
    <Paper 
      elevation={2} 
      sx={{
        position: 'fixed',
        bottom: 44, // Espacio para el footer
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300, // Aumentado para estar por encima de los mensajes de error
        width: 'auto',
        borderRadius: 1,
        overflow: 'hidden',
        // Diseño geométrico - siguiendo el estilo de EntityToolbar
        clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          height: '48px',
          px: 2,
        }}
      >
        {navItems.map((item, index) => (
          <Box
            key={item.path}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mx: 2,
              position: 'relative',
              '&::after': index < navItems.length - 1 ? {
                content: '""',
                position: 'absolute',
                top: '50%',
                right: -16,
                transform: 'translateY(-50%)',
                height: '60%',
                width: '1px',
                backgroundColor: 'divider',
                // Diseño geométrico para el separador
                clipPath: 'polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)'
              } : {}
            }}
          >
            <IconButton
              component={Link}
              to={item.path}
              onClick={() => console.log('Clic en:', item.path)}
              sx={{
                color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                p: 0.5,
                // Diseño geométrico para el botón
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {React.cloneElement(item.icon, { 
                sx: { fontSize: 18 } 
              })}
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                fontSize: '0.65rem',
                fontWeight: isActive(item.path) ? 500 : 400,
                mt: 0.2
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
} 