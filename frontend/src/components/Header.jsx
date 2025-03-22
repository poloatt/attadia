import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box,
  Tooltip
} from '@mui/material';
import { 
  PsychologyOutlined as BrainIcon,
  SettingsOutlined as SettingsIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon
} from '@mui/icons-material';
import { useSidebar } from '../context/SidebarContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const location = useLocation();
  const navigate = useNavigate();

  const getRouteTitle = () => {
    const path = location.pathname.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1) || 'inicio';
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
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: 40
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
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              color: 'inherit',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <BrainIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'inherit',
              fontSize: '0.875rem'
            }}
          >
            Present / {getRouteTitle()}
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
          <Tooltip title="Configuración">
            <IconButton 
              size="small"
              onClick={toggleSidebar}
              sx={{ 
                color: 'inherit',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 