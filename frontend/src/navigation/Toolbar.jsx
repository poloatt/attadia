// Toolbar.jsx
// Toolbar modular y automática: breadcrumbs, título, navegación de hermanos y back se obtienen de menuStructure.js según la ruta actual.
// Solo acepta 'children' y 'additionalActions' para extensibilidad. Cualquier cambio en el menú se refleja automáticamente.

import React, { useMemo, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { modulos } from './menuStructure';
import { icons } from './menuIcons';
import { SystemButtons } from '../components/common/SystemButtons';
import { useEntityActions } from '../components/common/CommonActions';
import { useUISettings } from '../context/UISettingsContext';

// Cache para optimizar búsquedas repetitivas
const routeCache = new Map();

// Función para limpiar el cache (útil para desarrollo)
const clearRouteCache = () => {
  routeCache.clear();
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Route cache cleared');
  }
};

// Limpiar cache cada 5 minutos para evitar memory leaks
setInterval(clearRouteCache, 5 * 60 * 1000);

function isRouteActive(path, currentPath) {
  if (!path) return false;
  return currentPath === path || currentPath.startsWith(path + '/');
}

function findActiveMainSection(currentPath, items = modulos) {
  const cacheKey = `main_${currentPath}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }
  
  const result = items.find(section => {
    if (section.path && isRouteActive(section.path, currentPath)) return true;
    return section.subItems?.some(subItem =>
      isRouteActive(subItem.path, currentPath) ||
      (subItem.subItems && subItem.subItems.some(subSubItem => isRouteActive(subSubItem.path, currentPath)))
    );
  });
  
  routeCache.set(cacheKey, result);
  return result;
}

function findActiveSubSection(currentPath, section) {
  if (!section?.subItems) return null;
  
  const cacheKey = `sub_${currentPath}_${section.id}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }
  
  const result = section.subItems.find(subItem =>
    isRouteActive(subItem.path, currentPath) ||
    (subItem.subItems && subItem.subItems.some(subSubItem => isRouteActive(subSubItem.path, currentPath)))
  );
  
  routeCache.set(cacheKey, result);
  return result;
}

// Función para encontrar el padre de una ruta en la jerarquía del menú
function findParentPath(currentPath, items = modulos) {
  const cacheKey = `parent_${currentPath}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }
  
  // Casos especiales
  if (currentPath === '/') {
    const result = { path: '/', icon: null, title: 'Home' };
    routeCache.set(cacheKey, result);
    return result;
  }
  if (currentPath === '/assets') {
    const result = { path: '/', icon: null, title: 'Home' };
    routeCache.set(cacheKey, result);
    return result;
  }
  
  // Buscar coincidencia exacta primero
  for (const mainItem of items) {
    // Si estamos exactamente en una sección principal
    if (mainItem.path && currentPath === mainItem.path) {
      const result = { path: '/assets', icon: mainItem.icon, title: mainItem.title };
      routeCache.set(cacheKey, result);
      return result;
    }
    
    // Buscar en subsecciones
    if (mainItem.subItems) {
      for (const subItem of mainItem.subItems) {
        // Si estamos exactamente en una subsección (nivel 2)
        if (subItem.path && currentPath === subItem.path) {
          const result = { path: mainItem.path, icon: mainItem.icon, title: mainItem.title };
          routeCache.set(cacheKey, result);
          return result;
        }
        
        // Buscar en sub-subsecciones (nivel 3)
        if (subItem.subItems) {
          for (const subSubItem of subItem.subItems) {
            if (subSubItem.path && currentPath === subSubItem.path) {
              const result = { path: subItem.path, icon: subItem.icon, title: subItem.title };
              routeCache.set(cacheKey, result);
              return result;
            }
          }
        }
      }
    }
  }
  
  // Si no encontramos coincidencia exacta, buscar la ruta padre más cercana
  for (const mainItem of items) {
    if (mainItem.subItems) {
      for (const subItem of mainItem.subItems) {
        // Si estamos en una ruta que empieza con la subsección
        if (subItem.path && currentPath.startsWith(subItem.path + '/')) {
          const result = { path: subItem.path, icon: subItem.icon, title: subItem.title };
          routeCache.set(cacheKey, result);
          return result;
        }
        
        // Buscar en sub-subsecciones
        if (subItem.subItems) {
          for (const subSubItem of subItem.subItems) {
            if (subSubItem.path && currentPath.startsWith(subSubItem.path + '/')) {
              const result = { path: subItem.path, icon: subItem.icon, title: subItem.title };
              routeCache.set(cacheKey, result);
              return result;
            }
          }
        }
      }
    }
  }
  
  // Fallback: si estamos en una ruta que empieza con /assets, volver a /
  if (currentPath.startsWith('/assets/')) {
    const result = { path: '/assets', icon: null, title: 'Assets' };
    routeCache.set(cacheKey, result);
    return result;
  }
  
  const result = { path: '/', icon: null, title: 'Home' }; // Fallback general
  routeCache.set(cacheKey, result);
  return result;
}

export default function Toolbar({ children, additionalActions = [] }) {
  // 1. HOOKS Y CÁLCULOS PRINCIPALES
  const { showEntityToolbarNavigation } = useUISettings();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 2. LÓGICA DE NAVEGACIÓN Y HELPERS
  const mainSection = useMemo(() => findActiveMainSection(currentPath, modulos), [currentPath]);
  const subSection = useMemo(() => findActiveSubSection(currentPath, mainSection), [currentPath, mainSection]);
  const siblings = useMemo(() => {
    if (isMobile) {
      if (mainSection?.subItems && subSection) {
        return mainSection.subItems;
      }
      if (mainSection?.subItems) {
        return mainSection.subItems;
      }
      return [];
    } else {
      if (subSection?.subItems && subSection.subItems.length > 0) {
        return subSection.subItems;
      }
      if (mainSection?.subItems && subSection) {
        return mainSection.subItems;
      }
      if (mainSection?.subItems) {
        return mainSection.subItems;
      }
      return [];
    }
  }, [mainSection, subSection, isMobile]);
  const shouldShowBack = useMemo(() => {
    const mainPages = ['/', '/assets', '/tiempo', '/salud'];
    return !mainPages.includes(location.pathname);
  }, [location.pathname]);
  const parentInfo = useMemo(() => findParentPath(currentPath), [currentPath]);
  const handleBack = useCallback(() => {
    navigate(parentInfo.path);
  }, [currentPath, parentInfo, navigate]);
  const { getEntityConfig, showAddButton } = useEntityActions();
  const entityConfig = getEntityConfig();

  // 3. LÓGICA DE RENDERIZADO CONDICIONAL
  if (!showEntityToolbarNavigation) return null;

  // 4. RENDER
  return (
    <Box sx={{
      width: '100%',
      left: 0,
      position: { xs: 'fixed', sm: 'fixed', md: 'sticky' },
      top: { xs: '40px', sm: '40px', md: 0 },
      zIndex: 1201,
      bgcolor: '#181818',
      pb: 0,
      minHeight: 2,
      m: 0,
      p: 0,
      boxShadow: 'none', // <-- Forzar sin sombra
      mb: 2 // <-- Margen inferior
    }}>
      {/* Layout simplificado y flexible */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: { xs: 1, sm: 2, md: 3 },
        pt: 0, 
        pb: 0, 
        width: '100%',
        minHeight: 2, 
        gap: 1
      }}>
        {/* Sección izquierda: Botón de atrás */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexShrink: 0,
          minWidth: 'fit-content',
          pl: 0
        }}>
          {shouldShowBack ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5
            }}>
              <Tooltip title={parentInfo.title || 'Volver'}>
                <IconButton onClick={handleBack} size="small">
                  {icons.arrowBack ? React.createElement(icons.arrowBack, { sx: { fontSize: 18 } }) : <span>&larr;</span>}
                </IconButton>
              </Tooltip>
              {/* Ícono del destino - solo mostrar en desktop */}
              {parentInfo.icon && !isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}>
                  {React.createElement(parentInfo.icon, { sx: { fontSize: 16 } })}
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {parentInfo.title}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              opacity: 0.1, 
              color: 'background.default', 
              pointerEvents: 'none', 
              '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: 'background.default'
              }
            }}>
              <Box component="span" sx={{ 
                fontSize: 18,
                color: 'background.default',
                fontWeight: 300, 
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(180deg)'
              }}>
                →
              </Box>
            </Box>
          )}
        </Box>
        {/* Sección central: Hermanos (siblings) - centrados con flex */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flex: 1,
          minHeight: 40, 
          position: 'relative' 
        }}>
          {siblings.length > 1 ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              position: 'relative',
              left: 'unset',
              transform: 'unset',
              zIndex: 1
            }}>
              {siblings.map(item => {
                const isActive = isRouteActive(item.path, currentPath);
                return (
                  <Tooltip key={item.path} title={item.title}>
                    <span style={{ display: 'inline-flex' }}>
                      <IconButton
                        component={Link}
                        to={item.path}
                        size="small"
                        sx={{
                          bgcolor: isActive ? 'action.selected' : 'transparent',
                          color: isActive ? 'primary.main' : 'text.secondary',
                          borderRadius: 1,
                          fontSize: 18,
                          flexShrink: 0
                        }}
                        disabled={isActive}
                      >
                        {item.icon
                          ? typeof item.icon === 'string'
                            ? icons[item.icon]
                              ? React.createElement(icons[item.icon])
                              : null
                            : React.createElement(item.icon)
                          : null}
                      </IconButton>
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
          ) : null}
        </Box>
        {/* Sección derecha: Acciones - con ancho fijo para mantener centrado de siblings */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          flexShrink: 0,
          minWidth: 48, 
          height: 40,
          pr: 0
        }}>
          {/* Acciones adicionales */}
          {!isMobile && additionalActions && additionalActions.map((action, idx) => {
            const isButton = action.icon && action.icon.type && (action.icon.type.displayName === 'IconButton' || action.icon.type.muiName === 'IconButton' || action.icon.type.isButtonComponent);
            return (
              <Tooltip key={idx} title={action.tooltip || action.label}>
                {isButton ? action.icon : <span>{action.icon}</span>}
              </Tooltip>
            );
          })}
          {/* Children */}
          {!isMobile && children}
          {/* Botón de agregar según reglas de nivel */}
          {showAddButton && entityConfig ? (
            <SystemButtons.AddButton entityConfig={entityConfig} buttonSx={{ ml: 1 }} />
          ) : (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32, 
              height: 32, 
              ml: 1,
              opacity: 0.1, 
              color: 'background.default', 
              pointerEvents: 'none', 
              borderRadius: 1, 
              padding: 0.5, 
              '& .MuiSvgIcon-root': {
                fontSize: 18, 
                color: 'background.default'
              }
            }}>
              <Box component="span" sx={{ 
                fontSize: 18, 
                color: 'background.default',
                fontWeight: 300, 
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18, 
                height: 18 
              }}>
                +
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}