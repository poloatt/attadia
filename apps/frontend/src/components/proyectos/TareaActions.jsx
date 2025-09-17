import React from 'react';
import { Box, Divider } from '@mui/material';
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
import { SystemButtons } from '../common/SystemButtons';

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
  const actions = [];

  if (!tarea.completada) {
    actions.push(
      {
        key: 'push',
        icon: <PushIcon />,
        label: 'Empujar',
        tooltip: 'Empujar',
        onClick: () => onPush(tarea)
      },
      {
        key: 'delegate',
        icon: <DelegateIcon />,
        label: 'Delegar',
        tooltip: 'Delegar',
        onClick: () => onDelegate(tarea)
      },
      {
        key: 'priority',
        icon: <PriorityIcon />,
        label: tarea.prioridad === 'ALTA' ? 'Prioridad baja' : 'Prioridad alta',
        tooltip: tarea.prioridad === 'ALTA' ? 'Cambiar a prioridad baja' : 'Cambiar a prioridad alta',
        onClick: () => onTogglePriority(tarea)
      },
      {
        key: 'cancel',
        icon: <CancelIcon />,
        label: 'Cancelar',
        tooltip: 'Cancelar',
        onClick: () => onCancel(tarea)
      },
      {
        key: 'complete',
        icon: <CompleteIcon />,
        label: 'Completar todo',
        tooltip: 'Completar todo',
        onClick: () => onComplete(tarea)
      },
      {
        key: 'edit',
        icon: <EditIcon />,
        label: 'Editar',
        tooltip: 'Editar',
        onClick: () => onEdit && onEdit(tarea)
      }
    );
  } else {
    actions.push({
      key: 'reactivate',
      icon: <ReactivateIcon />,
      label: 'Reactivar',
      tooltip: 'Reactivar',
      onClick: () => onReactivate(tarea)
    });
  }

  actions.push({
    key: 'delete',
    icon: <DeleteIcon />,
    label: 'Eliminar',
    tooltip: 'Eliminar',
    onClick: () => onDelete(tarea._id),
    confirm: true,
    confirmText: 'la tarea'
  });

  return (
    <Box>
      <Divider sx={{ my: 1, borderColor: 'grey.800' }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', px: 1 }}>
        <SystemButtons actions={actions} size="small" />
      </Box>
    </Box>
  );
};

export default TareaActions; 
