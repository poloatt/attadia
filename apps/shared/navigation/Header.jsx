import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Box,
    IconButton,
    Tooltip
  } from '../utils/materialImports';
  import { useSidebar } from '../context/SidebarContext';
  import { useUISettings } from '../context/UISettingsContext';
  import { useEntityActions } from '../components/common/CommonActions';
  import { AutorenewOutlined, AddOutlined } from '@mui/icons-material';
  import { useLocation, Link, useNavigate } from 'react-router-dom';
  import { useState } from 'react';
  import { Dialog } from '../utils/materialImports';
  // import { MercadoPagoConnectButton, BankConnectionForm } from '../../../atta/src/finance/bankconnections'; // Comentado: import cruzado
  import { getBreadcrumbs } from './breadcrumbUtils';
import { getIconByKey, icons } from './menuIcons';
import { modulos } from './menuStructure';
import { Breadcrumbs } from '../utils/materialImports';
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
    const { showEntityToolbarNavigation, showSidebarCollapsed } = useUISettings();
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
    // Construir breadcrumbs incluyendo el módulo padre cuando estés dentro de un módulo
    let breadcrumbs = [];
    if (moduloActivo) {
      // Si estás dentro de un módulo, incluir el módulo padre
      breadcrumbs = getBreadcrumbs(location.pathname, [moduloActivo]);
    } else {
      // Si no estás dentro de un módulo, usar todos los módulos
      breadcrumbs = getBreadcrumbs(location.pathname, modulos);
    }
    
    // Usar función centralizada para calcular mainMargin (pasando visibilidad colapsada en móvil)
    const mainMargin = getMainMargin(isMobile || isTablet, showSidebarCollapsed);
  
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

    // Determinar si se debe mostrar el botón atrás: ocultarlo en raíz y en niveles padre del menú (ej: finanzas, bienes, etc.)
    const shouldShowBackButton = (() => {
      const path = location.pathname;
      if (path === '/') return false;
      // Construir lista de rutas que actúan como nivel padre (tienen subItems) o módulos raíz
      const parentPaths = new Set();
      modulos.forEach(m => {
        if (m.path) parentPaths.add(m.path);
        if (Array.isArray(m.subItems)) {
          m.subItems.forEach(s => {
            if (s.path && Array.isArray(s.subItems) && s.subItems.length > 0) {
              parentPaths.add(s.path);
            }
          });
        }
      });
      return !parentPaths.has(path);
    })();
  
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
              flex: 1,
              position: 'relative'
            }}
          >
            {/* Layout específico para móvil/tablet cuando la toolbar está deshabilitada */}
            {(isMobile || isTablet) && !showEntityToolbarNavigation ? (
              <Box sx={{
                width: '100%',
                height: HEADER_CONFIG.height,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 0.5
              }}>
                {/* Izquierda: primero Menú y luego Atrás */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: HEADER_CONFIG.height, height: HEADER_CONFIG.height }}>
                    <MenuButton />
                  </Box>
                  {shouldShowBackButton && (
                    <IconButton onClick={handleBack} size="small" aria-label="Volver" sx={{ width: HEADER_CONFIG.height, height: HEADER_CONFIG.height }}>
                      {icons.arrowBack ? <icons.arrowBack sx={{ fontSize: 18 }} /> : <span>&larr;</span>}
                    </IconButton>
                  )}
                </Box>
                {/* Centro: ruta/título centrado */}
                {(() => {
                  const last = breadcrumbs[breadcrumbs.length - 1];
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {last?.icon && (
                        <DynamicIcon 
                          iconKey={last.icon} 
                          size="small" 
                          color="primary.main" 
                          sx={{ marginRight: 0.5 }} 
                        />
                      )}
                      <Typography color="inherit" sx={{ fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {last?.title}
                      </Typography>
                    </Box>
                  );
                })()}
                {/* Derecha: [acciones extra, + opcional, settings] ... [espaciador] ... [apps al extremo derecho] */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: '100%' }}>
                  {/* Acciones adicionales futuras: colócalas aquí a la izquierda dentro de este grupo */}
                  {/* Botón + (si se puede agregar) */}
                  {showAddButton && entityConfig ? (
                    <SystemButtons.AddButton entityConfig={entityConfig} />
                  ) : null}
                  {/* Settings */}
                  <IconButton 
                    size="small" 
                    onClick={() => navigate('/configuracion')} 
                    aria-label="Configuración"
                    sx={{ color: 'inherit', '&:hover': { color: 'text.primary' } }}
                  >
                    {icons.settings ? <icons.settings sx={{ fontSize: 20 }} /> : <span>⚙️</span>}
                  </IconButton>
                  {/* Espaciador para empujar Apps al extremo derecho */}
                  <Box sx={{ flexGrow: 1 }} />
                  {/* Apps toggle siempre último y alineado a la derecha */}
                  <SystemButtons.AppsButton />
                </Box>
              </Box>
            ) : (
              <>
                {/* MenuButton fijo - solo en desktop */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: collapsedWidth,
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
                  marginLeft: showEntityToolbarNavigation ? 0 : `${mainMargin}px`,
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  flex: 1
                }}>
                  {/* Botón de atrás solo si no estamos en la raíz y la toolbar no está activa */}
                  {shouldShowBackButton && !showEntityToolbarNavigation && (
                    <IconButton onClick={handleBack} size="small" sx={{ ml: 0, mr: 0.5 }}>
                      {icons.arrowBack ? <icons.arrowBack sx={{ fontSize: 18 }} /> : <span>&larr;</span>}
                    </IconButton>
                  )}
                </Box>
              </>
            )}

            {/* Título centrado - solo en desktop */}
            {!isMobile && !isTablet && (() => {
              const last = breadcrumbs[breadcrumbs.length - 1];
              return (
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${mainMargin}px`,
                    right: 0,
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

            {/* Título para móvil/tablet ahora lo maneja el layout específico cuando la toolbar está deshabilitada */}
            {(isMobile || isTablet) && showEntityToolbarNavigation && (() => {
              const last = breadcrumbs[breadcrumbs.length - 1];
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

            {/* En móvil/tablet con toolbar habilitada, mantener Apps toggle alineado a la derecha */}
            {(isMobile || isTablet) && showEntityToolbarNavigation && (
              <Box sx={{ position: 'absolute', right: { xs: 1, sm: 2, md: 3 }, display: 'flex', alignItems: 'center', height: HEADER_CONFIG.height }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: HEADER_CONFIG.height, height: HEADER_CONFIG.height }}>
                  <SystemButtons.AppsButton />
                </Box>
              </Box>
            )}
  
            <Box sx={{ flexGrow: 1 }} />

                         {/* Migración: todos los botones de acción del header en SystemButtons */}
             {/* Acciones sólo en desktop; en móvil ya están controladas arriba */}
             {(!isMobile && !isTablet) && (
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
             )}
            {/* Diálogos modales para sincronizar y agregar cuenta */}
            <Dialog open={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} maxWidth="xs" fullWidth>
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sincronizar nueva cuenta</Typography>
                {/* <MercadoPagoConnectButton
                  onSuccess={() => setIsSyncModalOpen(false)}
                  onError={() => setIsSyncModalOpen(false)}
                /> */}
              </Box>
            </Dialog>
            {/* <Dialog open={isBankConnectionFormOpen} onClose={() => setIsBankConnectionFormOpen(false)} maxWidth="xs" fullWidth>
              <BankConnectionForm onClose={() => setIsBankConnectionFormOpen(false)} />
            </Dialog> */}
          </Box>
        </Toolbar>
      </AppBar>
    );
  } 