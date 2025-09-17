import React, { memo, useState, isValidElement } from 'react';
import { IconButton, Tooltip, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '../../utils/materialImports';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon } from '@mui/icons-material';
import { useSidebar } from '../../context/SidebarContext';
import { useActionHistory, ACTION_TYPES } from '../../context/ActionHistoryContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import { Refresh as RefreshIcon, Undo as UndoIcon, History as HistoryIcon, AddOutlined as AddOutlinedIcon, VisibilityOff as HideValuesIcon, Apps as AppsIcon } from '@mui/icons-material';
import { Badge, Menu, MenuItem, ListItemText, ListItemIcon, Chip } from '../../utils/materialImports';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { modulos } from '../../navigation/menuStructure';
import { getIconByKey } from '../../navigation/menuIcons';
import { FORM_HEIGHTS } from '../../config/uiConstants';
import { DynamicIcon } from './DynamicIcon';

// Diálogo de confirmación para eliminar
const DeleteConfirmDialog = memo(({ open, onClose, onConfirm, itemName }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    PaperProps={{
      sx: {
        borderRadius: 0,
        bgcolor: 'background.default'
      }
    }}
  >
    <DialogTitle>Confirmar Eliminación</DialogTitle>
    <DialogContent>
      <Typography>
        ¿Estás seguro que deseas eliminar {itemName}?
        Esta acción no se puede deshacer.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>
        Cancelar
      </Button>
      <Button 
        onClick={onConfirm} 
        color="error" 
        variant="contained"
      >
        Eliminar
      </Button>
    </DialogActions>
  </Dialog>
));

/**
 * SystemButtons: Componente global y flexible para acciones de sistema.
 * Props:
 * - actions: array de objetos { key, icon, label, onClick, color, show, disabled, tooltip, confirm, confirmText, ... }
 * - direction: dirección del layout (row/column)
 * - size: tamaño de los botones
 * - disabled: deshabilitar todos los botones
 * - gap: separación entre botones
 */
export const SystemButtons = memo(({
  actions = [],
  direction = 'row',
  size = 'small',
  disabled = false,
  gap = 0.5
}) => {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

  const handleAction = (action, e) => {
    e?.stopPropagation();
    if (action.confirm) {
      setConfirmDialog({ open: true, action });
    } else {
      action.onClick && action.onClick(e);
    }
  };

  const handleConfirm = () => {
    confirmDialog.action?.onClick && confirmDialog.action.onClick();
    setConfirmDialog({ open: false, action: null });
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: direction,
          gap,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto'
        }}
      >
        {actions.filter(Boolean).filter(a => a.show !== false).map((action, idx) => {
          // Si el icono ya es un botón (ej: un IconButton) o un subcomponente con isButtonComponent, renderizarlo directamente
          const isButton = (isValidElement(action.icon) && (
            action.icon.type && (action.icon.type.displayName === 'IconButton' || action.icon.type.muiName === 'IconButton' || action.icon.type.isButtonComponent)
          ));
          if (isButton) {
            // Si ya es un IconButton, no envolver en Tooltip para evitar nesting
            return React.cloneElement(action.icon, {
              key: action.key || action.label || idx,
              disabled: disabled || action.disabled
            });
          }
          return (
            <Tooltip title={action.tooltip || action.label || ''} key={action.key || action.label || idx}>
              <IconButton
                onClick={e => handleAction(action, e)}
                size={action.size || size}
                sx={{
                  color: action.color || 'text.secondary',
                  p: 0.5,
                  '&:hover': {
                    color: action.hoverColor || 'primary.main',
                    backgroundColor: 'transparent'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem'
                  }
                }}
                disabled={disabled || action.disabled}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
      {/* Diálogo de confirmación genérico */}
      <DeleteConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        onConfirm={handleConfirm}
        itemName={confirmDialog.action?.confirmText || confirmDialog.action?.label || 'este registro'}
      />
    </>
  );
});

// Utilidades de iconos estándar para acciones comunes
export const SYSTEM_ICONS = {
  edit: <EditIcon />,
  delete: <DeleteIcon />,
  visibility: <VisibilityIcon />,
  add: <AddIcon />
}; 

// HeaderMenuButton
function HeaderMenuButton({ sx, disabled = false }) {
  const { toggleSidebar } = useSidebar();
  const btn = (
    <IconButton
      onClick={toggleSidebar}
      sx={{
        width: FORM_HEIGHTS.iconButton,
        height: FORM_HEIGHTS.iconButton,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
        color: 'inherit',
        position: 'relative',
        left: 0,
        '&:hover': { color: 'text.primary', background: 'action.hover' },
        ...sx
      }}
      aria-label="Abrir menú"
      disabled={disabled}
    >
      <MenuIcon sx={sx || { fontSize: 18, color: 'text.secondary' }} />
    </IconButton>
  );
  // Si está deshabilitado y se usa en un Tooltip, envolver en <span>
  if (disabled) {
    return <span style={{ display: 'inline-flex' }}>{btn}</span>;
  }
  btn.type.isButtonComponent = true;
  return btn;
}

// HeaderAddButton
function HeaderAddButton({ entityConfig, buttonSx }) {
  const [anchorEl, setAnchorEl] = useState(null);
  // Eliminar navigate y location para simplificar
  const hasSubItems = entityConfig && Array.isArray(entityConfig.subItems) && entityConfig.subItems.length > 0;
  const canAddSelf = entityConfig && entityConfig.canAdd;
  const addableChildren = hasSubItems ? entityConfig.subItems.filter(sub => sub.canAdd) : [];

  // Handler para abrir/cerrar el menú
  const handleOpenMenu = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Handler para crear submodelo
  const handleCreateSubItem = (subItem) => {
    handleCloseMenu();
    window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
      detail: { type: subItem.id, path: subItem.path }
    }));
  };

  // Handler para crear el modelo principal (siempre dispara el evento)
  const handleCreateSelf = () => {
    handleCloseMenu();
    window.dispatchEvent(new CustomEvent('headerAddButtonClicked', {
      detail: { type: entityConfig.id || entityConfig.name, path: entityConfig.path }
    }));
  };

  if (!entityConfig) return null;

  // Si es de tercer nivel (no tiene subItems pero sí canAdd), botón directo
  if (!hasSubItems && canAddSelf) {
    return (
      <Tooltip title={`Agregar ${entityConfig.name || entityConfig.title}`}>
        <IconButton
          size="small"
          onClick={handleCreateSelf}
          sx={{
            background: 'none',
            border: 'none',
            borderRadius: 1,
            boxShadow: 'none',
            padding: 0.5,
            color: 'text.secondary',
            '&:hover': {
              background: 'rgba(255,255,255,0.08)',
              color: 'inherit',
              boxShadow: 'none'
            },
            ...buttonSx
          }}
        >
          <AddOutlinedIcon sx={buttonSx || { fontSize: 18, color: 'text.secondary' }} />
        </IconButton>
      </Tooltip>
    );
  }

  // Si hay opciones para agregar (self o hijos), mostrar menú contextual
  if (canAddSelf || addableChildren.length > 0) {
    return (
      <>
        <Tooltip title={`Agregar ${entityConfig.name || entityConfig.title}`}> 
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{
              background: 'none',
              border: 'none',
              borderRadius: 1,
              boxShadow: 'none',
              padding: 0.5,
              color: 'text.secondary',
              '&:hover': {
                background: 'rgba(255,255,255,0.08)',
                color: 'inherit',
                boxShadow: 'none'
              },
              ...buttonSx
            }}
          >
            <AddOutlinedIcon sx={buttonSx || { fontSize: 18, color: 'text.secondary' }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          {/* Opción principal (nivel 2) primero si existe */}
          {canAddSelf && (
            <MenuItem onClick={handleCreateSelf}>
              <ListItemIcon>
                {entityConfig.icon ? (
                  typeof entityConfig.icon === 'string' ? 
                    <DynamicIcon iconKey={entityConfig.icon} size="small" /> : 
                    (React.isValidElement(entityConfig.icon) ? entityConfig.icon : 
                     (typeof entityConfig.icon === 'function' ? React.createElement(entityConfig.icon) : <AddOutlinedIcon fontSize="small" />))
                ) : <AddOutlinedIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={`Agregar ${entityConfig.name || entityConfig.title}`} />
            </MenuItem>
          )}
          {/* Opciones para cada submodelo agregable */}
          {addableChildren.map((sub) => (
            <MenuItem key={sub.id || sub.title} onClick={() => handleCreateSubItem(sub)} disabled={sub.isUnderConstruction}>
              <ListItemIcon>
                {sub.icon ? (
                  typeof sub.icon === 'string' ? 
                    <DynamicIcon iconKey={sub.icon} size="small" /> : 
                    (React.isValidElement(sub.icon) ? sub.icon : 
                     (typeof sub.icon === 'function' ? React.createElement(sub.icon) : <AddOutlinedIcon fontSize="small" />))
                ) : <AddOutlinedIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={`Agregar ${sub.title}`} />
              {sub.isUnderConstruction && (
                <Chip label="Próximamente" size="small" color="warning" sx={{ ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // Si no hay subItems ni self agregable, botón simple (no debería mostrarse)
  return null;
}

// Marcar el componente como botón para evitar anidado dentro de otro IconButton
HeaderAddButton.isButtonComponent = true;

// HeaderRefreshButton
function HeaderRefreshButton({ iconSx }) {
  const btn = (
    <IconButton 
      size="small"
      onClick={() => window.location.reload()}
      sx={{ color: 'inherit', '&:hover': { color: 'text.primary' } }}
    >
      <RefreshIcon sx={iconSx} />
    </IconButton>
  );
  btn.type.isButtonComponent = true;
  return btn;
}

// HeaderVisibilityButton
function HeaderVisibilityButton({ iconSx }) {
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const btn = (
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
          <HideValuesIcon sx={iconSx} /> : 
          <VisibilityIcon sx={iconSx} />
        }
      </IconButton>
    </Tooltip>
  );
  btn.type.isButtonComponent = true;
  return btn;
}

// HeaderUndoMenu
function HeaderUndoMenu({ iconSx }) {
  const { 
    canUndo, 
    undoLastAction, 
    getUndoCount, 
    getLastActions,
    getActionsByEntity
  } = useActionHistory();
  const [undoMenuAnchor, setUndoMenuAnchor] = useState(null);
  const location = useLocation();
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case ACTION_TYPES.CREATE:
        return <AddIcon sx={iconSx || { fontSize: 16 }} />;
      case ACTION_TYPES.UPDATE:
        return <EditIcon sx={iconSx || { fontSize: 16 }} />;
      case ACTION_TYPES.DELETE:
        return <DeleteIcon sx={iconSx || { fontSize: 16 }} />;
      case ACTION_TYPES.MOVE:
        return <MenuIcon sx={iconSx || { fontSize: 16 }} />;
      default:
        return <HistoryIcon sx={iconSx || { fontSize: 16 }} />;
    }
  };
  const handleUndoLastAction = () => {
    const lastAction = undoLastAction();
    if (lastAction) {
      window.dispatchEvent(new CustomEvent('undoAction', {
        detail: lastAction
      }));
    }
  };
  const handleUndoSpecificAction = (action) => {
    setUndoMenuAnchor(null);
    window.dispatchEvent(new CustomEvent('undoAction', {
      detail: action
    }));
  };
  let combinedActions = [];
  if (location.pathname.startsWith('/proyectos')) {
    const proyectosActions = getActionsByEntity('proyecto');
    const tareasActions = getActionsByEntity('tarea');
    combinedActions = [...proyectosActions, ...tareasActions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else {
    combinedActions = getLastActions(10);
  }
  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={canUndo() ? `Deshacer última acción (${getUndoCount()} disponible${getUndoCount() > 1 ? 's' : ''})` : 'No hay acciones para deshacer'}>
        <span>
          <IconButton
            size="small"
            onClick={canUndo() ? handleUndoLastAction : undefined}
            sx={{
              color: canUndo() ? 'inherit' : 'grey.500',
              '&:hover': { color: canUndo() ? 'text.primary' : 'grey.500' },
              position: 'relative'
            }}
            disabled={!canUndo()}
          >
            <UndoIcon sx={iconSx || { fontSize: 20 }} />
            {canUndo() && getUndoCount() > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: 'inherit',
                  lineHeight: 1
                }}
              >
                {getUndoCount() > 99 ? '99+' : getUndoCount()}
              </span>
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Ver historial de acciones">
        <IconButton 
          size="small"
          onClick={(e) => setUndoMenuAnchor(e.currentTarget)}
          sx={{ 
            color: 'inherit',
            '&:hover': { color: 'text.primary' }
          }}
        >
          <HistoryIcon sx={iconSx || { fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={undoMenuAnchor}
        open={Boolean(undoMenuAnchor)}
        onClose={() => setUndoMenuAnchor(null)}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 350
          }
        }}
      >
        {combinedActions.length > 0 ? combinedActions.slice(0, 10).map((action) => (
          <MenuItem 
            key={action.id}
            onClick={() => handleUndoSpecificAction(action)}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              py: 1
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getActionIcon(action.type)}
            </ListItemIcon>
            <ListItemText 
              primary={action.description}
              secondary={new Date(action.timestamp).toLocaleString('es-ES')}
              primaryTypographyProps={{ fontSize: '0.875rem' }}
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
            <Chip 
              label={action.entity} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </MenuItem>
        )) : (
          <MenuItem disabled>
            <ListItemText primary="No hay acciones para deshacer" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

// Marcar el componente como botón
HeaderUndoMenu.isButtonComponent = true;

// HeaderAppsButton - Menú de apps para móvil
function HeaderAppsButton({ iconSx }) {
  const [appsMenuAnchor, setAppsMenuAnchor] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener los 3 módulos principales
  const modulesList = modulos.filter(m => ['assets', 'salud', 'tiempo'].includes(m.id));

  const handleOpenAppsMenu = (e) => {
    setAppsMenuAnchor(e.currentTarget);
  };

  const handleCloseAppsMenu = () => {
    setAppsMenuAnchor(null);
  };

  const handleNavigateToModule = (modulo) => {
    handleCloseAppsMenu();
    navigate(modulo.path);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Cambiar aplicación">
        <IconButton 
          size="small"
          onClick={handleOpenAppsMenu}
          sx={{ 
            color: 'inherit',
            '&:hover': { color: 'text.primary' }
          }}
        >
          <AppsIcon sx={iconSx || { fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={appsMenuAnchor}
        open={Boolean(appsMenuAnchor)}
        onClose={handleCloseAppsMenu}
        PaperProps={{
          sx: {
            borderRadius: 1,
            bgcolor: 'background.default'
          }
        }}
      >
        {modulesList.map((modulo) => {
          const IconComponent = getIconByKey(modulo.icon);
          const isCurrentModule = location.pathname.startsWith(modulo.path) || 
                                 modulo.subItems?.some(sub => location.pathname.startsWith(sub.path));
          
          return (
            <MenuItem 
              key={modulo.id}
              onClick={() => handleNavigateToModule(modulo)}
              sx={{
                bgcolor: isCurrentModule ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemIcon>
                {IconComponent ? React.createElement(IconComponent, { fontSize: 'small', sx: { color: 'white' } }) : <AddOutlinedIcon fontSize="small" sx={{ color: 'white' }} />}
              </ListItemIcon>
              <ListItemText 
                primary={modulo.title}
                primaryTypographyProps={{ 
                  fontWeight: isCurrentModule ? 600 : 400,
                  color: 'white'
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

// Marcar el componente como botón
HeaderAppsButton.isButtonComponent = true;

// Botón reutilizable de colapso/expandir
export const CollapseIconButton = ({ expanded, onClick, sx = {}, ...props }) => (
  <IconButton
    onClick={onClick}
    size="small"
    sx={{
      transition: 'transform 0.2s',
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      color: 'text.secondary',
      ...sx
    }}
    {...props}
  >
    <ExpandMoreIcon />
  </IconButton>
);

// Exportar subcomponentes
SystemButtons.MenuButton = HeaderMenuButton;
SystemButtons.AddButton = HeaderAddButton;
SystemButtons.RefreshButton = HeaderRefreshButton;
SystemButtons.VisibilityButton = HeaderVisibilityButton;
SystemButtons.UndoMenu = HeaderUndoMenu;
SystemButtons.AppsButton = HeaderAppsButton; 

// Exportar MenuButton explícitamente para uso directo
export function MenuButton(props) {
  const { toggleSidebar } = useSidebar();
  return (
    <IconButton
      onClick={toggleSidebar}
      size="small"
      sx={{
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        color: 'inherit',
        '&:hover': { color: 'text.primary', background: 'action.hover' },
        ...props.sx
      }}
      aria-label="Abrir menú"
      disabled={props.disabled}
    >
      <MenuIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    </IconButton>
  );
} 