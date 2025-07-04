import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box,
  Tooltip
} from '@mui/material';
import { 
  MenuOutlined as MenuIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon
} from '@mui/icons-material';
import { useSidebar } from '../context/SidebarContext';
import { useUISettings } from '../context/UISettingsContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { toggleSidebar, isOpen, isDesktop } = useSidebar();
  const { showSidebar } = useUISettings();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const location = useLocation();
  const navigate = useNavigate();

  const getRouteTitle = () => {
    const path = location.pathname.split('/')[1];
    
    // Mapeo personalizado de rutas
    const customRouteTitles = {
      '': 'mis assets',          // ruta raíz (Dashboard)
      'dashboard': 'mis assets', // También para la ruta /dashboard
      'rutinas': 'mi salud',
      'tiempo': 'mi tiempo'
    };
    
    return customRouteTitles[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Rutas donde se debe mostrar el botón de visibilidad
  const showVisibilityButton = [
    '/', // Dashboard
    '/dashboard', // También en la ruta /dashboard
    '/transacciones',
    '/cuentas',
    '/monedas',
    '/proyectos',
    '/tareas',
    '/archivo',
    '/propiedades',
    '/contratos'
  ].includes(location.pathname);

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
          {showSidebar && (
            <Tooltip title="Menú">
          <IconButton 
                onClick={toggleSidebar}
            sx={{ 
              color: 'inherit',
                  width: 36,
                  height: 36,
                  minWidth: 0,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
              '&:hover': { color: 'text.primary' }
            }}
          >
                <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>
            </Tooltip>
          )}
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

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {showVisibilityButton && (
            <Tooltip title={showValues ? 'Ocultar valores' : 'Mostrar valores'}>
              <IconButton 
                size="small"
                onClick={toggleValuesVisibility}
                sx={{ 
                  color: 'inherit',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                {showValues ? 
                  <HideValuesIcon sx={{ fontSize: 20 }} /> : 
                  <ShowValuesIcon sx={{ fontSize: 20 }} />
                }
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}