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

  const actionButtonSx = { fontSize: 18, color: 'text.secondary', borderRadius: 1, p: 0.5 };

  // Debug: solo mostrar en desarrollo y cuando cambie la ruta
  if (process.env.NODE_ENV === 'development') {
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
    
    // Log específico para el botón de agregar
    if (currentPath === '/assets/finanzas/transacciones') {
      console.log('🔍 EntityToolbar: En página de transacciones, showAddButton:', showAddButton);
    }
    
    // Log específico para Assets.jsx
    if (currentPath === '/' || currentPath === '/assets') {
      console.log('🔍 EntityToolbar: En Assets, shouldShowBack:', shouldShowBack, 'showAddButton:', showAddButton, 'siblingsCount:', siblings.length);
    }
    
    // Log específico para páginas principales
    if (currentPath === '/tiempo' || currentPath === '/salud') {
      console.log('🔍 EntityToolbar: En página principal', currentPath, 'shouldShowBack:', shouldShowBack, 'siblingsCount:', siblings.length);
    }
    
    // Log específico para páginas de Tiempo
    if (currentPath.startsWith('/tiempo/')) {
      console.log('🔍 EntityToolbar: En página de Tiempo', currentPath, {
        shouldShowBack,
        siblingsCount: siblings.length,
        siblings: siblings.map(s => ({ title: s.title, path: s.path })),
        showAddButton,
        entityConfig: entityConfig?.name
      });
    }
    
    // Log específico para verificar distribución fija
    console.log('🔍 EntityToolbar: Distribución fija - Back:', shouldShowBack, 'Siblings:', siblings.length, 'Actions:', showAddButton);
    
    // Log específico para verificar que todas las páginas de Tiempo tengan la misma estructura
    if (currentPath.startsWith('/tiempo')) {
      console.log('🔍 EntityToolbar: Verificación Tiempo - Grid:', shouldShowBack ? 'auto 1fr 48px' : '1fr 48px', 'Path:', currentPath);
    }
  }

  // Render
  return (
    <Box sx={{ 
      width: '100vw', // Ancho fijo del viewport
      bgcolor: 'background.default', 
      pb: 0,
      position: 'sticky',
      top: 0, // Ahora se posiciona desde el top del contenedor principal
      zIndex: 1201,
      borderBottom: '1px solid',
      borderColor: 'divider',
      minHeight: 2, // Altura mínima extremadamente reducida
      left: 0, // Asegurar posición fija
      right: 0, // Asegurar posición fija
    }}>
      {/* Distribución fija de 3 boxes - NUNCA CAMBIA */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '120px 1fr 120px', // Distribución fija: back | siblings | actions
        alignItems: 'center', 
        px: 0, 
        pt: 0, 
        pb: 0, 
        width: '100%',
        minHeight: 40, // Altura fija para evitar saltos
        gap: 1
      }}>
        
        {/* BOX 1: BACK - Siempre alineado a la izquierda */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          minWidth: 120,
          height: 40,
          pl: 1
        }}>
          {shouldShowBack ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              minWidth: 'fit-content',
              flexShrink: 0
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
            // Espacio vacío para mantener el layout
            <Box sx={{ width: '100%', height: 40 }} />
          )}
        </Box>
        
        {/* BOX 2: SIBLINGS - Siempre centrado absolutamente */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 40,
          width: '100%',
          position: 'relative'
        }}>
          {siblings.length > 1 ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1
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
          ) : (
            // Espacio vacío para mantener el layout cuando no hay hermanos
            <Box sx={{ width: '100%', height: 40 }} />
          )}
        </Box>
        
        {/* BOX 3: ACTIONS - Siempre alineado a la derecha */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          minWidth: 120,
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
          
          {/* Botón de agregar */}
          {showAddButton && entityConfig ? (
            <HeaderAddButton entityConfig={entityConfig} buttonSx={{ ml: 1 }} />
          ) : (
            // Espacio invisible para mantener el layout
            <Box sx={{ width: 48, height: 40 }} />
          )}
        </Box>
      </Box>
    </Box>
  );
}