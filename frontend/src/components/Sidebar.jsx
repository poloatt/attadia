import React, { useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton, 
  Divider,
  Collapse,
  Typography,
  Tooltip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { 
  ExpandLess,
  ExpandMore,
  FiberManualRecordOutlined
} from '@mui/icons-material';

export default function Sidebar() {
  const { 
    isOpen, 
    menuItems, 
    toggleSection, 
    isSectionExpanded,
    isDesktop,
    closeSidebar,
    openSidebar,
    expandSection
  } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  // Función para determinar si una ruta está activa
  const isRouteActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Función para determinar si una sección está activa (solo si está directamente activa, no por subsecciones)
  const isSectionActive = (item) => {
    if (!item.path) return false;
    
    // Si la sección tiene subsecciones, solo está activa si está directamente activa
    if (item.hasSubItems) {
      return location.pathname === item.path;
    }
    
    // Si no tiene subsecciones, usar la lógica normal
    return isRouteActive(item.path);
  };

  // Función para determinar si una subsección está activa
  const isSubItemActive = (subItem) => {
    return isRouteActive(subItem.path);
  };

  // Función para determinar si una sección tiene subsecciones activas
  const hasActiveSubItems = (item) => {
    if (!item.hasSubItems || !item.subItems) return false;
    return item.subItems.some(subItem => isSubItemActive(subItem));
  };

  // Función para determinar si un ítem debe mostrar selección
  const shouldShowSelection = (item) => {
    // Si es una subsección, mostrar selección si está activa
    if (item.isSubItem) {
      return isSubItemActive(item);
    }
    
    // Si es una sección principal
    if (item.hasSubItems) {
      // Solo mostrar selección si está directamente activa Y no tiene subsecciones activas
      return isSectionActive(item) && !hasActiveSubItems(item);
    }
    
    // Si no tiene subsecciones, usar la lógica normal
    return isSectionActive(item);
  };

  // Función para encontrar la sección activa actual
  const findActiveSection = () => {
    return menuItems.find(item => {
      if (!item.hasSubItems) return false;
      
      // Verificar si la ruta principal está activa
      if (isRouteActive(item.path)) return true;
      
      // Verificar si alguna subsección está activa
      return item.subItems?.some(subItem => isRouteActive(subItem.path));
    });
  };

  // Función para obtener los elementos de menú a mostrar
  const getMenuItemsToShow = () => {
    if (isDesktop || isOpen) {
      // En desktop o cuando la sidebar está abierta, mostrar todos los elementos excepto configuración
      return menuItems.filter(item => item.id !== 'setup');
    } else {
      // En móvil colapsado, mostrar solo la sección activa
      const activeSection = findActiveSection();
      
      const itemsToShow = [];
      
      // Agregar la sección activa si existe
      if (activeSection) {
        itemsToShow.push(activeSection);
      }
      
      return itemsToShow;
    }
  };

  // Obtener elementos a mostrar
  const itemsToShow = getMenuItemsToShow();

  // Al cambiar de ruta, expandir automáticamente la sección activa y colapsar las demás en desktop
  useEffect(() => {
    if (isDesktop) {
      const activeSection = findActiveSection();
      if (activeSection) {
        expandSection(activeSection.id);
      }
    }
    // eslint-disable-next-line
  }, [location.pathname, isDesktop]);

  // Modifico toggleSection para que en desktop solo una sección esté expandida a la vez
  const handleToggleSection = (sectionId) => {
    if (isDesktop) {
      expandSection(sectionId); // Esto colapsa las demás y expande solo la seleccionada
    } else {
      toggleSection(sectionId); // Comportamiento normal en móvil
    }
  };

  // Renderizar elemento de menú principal
  const renderMenuItem = (item, isConfigItem = false) => {
    const isActive = shouldShowSelection(item);
    const isExpanded = isSectionExpanded(item.id);
    
    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <Tooltip 
            title={!isOpen ? (item.hasSubItems ? `${item.title} (click para expandir)` : item.title) : ''} 
            placement="right"
            arrow
          >
            <ListItemButton
              onClick={() => {
                if (item.hasSubItems) {
                  if (isOpen) {
                    // Si la sidebar está abierta, usar la nueva función
                    handleToggleSection(item.id);
                  } else {
                    // Si la sidebar está cerrada, navegar a la ruta principal si existe
                    if (item.path) {
                      navigate(item.path);
                      // En móvil, colapsar sidebar después de navegar (solo si está expandida)
                      if (!isDesktop && isOpen) {
                        closeSidebar();
                      }
                    }
                  }
                } else if (item.path) {
                  navigate(item.path);
                  if (!isDesktop && isOpen) {
                    closeSidebar();
                  }
                }
              }}
              selected={isActive}
              sx={{
                minHeight: 36,
                justifyContent: isOpen ? 'initial' : 'center',
                px: isOpen ? 1.5 : 1,
                borderRadius: '20px',
                mb: 0.25,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: isOpen ? 'action.hover' : 'transparent',
                },
                '&.Mui-selected, &.Mui-selected:hover': {
                  backgroundColor: !isOpen && !isDesktop ? 'transparent' : 'action.selected',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isOpen ? 1.5 : 'auto',
                  justifyContent: 'center',
                  position: 'relative',
                  color: 'inherit',
                }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  bgcolor: isActive ? 'action.selected' : 'transparent',
                  color: isActive ? 'primary.main' : 'inherit',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isActive ? 'action.selected' : 'action.hover',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 20,
                  }
                }}>
                  {item.icon}
                </Box>
              </ListItemIcon>
              
              {isOpen && (
                <>
                  <ListItemText 
                    primary={item.title}
                    sx={{ 
                      opacity: 1,
                      m: 0,
                      '& .MuiTypography-root': {
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'primary.main' : 'inherit',
                      }
                    }} 
                  />
                  {item.hasSubItems && (
                    <Box sx={{ ml: 1 }}>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  )}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        {/* Subitems - mostrar cuando la sidebar está expandida O cuando está colapsada y es la sección activa */}
        {item.hasSubItems && (
          (isOpen && isExpanded) || (!isOpen && !isDesktop && findActiveSection()?.id === item.id)
        ) && (
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: isOpen ? 0.25 : 0 }}>
              {item.subItems?.map((subItem) => (
                <ListItem key={subItem.path} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      navigate(subItem.path);
                      // En móvil, colapsar sidebar después de navegar (solo si está expandida)
                      if (!isDesktop && isOpen) {
                        closeSidebar();
                      }
                    }}
                    selected={isRouteActive(subItem.path)}
                    sx={{
                      minHeight: 32,
                      pl: isOpen ? 2.5 : 1, // Menos padding en modo colapsado
                      pr: isOpen ? 1.5 : 0.5, // Menos padding en modo colapsado
                      borderRadius: '16px',
                      mb: 0.125,
                      justifyContent: isOpen ? 'initial' : 'center', // Centrado en modo colapsado
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: isOpen ? 'action.hover' : 'transparent',
                      },
                      '&.Mui-selected, &.Mui-selected:hover': {
                        backgroundColor: !isOpen && !isDesktop ? 'transparent' : 'action.selected',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isOpen ? 1 : 'auto', // Sin margin en modo colapsado
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        bgcolor: isRouteActive(subItem.path) ? 'action.selected' : 'transparent',
                        color: isRouteActive(subItem.path) ? 'primary.main' : 'text.disabled',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isRouteActive(subItem.path) ? 'action.selected' : 'action.hover',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 20,
                        }
                      }}>
                        {subItem.icon || <FiberManualRecordOutlined sx={{ fontSize: 8 }} />}
                      </Box>
                    </ListItemIcon>
                    {isOpen && (
                      <ListItemText 
                        primary={subItem.title}
                        sx={{ 
                          m: 0,
                          '& .MuiTypography-root': {
                            fontSize: '0.7rem',
                            fontWeight: isRouteActive(subItem.path) ? 600 : 400,
                            color: isRouteActive(subItem.path) ? 'primary.main' : 'inherit',
                          }
                        }} 
                      />
                    )}
                    {/* Tooltip para subsecciones en modo colapsado */}
                    {!isOpen && (
                      <Tooltip 
                        title={subItem.title} 
                        placement="right"
                        arrow
                      >
                        <Box sx={{ position: 'absolute', inset: 0 }} />
                      </Tooltip>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ 
      width: isOpen ? 280 : 56, // Siempre consistente tanto en desktop como móvil
      transition: 'width 0.3s ease',
      flexShrink: 0,
      pb: { xs: '88px', sm: '88px', md: 0 } // Padding inferior para evitar superposición con BottomNavigation
    }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 'auto',
          '& .MuiDrawer-paper': {
            position: 'fixed',
            top: '40px', // Debajo del header
            width: isOpen ? 280 : 56, // Siempre 56px cuando está colapsada, tanto en desktop como móvil
            height: 'calc(100vh - 40px)', // Altura completa menos el header
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            overflowY: 'auto',
            backgroundColor: 'background.default', // Mismo color que el layout principal
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            zIndex: (theme) => theme.zIndex.drawer, // Debajo del header
            pb: { xs: '88px', sm: '88px', md: 0 }, // Padding inferior para evitar superposición
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'action.hover',
              borderRadius: 0,
            },
          }
        }}
      >
        {/* Header */}
        {isOpen && (
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                color: 'primary.main',
                textAlign: 'center'
              }}
            >
              Present
            </Typography>
          </Box>
        )}

        {/* Menu Items */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          justifyContent: 'space-between'
        }}>
          <List sx={{ 
            p: isOpen ? 1 : 0.5, 
            flex: 1,
            '& .MuiListItem-root:last-child .MuiListItemButton-root': {
              mb: 0
            }
          }}>
            {/* Mostrar elementos principales */}
            {itemsToShow.map((item) => renderMenuItem(item))}
          </List>

          {/* Configuración siempre al final */}
          <List sx={{ p: isOpen ? 1 : 0.5, mt: 'auto' }}>
            {menuItems
              .filter(item => item.id === 'setup')
              .map((item) => renderMenuItem(item, true))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}