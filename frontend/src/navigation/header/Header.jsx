import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  IconButton
} from '@mui/material';
import { useSidebar } from '../../context/SidebarContext';
import { useUISettings } from '../../context/UISettingsContext';
import { useEntityActions } from '../../components/EntityViews/EntityActions';
import { AutorenewOutlined, AddOutlined } from '@mui/icons-material';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { MercadoPagoConnectButton, BankConnectionForm } from '../../components/finance';
import { getBreadcrumbs } from '../breadcrumbUtils';
import { menuItems } from '../menuStructure';
import { icons } from '../menuIcons';
import { Breadcrumbs, useTheme, useMediaQuery } from '@mui/material';
import { SystemButtons, SYSTEM_ICONS } from '../../components/common/SystemButtons';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export default function Header() {
  const { showSidebar } = useSidebar();
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
  const breadcrumbs = getBreadcrumbs(location.pathname, menuItems);

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
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, // Header siempre por encima de sidebar
        backgroundColor: '#181818', // Fondo opaco
        borderBottom: '1px solid',
        borderColor: 'divider',
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
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          <SystemButtons.MenuButton />
          {/* Botón de atrás solo si no estamos en la raíz y la toolbar no está activa */}
          {location.pathname !== '/' && !showEntityToolbarNavigation && (
            <IconButton onClick={handleBack} size="small" sx={{ ml: 0, mr: 0.5 }}>
              {icons.arrowBack ? <icons.arrowBack sx={{ fontSize: 18 }} /> : <span>&larr;</span>}
            </IconButton>
          )}
          {isMobile ? (
            (() => {
              const last = breadcrumbs[breadcrumbs.length - 1];
              const Icon = last?.icon
                ? typeof last.icon === 'string'
                  ? icons[last.icon]
                  : last.icon
                : null;
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
                  {Icon && <Icon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />}
                  <Typography color="inherit" sx={{ fontWeight: 500 }}>
                    {last?.title}
                  </Typography>
                </Box>
              );
            })()
          ) : (
            <Breadcrumbs separator="/" sx={{ fontSize: '0.95rem', color: 'inherit' }}>
              {breadcrumbs.map((item, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                const Icon = item.icon
                  ? typeof item.icon === 'string'
                    ? icons[item.icon]
                    : item.icon
                  : null;
                return isLast ? (
                  <Box key={item.path} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {Icon && <Icon sx={{ fontSize: 16, color: 'primary.main' }} />}
                    <Typography color="inherit" sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                  </Box>
                ) : (
                  <Link key={item.path} to={item.path} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {item.title}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Migración: todos los botones de acción del header en SystemButtons */}
        <SystemButtons
          actions={[
            {
              key: 'refresh',
              icon: <RefreshIcon />,
              label: 'Refrescar',
              tooltip: 'Refrescar',
              onClick: () => window.location.reload(),
              disabled: false
            },
            showAddButton && !showEntityToolbarNavigation && entityConfig ? {
              key: 'add',
              icon: <SystemButtons.AddButton entityConfig={entityConfig} />,
              label: 'Agregar',
              tooltip: 'Agregar',
              disabled: false
            } : null,
            showSidebar === false ? {
              key: 'config',
              icon: icons.settings ? icons.settings({ sx: { fontSize: 20 } }) : <span>⚙️</span>,
              label: 'Configuración',
              tooltip: 'Configuración',
              onClick: () => navigate('/configuracion'),
              disabled: false
            } : null,
            location.pathname.includes('/cuentas') ? {
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
      </Toolbar>
    </AppBar>
  );
} 