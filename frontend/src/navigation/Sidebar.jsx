import React, { useEffect, useMemo, useCallback } from 'react';
import { 
  Drawer, 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton, 
  Divider,
  Tooltip,
  IconButton,
  Typography
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useUISettings } from '../context/UISettingsContext';
import { icons } from './menuIcons';
import SidebarResizer from './SidebarResizer';

export default function Sidebar() {
  const { 
    isOpen, 
    menuItems, 
    mainSections,
    isDesktop,
    closeSidebar,
    selectedMain,
    setSelectedMain,
    selectedSecond,
    setSelectedSecond,
    sidebarWidth,
    handleSidebarResize
  } = useSidebar();
  const { showEntityToolbarNavigation, showSidebar } = useUISettings();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Función utilitaria para verificar si una ruta está activa
  const isRouteActive = useCallback((path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Función para encontrar la sección activa basada en la ruta actual
  const findActiveSection = useCallback(() => {
    return mainSections.find(section => {
      // Verificar si la ruta principal está activa
      if (section.path && isRouteActive(section.path)) return true;
      
      // Verificar si alguna subsección está activa
      return section.subItems?.some(subItem => {
        if (subItem.path && isRouteActive(subItem.path)) return true;
        return subItem.subItems?.some(subSubItem => isRouteActive(subSubItem.path));
      });
    });
  }, [mainSections, isRouteActive]);

  // Función para encontrar la subsección activa
  const findActiveSubSection = useCallback((section) => {
    if (!section.subItems) return null;
    
    return section.subItems.find(subItem => {
      if (subItem.path && isRouteActive(subItem.path)) return true;
      return subItem.subItems?.some(subSubItem => isRouteActive(subSubItem.path));
    });
  }, [isRouteActive]);

  // Sincronizar selección con la ruta actual
  useEffect(() => {
    const activeSection = findActiveSection();
    if (activeSection && activeSection.id !== selectedMain) {
      setSelectedMain(activeSection.id);
      
      const activeSubSection = findActiveSubSection(activeSection);
      // Si estamos en la ruta principal de una sección (como /assets), no seleccionar subsección
      if (activeSection.path && location.pathname === activeSection.path) {
        setSelectedSecond(null);
      } else if (activeSubSection && activeSubSection.id !== selectedSecond) {
        setSelectedSecond(activeSubSection.id);
      }
    }
  }, [location.pathname, selectedMain, selectedSecond, setSelectedMain, setSelectedSecond, findActiveSection, findActiveSubSection]);

  // Memoizar la sección principal seleccionada y sus items
  const currentMainSection = useMemo(() => 
    mainSections.find(section => section.id === selectedMain), 
    [mainSections, selectedMain]
  );
  
  const secondLevelItems = useMemo(() => 
    currentMainSection?.subItems || [], 
    [currentMainSection]
  );
  
  // Determinar si el segundo nivel es plano (sin subniveles)
  const isFlatSection = useMemo(() => 
    secondLevelItems.length > 0 && !secondLevelItems.some(item => item.hasSubItems), 
    [secondLevelItems]
  );
  
  // Obtener elementos del tercer nivel
  const thirdLevelItems = useMemo(() => 
    isFlatSection 
      ? secondLevelItems 
      : (secondLevelItems.find(item => item.id === selectedSecond)?.subItems || []),
    [isFlatSection, secondLevelItems, selectedSecond]
  );

  // Función para renderizar un botón de menú
  const renderMenuItem = useCallback((item, level = 0, isSubItem = false) => {
    const isActive = isRouteActive(item.path);
    const isDisabled = item.isUnderConstruction;
    const isSelectedSecond = isSubItem && item.id === selectedSecond;
    
    return (
      <ListItem key={item.id || item.path} disablePadding sx={{ bgcolor: 'transparent' }}>
        <Tooltip 
          title={!isOpen ? item.title : ''} 
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={() => {
              if (item.path && !isDisabled) {
                navigate(item.path);
                // Solo cerrar sidebar en móvil, no en desktop
                if (!isDesktop && isOpen) closeSidebar();
              }
              if (isSubItem) {
                setSelectedSecond(item.id);
              }
            }}
            selected={isActive}
            disabled={isDisabled}
            tabIndex={0}
            sx={{
              minHeight: level === 0 ? 40 : 36,
              pl: isOpen ? (level * 2 + 1.5) : 1,
              pr: isOpen ? 1.5 : 1,
              borderRadius: '12px',
              mb: 0.25,
              justifyContent: isOpen ? 'initial' : 'center',
              backgroundColor: isActive ? '#323232' : isSelectedSecond ? '#232323' : 'transparent',
              '&:hover': {
                backgroundColor: isActive ? '#3a3a3a' : '#232323',
              },
              '&.Mui-selected, &.Mui-selected:hover': {
                backgroundColor: '#323232',
                color: '#fff',
              },
              opacity: isDisabled ? 0.5 : 1,
              transition: 'background 0.2s',
              position: 'relative',
              zIndex: 1
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isOpen ? 1.5 : 'auto',
                justifyContent: 'center',
                color: isActive || isSelectedSecond ? '#fff' : '#bdbdbd',
                alignItems: 'center',
                display: 'flex',
                fontSize: 0,
                height: 24,
                width: 24
              }}
            >
              {item.icon && React.createElement(item.icon, { fontSize: 'small', style: { fontSize: 22, verticalAlign: 'middle' } })}
            </ListItemIcon>
            {isOpen && (
              <ListItemText 
                primary={item.title}
                sx={{ 
                  m: 0,
                  '& .MuiTypography-root': {
                    fontSize: level === 0 ? '0.95rem' : '0.9rem',
                    fontWeight: isActive || isSelectedSecond ? 700 : 400,
                    color: isActive || isSelectedSecond ? '#fff' : '#e0e0e0',
                    letterSpacing: 0.1,
                  }
                }} 
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  }, [isOpen, isDesktop, closeSidebar, navigate, setSelectedSecond, selectedSecond, isRouteActive]);

  // Renderizar encabezado de secciones principales (siempre, en desktop y mobile)
  const renderMainSectionsHeader = useCallback(() => {
    if (!isDesktop) return null; // Ocultar en móvil
    return (
      <Box sx={{
        width: '100%',
        bgcolor: '#181818',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 2, // Misma estructura que EntityToolbar
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: isOpen ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: isOpen ? 'center' : 'flex-start',
          gap: isOpen ? 2 : 1.5,
          width: '100%',
          minHeight: 40, // Misma altura que EntityToolbar
          px: 1,
          py: 0.15, // Padding mínimo para alineación perfecta
        }}>
        {mainSections.map(section => (
          <Tooltip 
            key={section.id} 
            title={section.title} 
            placement={isOpen ? 'bottom' : 'right'} 
            arrow
          >
            <IconButton
              onClick={() => {
                setSelectedMain(section.id);
                if (section.path) {
                  navigate(section.path);
                  // Solo cerrar sidebar en móvil, no en desktop
                  if (!isDesktop && isOpen) closeSidebar();
                }
              }}
              color={selectedMain === section.id ? 'primary' : 'default'}
              sx={{
                bgcolor: selectedMain === section.id ? '#232323' : 'transparent',
                borderRadius: 1, // Cambiado a 1 para seguir el estilo geométrico
                width: 32,
                height: 32,
                m: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                color: selectedMain === section.id ? '#fff' : '#bdbdbd',
                p: 0, // Sin padding interno para alineación perfecta
              }}
            >
              {section.icon && React.createElement(section.icon, { fontSize: 'small' })}
            </IconButton>
          </Tooltip>
        ))}
        </Box>
      </Box>
    );
  }, [isOpen, mainSections, selectedMain, setSelectedMain, navigate, closeSidebar, isDesktop]);

  // Obtener la sección de configuración
  const setupSection = useMemo(() => 
    menuItems.find(item => item.id === 'setup'), 
    [menuItems]
  );

  // Renderizar títulos de sección
  const renderSectionTitle = (title) => (
    <Typography
      variant="caption"
      sx={{
        color: '#bdbdbd',
        fontWeight: 500,
        fontSize: '0.75rem',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        pl: isOpen ? 2 : 0,
        pt: 2,
        pb: 0.5,
        mb: 0.5,
        opacity: 0.7
      }}
    >
      {title}
    </Typography>
  );

  if (!showSidebar && !isOpen) return null;
  // En móvil, solo mostrar si hay thirdLevelItems
  if (!isDesktop && thirdLevelItems.length === 0) return null;
  return (
    <Box sx={{ 
      width: isOpen ? sidebarWidth : 56, 
      transition: 'width 0.3s ease', 
      flexShrink: 0, 
      pb: { xs: '88px', sm: '88px', md: 0 } 
    }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 'auto',
          '& .MuiDrawer-paper': {
            position: 'fixed',
            top: isDesktop ? '40px' : '80px', // 40px header + 40px toolbar en móvil
            width: isOpen ? sidebarWidth : 56,
            height: isDesktop ? 'calc(100vh - 40px)' : 'calc(100vh - 80px)',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            overflowY: 'auto',
            backgroundColor: '#181818',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            zIndex: (theme) => theme.zIndex.drawer,
            pb: { xs: '88px', sm: '88px', md: 0 },
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#232323', borderRadius: 0 },
          }
        }}
      >
        {/* Encabezado de secciones principales */}
        {renderMainSectionsHeader()}

        {/* Mostrar iconos de 3er nivel centrados verticalmente en móvil colapsado */}
        {(!isDesktop && !isOpen && thirdLevelItems.length > 0) && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <List sx={{ p: 0, m: 0 }}>
              {thirdLevelItems.map(subItem => (
                <ListItem key={subItem.id || subItem.path} disablePadding sx={{ bgcolor: 'transparent', justifyContent: 'center', display: 'flex' }}>
                  <Tooltip title={subItem.title} placement="right" arrow>
                    <IconButton
                      onClick={() => {
                        if (subItem.path && !subItem.isUnderConstruction) {
                          navigate(subItem.path);
                          if (!isDesktop && isOpen) closeSidebar();
                        }
                      }}
                      color={isRouteActive(subItem.path) ? 'primary' : 'default'}
                      sx={{
                        bgcolor: isRouteActive(subItem.path) ? '#232323' : 'transparent',
                        borderRadius: 1,
                        width: 32,
                        height: 32,
                        m: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                        color: isRouteActive(subItem.path) ? '#fff' : '#bdbdbd',
                        p: 0,
                        opacity: subItem.isUnderConstruction ? 0.5 : 1
                      }}
                      disabled={subItem.isUnderConstruction}
                    >
                      {subItem.icon && React.createElement(subItem.icon, { fontSize: 'small' })}
                    </IconButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Título de sección - muestra el subgrupo child si está seleccionado */}
        {isOpen && (() => {
          // Si hay una selección de nivel 2, mostrar su título
          if (selectedSecond && !isFlatSection) {
            const selectedSecondItem = secondLevelItems.find(item => item.id === selectedSecond);
            if (selectedSecondItem && selectedSecondItem.title) {
              return (
                <Box sx={{ mt: 2, mb: 0.5, pl: 2 }}>
                  {renderSectionTitle(selectedSecondItem.title)}
                </Box>
              );
            }
          }
          // Si no hay selección de nivel 2, mostrar el título de la sección principal
          if (currentMainSection && currentMainSection.title) {
            return (
              <Box sx={{ mt: 2, mb: 0.5, pl: 2 }}>
                {renderSectionTitle(currentMainSection.title)}
              </Box>
            );
          }
          return null;
        })()}

        {/* Mostrar subniveles y setup SIEMPRE si la sidebar está extendida (isOpen) */}
        {(isOpen || !showEntityToolbarNavigation) && (
          <>
            {/* Si la sección es plana, muestra SIEMPRE todos los subitems arriba */}
            {isFlatSection && secondLevelItems.length > 0 && (
              <List sx={{ p: isOpen ? 1 : 0.5, mt: isDesktop ? 0.5 : 0 }}>
                {secondLevelItems.map(item => renderMenuItem(item, 0, true))}
              </List>
            )}

            {/* Si NO es plana, sigue la lógica de selección */}
            {!isFlatSection && secondLevelItems.length > 0 && (
              !selectedSecond ? (
                <List sx={{ p: isOpen ? 1 : 0.5, mt: isDesktop ? 0.5 : 0 }}>
                  {secondLevelItems.map(item => renderMenuItem(item, 0, true))}
                </List>
              ) : (
                <>
                  {/* Nivel 3: Subsecciones del elemento seleccionado */}
                  {thirdLevelItems.length > 0 && (
                    <List sx={{ p: isOpen ? 1 : 0.5 }}>
                      {thirdLevelItems.map(subItem => renderMenuItem(subItem, 1))}
                    </List>
                  )}
                  
                  {/* Elementos del nivel 2 alineados al margen inferior */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <List sx={{ p: isOpen ? 1 : 0.5 }}>
                      {secondLevelItems.map(item => renderMenuItem(item, 0, true))}
                    </List>
                  </Box>
                </>
              )
            )}
          </>
        )}

        {/* SIEMPRE al final: Setup */}
        <Box sx={{ mt: 'auto' }}>
          {setupSection && (
            <>
              <Divider sx={{ my: 1, borderColor: 'divider', opacity: 0.4 }} />
              <List sx={{ p: isOpen ? 1 : 0.5 }}>
                {renderMenuItem(setupSection, 0)}
              </List>
            </>
          )}
        </Box>
        
        {/* Sidebar Resizer */}
        <SidebarResizer 
          onResize={handleSidebarResize}
          isOpen={isOpen}
          minWidth={200}
          maxWidth={400}
          defaultWidth={sidebarWidth}
        />
      </Drawer>
    </Box>
  );
}
