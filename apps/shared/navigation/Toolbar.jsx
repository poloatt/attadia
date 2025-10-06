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
// import { RutinaNavigation } from '../../../foco/src/rutinas/RutinaNavigation'; // Comentado: import cruzado
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
  
  // Estado para controlar el botón de delete
  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  
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
      '/rutinas'
    ];
    return specificNavigationRoutes.some(route => currentPath.startsWith(route));
  };
  
  // Componente de navegación específica
  const SpecificNavigationComponent = () => {
    if (!shouldShowSpecificNavigation()) return null;
    
    // if (currentPath.startsWith('/tiempo/rutinas')) {
    //   return <RutinaNavigationWrapper />;
    // }
    
    return null;
  };
  
  // Wrapper para RutinaNavigation que proporciona los datos necesarios desde el contexto
  const RutinaNavigationWrapper = () => {
    // Solo usar useRutinas si estamos en una ruta de rutinas
    if (!(currentPath.startsWith('/rutinas') || currentPath.startsWith('/tiempo/rutinas'))) {
      return null;
    }
    
    let rutina = null;
    let rutinas = [];
    let loading = false;
    let calculateCompletionPercentage = () => 0;
    
    try {
      const rutinasData = useRutinas();
      const statisticsData = useRutinasStatistics();
      rutina = rutinasData.rutina;
      rutinas = rutinasData.rutinas;
      loading = rutinasData.loading;
      calculateCompletionPercentage = statisticsData.calculateCompletionPercentage;
    } catch (error) {
      // Si no hay RutinasProvider, usar valores por defecto
      console.warn('RutinasProvider no disponible, usando valores por defecto');
      return null;
    }
    
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
        {/* RutinaNavigation está comentado por importación cruzada */}
        {/* <RutinaNavigation 
          rutina={rutina}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onEdit={handleEdit}
          onAdd={handleAdd}
        /> */}
        <Typography variant="body2" color="text.secondary">
          Navegación de rutinas (en desarrollo)
        </Typography>
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

  // Efecto para escuchar cambios en la selección de elementos
  useEffect(() => {
    const handleSelectionChange = (event) => {
      const { hasSelections } = event.detail;
      setHasSelectedItems(hasSelections);
    };

    window.addEventListener('selectionChanged', handleSelectionChange);
    
    return () => {
      window.removeEventListener('selectionChanged', handleSelectionChange);
    };
  }, []);

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

  // 3. RENDER
  // Mostrar siempre la Toolbar en desktop; respetar preferencia solo en móvil/tablet
  if (isMobileOrTablet && !showEntityToolbarNavigation) return null;

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
        width: '100%',
        height: FORM_HEIGHTS.toolbar,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 1, sm: 2, md: 3 },
        gap: 1,
        position: 'relative'
      }}>
        {/* Sección izquierda: Botón de atrás */}
        <Box 
          ref={leftSectionRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            minWidth: 'fit-content',
            position: 'absolute',
            left: { xs: 1, sm: 2, md: 3 }
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
          width: '100%',
          height: FORM_HEIGHTS.toolbar,
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0
        }}>
          {shouldShowSpecificNavigation() ? (
            // Usar navegación específica si está disponible
            <RutinaNavigationWrapper />
          ) : customMainSection ? (
            // Usar navegación específica pasada como prop si está disponible
            customMainSection
          ) : (
            // Usar navegación estándar de siblings
            siblings.length > 1 ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.125, sm: 0.5 }
              }}>
                {siblings.map(item => {
                  const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                  return isMobile ? (
                    // Versión simplificada para móvil
                    <Tooltip key={item.path} title={item.title}>
                      <IconButton
                        onClick={() => navigate(item.path)}
                        size="small"
                        sx={{
                          bgcolor: 'transparent',
                          color: isActive ? 'primary.main' : 'text.secondary',
                          borderRadius: '50%',
                          padding: 0.25,
                          minWidth: 32,
                          height: 32,
                          position: 'relative',
                          '&::after': isActive ? {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 23,
                            height: 23,
                            borderRadius: '50%',
                            bgcolor: 'action.selected',
                            zIndex: -1
                          } : {},
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: isActive ? 'transparent' : 'action.hover',
                          }
                        }}
                      >
                        {React.createElement(getIconByKey(item.icon), { sx: { fontSize: 14 } })}
                      </IconButton>
                    </Tooltip>
                  ) : (
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
            height: FORM_HEIGHTS.toolbar,
            position: 'absolute',
            right: { xs: 1, sm: 2, md: 3 }
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
          {/* Botón de agregar inteligente */}
          {(() => {
            // Para páginas de proyectos, usar botón inteligente
            if (currentPath.startsWith('/tiempo/proyectos') || 
                currentPath.startsWith('/tiempo/tareas') || 
                currentPath.startsWith('/tiempo/archivo')) {
              
              const getSmartAddButton = () => {
                const handleSmartAdd = () => {
                  if (currentPath === '/tiempo/proyectos') {
                    window.dispatchEvent(new CustomEvent('addProject'));
                  } else if (currentPath === '/tiempo/tareas') {
                    window.dispatchEvent(new CustomEvent('addTask'));
                  } else if (currentPath === '/tiempo/archivo') {
                    navigate('/tiempo/tareas');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('addTask'));
                    }, 100);
                  }
                };

                const getTooltip = () => {
                  if (currentPath === '/tiempo/proyectos') return 'Nuevo Proyecto';
                  if (currentPath === '/tiempo/tareas') return 'Nueva Tarea';
                  if (currentPath === '/tiempo/archivo') return 'Nueva Tarea';
                  return 'Agregar';
                };

                return (
                  <Tooltip title={getTooltip()}>
                    <IconButton
                      size="small"
                      onClick={handleSmartAdd}
                      sx={{ 
                        ml: 1,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {React.createElement(icons.add, { sx: { fontSize: 18 } })}
                    </IconButton>
                  </Tooltip>
                );
              };

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {/* Botón de Google Tasks solo para /tiempo/tareas */}
                  {(currentPath === '/tiempo/tareas' || currentPath.startsWith('/tiempo/tareas/')) && (
                    <Tooltip title="Configurar Google Tasks">
                      <IconButton
                        size="small"
                        onClick={() => {
                          // Disparar evento para abrir configuración de Google Tasks
                          window.dispatchEvent(new CustomEvent('openGoogleTasksConfig'));
                        }}
                        sx={{
                          mr: 0.5,
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            transform: 'scale(1.05)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {React.createElement(icons.google || (() => (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )), { sx: { fontSize: 18 } })}
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {/* Botón de eliminar múltiple para /tiempo/archivo y /tiempo/tareas - solo cuando hay selecciones */}
                  {(currentPath === '/tiempo/archivo' || currentPath === '/tiempo/tareas') && (
                    <Tooltip title={hasSelectedItems ? "Eliminar seleccionadas" : "Selecciona elementos para eliminar"}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (hasSelectedItems) {
                            // Disparar evento para eliminar tareas seleccionadas
                            window.dispatchEvent(new CustomEvent('deleteSelectedTasks'));
                          }
                        }}
                        sx={{
                          mr: 0.5,
                          color: 'error.main',
                          opacity: hasSelectedItems ? 1 : 0.3,
                          '&:hover': {
                            backgroundColor: hasSelectedItems ? 'error.main' : 'transparent',
                            color: hasSelectedItems ? 'white' : 'error.main',
                            transform: hasSelectedItems ? 'scale(1.05)' : 'none',
                            opacity: 1,
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        disabled={!hasSelectedItems}
                      >
                        {React.createElement(icons.delete || (() => (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        )), { sx: { fontSize: 18 } })}
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {/* Botón de selección múltiple para /tiempo/archivo y /tiempo/tareas - solo desktop */}
                  {(currentPath === '/tiempo/archivo' || currentPath === '/tiempo/tareas') && (
                    <Tooltip title="Activar selección múltiple">
                      <IconButton
                        size="small"
                        onClick={() => {
                          console.log('🔍 Botón de selección múltiple clickeado');
                          // Disparar evento para activar selección múltiple
                          window.dispatchEvent(new CustomEvent('activateMultiSelect'));
                        }}
                        sx={{
                          mr: 0.5,
                          color: hasSelectedItems ? 'primary.main' : 'text.secondary',
                          opacity: hasSelectedItems ? 1 : 0.7,
                          '&:hover': {
                            backgroundColor: hasSelectedItems ? 'primary.main' : 'action.hover',
                            color: hasSelectedItems ? 'white' : 'primary.main',
                            transform: 'scale(1.05)',
                            opacity: 1,
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {getSmartAddButton()}
                </Box>
              );
            }
            
            // Para otras páginas, usar la lógica original
            if (!shouldShowSpecificNavigation() && showAddButton && entityConfig) {
              return <SystemButtons.AddButton entityConfig={entityConfig} buttonSx={{ ml: 1 }} />;
            }
            
            if (!shouldShowSpecificNavigation()) {
              return (
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
              );
            }
            
            return null;
          })()}
        </Box>
      </Box>
    </Box>
  );
}