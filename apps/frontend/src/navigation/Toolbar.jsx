// Toolbar.jsx
// Toolbar modular: ahora recibe 'moduloActivo', 'nivel1' y 'currentPath' como props. Solo navega entre los hijos de nivel1.

import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '../utils/materialImports';
import { FORM_HEIGHTS } from '../config/uiConstants';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getIconByKey, icons } from './menuIcons';
import { SystemButtons } from '../components/common/SystemButtons';
import { useEntityActions } from '../components/common/CommonActions';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';
import useResponsive from '../hooks/useResponsive';
import { getMainModules, reorderModulesWithActiveFirst, findActiveModule } from '../utils/navigationUtils';
import { DynamicIcon, ClickableIcon, IconWithText } from '../components/common/DynamicIcon';
import { RutinaNavigation } from '../components/rutinas/RutinaNavigation';
import { useRutinas } from '../context/RutinasContext';
import { useRutinasStatistics } from '../context/RutinasStatisticsContext';

export default function Toolbar({
  moduloActivo,
  nivel1 = [],
  currentPath = '',
  children,
  additionalActions = [],
  onBack,
  parentInfo,
  customMainSection,
}) {
  // 1. HOOKS Y CÁLCULOS PRINCIPALES
  const { showEntityToolbarNavigation } = useUISettings();
  const { isOpen: sidebarIsOpen, getMainMargin } = useSidebar();
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();
  const { getEntityConfig, showAddButton } = useEntityActions();
  const entityConfig = getEntityConfig();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Refs para medir el espacio de las secciones
  const leftSectionRef = useRef(null);
  const rightSectionRef = useRef(null);
  const [leftSectionWidth, setLeftSectionWidth] = useState(0);
  const [rightSectionWidth, setRightSectionWidth] = useState(0);
  
  // Usar función centralizada para calcular mainMargin base
  const baseMainMargin = getMainMargin(isMobileOrTablet);

  // 2. LÓGICA DE NAVEGACIÓN
  // Siblings: los hijos de nivel1
  const siblings = nivel1;
  // Determinar si mostrar botón de atrás
  const shouldShowBack = !!onBack && !!parentInfo;
  
  // Determinar si debe mostrar navegación específica
  const shouldShowSpecificNavigation = () => {
    const specificNavigationRoutes = [
      '/tiempo/rutinas',
      // Aquí se pueden agregar más rutas que necesiten navegación específica
    ];
    
    return specificNavigationRoutes.some(route => currentPath.startsWith(route));
  };
  
  // Componente de navegación específica para rutinas
  const SpecificNavigationComponent = () => {
    if (!shouldShowSpecificNavigation()) return null;
    
    if (currentPath.startsWith('/tiempo/rutinas')) {
      return <RutinaNavigationWrapper />;
    }
    
    return null;
  };
  
  // Wrapper para RutinaNavigation que proporciona los datos necesarios desde el contexto
  const RutinaNavigationWrapper = () => {
    const { rutina, rutinas, loading } = useRutinas();
    const { calculateCompletionPercentage } = useRutinasStatistics();
    
    // Calcular página actual y total de páginas
    const currentPage = rutina ? rutinas.findIndex(r => r._id === rutina._id) + 1 : 1;
    const totalPages = rutinas.length;
    
    // Handlers para las acciones
    const handleEdit = (rutina) => {
      // Disparar evento para que la página maneje la edición
      window.dispatchEvent(new CustomEvent('editRutina', { detail: { rutina } }));
    };
    
    const handleAdd = () => {
      // Disparar evento para que la página maneje la adición
      window.dispatchEvent(new CustomEvent('addRutina'));
    };
    
    // Siempre renderizar RutinaNavigation, incluso si no hay rutina
    // El componente RutinaNavigation maneja internamente los casos de rutina null
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <RutinaNavigation 
          rutina={rutina}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </Box>
    );
  };
  
  // Lógica para mostrar íconos de módulos principales (solo cuando sidebar está extendida)
  const shouldShowModuleIcons = sidebarIsOpen && !isMobile;
  const moduleData = shouldShowModuleIcons ? (() => {
    // Usar utilidades centralizadas para navegación
    const moduloActivo = findActiveModule(location.pathname);
    const todosLosModulos = getMainModules(); // ['assets', 'salud', 'tiempo']
    
    // Reordenar usando utilidad centralizada
    return reorderModulesWithActiveFirst(todosLosModulos, moduloActivo);
  })() : [];

  // Efecto para medir el ancho de las secciones
  useEffect(() => {
    const measureSections = () => {
      if (leftSectionRef.current) {
        setLeftSectionWidth(leftSectionRef.current.offsetWidth);
      }
      if (rightSectionRef.current) {
        setRightSectionWidth(rightSectionRef.current.offsetWidth);
      }
    };

    // Medir inmediatamente
    measureSections();

    // Medir después de que el DOM se actualice
    const timeoutId = setTimeout(measureSections, 0);

    // Observer para cambios en el DOM
    const resizeObserver = new ResizeObserver(measureSections);
    if (leftSectionRef.current) {
      resizeObserver.observe(leftSectionRef.current);
    }
    if (rightSectionRef.current) {
      resizeObserver.observe(rightSectionRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [shouldShowBack, parentInfo, additionalActions, children, showAddButton, entityConfig, isMobile]);

  // Calcular el margen ajustado considerando las secciones de acciones
  const adjustedMainMargin = baseMainMargin + leftSectionWidth;
  const mainContentWidth = `calc(100vw - ${adjustedMainMargin}px - ${rightSectionWidth}px)`;

  // 3. RENDER
  if (!showEntityToolbarNavigation) return null;

  return (
    <Box sx={{
      width: '100%',
      position: 'relative',
      bgcolor: '#181818',
      minHeight: FORM_HEIGHTS.minHeight,
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
          width: baseMainMargin,
          height: FORM_HEIGHTS.toolbar,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          zIndex: 1
        }}>
          {/* Módulo activo a la izquierda */}
          {(() => {
            const moduloActivo = moduleData[0];
            return (
              <Tooltip title={moduloActivo.title}>
                <IconWithText 
                  iconKey={moduloActivo.icon}
                  text={moduloActivo.title}
                  onClick={() => navigate(moduloActivo.path)}
                  sx={{
                    color: 'text.primary',
                  }}
                  textSx={{
                    fontSize: '0.75rem'
                  }}
                />
              </Tooltip>
            );
          })()}

          {/* Otros módulos a la derecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {moduleData.slice(1).map(modulo => (
              <ClickableIcon
                key={modulo.id}
                iconKey={modulo.icon}
                title={modulo.title}
                onClick={() => navigate(modulo.path)}
                size="small"
                sx={{
                  fontSize: 18
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Sección principal - posicionada en el área del main content */}
      <Box sx={{
        marginLeft: `${adjustedMainMargin}px`,
        width: mainContentWidth,
        height: FORM_HEIGHTS.toolbar,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 1, sm: 2, md: 3 },
        gap: 1
      }}>
        {/* Sección izquierda: Botón de atrás */}
        <Box 
          ref={leftSectionRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            minWidth: 'fit-content'
          }}
        >
          {shouldShowBack ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={parentInfo.title || 'Volver'}>
                <IconButton onClick={onBack} size="small">
                  {icons.arrowBack && typeof icons.arrowBack === 'function' ? React.createElement(icons.arrowBack, { sx: { fontSize: 18 } }) : <span>&larr;</span>}
                </IconButton>
              </Tooltip>
              {/* Ícono del destino - solo mostrar en desktop */}
              {parentInfo.icon && typeof parentInfo.icon === 'function' && !isMobile && (
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

        {/* Sección central: Hermanos (siblings) o navegación específica */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: FORM_HEIGHTS.minHeight,
          position: 'relative'
        }}>
          {shouldShowSpecificNavigation() ? (
            // Usar navegación específica si está disponible
            <SpecificNavigationComponent />
          ) : customMainSection ? (
            // Usar navegación específica pasada como prop si está disponible
            customMainSection
          ) : (
            // Usar navegación estándar de siblings
            siblings.length > 1 ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                {siblings.map(item => {
                  const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                  return (
                    <ClickableIcon
                      key={item.path}
                      iconKey={item.icon}
                      title={item.title}
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      size="small"
                      sx={{
                        fontSize: 18,
                        flexShrink: 0
                      }}
                    />
                  );
                })}
              </Box>
            ) : null
          )}
        </Box>

        {/* Sección derecha: Acciones y herramientas */}
        <Box 
          ref={rightSectionRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 0,
            minWidth: 48,
            height: FORM_HEIGHTS.toolbar
          }}
        >
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