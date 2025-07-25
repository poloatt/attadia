// Toolbar.jsx
// Toolbar modular: ahora recibe 'moduloActivo', 'nivel1' y 'currentPath' como props. Solo navega entre los hijos de nivel1.

import React from 'react';
import { Box, IconButton, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import { icons, getIconByKey } from './menuIcons';
import { SystemButtons } from '../components/common/SystemButtons';
import { useEntityActions } from '../components/common/CommonActions';
import { useUISettings } from '../context/UISettingsContext';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getEntityConfig, showAddButton } = useEntityActions();
  const entityConfig = getEntityConfig();

  // 2. LÓGICA DE NAVEGACIÓN
  // Siblings: los hijos de nivel1
  const siblings = nivel1;
  // Determinar si mostrar botón de atrás
  const shouldShowBack = !!onBack && !!parentInfo;

  // 3. RENDER
  if (!showEntityToolbarNavigation) return null;

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
      boxShadow: 'none',
      mb: 2
    }}>
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