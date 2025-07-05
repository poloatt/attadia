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
  Tooltip,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { 
  ExpandLess,
  ExpandMore,
  FiberManualRecordOutlined,
  PushPin,
  PushPinOutlined,
  UnfoldMore,
  UnfoldLess
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
    expandSection,
    isPinned,
    togglePinned,
    expandAllSections,
    collapseAllSections,
    collapseSection
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
    // Si alguna subsección está activa, la sección NO debe estar activa visualmente
    const hasActiveSubRoute = item.subItems?.some(subItem => isRouteActive(subItem.path));
    const isMainRouteActive = isRouteActive(item.path);
    const isExpanded = isSectionExpanded(item.id);
    return (!hasActiveSubRoute && (isMainRouteActive || (isOpen && isExpanded)));
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
    const isCollapsedActive = !isOpen && activeSectionForCollapsed?.id === item.id;

    // Sidebar colapsada y sección activa: render especial con óvalo decorativo
    if (!isOpen && item.hasSubItems && isCollapsedActive) {
      return (
        <Box key={item.id} sx={{ position: 'relative', width: '100%' }}>
          {/* Óvalo de fondo decorativo */}
          <Box
            sx={{
              position: 'absolute',
              left: 6,
              right: 6,
              top: -46,
              bottom: 0,
              background: (theme) => theme.palette.action.selected,
              opacity: 0.18,
              borderRadius: 99,
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
          {/* Sección principal, siempre clickeable */}
          <ListItem disablePadding sx={{ position: 'relative', zIndex: 1 }}>
            <Tooltip 
              title={item.hasSubItems ? `${item.title} (click para expandir)` : item.title} 
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => {
                  if (item.path) navigate(item.path);
                  if (item.hasSubItems && isDesktop) expandSection(item.id);
                }}
                sx={{
                  minHeight: 36,
                  justifyContent: 'center',
                  px: 1,
                  borderRadius: '20px',
                  mb: 0.25,
                  backgroundColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                  '&:hover': {
                    backgroundColor: isDesktop ? 'action.selected' : 'transparent',
                    borderRadius: isDesktop ? '8px' : '20px',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 'auto',
                    justifyContent: 'center',
                    position: 'relative',
                    color: 'inherit',
                    zIndex: 1,
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
                {/* Botón de expandir/colapsar individual */}
                {item.hasSubItems && (
                  <Box sx={{ ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        isExpanded ? collapseSection(item.id) : expandSection(item.id);
                      }}
                      sx={{
                        color: 'text.secondary',
                        p: 0.5,
                        ml: 0.5,
                      }}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
          {/* Subsecciones, debajo del ícono principal */}
          <List component="div" disablePadding sx={{ pl: 0, pr: 0, width: '100%', position: 'relative', zIndex: 1 }}>
            {item.subItems?.map((subItem) => (
              <ListItem key={subItem.path} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(subItem.path);
                    if (!isDesktop && isOpen && !isPinned) {
                      closeSidebar();
                    }
                  }}
                  sx={{
                    minHeight: 32,
                    pl: 1,
                    pr: 0.5,
                    borderRadius: '16px',
                    mb: 0.125,
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: isDesktop ? 'action.selected' : 'transparent',
                      borderRadius: isDesktop ? '8px' : '16px',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 'auto',
                      justifyContent: 'center',
                      color: 'inherit',
                      zIndex: 1,
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
                        bgcolor: isDesktop ? 'action.selected' : 'transparent',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 20,
                      }
                    }}>
                      {subItem.icon || <FiberManualRecordOutlined sx={{ fontSize: 8 }} />}
                    </Box>
                  </ListItemIcon>
                  <Tooltip 
                    title={subItem.title} 
                    placement="right"
                    arrow
                  >
                    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                  </Tooltip>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    }

    // Sidebar expandida o sección no activa: render normal
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
                  // Siempre navegar a la ruta principal de la sección
                  if (item.path) {
                    navigate(item.path);
                  }
                  if (isDesktop) {
                    expandSection(item.id); // Asegura que la sección se expanda
                  } else {
                    // En mobile: cerrar sidebar solo si no está pinnada
                    if (isOpen && !isPinned) {
                      closeSidebar();
                    }
                  }
                } else {
                  // Sin subsecciones: navegar normalmente
                  navigate(item.path);
                  if (!isDesktop && isOpen && !isPinned) {
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
                  backgroundColor: isDesktop ? 'action.selected' : 'transparent',
                  borderRadius: isDesktop ? '8px' : '20px',
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
                      <IconButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          isExpanded ? collapseSection(item.id) : expandSection(item.id);
                        }}
                        sx={{
                          color: 'text.secondary',
                          p: 0.5,
                          ml: 0.5,
                        }}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  )}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {/* Subitems - mostrar cuando la sidebar está expandida O cuando está colapsada y es la sección activa */}
        {item.hasSubItems && (
          (isOpen && isExpanded)
        ) && (
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: isOpen ? 0.25 : 0 }}>
              {item.subItems?.map((subItem) => (
                <ListItem key={subItem.path} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      navigate(subItem.path);
                      if (!isDesktop && isOpen && !isPinned) {
                        closeSidebar();
                      }
                    }}
                    sx={{
                      minHeight: 32,
                      pl: isOpen ? 2.5 : 1,
                      pr: isOpen ? 1.5 : 0.5,
                      borderRadius: '16px',
                      mb: 0.125,
                      justifyContent: isOpen ? 'initial' : 'center',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: isDesktop ? 'action.selected' : 'transparent',
                        borderRadius: isDesktop ? '8px' : '16px',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isOpen ? 1 : 'auto',
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
                          bgcolor: isDesktop ? 'action.selected' : 'transparent',
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
                        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
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
          <Box sx={{ 
            p: 1, 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                color: 'primary.main',
                flex: 1,
                textAlign: 'center'
              }}
            >
              Present
            </Typography>
            
            {/* Botones de control */}
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
              {/* Botón de pin */}
              <Tooltip title={isPinned ? "Desanclar sidebar" : "Anclar sidebar"}>
                <IconButton
                  size="small"
                  onClick={togglePinned}
                  sx={{
                    color: isPinned ? 'primary.main' : 'text.secondary',
                    padding: 0.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'primary.main'
                    }
                  }}
                >
                  {isPinned ? <PushPin sx={{ fontSize: '1rem' }} /> : <PushPinOutlined sx={{ fontSize: '1rem' }} />}
                </IconButton>
              </Tooltip>
              
              {/* Botón de expandir/contraer todas las secciones */}
              <Tooltip title="Expandir/Contraer todas las secciones">
                <IconButton
                  size="small"
                  onClick={() => {
                    const hasExpandedSections = menuItems.some(item => 
                      item.hasSubItems && isSectionExpanded(item.id)
                    );
                    if (hasExpandedSections) {
                      collapseAllSections();
                    } else {
                      expandAllSections();
                    }
                  }}
                  sx={{
                    color: 'text.secondary',
                    padding: 0.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'primary.main'
                    }
                  }}
                >
                  {menuItems.some(item => item.hasSubItems && isSectionExpanded(item.id)) ? 
                    <UnfoldLess sx={{ fontSize: '1rem' }} /> : 
                    <UnfoldMore sx={{ fontSize: '1rem' }} />
                  }
                </IconButton>
              </Tooltip>
            </Box>
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