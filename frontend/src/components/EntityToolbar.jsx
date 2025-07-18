// EntityToolbar.jsx
// Toolbar modular y automática: breadcrumbs, título, navegación de hermanos y back se obtienen de menuStructure.js según la ruta actual.
// Solo acepta 'children' y 'additionalActions' para extensibilidad. Cualquier cambio en el menú se refleja automáticamente.

import React, { useMemo } from 'react';
import { Box, IconButton, Tooltip, Typography, Breadcrumbs, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { menuItems } from '../navigation/menuStructure';
import { icons } from '../navigation/menuIcons';
import HeaderAddButton from './header/HeaderAddButton';
import HeaderVisibilityButton from './header/HeaderVisibilityButton';
import HeaderUndoMenu from './header/HeaderUndoMenu';
import HeaderRefreshButton from './header/HeaderRefreshButton';
import { useHeaderActions } from './header/HeaderActions';
import { useUISettings } from '../context/UISettingsContext';

function isRouteActive(path, currentPath) {
  if (!path) return false;
  return currentPath === path || currentPath.startsWith(path + '/');
}

function findActiveMainSection(currentPath, items = menuItems) {
  return items.find(section => {
    if (section.path && isRouteActive(section.path, currentPath)) return true;
    return section.subItems?.some(subItem =>
      isRouteActive(subItem.path, currentPath) ||
      (subItem.subItems && subItem.subItems.some(subSubItem => isRouteActive(subSubItem.path, currentPath)))
    );
  });
}

function findActiveSubSection(currentPath, section) {
  if (!section?.subItems) return null;
  return section.subItems.find(subItem =>
    isRouteActive(subItem.path, currentPath) ||
    (subItem.subItems && subItem.subItems.some(subSubItem => isRouteActive(subSubItem.path, currentPath)))
  );
}

export default function EntityToolbar({ children, additionalActions = [] }) {
  const { showEntityToolbarNavigation } = useUISettings();
  if (!showEntityToolbarNavigation) return null;

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

  const handleBack = () => {
    if (mainSection?.path) {
      navigate(mainSection.path);
    } else {
      navigate('/');
    }
  };

  const {
    showVisibilityButton,
    getEntityConfig,
    showAddButton,
    showUndoButton
  } = useHeaderActions();
  const entityConfig = getEntityConfig();

  const actionButtonSx = { fontSize: 18, color: 'text.secondary', borderRadius: 1, p: 0.5 };

  // Render
  return (
    <Box sx={{ 
      width: '100%', 
      bgcolor: 'background.default', 
      pb: 0,
      position: 'sticky',
      top: 0, // Ahora se posiciona desde el top del contenedor principal
      zIndex: 1201,
      borderBottom: '1px solid',
      borderColor: 'divider',
      minHeight: 2, // Altura mínima extremadamente reducida
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: 0, 
        pt: 0, 
        pb: 0, 
        width: '100%',
        minHeight: 2, // Altura mínima extremadamente reducida
        position: 'relative', // Para posicionamiento absoluto del botón +
      }}>
        {/* Botón de atrás en mobile, solo si la toolbar está activa y no estamos en la raíz */}
        {isMobile && location.pathname !== '/' && (
          <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
            {icons.arrowBack ? React.createElement(icons.arrowBack, { sx: { fontSize: 18 } }) : <span>&larr;</span>}
          </IconButton>
        )}
        {/* Hermanos centrados en mobile y desktop - siempre ocupan el mismo espacio */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          flex: 1, 
          justifyContent: 'center',
          minHeight: 40, // Altura fija para evitar saltos
        }}>
          {siblings.length > 1 ? siblings.map(item => (
            <Tooltip key={item.path} title={item.title}>
              <IconButton
                component={Link}
                to={item.path}
                size="small"
                sx={{
                  bgcolor: isRouteActive(item.path, currentPath) ? 'action.selected' : 'transparent',
                  color: isRouteActive(item.path, currentPath) ? 'primary.main' : 'text.secondary',
                  borderRadius: 1,
                  fontSize: 18
                }}
                disabled={isRouteActive(item.path, currentPath)}
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
          )) : (
            // Espacio vacío para mantener el layout cuando no hay hermanos
            <Box sx={{ width: '100%', height: 40 }} />
          )}
        </Box>
        
        {/* Acciones adicionales y children en desktop */}
        {!isMobile && additionalActions && additionalActions.map((action, idx) => (
          <Tooltip key={idx} title={action.tooltip || action.label}>
            <span>{action.icon}</span>
          </Tooltip>
        ))}
        {!isMobile && children}
        {/* Botón de agregar SIEMPRE visible en la toolbar, tanto en mobile como en desktop */}
        {showAddButton && entityConfig && (
          <Box sx={{ 
            position: isMobile ? 'absolute' : 'static', 
            right: isMobile ? 8 : undefined, 
            top: isMobile ? '50%' : undefined, 
            transform: isMobile ? 'translateY(-50%)' : undefined
          }}>
            <HeaderAddButton entityConfig={entityConfig} buttonSx={{ ml: 1 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}