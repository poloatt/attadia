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
    // Si hay una subsección activa y tiene subitems, muestra sus subitems (nivel 3)
    if (subSection?.subItems && subSection.subItems.length > 0) {
      return subSection.subItems;
    }
    // Si estamos en un subitem (nivel 2), muestra los hermanos de ese subitem
    if (mainSection?.subItems && subSection) {
      return mainSection.subItems;
      }
    // Si estamos en el nivel principal, muestra los subitems del mainSection
    if (mainSection?.subItems) {
      return mainSection.subItems;
      }
    return [];
  }, [mainSection, subSection]);

  // Botón de atrás: ir al path del menú padre, si existe
  // Ahora solo muestra el botón si hay un mainSection y subSection (es decir, no en la raíz)
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
    <Box sx={{ width: '100%', bgcolor: 'background.default', pb: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pt: 0.5, pb: 0, width: '100%' }}>
        {/* Hermanos centrados en mobile y desktop */}
        {siblings.length > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, justifyContent: 'center' }}>
            {siblings.map(item => (
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
                  ))}
                </Box>
              )}
        {!isMobile && showAddButton && <HeaderAddButton entityConfig={entityConfig} buttonSx={actionButtonSx} />}
        {/* Renderizar acciones adicionales si existen */}
        {!isMobile && additionalActions && additionalActions.map((action, idx) => (
          <Tooltip key={idx} title={action.tooltip || action.label}>
            <span>{action.icon}</span>
          </Tooltip>
        ))}
        {!isMobile && children}
      </Box>
    </Box>
  );
}