// EntityToolbar.jsx
// Toolbar modular y automática: breadcrumbs, título, navegación de hermanos y back se obtienen de menuStructure.js según la ruta actual.
// Solo acepta 'children' y 'additionalActions' para extensibilidad. Cualquier cambio en el menú se refleja automáticamente.

import React, { useMemo, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { menuItems } from '../../navigation/menuStructure';
import { icons } from '../../navigation/menuIcons';
import HeaderAddButton from '../../navigation/header/HeaderAddButton';
import HeaderVisibilityButton from '../../navigation/header/HeaderVisibilityButton';
import HeaderUndoMenu from '../../navigation/header/HeaderUndoMenu';
import HeaderRefreshButton from '../../navigation/header/HeaderRefreshButton';
import { useHeaderActions } from '../../navigation/header/HeaderActions';
import { useUISettings } from '../../context/UISettingsContext';

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

function findActiveMainSection(currentPath, items = menuItems) {
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
function findParentPath(currentPath, items = menuItems) {
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

export default function EntityToolbar({ children, additionalActions = [] }) {
  const { showEntityToolbarNavigation } = useUISettings();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Encuentra la sección principal y subsección activas
  const mainSection = useMemo(() => findActiveMainSection(currentPath, menuItems), [currentPath]);
  const subSection = useMemo(() => findActiveSubSection(currentPath, mainSection), [currentPath, mainSection]);

  // Decide qué subitems mostrar (hermanos)
  const siblings = useMemo(() => {
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
  }, [mainSection, subSection]);

  // Memoizar los cálculos para evitar re-renders innecesarios
  const shouldShowBack = useMemo(() => {
    // No mostrar botón de atrás en páginas principales
    const mainPages = ['/', '/assets', '/tiempo', '/salud'];
    return !mainPages.includes(location.pathname);
  }, [location.pathname]);
  
  const parentInfo = useMemo(() => 
    findParentPath(currentPath), 
    [currentPath]
  );

  const handleBack = useCallback(() => {
    console.log('🔙 Back button clicked:', { currentPath, parentInfo });
    navigate(parentInfo.path);
  }, [currentPath, parentInfo, navigate]);

  const {
    showVisibilityButton,
    getEntityConfig,
    showAddButton,
    showUndoButton
  } = useHeaderActions();
  const entityConfig = getEntityConfig();

  if (!showEntityToolbarNavigation) return null;

  // Debug: solo mostrar en desarrollo y cuando cambie la ruta
  if (process.env.NODE_ENV === 'development' && false) { // Deshabilitado temporalmente
    console.log('🔍 EntityToolbar Debug:', {
      currentPath,
      shouldShowBack,
      parentInfo,
      mainSection: mainSection?.id,
      subSection: subSection?.id,
      siblingsCount: siblings.length,
      showAddButton,
      entityConfig,
      showEntityToolbarNavigation
    });
  }

  // Render
  return (
    <Box sx={{ 
      width: '100%', 
      bgcolor: 'background.default', 
      pb: 0,
      position: 'sticky',
      top: 0,
      zIndex: 1201,
      borderBottom: '1px solid',
      borderColor: 'divider',
      minHeight: 2, // Revertido a altura mínima original
    }}>
      {/* Layout simplificado y flexible */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: 0, // Revertido a padding horizontal original
        pt: 0, // Revertido a padding vertical original
        pb: 0, // Revertido a padding vertical original
        width: '100%',
        minHeight: 2, // Revertido a altura mínima original
        gap: 1
      }}>
        
        {/* Sección izquierda: Botón de atrás */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexShrink: 0,
          minWidth: 'fit-content',
          pl: 1
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
            // Botón de atrás con color de background para difuminarse
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              opacity: 0.1, // Muy baja opacidad para difuminarse
              color: 'background.default', // Color del background
              pointerEvents: 'none', // No clickeable
              '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: 'background.default'
              }
            }}>
              <Box component="span" sx={{ 
                fontSize: 18,
                color: 'background.default',
                fontWeight: 300, // Más delgado para parecer plano
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(180deg)' // Rotar para que apunte hacia la derecha (inactivo)
              }}>
                →
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Sección central: Hermanos (siblings) - centrados considerando el padding del Container */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flex: 1,
          minHeight: 40, // Altura fija para mantener centrado
          position: 'relative' // Para posicionamiento absoluto de los siblings
        }}>
          {siblings.length > 1 ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              position: 'absolute', // Posicionamiento absoluto para centrado perfecto
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
              // Ajuste para alinear con el contenido del Container
              ...(isMobile ? {
                // En mobile, el Container tiene px: 1, así que ajustamos
                left: 'calc(50% + 8px)', // 8px = 1 * theme.spacing(1)
              } : {
                // En desktop, el Container tiene px: 3, así que ajustamos
                left: 'calc(50% + 24px)', // 24px = 3 * theme.spacing(1)
              })
            }}>
              {siblings.map(item => {
                const isActive = isRouteActive(item.path, currentPath);
                return (
                  <Tooltip key={item.path} title={item.title}>
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
          minWidth: 48, // Ancho fijo para mantener centrado de siblings
          height: 40,
          pr: 1
        }}>
          {/* Acciones adicionales */}
          {!isMobile && additionalActions && additionalActions.map((action, idx) => (
            <Tooltip key={idx} title={action.tooltip || action.label}>
              <span>{action.icon}</span>
            </Tooltip>
          ))}
          
          {/* Children */}
          {!isMobile && children}
          
          {/* Botón de agregar - LÓGICA SIMPLIFICADA */}
          {showAddButton && entityConfig ? (
            <HeaderAddButton entityConfig={entityConfig} buttonSx={{ ml: 1 }} />
          ) : (
            // Botón + con color de background para difuminarse - MISMO TAMAÑO que el activo
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32, // Mismo tamaño que IconButton small
              height: 32, // Mismo tamaño que IconButton small
              ml: 1,
              opacity: 0.1, // Muy baja opacidad para difuminarse
              color: 'background.default', // Color del background
              pointerEvents: 'none', // No clickeable
              borderRadius: 1, // Mismo border radius que el activo
              padding: 0.5, // Mismo padding que el activo
              '& .MuiSvgIcon-root': {
                fontSize: 18, // Mismo fontSize que el activo
                color: 'background.default'
              }
            }}>
              <Box component="span" sx={{ 
                fontSize: 18, // Mismo fontSize que el AddIcon activo
                color: 'background.default',
                fontWeight: 300, // Más delgado para parecer plano
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18, // Mismo ancho que el icono
                height: 18 // Mismo alto que el icono
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