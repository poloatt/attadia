import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { getBottomNavigationItems } from './menuStructure';
import { isRouteActive } from './menuIcons';

/**
 * Componente de navegación inferior con diseño geométrico
 * Este componente muestra botones para acceder rápidamente a Assets, Salud y Tiempo
 * Utiliza configuración modular desde menuStructure.js
 */
export default function BottomNavigation() {
  const location = useLocation();
  
  // Obtener elementos de navegación desde la configuración modular
  const navItems = getBottomNavigationItems();

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
          {navItems.map((item, index) => {
            const isActive = isRouteActive(location.pathname, item.activePaths);
            
            return (
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
                    color: isActive ? 'primary.main' : 'text.secondary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    p: 0.5,
                  }}
                >
                  <item.icon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    fontSize: '0.65rem',
                    fontWeight: isActive ? 500 : 400,
                    mt: 0.2
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
} 
