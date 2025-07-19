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
import { getEstadoLabel, getEstadoContrato } from '../propiedades/contratos/contratoUtils';
import { getEstadoColor } from '../common/StatusSystem';

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


// Funciones auxiliares para contratos
const getContratoIcon = (tipo) => {
  const iconMap = {
    'ALQUILER': HomeIcon,
    'MANTENIMIENTO': EngineeringIcon,
    'VENTA': BusinessIcon,
    'SERVICIOS': ServicesIcon
  };
  return iconMap[tipo] || HomeIcon;
};

const getEntityHeaderProps = ({ entity, type, onView, onEdit, onDelete, onExpand }) => {
  if (type === 'propiedad') {
    return {
      isMain: true,
      title: entity.titulo || entity.direccion || 'Sin título',
      subtitle: entity.ciudad || '',
      statusLabel: entity.estado || 'SIN ESTADO',
      statusColor: getEstadoColor(entity.estado, 'PROPIEDAD'),
      icon: getPropiedadIcon(entity.tipo),
      iconColor: getEstadoColor(entity.estado, 'PROPIEDAD'),
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
    const estado = getEstadoContrato(entity);
    return {
      isMain: true,
      title: entity.propiedad?.titulo || 'Sin propiedad',
      subtitle: entity.propiedad?.ciudad || '',
      statusLabel: getEstadoLabel(estado),
      statusColor: getEstadoColor(estado, 'CONTRATO'),
      icon: getContratoIcon(entity.tipoContrato),
      iconColor: getEstadoColor(estado, 'CONTRATO'),
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
