import React, { memo, useState, isValidElement } from 'react';
import { IconButton, Tooltip, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, ButtonBase, CircularProgress } from '../../utils/materialImports';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon, CheckBoxOutlined as MultiSelectIcon } from '@mui/icons-material';
import { useSidebar } from '../../context/SidebarContext';
import { useActionHistory, ACTION_TYPES } from '../../context/ActionHistoryContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import { Refresh as RefreshIcon, Undo as UndoIcon, AddOutlined as AddOutlinedIcon, VisibilityOff as HideValuesIcon, Apps as AppsIcon, ArchiveOutlined as ArchiveIcon, Sync as SyncIcon } from '@mui/icons-material';
import { Menu, MenuItem, ListItemText, ListItemIcon, Chip, Divider } from '../../utils/materialImports';
import { SettingsOutlined as SettingsOutlinedIcon } from '@mui/icons-material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { modulos } from '../../navigation/menuStructure';
import { getIconByKey } from '../../navigation/menuIcons';
import { FORM_HEIGHTS } from '../../config/uiConstants';
import { DynamicIcon } from './DynamicIcon';
import { config } from '../../config/envConfig.js';
import { navigateToAppPath } from '../../utils/navigationUtils';
import useResponsive from '../../hooks/useResponsive';

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
  gap = 0.25,
  sx: containerSx = {}
}) => {
  const { isMobile } = useResponsive();
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
          gap: typeof gap === 'number' ? (isMobile ? gap * 0.5 : gap) : gap,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          ...containerSx
        }}
      >
        {actions
          .filter(Boolean)
          .filter(a => a.show !== false)
          .filter(a => !!a.icon)
          .map((action, idx) => {
          // Si el icono ya es un botón (ej: un IconButton) o un subcomponente con isButtonComponent, renderizarlo directamente
          const isButton = (isValidElement(action.icon) && (
            action.icon.type && (action.icon.type.displayName === 'IconButton' || action.icon.type.muiName === 'IconButton' || action.icon.type.isButtonComponent)
          ));
          if (isButton) {
            // Si ya es un IconButton, no envolver en Tooltip para evitar nesting
            // Aplicar buttonSx si existe, mergeando con los props existentes del elemento
            const existingSx = action.icon.props?.sx || {};
            // Merge simple: buttonSx sobrescribe existingSx, pero preservamos valores responsive
            // si buttonSx tiene valores simples y existingSx tiene responsive, no sobrescribir
            let mergedSx = { ...existingSx };
            if (action.buttonSx) {
              Object.keys(action.buttonSx).forEach(key => {
                const buttonValue = action.buttonSx[key];
                const existingValue = existingSx[key];
                const isExistingResponsive = existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue) && 
                    (existingValue.xs !== undefined || existingValue.sm !== undefined);
                const isButtonResponsive = buttonValue && typeof buttonValue === 'object' && !Array.isArray(buttonValue) && 
                    (buttonValue.xs !== undefined || buttonValue.sm !== undefined);
                
                // Si ambos son responsive, mergear breakpoints
                if (isExistingResponsive && isButtonResponsive) {
                  mergedSx[key] = { ...existingValue, ...buttonValue };
                }
                // Si solo buttonValue es responsive, usar buttonValue
                else if (isButtonResponsive) {
                  mergedSx[key] = { ...(existingValue || {}), ...buttonValue };
                }
                // Si existingValue es responsive y buttonValue es simple, preservar responsive (no sobrescribir)
                else if (isExistingResponsive) {
                  // No hacer nada, preservar existingValue
                  return;
                }
                // Ambos son simples, sobrescribir
                else {
                  mergedSx[key] = buttonValue;
                }
              });
            }
            return React.cloneElement(action.icon, {
              key: action.key || action.label || idx,
              disabled: disabled || action.disabled,
              sx: mergedSx
            });
          }
          return (
            <Tooltip title={action.tooltip || action.label || ''} key={action.key || action.label || idx}>
              <IconButton
                onClick={e => handleAction(action, e)}
                size={action.size || size}
                sx={{
                  color: action.color || 'text.secondary',
                  p: isMobile ? 0.25 : 0.5,
                  '&:hover': {
                    color: action.hoverColor || 'primary.main',
                    backgroundColor: 'transparent'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: isMobile ? '0.9rem' : '1.25rem'
                  },
                  ...(action.buttonSx || {})
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

// --- Botones estilo "tab" reutilizables (para Rutinas UX) ---
// Estilo minimalista (sin colores de marca): neutro para match con la UI general
const baseTabSx = {
  cursor: 'pointer',
  px: 1.2,
  py: 0.6,
  fontWeight: 700,
  fontSize: '0.9rem',
  color: 'rgba(255,255,255,0.85)',
  borderRadius: 0,
  transition: 'background 0.2s, color 0.2s',
  '&.Mui-disabled': { opacity: 0.5, cursor: 'not-allowed' }
};

export const TabActionButton = ({ children, sx = {}, disabled = false, onClick, ...props }) => (
  <ButtonBase
    onClick={onClick}
    disabled={disabled}
    sx={{
      ...baseTabSx,
      background: 'rgba(255,255,255,0.04)',
      borderLeft: '2px solid rgba(255,255,255,0.12)',
      '&:hover': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.95)' },
      ...sx
    }}
    {...props}
  >
    {children}
  </ButtonBase>
);

export const TabPrimaryButton = ({ children, sx = {}, disabled = false, onClick, ...props }) => (
  <ButtonBase
    onClick={onClick}
    disabled={disabled}
    sx={{
      ...baseTabSx,
      background: 'rgba(255,255,255,0.06)',
      borderLeft: '2px solid rgba(255,255,255,0.22)',
      '&:hover': { background: 'rgba(255,255,255,0.10)', color: '#fff' },
      ...sx
    }}
    {...props}
  >
    {children}
  </ButtonBase>
);

// Botones específicos solicitados: "Cancelar" y "Guardar"
export const CancelarTabButton = ({ onClick, disabled = false, sx = {}, ...props }) => (
  <TabActionButton
    onClick={onClick}
    disabled={disabled}
    sx={{
      fontWeight: 500, // Cancelar: acción secundaria, sin negrita
      color: 'rgba(255,255,255,0.75)',
      ...sx
    }}
    {...props}
  >
    Cancelar
  </TabActionButton>
);

export const GuardarTabButton = ({ onClick, disabled = false, loading = false, sx = {}, ...props }) => (
  <TabPrimaryButton onClick={onClick} disabled={disabled || loading} sx={sx} {...props}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {loading && <CircularProgress size={18} color="inherit" />}
      <span>{loading ? 'Guardando...' : 'Guardar'}</span>
    </Box>
  </TabPrimaryButton>
);

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
    getUndoCount
  } = useActionHistory();
  // Ocultar completamente si no hay historial
  if (!canUndo() || getUndoCount() === 0) {
    return null;
  }
  const handleUndoLastAction = () => {
    const lastAction = undoLastAction();
    if (lastAction) {
      window.dispatchEvent(new CustomEvent('undoAction', {
        detail: lastAction
      }));
    }
  };
  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Tooltip title={canUndo() ? `Deshacer última acción (${getUndoCount()} disponible${getUndoCount() > 1 ? 's' : ''})` : 'No hay acciones para deshacer'}>
        <span>
          <IconButton
            size="small"
            onClick={canUndo() ? handleUndoLastAction : undefined}
            sx={{
              width: 32,
              height: 32,
              padding: 0.5,
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
    </Box>
  );
}

// Marcar el componente como botón
HeaderUndoMenu.isButtonComponent = true;

// HeaderArchiveButton - acceso rápido a /archivo
function HeaderArchiveButton({ iconSx, buttonSx }) {
  const navigate = useNavigate();
  const { isMobile: isMobileFromHook } = useResponsive();
  
  // Fallback robusto: usar window.innerWidth si useMediaQuery falla
  const isMobile = typeof window !== 'undefined' 
    ? (isMobileFromHook || window.innerWidth < 600)
    : isMobileFromHook;
  
  // Extraer valores responsive de buttonSx si existen y convertirlos a valores directos
  const getButtonSxValue = (key) => {
    if (!buttonSx || !buttonSx[key]) return null;
    const value = buttonSx[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Si es responsive, extraer el valor según isMobile
      return isMobile ? (value.xs || value.sm || value) : (value.sm || value.md || value.xs || value);
    }
    return value;
  };
  
  // Separar propiedades que ya procesamos del resto de buttonSx
  // IMPORTANTE: excluir width, height, padding para evitar conflictos
  const { width, height, padding, '&:hover': hoverStyles, ...restButtonSx } = buttonSx || {};
  
  // Calcular valores finales: si buttonSx tiene valores responsive, usarlos; si no, usar defaults
  const finalWidth = getButtonSxValue('width') ?? (isMobile ? 32 : 32);
  const finalHeight = getButtonSxValue('height') ?? (isMobile ? 32 : 32);
  const finalPadding = getButtonSxValue('padding') ?? (isMobile ? 0.25 : 0.5);
  
  const btn = (
    <IconButton
      size="small"
      aria-label="Archivo"
      onClick={() => navigate('/archivo')}
      sx={{
        width: finalWidth,
        height: finalHeight,
        padding: finalPadding,
        minWidth: finalWidth,
        minHeight: finalHeight,
        color: 'primary.main', // Mismo color que sync para armonía visual
        '& .MuiSvgIcon-root': {
          fontSize: isMobile ? '0.9rem' : (iconSx?.fontSize || 18)
        },
        '&:hover': { 
          color: 'primary.main', 
          background: 'action.hover',
          ...(hoverStyles || {})
        },
        ...restButtonSx
      }}
    >
      <ArchiveIcon sx={iconSx || { fontSize: isMobile ? 14 : 18 }} />
    </IconButton>
  );
  btn.type.isButtonComponent = true;
  return btn;
}

HeaderArchiveButton.isButtonComponent = true;

// HeaderSyncButton - botón reutilizable de sincronización (uso genérico)
function HeaderSyncButton({ onClick, tooltip = 'Sincronizar', iconSx, buttonSx, disabled = false }) {
  const { isMobile: isMobileFromHook } = useResponsive();
  
  // Fallback robusto: usar window.innerWidth si useMediaQuery falla
  const isMobile = typeof window !== 'undefined' 
    ? (isMobileFromHook || window.innerWidth < 600)
    : isMobileFromHook;
  
  // Extraer valores responsive de buttonSx si existen y convertirlos a valores directos
  const getButtonSxValue = (key) => {
    if (!buttonSx || !buttonSx[key]) return null;
    const value = buttonSx[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Si es responsive, extraer el valor según isMobile
      return isMobile ? (value.xs || value.sm || value) : (value.sm || value.md || value.xs || value);
    }
    return value;
  };
  
  // Separar propiedades que ya procesamos del resto de buttonSx
  // IMPORTANTE: excluir width, height, padding para evitar conflictos
  const { width, height, padding, '&:hover': hoverStyles, ...restButtonSx } = buttonSx || {};
  
  // Calcular valores finales: si buttonSx tiene valores responsive, usarlos; si no, usar defaults
  const finalWidth = getButtonSxValue('width') ?? (isMobile ? 32 : 32);
  const finalHeight = getButtonSxValue('height') ?? (isMobile ? 32 : 32);
  const finalPadding = getButtonSxValue('padding') ?? (isMobile ? 0.25 : 0.5);
  
  const btn = (
    <IconButton
      size="small"
      aria-label={tooltip}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      sx={{
        width: finalWidth,
        height: finalHeight,
        padding: finalPadding,
        minWidth: finalWidth,
        minHeight: finalHeight,
        color: 'primary.main',
        '& .MuiSvgIcon-root': {
          fontSize: isMobile ? '0.9rem' : (iconSx?.fontSize || 18)
        },
        '&:hover': { 
          color: 'primary.main', 
          background: 'action.hover',
          ...(hoverStyles || {})
        },
        ...restButtonSx
      }}
    >
      <SyncIcon sx={iconSx || { fontSize: isMobile ? 14 : 18 }} />
    </IconButton>
  );
  // Marcar como "botón" para que SystemButtons lo renderice directo
  btn.type.isButtonComponent = true;
  return btn;
}

HeaderSyncButton.isButtonComponent = true;

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
    navigateToAppPath(navigate, modulo.path);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Cambiar aplicación">
        <IconButton 
          size="small"
          onClick={handleOpenAppsMenu}
          sx={{ 
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            color: 'inherit',
            '&:hover': { color: 'text.primary', background: 'action.hover' }
          }}
        >
          <AppsIcon sx={iconSx || { fontSize: 18, color: 'text.secondary' }} />
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
        <Divider />
        <MenuItem
          onClick={() => {
            handleCloseAppsMenu();
            navigateToAppPath(navigate, '/configuracion');
          }}
          sx={{
            bgcolor: location.pathname.startsWith('/configuracion') ? 'action.selected' : 'transparent',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" sx={{ color: 'white' }} />
          </ListItemIcon>
          <ListItemText
            primary="Configuración"
            primaryTypographyProps={{
              fontWeight: location.pathname.startsWith('/configuracion') ? 600 : 400,
              color: 'white'
            }}
          />
        </MenuItem>
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
SystemButtons.ArchiveButton = HeaderArchiveButton;
SystemButtons.SyncButton = HeaderSyncButton;
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

// HeaderMultiSelectButton - Botón para activar selección múltiple
function HeaderMultiSelectButton({ onActivate, iconSx }) {
  const btn = (
    <Tooltip title="Selección múltiple">
      <IconButton
        size="small"
        onClick={onActivate}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          },
          ...iconSx
        }}
      >
        <MultiSelectIcon />
      </IconButton>
    </Tooltip>
  );
  btn.type.isButtonComponent = true;
  return btn;
}

// HeaderMultiSelectDeleteButton - Botón de delete para selección múltiple
function HeaderMultiSelectDeleteButton({ onDelete, selectedCount, iconSx }) {
  const btn = (
    <Tooltip title={selectedCount > 0 ? `Eliminar ${selectedCount} elemento(s)` : 'Selecciona elementos para eliminar'}>
      <IconButton
        size="small"
        onClick={onDelete}
        disabled={selectedCount === 0}
        sx={{
          color: selectedCount > 0 ? 'error.main' : 'text.disabled',
          '&:hover': {
            backgroundColor: selectedCount > 0 ? 'rgba(244, 67, 54, 0.1)' : 'transparent'
          },
          ...iconSx
        }}
      >
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );
  btn.type.isButtonComponent = true;
  return btn;
}

// HeaderMultiSelectCancelButton - Botón para cancelar selección múltiple
function HeaderMultiSelectCancelButton({ onCancel, iconSx }) {
  const btn = (
    <Tooltip title="Cancelar selección múltiple">
      <IconButton
        size="small"
        onClick={onCancel}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          },
          ...iconSx
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          Cancelar
        </Typography>
      </IconButton>
    </Tooltip>
  );
  btn.type.isButtonComponent = true;
  return btn;
}

// Exportar los nuevos componentes
SystemButtons.MultiSelectButton = HeaderMultiSelectButton;
SystemButtons.MultiSelectDeleteButton = HeaderMultiSelectDeleteButton;
SystemButtons.MultiSelectCancelButton = HeaderMultiSelectCancelButton;

export default SystemButtons; 