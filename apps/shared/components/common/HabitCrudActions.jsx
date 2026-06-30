import React, { memo } from 'react';
import { Box } from '@mui/material';
import SystemButtons from './SystemButtons.jsx';
import { getStandardActions } from './CommonActions.jsx';

/**
 * Acciones estándar edit/delete para filas de hábitos (Rutinas, etc.).
 * Usa SYSTEM_ICONS + ACTIONS vía getStandardActions.
 */
function HabitCrudActions({
  onEdit,
  onDelete,
  itemName = 'este hábito',
  showEdit = true,
  showDelete = true,
  disabled = false,
  size = 'small',
  gap = 0,
  sx,
}) {
  const actions = getStandardActions({
    onEdit: onEdit
      ? (e) => {
          e?.stopPropagation?.();
          onEdit(e);
        }
      : undefined,
    onDelete: onDelete
      ? (e) => {
          e?.stopPropagation?.();
          onDelete(e);
        }
      : undefined,
    itemName,
    disabled,
    showEdit: showEdit && Boolean(onEdit),
    showDelete: showDelete && Boolean(onDelete),
  });

  if (!actions.length) return null;

  return (
    <Box sx={sx}>
      <SystemButtons actions={actions} size={size} gap={gap} />
    </Box>
  );
}

export default memo(HabitCrudActions);
