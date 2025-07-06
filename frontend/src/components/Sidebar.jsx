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
  FiberManualRecordOutlined,
  TrendingUpOutlined as ChartIcon,
  ApartmentOutlined,
  Inventory2Outlined,
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined,
  RepeatOutlined,
  PersonSearchOutlined,
  PersonOutlined,
  DescriptionOutlined,
  HotelOutlined
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

  // Función para determinar si estamos en una sección de Assets
  const isInAssetsSection = () => {
    const assetsPaths = [
      '/dashboard',
      '/propiedades',
      '/habitaciones',
      '/contratos',
      '/inquilinos',
      '/inventario',
      '/transacciones',
      '/cuentas',
      '/monedas',
      '/recurrente',
      '/deudores'
    ];
    return assetsPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  };

  // Función para determinar qué sección principal de Assets está activa
  const getActiveAssetsSection = () => {
    if (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard') ||
        location.pathname === '/transacciones' || location.pathname.startsWith('/transacciones') ||
        location.pathname === '/cuentas' || location.pathname.startsWith('/cuentas') ||
        location.pathname === '/monedas' || location.pathname.startsWith('/monedas') ||
        location.pathname === '/recurrente' || location.pathname.startsWith('/recurrente') ||
        location.pathname === '/deudores' || location.pathname.startsWith('/deudores')) {
      return 'dashboard';
    } else if (location.pathname === '/propiedades' || location.pathname.startsWith('/propiedades') || 
               location.pathname === '/habitaciones' || location.pathname.startsWith('/habitaciones') ||
               location.pathname === '/contratos' || location.pathname.startsWith('/contratos') ||
               location.pathname === '/inquilinos' || location.pathname.startsWith('/inquilinos')) {
      return 'propiedades';
    } else if (location.pathname === '/inventario' || location.pathname.startsWith('/inventario')) {
      return 'inventario';
    }
    return null;
  };

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

  // Renderizar elemento de Assets fijo
  const renderAssetsFixedItem = (item) => {
    const isActive = isRouteActive(item.path);
    
    return (
      <ListItem key={item.id} disablePadding>
        <Tooltip 
          title={!isOpen ? item.title : ''} 
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={() => {
              navigate(item.path);
              if (!isDesktop && isOpen) {
                closeSidebar();
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
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  // Elementos fijos de Assets
  const assetsFixedItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <ChartIcon />,
      path: '/dashboard'
    },
    {
      id: 'propiedades',
      title: 'Propiedades',
      icon: <ApartmentOutlined />,
      path: '/propiedades'
    },
    {
      id: 'inventario',
      title: 'Inventario',
      icon: <Inventory2Outlined />,
      path: '/inventario'
    }
  ];

  // Obtener subsecciones dinámicas basadas en la sección activa
  const getDynamicSubItems = () => {
    const activeSection = getActiveAssetsSection();
    
    if (activeSection === 'dashboard') {
      return [
        {
          title: 'Transacciones',
          path: '/transacciones',
          icon: <WalletIcon />
        },
        {
          title: 'Cuentas',
          path: '/cuentas',
          icon: <AccountBalanceOutlined />
        },
        {
          title: 'Monedas',
          path: '/monedas',
          icon: <CurrencyExchangeOutlined />
        },
        {
          title: 'Recurrente',
          path: '/recurrente',
          icon: <RepeatOutlined />
        },
        {
          title: 'Deudores',
          path: '/deudores',
          icon: <PersonSearchOutlined />
        }
      ];
    } else if (activeSection === 'propiedades') {
      return [
        {
          title: 'Inquilinos',
          path: '/inquilinos',
          icon: <PersonOutlined />
        },
        {
          title: 'Contratos',
          path: '/contratos',
          icon: <DescriptionOutlined />
        },
        {
          title: 'Habitaciones',
          path: '/habitaciones',
          icon: <HotelOutlined />
        }
      ];
    } else if (activeSection === 'inventario') {
      return []; // Inventario no tiene subsecciones por ahora
    }
    
    return [];
  };

  // Renderizar subsección dinámica
  const renderDynamicSubItem = (subItem) => {
    return (
      <ListItem key={subItem.path} disablePadding>
        <ListItemButton
          onClick={() => {
            navigate(subItem.path);
            if (!isDesktop && isOpen) {
              closeSidebar();
            }
          }}
          selected={isRouteActive(subItem.path)}
          sx={{
            minHeight: 32,
            pl: isOpen ? 2.5 : 1,
            pr: isOpen ? 1.5 : 0.5,
            borderRadius: '16px',
            mb: 0.125,
            justifyContent: isOpen ? 'initial' : 'center',
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
    );
  };

  return (
    <Box sx={{ 
      width: isOpen ? 280 : 56,
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
            top: '40px',
            width: isOpen ? 280 : 56,
            height: 'calc(100vh - 40px)',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            overflowY: 'auto',
            backgroundColor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            zIndex: (theme) => theme.zIndex.drawer,
            pb: { xs: '88px', sm: '88px', md: 0 },
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
            {/* Si estamos en Assets, mostrar estructura especial */}
            {isInAssetsSection() ? (
              <>
                {/* Grupo fijo de Assets */}
                {isOpen && (
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        px: 1.5, 
                        py: 0.5, 
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Assets
                    </Typography>
                  </Box>
                )}
                {assetsFixedItems.map(renderAssetsFixedItem)}
                
                {/* Separador sutil entre grupos */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  my: 1.5,
                  px: isOpen ? 1.5 : 0.5
                }}>
                  <Box sx={{ 
                    width: isOpen ? '80%' : '60%',
                    height: '1px',
                    bgcolor: 'divider',
                    opacity: 0.3
                  }} />
                </Box>
                
                {/* Grupo dinámico de subsecciones */}
                {getDynamicSubItems().length > 0 && (
                  <>
                    {isOpen && (
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {getActiveAssetsSection() === 'dashboard' ? 'Finanzas' : 
                           getActiveAssetsSection() === 'propiedades' ? 'Gestión' : 'Secciones'}
                        </Typography>
                      </Box>
                    )}
                    {getDynamicSubItems().map(renderDynamicSubItem)}
                    
                    {/* Separador sutil al final del grupo dinámico */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      my: 1.5,
                      px: isOpen ? 1.5 : 0.5
                    }}>
                      <Box sx={{ 
                        width: isOpen ? '60%' : '40%',
                        height: '1px',
                        bgcolor: 'divider',
                        opacity: 0.2
                      }} />
                    </Box>
                  </>
                )}
              </>
            ) : (
              /* Mostrar elementos principales normales */
              itemsToShow.map((item) => renderMenuItem(item))
            )}
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