import React, { memo } from 'react';
import { SystemButtons, SYSTEM_ICONS } from './SystemButtons';
import { useLocation } from 'react-router-dom';
import { modulos } from '../../navigation/menuStructure';
import DescriptionIcon from '@mui/icons-material/Description';
import HomeIcon from '@mui/icons-material/Home';
// TipoPropiedadIcon removido - causaba dependencia circular
import PhoneIcon from '@mui/icons-material/Phone';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import { IconButton } from '../../utils/materialImports';

/**
 * EntityActions: Componente de acciones reutilizable y extensible usando SystemButtons.
 * Props:
 * - onEdit: función para editar
 * - onDelete: función para eliminar
 * - onContratoDetail: función para abrir detalle de contrato
 * - onPropiedadDetail: función para abrir detalle de propiedad
 * - tipoPropiedad: tipo de propiedad para el icono dinámico
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
  onContratoDetail,
  onPropiedadDetail,
  tipoPropiedad,
  itemName = 'este registro',
  size = 'small',
  direction = 'row',
  showDelete = true,
  showEdit = true,
  disabled = false,
  extraActions = []
}) => {
  const builtActions = [
    ...extraActions,
    onContratoDetail && {
      key: 'contratoDetail',
      icon: <DescriptionIcon />,
      label: 'Ver contrato',
      tooltip: 'Ver contrato',
      onClick: onContratoDetail,
      color: 'white',
      show: true
    },
    onPropiedadDetail && {
      key: 'propiedadDetail',
      icon: <HomeIcon />, // Usar icono genérico en lugar de TipoPropiedadIcon
      label: 'Ver propiedad',
      tooltip: 'Ver propiedad',
      onClick: onPropiedadDetail,
      color: 'white',
      show: true
    },
    showEdit && onEdit ? ACTIONS.edit({ onClick: onEdit, disabled, color: 'white' }) : null,
    showDelete && onDelete ? ACTIONS.delete({ onClick: onDelete, disabled, itemName }) : null
  ].filter(Boolean);
  return (
    <SystemButtons
      actions={builtActions}
      direction={direction}
      size={size}
      disabled={disabled}
      // Forzar color blanco en todos los botones excepto delete
      sx={{
        '& .MuiIconButton-root': {
          color: 'white',
        },
        // Sobrescribir color para el botón delete con rojo al 40% de opacidad
        // El selector busca el botón que contiene el icono de delete
        '& .MuiIconButton-root:has(svg[data-testid="DeleteIcon"])': {
          color: 'rgba(244, 67, 54, 0.4) !important',
          '&:hover': {
            color: 'rgba(244, 67, 54, 0.6) !important'
          }
        }
      }}
    />
  );
}); 

// Acciones estándar modulares para reutilización
export const ACTIONS = {
  edit: ({ onClick, disabled = false }) => ({
    key: 'edit',
    icon: SYSTEM_ICONS.edit, // Ahora es un componente, se renderiza en SystemButtons
    label: 'Editar',
    onClick,
    disabled,
    tooltip: 'Editar'
  }),
  delete: ({ onClick, disabled = false, itemName = 'este registro' }) => ({
    key: 'delete',
    icon: SYSTEM_ICONS.delete, // Ahora es un componente, se renderiza en SystemButtons
    label: 'Eliminar',
    onClick,
    disabled,
    tooltip: 'Eliminar',
    confirm: true,
    confirmText: itemName,
    buttonSx: {
      color: 'rgba(244, 67, 54, 0.4) !important', // Rojo con 40% de opacidad
      '&:hover': {
        color: 'rgba(244, 67, 54, 0.6) !important' // Rojo con 60% de opacidad al hacer hover
      }
    }
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
// Preferir el match más profundo (buscar hijos antes que padres)
function findMenuItemByPath(path, items = modulos, parent = null) {
  for (const item of items) {
    // Buscar primero en los hijos para privilegiar el match más profundo
    if (item.subItems && item.subItems.length > 0) {
      const nested = findMenuItemByPath(path, item.subItems, item);
      if (nested.item) return nested;
    }
    // Si no se encontró en hijos, comparar el propio item
    if (item.path === path) return { item, parent };
  }
  return { item: null, parent: null };
}

export function useEntityActions() {
  const location = useLocation();
  const currentPath = location.pathname;
  let entityConfig = null;
  let showAddButton = false;

  // Nueva lógica: determinar entidad por coincidencia en menuStructure (profundidad real),
  // sin depender del número de segmentos en la URL. Esto permite casos como '/propiedades'.
  const { item } = findMenuItemByPath(currentPath);
  if (item) {
    const canAddSelf = !!item.canAdd;
    const addableChildren = Array.isArray(item.subItems)
      ? item.subItems.filter(sub => sub.canAdd)
      : [];
    if (canAddSelf || addableChildren.length > 0) {
      showAddButton = true;
      entityConfig = {
        ...item,
        subItems: addableChildren
      };
    }
  }

  return {
    getRouteTitle: () => entityConfig?.title || '',
    getEntityConfig: () => entityConfig,
    showAddButton
  };
} 

export default EntityActions; 

export const CallButton = ({ phone, ...props }) => (
  <IconButton
    aria-label="Llamar"
    href={`tel:${phone}`}
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  >
    <PhoneIcon />
  </IconButton>
);

export const SmsButton = ({ phone, ...props }) => (
  <IconButton
    aria-label="Enviar SMS"
    href={`sms:${phone}`}
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  >
    <SmsIcon />
  </IconButton>
);

export const EmailButton = ({ email, ...props }) => (
  <IconButton
    aria-label="Enviar Email"
    href={`mailto:${email}`}
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  >
    <EmailIcon />
  </IconButton>
); 
