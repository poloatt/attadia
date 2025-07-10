import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  IconButton
} from '@mui/material';
import { useSidebar } from '../../context/SidebarContext';
import { useUISettings } from '../../context/UISettingsContext';
import { useHeaderActions } from './HeaderActions';
import HeaderMenuButton from './HeaderMenuButton';
import HeaderVisibilityButton from './HeaderVisibilityButton';
import HeaderUndoMenu from './HeaderUndoMenu';
import HeaderAddButton from './HeaderAddButton';
import HeaderRefreshButton from './HeaderRefreshButton';
import { AutorenewOutlined, AddOutlined } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import MercadoPagoConnectButton from '../bankconnections/MercadoPagoConnectButton';
import BankConnectionForm from '../bankconnections/BankConnectionForm';

export default function Header() {
  const { showSidebar } = useSidebar();
  const { showEntityToolbarNavigation } = useUISettings();
  const { 
    getRouteTitle, 
    showVisibilityButton, 
    getEntityConfig, 
    showAddButton, 
    showUndoButton 
  } = useHeaderActions();

  const entityConfig = getEntityConfig();
  const location = useLocation();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBankConnectionFormOpen, setIsBankConnectionFormOpen] = useState(false);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, // Header siempre por encima de sidebar
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
          <HeaderMenuButton />
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'inherit',
              fontSize: '0.875rem'
            }}
          >
            {getRouteTitle()}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {showVisibilityButton && <HeaderVisibilityButton />}
          
          {showUndoButton && <HeaderUndoMenu />}

          <HeaderRefreshButton />

          {/* Botón de sincronizar solo en la página de cuentas */}
          {location.pathname.includes('/cuentas') && (
            <>
              <IconButton
                onClick={() => setIsSyncModalOpen(true)}
                size="small"
                aria-label="Sincronizar"
                color="inherit"
              >
                <AutorenewOutlined sx={{ fontSize: 20, color: 'white' }} />
              </IconButton>
              <Dialog open={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} maxWidth="xs" fullWidth>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Sincronizar nueva cuenta</Typography>
                  <MercadoPagoConnectButton
                    onSuccess={() => setIsSyncModalOpen(false)}
                    onError={() => setIsSyncModalOpen(false)}
                  />
                </Box>
              </Dialog>
              {/* Botón de agregar cuenta (abre BankConnectionForm) */}
              <IconButton
                onClick={() => setIsBankConnectionFormOpen(true)}
                size="small"
                aria-label="Agregar"
                color="inherit"
              >
                <AddOutlined sx={{ fontSize: 20, color: 'white' }} />
              </IconButton>
              <BankConnectionForm
                open={isBankConnectionFormOpen}
                onClose={() => setIsBankConnectionFormOpen(false)}
                onSubmit={() => setIsBankConnectionFormOpen(false)}
                isEditing={false}
              />
            </>
          )}
          {/* Botón de agregar siempre a la derecha, excepto en cuentas */}
          {!location.pathname.includes('/cuentas') && showAddButton && (
            <HeaderAddButton entityConfig={entityConfig} />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
} 