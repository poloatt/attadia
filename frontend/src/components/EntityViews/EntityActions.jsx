import React, { memo } from 'react';
import { SystemButtons, SYSTEM_ICONS } from '../common/SystemButtons';
import { useLocation } from 'react-router-dom';
import { menuItems } from '../../navigation/menuStructure';

/**
 * EntityActions: Componente de acciones reutilizable y extensible usando SystemButtons.
 * Props:
 * - onEdit: función para editar
 * - onDelete: función para eliminar
 * - itemName: nombre del ítem para el diálogo de confirmación
 * - size: tamaño de los botones
 * - direction: dirección del layout
 * - showDelete: mostrar botón eliminar
 * - disabled: deshabilitar acciones
 * - extraActions: array de objetos { icon, label, onClick, color, show, disabled, tooltip, ... }
 */
export const EntityActions = memo(({ 
  onEdit, 
  onDelete,
  itemName = 'este registro',
  size = 'small',
  direction = 'row',
  showDelete = true,
  showEdit = true,
  disabled = false,
  extraActions = []
}) => {
  const actions = getStandardActions({ onEdit, onDelete, itemName, disabled, showEdit, showDelete, extraActions });
  return (
    <SystemButtons
      actions={actions}
      direction={direction}
      size={size}
      disabled={disabled}
    />
  );
}); 

// Acciones estándar modulares para reutilización
export const ACTIONS = {
  edit: ({ onClick, disabled = false }) => ({
    key: 'edit',
    icon: SYSTEM_ICONS.edit,
    label: 'Editar',
    onClick,
    disabled,
    tooltip: 'Editar'
  }),
  delete: ({ onClick, disabled = false, itemName = 'este registro' }) => ({
    key: 'delete',
    icon: SYSTEM_ICONS.delete,
    label: 'Eliminar',
    onClick,
    disabled,
    tooltip: 'Eliminar',
    confirm: true,
    confirmText: itemName
  })
};

// Alternativamente, función para obtener acciones estándar
export function getStandardActions({ onEdit, onDelete, itemName = 'este registro', disabled = false, showEdit = true, showDelete = true, extraActions = [] }) {
  return [
    ...extraActions,
    showEdit && onEdit ? ACTIONS.edit({ onClick: onEdit, disabled }) : null,
    showDelete && onDelete ? ACTIONS.delete({ onClick: onDelete, disabled, itemName }) : null
  ].filter(Boolean);
}

// Helper para encontrar el item activo y su jerarquía
function findMenuItemByPath(path, items = menuItems) {
  for (const item of items) {
    if (item.path === path) return { item, parent: null };
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.path === path) return { item: sub, parent: item };
        if (sub.subItems) {
          for (const subsub of sub.subItems) {
            if (subsub.path === path) return { item: subsub, parent: sub };
          }
        }
      }
    }
  }
  return { item: null, parent: null };
}

export function useEntityActions() {
  const location = useLocation();
  const currentPath = location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  let entityConfig = null;
  let showAddButton = false;

  if (pathParts.length === 2) {
    // Nivel 2: buscar el item y sus hijos agregables
    const { item } = findMenuItemByPath(currentPath);
    if (item) {
      const canAddSelf = item.canAdd;
      const addableChildren = item.subItems ? item.subItems.filter(sub => sub.canAdd) : [];
      if (canAddSelf || addableChildren.length > 0) {
        showAddButton = true;
        entityConfig = {
          ...item,
          subItems: addableChildren
        };
      }
    }
  } else if (pathParts.length === 3) {
    // Nivel 3: solo mostrar el modelo propio si canAdd
    const { item } = findMenuItemByPath(currentPath);
    if (item && item.canAdd) {
      showAddButton = true;
      entityConfig = { ...item, subItems: [] };
    }
  }
  // Nivel 1 o rutas no reconocidas: no mostrar AddButton

  return {
    getRouteTitle: () => entityConfig?.title || '',
    getEntityConfig: () => entityConfig,
    showAddButton
  };
} 
