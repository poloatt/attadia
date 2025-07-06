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
  VisibilityOff as HideValuesIcon,
  AddOutlined as AddIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import { useSidebar } from '../context/SidebarContext';
import { useUISettings } from '../context/UISettingsContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useActionHistory } from '../context/ActionHistoryContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { toggleSidebar, isOpen, isDesktop } = useSidebar();
  const { showSidebar, showEntityToolbarNavigation } = useUISettings();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const { canUndo, undoLastAction, getUndoCount } = useActionHistory();
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

  // Configuración para el botón de crear registros
  const getEntityConfig = () => {
    const path = location.pathname.slice(1); // Elimina el / inicial
    
    const configs = {
      proyectos: {
        name: 'proyecto',
        action: () => {
          // Disparar evento para que el componente de la página maneje la creación
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'proyecto', path: '/proyectos' }
          }));
        }
      },
      tareas: {
        name: 'tarea',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'tarea', path: '/tareas' }
          }));
        }
      },
      propiedades: {
        name: 'propiedad',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'propiedad', path: '/propiedades' }
          }));
        }
      },
      transacciones: {
        name: 'transacción',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'transaccion', path: '/transacciones' }
          }));
        }
      },
      cuentas: {
        name: 'cuenta',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'cuenta', path: '/cuentas' }
          }));
        }
      },
      monedas: {
        name: 'moneda',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'moneda', path: '/monedas' }
          }));
        }
      },
      rutinas: {
        name: 'rutina',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'rutina', path: '/rutinas' }
          }));
        }
      },
      inquilinos: {
        name: 'inquilino',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'inquilino', path: '/inquilinos' }
          }));
        }
      },
      contratos: {
        name: 'contrato',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'contrato', path: '/contratos' }
          }));
        }
      },
      habitaciones: {
        name: 'habitación',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'habitacion', path: '/habitaciones' }
          }));
        }
      },
      inventario: {
        name: 'inventario',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'inventario', path: '/inventario' }
          }));
        }
      },
      recurrente: {
        name: 'transacción recurrente',
        action: () => {
          window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
            detail: { type: 'transaccion-recurrente', path: '/recurrente' }
          }));
        }
      }
    };

    return configs[path] || null;
  };

  // Rutas donde se debe mostrar el botón de agregar cuando el EntityToolbar esté oculto
  // Excluimos inventario, transacciones y propiedades porque tienen el botón en la toolbar
  const showAddButton = !showEntityToolbarNavigation && [
    '/proyectos',
    '/tareas',
    '/cuentas',
    '/monedas',
    '/rutinas',
    '/inquilinos',
    '/contratos',
    '/habitaciones',
    '/recurrente'
  ].includes(location.pathname);

  // Rutas donde se debe mostrar el botón de revertir acciones
  const showUndoButton = [
    '/proyectos',
    '/tareas'
  ].includes(location.pathname);

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

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
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

          {/* Botón de revertir acciones */}
          {showUndoButton && canUndo() && (
            <Tooltip title={`Revertir última acción (${getUndoCount()} disponible${getUndoCount() > 1 ? 's' : ''})`}>
              <IconButton 
                size="small"
                onClick={() => {
                  const lastAction = undoLastAction();
                  if (lastAction) {
                    // Disparar evento para que el componente maneje la reversión
                    window.dispatchEvent(new CustomEvent('undoAction', {
                      detail: lastAction
                    }));
                  }
                }}
                sx={{ 
                  color: 'inherit',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                <UndoIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Botón de agregar cuando EntityToolbar está oculto */}
          {showAddButton && entityConfig && (
            <Tooltip title={`Agregar ${entityConfig.name}`}>
              <IconButton 
                size="small"
                onClick={entityConfig.action}
                sx={{ 
                  color: 'inherit',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}