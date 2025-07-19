import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { icons } from './menuIcons';

/**
 * Componente de navegación inferior con diseño geométrico
 * Este componente muestra botones para acceder rápidamente a Assets, Salud y Tiempo
 */
export default function BottomNavigation() {
  const location = useLocation();
  
  // Verificar si estamos en una ruta específica
  const isActive = (path) => {
    if (path === '/assets') {
      return location.pathname === '/' || 
             location.pathname === '/assets' || 
             location.pathname.startsWith('/assets/');
    }
    if (path === '/salud') {
      return location.pathname === '/salud' || 
             location.pathname.startsWith('/salud/');
    }
    if (path === '/tiempo') {
      return location.pathname === '/tiempo' || 
             location.pathname.startsWith('/tiempo/');
    }
    return location.pathname === path;
  };

  // Lista de elementos de navegación usando los componentes de icono directamente
  const navItems = [
    { 
      icon: icons.trendingUp, 
      label: 'Assets', 
      path: '/assets' 
    },
    { 
      icon: icons.health, 
      label: 'Salud', 
      path: '/salud' 
    },
    { 
      icon: icons.accessTime, 
      label: 'Tiempo', 
      path: '/tiempo' 
    }
  ];

  return (
    <Paper 
      elevation={3} 
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        zIndex: 1200,
        borderRadius: 0,
        bgcolor: '#181818', // Fondo opaco
        boxShadow: '0 -2px 8px rgba(0,0,0,0.10)',
        borderTop: '1px solid',
        borderColor: 'divider',
        m: 0,
        p: 0,
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          height: '88px',
          width: '100%',
          pt: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            width: 'auto',
            minWidth: '300px',
            maxWidth: '400px',
            height: '56px',
          }}
        >
          {navItems.map((item, index) => (
            <Box
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                textDecoration: 'none',
                py: 1,
                px: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&::after': index < navItems.length - 1 ? {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  right: -16,
                  transform: 'translateY(-50%)',
                  height: '60%',
                  width: '1px',
                  backgroundColor: 'divider',
                  clipPath: 'polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)'
                } : {}
              }}
            >
              <Box
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                  bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                  p: 0.5,
                }}
              >
                {/* Usar el componente de icono directamente como JSX */}
                <item.icon sx={{ fontSize: 18 }} />
              </Box>
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
      </Box>
    </Paper>
  );
} 
