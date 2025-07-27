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
import { getIconByKey, icons } from './menuIcons';
import { Breadcrumbs } from '@mui/material';
import useResponsive from '../hooks/useResponsive';
import { useNavigationState } from '../utils/navigationUtils';
import { HEADER_CONFIG } from '../config/uiConstants';
import { DynamicIcon } from '../components/common/DynamicIcon';
  import { SystemButtons, SYSTEM_ICONS, MenuButton } from '../components/common/SystemButtons';
  import { Refresh as RefreshIcon } from '@mui/icons-material';
  import theme from '../context/ThemeContext';
  import React from 'react';
  
  export default function Header() {
    const { toggleSidebar, isOpen: sidebarIsOpen, collapsedWidth, getMainMargin } = useSidebar();
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
    const { isMobile, isTablet } = useResponsive();
    const { moduloActivo } = useNavigationState(location.pathname);
    // Usar módulos completos si moduloActivo no está disponible
    const breadcrumbs = getBreadcrumbs(location.pathname, moduloActivo?.subItems || []);
    
    // Usar función centralizada para calcular mainMargin
    const mainMargin = getMainMargin(isMobile || isTablet);
  
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
          height: HEADER_CONFIG.height,
          left: 0, // Header ocupa todo el ancho
          width: '100%', // Header siempre 100% del ancho
          transition: 'none', // Sin transiciones innecesarias
          top: 0 // Header siempre arriba de todo
        }}
      >
        <Toolbar 
          variant="dense"
          sx={{ 
            minHeight: HEADER_CONFIG.height,
            height: HEADER_CONFIG.height,
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
                         {/* MenuButton fijo - siempre en la misma posición */}
             <Box sx={{ 
               position: 'absolute',
               left: 0,
               top: 0,
               width: collapsedWidth, // Siempre usa el ancho colapsado (56px)
               height: HEADER_CONFIG.height,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 2
             }}>
               <MenuButton />
             </Box>
            
            {/* Sección de navegación alineada con main content */}
            <Box sx={{ 
              marginLeft: `${mainMargin}px`,
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
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
                      left: `${mainMargin}px`,
                      right: 0,
                      width: `calc(100% - ${mainMargin}px)`,
                      height: HEADER_CONFIG.height,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  >
                    {last?.icon && (
                      <DynamicIcon 
                        iconKey={last.icon} 
                        size="small" 
                        color="primary.main" 
                        sx={{ marginRight: 0.5 }} 
                      />
                    )}
                    <Typography color="inherit" sx={{ fontWeight: 500 }}>
                      {last?.title}
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
  
            <Box sx={{ flexGrow: 1 }} />

                         {/* Migración: todos los botones de acción del header en SystemButtons */}
             <SystemButtons
               actions={[
                 // Botón Apps solo en móvil
                 isMobile ? {
                   key: 'apps',
                   icon: <SystemButtons.AppsButton />,
                   label: 'Aplicaciones',
                   tooltip: 'Cambiar aplicación',
                   disabled: false
                 } : null,
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