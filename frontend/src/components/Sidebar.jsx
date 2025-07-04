import React from 'react';
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
    return location.pathname === path;
  };

  // Función para determinar si una sección tiene rutas activas
  const isSectionActive = (item) => {
    if (!item.hasSubItems) {
      return isRouteActive(item.path);
    }
    
    // Una sección con subsecciones está activa si:
    // 1. Alguna de sus subsecciones está activa
    // 2. Su ruta principal está activa
    // 3. Está expandida (para mantener el estado visual)
    const hasActiveSubRoute = item.subItems?.some(subItem => isRouteActive(subItem.path));
    const isMainRouteActive = isRouteActive(item.path);
    const isExpanded = isSectionExpanded(item.id);
    
    return hasActiveSubRoute || isMainRouteActive || (isOpen && isExpanded);
  };

  // Función para encontrar la sección activa actual (para modo colapsado)
  const findActiveSection = () => {
    return menuItems.find(item => {
      if (!item.hasSubItems) return false;
      
      // Verificar si la ruta principal está activa
      if (isRouteActive(item.path)) return true;
      
      // Verificar si alguna subsección está activa
      return item.subItems?.some(subItem => isRouteActive(subItem.path));
    });
  };

  // Obtener la sección activa para mostrar subsecciones en modo colapsado
  const activeSectionForCollapsed = !isOpen ? findActiveSection() : null;

  // Renderizar elemento de menú principal
  const renderMenuItem = (item) => {
    const isActive = isSectionActive(item);
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
                    // Si la sidebar está abierta, toggle la sección
                    toggleSection(item.id);
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
                } else {
                  navigate(item.path);
                  // En móvil, colapsar sidebar después de navegar (solo si está expandida)
                  if (!isDesktop && isOpen) {
                    closeSidebar();
                  }
                }
              }}
              sx={{
                minHeight: 36,
                justifyContent: isOpen ? 'initial' : 'center',
                px: isOpen ? 1.5 : 1,
                borderRadius: '20px',
                mb: 0.25,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
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
          (isOpen && isExpanded) || (!isOpen && activeSectionForCollapsed?.id === item.id)
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
                    sx={{
                      minHeight: 32,
                      pl: isOpen ? 2.5 : 1, // Menos padding en modo colapsado
                      pr: isOpen ? 1.5 : 0.5, // Menos padding en modo colapsado
                      borderRadius: '16px',
                      mb: 0.125,
                      justifyContent: isOpen ? 'initial' : 'center', // Centrado en modo colapsado
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover',
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
      flexShrink: 0 
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
        <List sx={{ 
          p: isOpen ? 1 : 0.5, 
          flex: 1,
          '& .MuiListItem-root:last-child .MuiListItemButton-root': {
            mb: 0
          }
        }}>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </Drawer>
    </Box>
  );
}