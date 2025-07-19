import React from 'react';

// Sistema centralizado de estados para toda la aplicación
// Unifica iconos, colores y textos para todos los chips de estado

// Importaciones modulares de iconos de Material-UI
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import DescriptionIcon from '@mui/icons-material/Description';
import CancelIcon from '@mui/icons-material/Cancel';
import PauseIcon from '@mui/icons-material/Pause';
import ErrorIcon from '@mui/icons-material/Error';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import WarningIcon from '@mui/icons-material/Warning';

// Estados de Propiedades
export const PROPIEDAD_ESTADOS = {
  DISPONIBLE: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - disponible
    text: 'Disponible'
  },
  OCUPADA: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - ocupada
    text: 'Ocupada'
  },
  MANTENIMIENTO: {
    icon: 'Engineering',
    color: '#ff9800', // Naranja - mantenimiento
    text: 'Mantenimiento'
  },
  RESERVADA: {
    icon: 'BookmarkAdded',
    color: '#673ab7', // Púrpura - reservada
    text: 'Reservada'
  }
};

// Estados de Contratos
export const CONTRATO_ESTADOS = {
  ACTIVO: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - activo (coherente con OCUPADA)
    text: 'Activo'
  },
  PLANEADO: {
    icon: 'PendingActions',
    color: '#673ab7', // Púrpura - planeado (coherente con RESERVADA/RESERVADO)
    text: 'Planeado'
  },
  FINALIZADO: {
    icon: 'BookmarkAdded',
    color: '#9e9e9e', // Gris - finalizado
    text: 'Finalizado'
  },
  MANTENIMIENTO: {
    icon: 'Engineering',
    color: '#ff9800', // Naranja - mantenimiento (coherente)
    text: 'Mantenimiento'
  }
};

// Estados de Inquilinos
export const INQUILINO_ESTADOS = {
  ACTIVO: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - activo (coherente con OCUPADA/ACTIVO)
    text: 'Activo'
  },
  RESERVADO: {
    icon: 'BookmarkAdded',
    color: '#673ab7', // Púrpura - reservado (coherente con RESERVADA)
    text: 'Reservado'
  },
  PENDIENTE: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - pendiente (coherente con DISPONIBLE/PLANEADO)
    text: 'Pendiente'
  },
  INACTIVO: {
    icon: 'DescriptionIcon',
    color: '#9e9e9e', // Gris - inactivo (coherente con FINALIZADO)
    text: 'Inactivo'
  },
  SIN_CONTRATO: {
    icon: 'DescriptionIcon',
    color: '#9e9e9e', // Gris - sin contrato (coherente con INACTIVO)
    text: 'Sin Contrato'
  }
};

// Estados de Proyectos
export const PROYECTO_ESTADOS = {
  PENDIENTE: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - pendiente (coherente con DISPONIBLE/PLANEADO)
    text: 'Pendiente'
  },
  EN_PROGRESO: {
    icon: 'Engineering',
    color: '#2196f3', // Azul - en progreso (coherente con OCUPADA/ACTIVO)
    text: 'En Progreso'
  },
  COMPLETADO: {
    icon: 'CheckCircle',
    color: '#9e9e9e', // Gris - completado (coherente con FINALIZADO/INACTIVO)
    text: 'Completado'
  }
};

// Estados de Tareas
export const TAREA_ESTADOS = {
  PENDIENTE: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - pendiente (coherente con DISPONIBLE/PLANEADO)
    text: 'Pendiente'
  },
  EN_PROGRESO: {
    icon: 'Engineering',
    color: '#2196f3', // Azul - en progreso (coherente con OCUPADA/ACTIVO)
    text: 'En Progreso'
  },
  COMPLETADA: {
    icon: 'CheckCircle',
    color: '#9e9e9e', // Gris - completada (coherente con FINALIZADO/INACTIVO)
    text: 'Completada'
  },
  CANCELADA: {
    icon: 'Cancel',
    color: '#f44336', // Rojo - cancelada (coherente con ERROR)
    text: 'Cancelada'
  }
};

// Estados de Transacciones
export const TRANSACCION_ESTADOS = {
  PENDIENTE: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - pendiente (coherente con DISPONIBLE/PLANEADO)
    text: 'Pendiente'
  },
  PAGADO: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - pagado (coherente con OCUPADA/ACTIVO)
    text: 'Pagado'
  },
  COMPLETADA: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - completada (coherente con OCUPADA/ACTIVO)
    text: 'Completada'
  },
  CANCELADA: {
    icon: 'Cancel',
    color: '#f44336', // Rojo - cancelada (coherente con ERROR)
    text: 'Cancelada'
  }
};

// Estados de Transacciones Recurrentes
export const TRANSACCION_RECURRENTE_ESTADOS = {
  ACTIVO: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - activo (coherente con OCUPADA/ACTIVO)
    text: 'Activo'
  },
  PAUSADO: {
    icon: 'Pause',
    color: '#ff9800', // Naranja - pausado (coherente con MANTENIMIENTO)
    text: 'Pausado'
  },
  FINALIZADO: {
    icon: 'BookmarkAdded',
    color: '#9e9e9e', // Gris - finalizado (coherente con FINALIZADO/INACTIVO)
    text: 'Finalizado'
  }
};

// Estados de BankConnection
export const BANK_CONNECTION_ESTADOS = {
  ACTIVA: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - activa (coherente con OCUPADA/ACTIVO)
    text: 'Activa'
  },
  INACTIVA: {
    icon: 'Cancel',
    color: '#9e9e9e', // Gris - inactiva (coherente con INACTIVO/FINALIZADO)
    text: 'Inactiva'
  },
  ERROR: {
    icon: 'Error',
    color: '#f44336', // Rojo - error (coherente con ERROR/CANCELADA)
    text: 'Error'
  },
  PENDIENTE_VERIFICACION: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - pendiente (coherente con PENDIENTE)
    text: 'Pendiente de Verificación'
  }
};

// Estados de Inventarios
export const INVENTARIO_ESTADOS = {
  NUEVO: {
    icon: 'NewReleases',
    color: '#4caf50', // Verde - nuevo (coherente con DISPONIBLE/NUEVO)
    text: 'Nuevo'
  },
  BUEN_ESTADO: {
    icon: 'CheckCircle',
    color: '#2196f3', // Azul - buen estado (coherente con ACTIVO)
    text: 'Buen Estado'
  },
  REGULAR: {
    icon: 'Warning',
    color: '#ff9800', // Naranja - regular (coherente con MANTENIMIENTO)
    text: 'Regular'
  },
  MALO: {
    icon: 'Error',
    color: '#f44336', // Rojo - malo (coherente con ERROR/CANCELADA)
    text: 'Malo'
  },
  REPARACION: {
    icon: 'Engineering',
    color: '#ff9800', // Naranja - reparación (coherente con MANTENIMIENTO)
    text: 'En Reparación'
  }
};

// Estados de Objetivos
export const OBJETIVO_ESTADOS = {
  PENDIENTE: {
    icon: 'PendingActions',
    color: '#4caf50', // Verde - pendiente (coherente con DISPONIBLE/PLANEADO)
    text: 'Pendiente'
  },
  EN_PROGRESO: {
    icon: 'Engineering',
    color: '#2196f3', // Azul - en progreso (coherente con OCUPADA/ACTIVO)
    text: 'En Progreso'
  },
  COMPLETADO: {
    icon: 'CheckCircle',
    color: '#9e9e9e', // Gris - completado (coherente con FINALIZADO/INACTIVO)
    text: 'Completado'
  },
  CANCELADO: {
    icon: 'Cancel',
    color: '#f44336', // Rojo - cancelado (coherente con ERROR)
    text: 'Cancelado'
  }
};

// Función unificada para obtener información de estado
export function getEstadoInfo(estado, tipo = 'PROPIEDAD') {
  const estadosMap = {
    PROPIEDAD: PROPIEDAD_ESTADOS,
    CONTRATO: CONTRATO_ESTADOS,
    INQUILINO: INQUILINO_ESTADOS,
    PROYECTO: PROYECTO_ESTADOS,
    TAREA: TAREA_ESTADOS,
    TRANSACCION: TRANSACCION_ESTADOS,
    TRANSACCION_RECURRENTE: TRANSACCION_RECURRENTE_ESTADOS,
    BANK_CONNECTION: BANK_CONNECTION_ESTADOS,
    INVENTARIO: INVENTARIO_ESTADOS,
    OBJETIVO: OBJETIVO_ESTADOS
  };

  const estados = estadosMap[tipo];
  return estados[estado] || {
    icon: 'PendingActions',
    color: '#9e9e9e',
    text: estado || 'Desconocido'
  };
}

// Función para obtener solo el icono
export function getEstadoIcon(estado, tipo = 'PROPIEDAD') {
  return getEstadoInfo(estado, tipo).icon;
}

// Función para obtener solo el color
export function getEstadoColor(estado, tipo = 'PROPIEDAD') {
  return getEstadoInfo(estado, tipo).color;
}

// Función para obtener solo el texto
export function getEstadoText(estado, tipo = 'PROPIEDAD') {
  return getEstadoInfo(estado, tipo).text;
}

// Mapeo de iconos a componentes de Material-UI
export const ICON_MAP = {
  'PendingActions': PendingActionsIcon,
  'CheckCircle': CheckCircleIcon,
  'Engineering': EngineeringIcon,
  'BookmarkAdded': BookmarkAddedIcon,
  'DescriptionIcon': DescriptionIcon,
  'Cancel': CancelIcon,
  'Pause': PauseIcon,
  'Error': ErrorIcon,
  'NewReleases': NewReleasesIcon,
  'Warning': WarningIcon
};

// Exportar todos los estados para compatibilidad
export const STATUS_COLORS = {
  // Propiedades
  DISPONIBLE: PROPIEDAD_ESTADOS.DISPONIBLE,
  OCUPADA: PROPIEDAD_ESTADOS.OCUPADA,
  MANTENIMIENTO: PROPIEDAD_ESTADOS.MANTENIMIENTO,
  RESERVADA: PROPIEDAD_ESTADOS.RESERVADA,
  
  // Contratos
  ACTIVO: CONTRATO_ESTADOS.ACTIVO,
  PLANEADO: CONTRATO_ESTADOS.PLANEADO,
  FINALIZADO: CONTRATO_ESTADOS.FINALIZADO,
  
  // Inquilinos
  INACTIVO: INQUILINO_ESTADOS.INACTIVO,
  PENDIENTE: INQUILINO_ESTADOS.PENDIENTE,
  SIN_CONTRATO: INQUILINO_ESTADOS.SIN_CONTRATO
};

// Función para obtener el componente de icono del estado (con props predefinidas)
export function getStatusIconComponent(estado, tipo = 'PROPIEDAD') {
  const iconName = getEstadoIcon(estado, tipo);
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para estado: ${estado}, tipo: ${tipo}, iconName: ${iconName}`);
    return React.createElement(PendingActionsIcon, { sx: { fontSize: '0.9rem' } });
  }
  
  return React.createElement(IconComponent, { sx: { fontSize: '0.9rem' } });
}

// Función para obtener solo el componente de icono (sin props)
export function getStatusIconComponentRaw(estado, tipo = 'PROPIEDAD') {
  const iconName = getEstadoIcon(estado, tipo);
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para estado: ${estado}, tipo: ${tipo}, iconName: ${iconName}`);
    return PendingActionsIcon;
  }
  
  return IconComponent;
} 