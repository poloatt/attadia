import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box
} from '@mui/material';
import { useSidebar } from '../../context/SidebarContext';
import { useUISettings } from '../../context/UISettingsContext';
import { useHeaderActions } from './HeaderActions';
import HeaderMenuButton from './HeaderMenuButton';
import HeaderVisibilityButton from './HeaderVisibilityButton';
import HeaderUndoMenu from './HeaderUndoMenu';
import HeaderAddButton from './HeaderAddButton';
import HeaderRefreshButton from './HeaderRefreshButton';

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

          {/* Botón de agregar siempre a la derecha */}
          {showAddButton && (
            <HeaderAddButton entityConfig={entityConfig} />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
} 