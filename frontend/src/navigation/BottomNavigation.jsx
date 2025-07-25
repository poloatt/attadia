import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { modulos } from './menuStructure';
import { getIconByKey, isRouteActive } from './menuIcons';
import theme from '../context/ThemeContext';

/**
 * Componente de navegación inferior con diseño geométrico
 * Ahora muestra dinámicamente los menús de nivel 1 del módulo activo
 */
export default function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Encontrar el módulo activo según la ruta
  const moduloActivo = modulos.find(modulo =>
    modulo.subItems?.some(sub => currentPath.startsWith(sub.path)) ||
    currentPath.startsWith(modulo.path)
  );

  // Obtener los menús de nivel 1 del módulo activo
  const navItems = moduloActivo?.subItems || [];

  if (!moduloActivo || navItems.length === 0) return null;

  return (
    <Paper 
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        zIndex: 1200,
        borderRadius: 0,
        bgcolor: theme.palette.background.default, // Fondo opaco
        boxShadow: 'none',
        borderTop: '1px solid',
        borderColor: theme.palette.divider,
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
            gap: 2,
            width: '100%',
            minWidth: '300px',
            height: '56px',
            px: { xs: 1, sm: 2, md: 3 }
          }}
        >
          {navItems.map((item, index) => {
            const isActive = isRouteActive(location.pathname, item.path);
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
                    borderRadius: '50%',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    p: 1,
                  }}
                >
                  {typeof item.icon === 'string' && getIconByKey(item.icon) &&
                    React.createElement(getIconByKey(item.icon), { fontSize: 'small' })}
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
