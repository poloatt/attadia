import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Box,
    IconButton,
    Tooltip
  } from '@mui/material';
  import { useSidebar } from '../context/SidebarContext';
  import { useUISettings } from '../context/UISettingsContext';
  import { useEntityActions } from '../components/common/CommonActions';
  import { AutorenewOutlined, AddOutlined } from '@mui/icons-material';
  import { useLocation, Link, useNavigate } from 'react-router-dom';
  import { useState } from 'react';
  import Dialog from '@mui/material/Dialog';
  import { MercadoPagoConnectButton, BankConnectionForm } from '../components/finance/bankconnections';
  import { getBreadcrumbs } from './breadcrumbUtils';
  import { modulos } from './menuStructure';
  import { getIconByKey } from './menuIcons';
  import { Breadcrumbs, useTheme, useMediaQuery } from '@mui/material';
  import { SystemButtons, SYSTEM_ICONS, MenuButton } from '../components/common/SystemButtons';
  import { Refresh as RefreshIcon } from '@mui/icons-material';
  import theme from '../context/ThemeContext';
  import React from 'react';
  
  export default function Header() {
    const { toggleSidebar } = useSidebar();
    const { showEntityToolbarNavigation } = useUISettings();
    const { 
      getRouteTitle, 
      getEntityConfig, 
      showAddButton 
    } = useEntityActions();
  
    const entityConfig = getEntityConfig();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isBankConnectionFormOpen, setIsBankConnectionFormOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const breadcrumbs = getBreadcrumbs(location.pathname, modulos);
  
    const handleBack = () => {
      // Encuentra el menú padre según la ruta
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 1) {
        // Quita el último segmento
        const parentPath = '/' + pathParts.slice(0, -1).join('/');
        navigate(parentPath);
      } else {
        navigate('/');
      }
    };
  
    return (
      <AppBar 
        position="fixed" 
        color="default" // <-- Forzar uso del color de fondo definido en el theme
        elevation={0}    // <-- Quitar sombra
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, // Header siempre por encima de sidebar
          backgroundColor: '#181818', // <-- Forzar color exacto
          boxShadow: 'none', // <-- Forzar sin sombra
          height: 40,
          left: 0, // Header ocupa todo el ancho
          width: '100%', // Header siempre 100% del ancho
          transition: 'none', // Sin transiciones innecesarias
          top: 0 // Header siempre arriba de todo
        }}
      >
        <Toolbar 
          variant="dense"
          sx={{ 
            minHeight: 40,
            height: 40,
            px: {
              xs: 1,
              sm: 2,
              md: 3
            },
            boxShadow: 'none' // <-- Forzar sin sombra en Toolbar
          }}
        >
          <Box
            sx={{
              width: '100%',
              px: { xs: 1, sm: 2, md: 3 },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: 1
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <MenuButton />
              {/* Botón de atrás solo si no estamos en la raíz y la toolbar no está activa */}
              {location.pathname !== '/' && !showEntityToolbarNavigation && (
                <IconButton onClick={handleBack} size="small" sx={{ ml: 0, mr: 0.5 }}>
                  {icons.arrowBack ? <icons.arrowBack sx={{ fontSize: 18 }} /> : <span>&larr;</span>}
                </IconButton>
              )}
              {(() => {
                const last = breadcrumbs[breadcrumbs.length - 1];
                const IconComponent = last?.icon && typeof last.icon === 'string' ? getIconByKey(last.icon) : null;
                return (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      width: '100%',
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  >
                    {IconComponent && React.createElement(IconComponent, { fontSize: 'small', color: 'primary.main', style: { marginRight: 4 } })}
                    <Typography color="inherit" sx={{ fontWeight: 500 }}>
                      {last?.title}
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
  
            <Box sx={{ flexGrow: 1 }} />

            {/* Íconos de los otros dos módulos principales */}
            {(() => {
              // Detectar el módulo activo
              const moduloActivo = modulos.find(modulo =>
                modulo.subItems?.some(sub => location.pathname.startsWith(sub.path)) ||
                location.pathname.startsWith(modulo.path)
              );
              // Filtrar los otros dos módulos
              const otrosModulos = modulos.filter(m => m.id !== moduloActivo?.id && ['assets', 'salud', 'tiempo'].includes(m.id));
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', flexGrow: 0, justifyContent: 'flex-end' }}>
                  {otrosModulos.map(modulo => {
                    const IconComponent = getIconByKey(modulo.icon);
                    return (
                      <Tooltip key={modulo.id} title={modulo.title}>
                        <IconButton
                          onClick={() => navigate(modulo.path)}
                          size="small"
                          sx={{
                            bgcolor: 'transparent',
                            color: 'text.secondary', // color más neutro
                            borderRadius: 1,
                            fontSize: 22,
                            transition: 'color 0.2s',
                            '&:hover': {
                              color: 'primary.main', // solo resalta en hover
                              bgcolor: 'action.hover',
                            },
                            mx: 0.25 // mínimo espacio entre iconos
                          }}
                        >
                          {IconComponent && React.createElement(IconComponent, { fontSize: 'small' })}
                        </IconButton>
                      </Tooltip>
                    );
                  })}
                </Box>
              );
            })()}

            {/* Migración: todos los botones de acción del header en SystemButtons */}
            <SystemButtons
              actions={[
                !showEntityToolbarNavigation && showAddButton && entityConfig ? {
                  key: 'add',
                  icon: <SystemButtons.AddButton entityConfig={entityConfig} />, // Solo visual, sin lógica local
                  label: 'Agregar',
                  tooltip: 'Agregar',
                  disabled: false
                } : null,
                !showEntityToolbarNavigation ? {
                  key: 'config',
                  icon: icons.settings ? <icons.settings sx={{ fontSize: 20 }} /> : <span>⚙️</span>,
                  label: 'Configuración',
                  tooltip: 'Configuración',
                  onClick: () => navigate('/configuracion'),
                  disabled: false
                } : null,
                !showEntityToolbarNavigation && location.pathname.includes('/cuentas') ? {
                  key: 'sync',
                  icon: <AutorenewOutlined sx={{ fontSize: 20, color: 'white' }} />,
                  label: 'Sincronizar',
                  tooltip: 'Sincronizar nueva cuenta',
                  onClick: () => setIsSyncModalOpen(true),
                  disabled: false
                } : null,
              ]}
              direction="row"
              size="small"
            />
            {/* Diálogos modales para sincronizar y agregar cuenta */}
            <Dialog open={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} maxWidth="xs" fullWidth>
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sincronizar nueva cuenta</Typography>
                <MercadoPagoConnectButton
                  onSuccess={() => setIsSyncModalOpen(false)}
                  onError={() => setIsSyncModalOpen(false)}
                />
              </Box>
            </Dialog>
            <Dialog open={isBankConnectionFormOpen} onClose={() => setIsBankConnectionFormOpen(false)} maxWidth="xs" fullWidth>
              <BankConnectionForm onClose={() => setIsBankConnectionFormOpen(false)} />
            </Dialog>
          </Box>
        </Toolbar>
      </AppBar>
    );
  } 