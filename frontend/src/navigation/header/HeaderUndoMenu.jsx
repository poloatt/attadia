import { 
  IconButton, 
  Tooltip, 
  Badge, 
  Menu, 
  MenuItem, 
  ListItemText, 
  ListItemIcon, 
  Chip 
} from '@mui/material';
import { 
  Undo as UndoIcon,
  History as HistoryIcon,
  Add as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as MoveIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useActionHistory, ACTION_TYPES } from '../../context/ActionHistoryContext';
import { useLocation } from 'react-router-dom';

export default function HeaderUndoMenu({ iconSx }) {
  const { 
    canUndo, 
    undoLastAction, 
    getUndoCount, 
    getLastActions,
    getActionsByEntity,
    actionHistory
  } = useActionHistory();
  const [undoMenuAnchor, setUndoMenuAnchor] = useState(null);
  const location = useLocation();

  // Obtener icono según el tipo de acción
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case ACTION_TYPES.CREATE:
        return <CreateIcon sx={iconSx || { fontSize: 16 }} />;
      case ACTION_TYPES.UPDATE:
        return <EditIcon sx={iconSx || { fontSize: 16 }} />;
      case ACTION_TYPES.DELETE:
        return <DeleteIcon sx={iconSx || { fontSize: 16 }} />;
      case ACTION_TYPES.MOVE:
        return <MoveIcon sx={iconSx || { fontSize: 16 }} />;
      default:
        return <HistoryIcon sx={iconSx || { fontSize: 16 }} />;
    }
  };

  // Manejar deshacer última acción
  const handleUndoLastAction = () => {
    const lastAction = undoLastAction();
    if (lastAction) {
      window.dispatchEvent(new CustomEvent('undoAction', {
        detail: lastAction
      }));
    }
  };

  // Manejar deshacer acción específica
  const handleUndoSpecificAction = (action) => {
    setUndoMenuAnchor(null);
    window.dispatchEvent(new CustomEvent('undoAction', {
      detail: action
    }));
  };

  // Combinar historial de proyectos y tareas si estamos en la página de proyectos
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
    <>
      {/* Botón de revertir acciones */}
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

      {/* Botón para ver historial completo */}
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

      {/* Menú de historial */}
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
    </>
  );
} 
