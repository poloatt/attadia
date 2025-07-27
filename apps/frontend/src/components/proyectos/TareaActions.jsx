import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  CalendarTodayOutlined as PushIcon,
  PersonOutlined as DelegateIcon,
  PriorityHighOutlined as PriorityIcon,
  CheckCircleOutlined as CompleteIcon,
  RefreshOutlined as ReactivateIcon,
  CancelOutlined as CancelIcon
} from '@mui/icons-material';

const TareaActions = ({ 
  tarea, 
  onEdit, 
  onDelete, 
  onPush,
  onDelegate,
  onTogglePriority,
  onComplete,
  onReactivate,
  onCancel
}) => {
  return (
    <Box>
      <Divider sx={{ my: 1, borderColor: 'grey.800' }} />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 0.5,
        px: 1
      }}>
        {!tarea.completada ? (
          <>
            <Tooltip title="Empujar">
              <IconButton
                size="small"
                onClick={() => onPush(tarea)}
                sx={{ color: 'text.secondary' }}
              >
                <PushIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delegar">
              <IconButton
                size="small"
                onClick={() => onDelegate(tarea)}
                sx={{ color: 'text.secondary' }}
              >
                <DelegateIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={tarea.prioridad === 'ALTA' ? 'Cambiar a prioridad baja' : 'Cambiar a prioridad alta'}>
              <IconButton
                size="small"
                onClick={() => onTogglePriority(tarea)}
                sx={{ color: 'text.secondary' }}
              >
                <PriorityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Cancelar">
              <IconButton
                size="small"
                onClick={() => onCancel(tarea)}
                sx={{ color: 'text.secondary' }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Completar todo">
              <IconButton
                size="small"
                onClick={() => onComplete(tarea)}
                sx={{ color: 'text.secondary' }}
              >
                <CompleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => onEdit(tarea)}
                sx={{ color: 'text.secondary' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Reactivar">
            <IconButton
              size="small"
              onClick={() => onReactivate(tarea)}
              sx={{ color: 'text.secondary' }}
            >
              <ReactivateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Eliminar">
          <IconButton
            size="small"
            onClick={() => onDelete(tarea._id)}
            sx={{ color: 'text.secondary' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default TareaActions; 
