import {
  ListAlt as ListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  HomeOutlined as HomeIcon,
  Engineering as EngineeringIcon,
  BusinessOutlined as BusinessIcon,
  StoreOutlined as ServicesIcon
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { getEstadoLabel, getEstadoColor, getEstadoContrato } from '../contratos/contratoUtils';

// Funciones auxiliares para propiedades
const getPropiedadIcon = (tipo) => {
  const iconMap = {
    'CASA': HomeIcon,
    'DEPARTAMENTO': BusinessIcon,
    'APARTAMENTO': BusinessIcon,
    'LOCAL': ServicesIcon
  };
  return iconMap[tipo?.toUpperCase()] || HomeIcon;
};
const getPropiedadEstadoColor = (estado) => {
  const statusColors = {
    'DISPONIBLE': '#4caf50',
    'OCUPADA': '#ff9800',
    'MANTENIMIENTO': '#2196f3',
    'RESERVADA': '#9c27b0'
  };
  return statusColors[estado] || '#9e9e9e';
};

const getEntityHeaderProps = ({ entity, type, onView, onEdit, onDelete, onExpand }) => {
  if (type === 'propiedad') {
    return {
      isMain: true,
      title: entity.titulo || entity.direccion || 'Sin título',
      subtitle: entity.ciudad || '',
      statusLabel: entity.estado || 'SIN ESTADO',
      statusColor: getPropiedadEstadoColor(entity.estado),
      icon: getPropiedadIcon(entity.tipo),
      iconColor: getPropiedadEstadoColor(entity.estado),
      actions: (
        <>
          <IconButton size="small" onClick={() => onView && onView(entity)}>
            <ListIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit && onEdit(entity)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete && onDelete(entity)}>
            <DeleteIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onExpand && onExpand(entity)}>
            <ExpandMoreIcon />
          </IconButton>
        </>
      )
    };
  }
  if (type === 'contrato') {
    return {
      isMain: true,
      title: entity.propiedad?.titulo || 'Sin propiedad',
      subtitle: entity.propiedad?.ciudad || '',
      statusLabel: getEstadoLabel(getEstadoContrato(entity)),
      statusColor: getEstadoColor(getEstadoContrato(entity)),
      icon: (() => {
        const iconMap = {
          'ALQUILER': HomeIcon,
          'MANTENIMIENTO': EngineeringIcon,
          'VENTA': BusinessIcon,
          'SERVICIOS': ServicesIcon
        };
        return iconMap[entity.tipoContrato] || HomeIcon;
      })(),
      iconColor: getEstadoColor(getEstadoContrato(entity)),
      actions: (
        <>
          <IconButton size="small" onClick={() => onView && onView(entity)}>
            <ListIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit && onEdit(entity)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete && onDelete(entity)}>
            <DeleteIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onExpand && onExpand(entity)}>
            <ExpandMoreIcon />
          </IconButton>
        </>
      )
    };
  }
};

export default getEntityHeaderProps; 