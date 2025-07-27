// Toolbar.jsx
// Toolbar modular: ahora recibe 'moduloActivo', 'nivel1' y 'currentPath' como props. Solo navega entre los hijos de nivel1.

import React from 'react';
import { Box, IconButton, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { icons, getIconByKey } from './menuIcons';
import { SystemButtons } from '../components/common/SystemButtons';
import { useEntityActions } from '../components/common/CommonActions';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';
import { modulos } from './menuStructure';

export default function Toolbar({
  moduloActivo,
  nivel1 = [],
  currentPath = '',
  children,
  additionalActions = [],
  onBack,
  parentInfo,
}) {
  // 1. HOOKS Y CÁLCULOS PRINCIPALES
  const { showEntityToolbarNavigation } = useUISettings();
  const { isOpen: sidebarIsOpen, getMainMargin } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { getEntityConfig, showAddButton } = useEntityActions();
  const entityConfig = getEntityConfig();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Usar función centralizada para calcular mainMargin
  const mainMargin = getMainMargin(isMobile, isTablet);

  // 2. LÓGICA DE NAVEGACIÓN
  // Siblings: los hijos de nivel1
  const siblings = nivel1;
  // Determinar si mostrar botón de atrás
  const shouldShowBack = !!onBack && !!parentInfo;
  
  // Lógica para mostrar íconos de módulos principales (solo cuando sidebar está extendida)
  const shouldShowModuleIcons = sidebarIsOpen && !isMobile;
  const moduleData = shouldShowModuleIcons ? (() => {
    // Detectar el módulo activo
    const moduloActivo = modulos.find(modulo =>
      modulo.subItems?.some(sub => location.pathname.startsWith(sub.path)) ||
      location.pathname.startsWith(modulo.path)
    );
    
    // Obtener todos los módulos principales
    const todosLosModulos = modulos.filter(m => ['assets', 'salud', 'tiempo'].includes(m.id));
    
    // Reordenar: módulo activo primero, luego los otros
    const otrosModulos = todosLosModulos.filter(m => m.id !== moduloActivo?.id);
    return moduloActivo ? [moduloActivo, ...otrosModulos] : todosLosModulos;
  })() : [];

  // 3. RENDER
  if (!showEntityToolbarNavigation) return null;

  return (
    <Box sx={{
      width: '100%',
      position: 'relative',
      bgcolor: '#181818',
      minHeight: 40,
      m: 0,
      p: 0,
      boxShadow: 'none'
    }}>
      {/* Sección de módulos - posicionada en el área de la sidebar */}
      {shouldShowModuleIcons && moduleData.length > 0 && (
        <Box sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: mainMargin,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          zIndex: 1
        }}>
          {/* Módulo activo a la izquierda */}
          {(() => {
            const moduloActivo = moduleData[0];
            const IconComponent = getIconByKey(moduloActivo.icon);
            return (
              <Tooltip title={moduloActivo.title}>
                <Box 
                  onClick={() => navigate(moduloActivo.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.primary',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                >
                                     {IconComponent && React.createElement(IconComponent, { 
                     fontSize: 'small'
                   })}
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {moduloActivo.title}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })()}

          {/* Otros módulos a la derecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {moduleData.slice(1).map(modulo => {
              const IconComponent = getIconByKey(modulo.icon);
              return (
                <Tooltip key={modulo.id} title={modulo.title}>
                  <IconButton
                    onClick={() => navigate(modulo.path)}
                    size="small"
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      borderRadius: 1,
                      fontSize: 18,
                      transition: 'color 0.2s',
                      '&:hover': {
                        color: 'primary.main',
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    {IconComponent && React.createElement(IconComponent, { fontSize: 'small' })}
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Sección principal - posicionada en el área del main content */}
      <Box sx={{
        marginLeft: `${mainMargin}px`,
        width: `calc(100vw - ${mainMargin}px)`,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 1, sm: 2, md: 3 },
        gap: 1
      }}>
        {/* Sección izquierda: Botón de atrás */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          minWidth: 'fit-content'
        }}>
          {shouldShowBack ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={parentInfo.title || 'Volver'}>
                <IconButton onClick={onBack} size="small">
                  {icons.arrowBack ? React.createElement(icons.arrowBack, { sx: { fontSize: 18 } }) : <span>&larr;</span>}
                </IconButton>
              </Tooltip>
              {/* Ícono del destino - solo mostrar en desktop */}
              {parentInfo.icon && !isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
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
              pointerEvents: 'none'
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

        {/* Sección central: Hermanos (siblings) - centrados en el área del main */}
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
              gap: 0.5
            }}>
              {siblings.map(item => {
                const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
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
                        {getIconByKey(item.icon) && React.createElement(getIconByKey(item.icon))}
                      </IconButton>
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
          ) : null}
        </Box>

        {/* Sección derecha: Acciones y herramientas */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
          minWidth: 48,
          height: 40
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
              padding: 0.5
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