import React from 'react';

// Sistema centralizado de estados para toda la aplicación
// Unifica iconos, colores y textos para todos los chips de estado

// Importaciones modulares de iconos de Material-UI
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import BookmarkAddedOutlinedIcon from '@mui/icons-material/BookmarkAddedOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

// Estados de Propiedades
export const PROPIEDAD_ESTADOS = {
  DISPONIBLE: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - disponible (vacía, vencida, error)
    text: 'Disponible'
  },
  OCUPADA: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - ocupada, huésped actual, activo
    text: 'Ocupada'
  },
  MANTENIMIENTO: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - mantenimiento, pendiente, on hold
    text: 'Mantenimiento'
  },
  RESERVADA: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeado, reservado, futuro huésped
    text: 'Reservada'
  },
  ARCHIVADA: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - archivado, completado, finalizado
    text: 'Archivada'
  }
};

// Estados de Contratos
export const CONTRATO_ESTADOS = {
  ACTIVO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - activo, huésped actual
    text: 'Activo'
  },
  PLANEADO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeado, reservado, futuro
    text: 'Planeado'
  },
  FINALIZADO: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - finalizado, archivado, completado
    text: 'Finalizado'
  },
  MANTENIMIENTO: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - mantenimiento, pendiente
    text: 'Mantenimiento'
  },
  CANCELADO: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelado, error, vencido
    text: 'Cancelado'
  }
};

// Estados de Inquilinos
export const INQUILINO_ESTADOS = {
  ACTIVO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - activo, huésped actual
    text: 'Activo'
  },
  RESERVADO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - reservado, futuro huésped
    text: 'Reservado'
  },
  PENDIENTE: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - pendiente, on hold
    text: 'Pendiente'
  },
  INACTIVO: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - inactivo, archivado, completado
    text: 'Inactivo'
  },
  SIN_CONTRATO: {
    icon: 'DescriptionIcon',
    color: '#bdbdbd', // Gris - sin contrato, archivado
    text: 'Sin Contrato'
  },
  CANCELADO: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelado, error
    text: 'Cancelado'
  }
};

// Estados de Proyectos
export const PROYECTO_ESTADOS = {
  EN_PROGRESO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - en progreso, actual
    text: 'En Progreso'
  },
  PLANEADO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeado, futuro
    text: 'Planeado'
  },
  PENDIENTE: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - pendiente, on hold
    text: 'Pendiente'
  },
  COMPLETADO: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - completado, archivado
    text: 'Completado'
  },
  CANCELADO: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelado, error
    text: 'Cancelado'
  }
};

// Estados de Tareas
export const TAREA_ESTADOS = {
  EN_PROGRESO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - en progreso, actual
    text: 'En Progreso'
  },
  PLANEADA: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeada, futuro
    text: 'Planeada'
  },
  PENDIENTE: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - pendiente, on hold
    text: 'Pendiente'
  },
  COMPLETADA: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - completada, archivada
    text: 'Completada'
  },
  CANCELADA: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelada, error
    text: 'Cancelada'
  }
};

// Estados de Transacciones
export const TRANSACCION_ESTADOS = {
  PAGADO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - pagado, actual
    text: 'Pagado'
  },
  PLANEADO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeado, futuro
    text: 'Planeado'
  },
  PENDIENTE: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - pendiente, on hold
    text: 'Pendiente'
  },
  COMPLETADA: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - completada, archivada
    text: 'Completada'
  },
  CANCELADA: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelada, error
    text: 'Cancelada'
  }
};

// Estados de Transacciones Recurrentes
export const TRANSACCION_RECURRENTE_ESTADOS = {
  ACTIVO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - activo, actual
    text: 'Activo'
  },
  PLANEADO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeado, futuro
    text: 'Planeado'
  },
  PAUSADO: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - pausado, pendiente
    text: 'Pausado'
  },
  FINALIZADO: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - finalizado, archivado
    text: 'Finalizado'
  },
  CANCELADO: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelado, error
    text: 'Cancelado'
  }
};

// Estados de BankConnection
export const BANK_CONNECTION_ESTADOS = {
  ACTIVA: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - activa, actual
    text: 'Activa'
  },
  PLANEADA: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeada, futuro
    text: 'Planeada'
  },
  ERROR: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - error, vencido
    text: 'Error'
  },
  INACTIVA: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - inactiva, archivada
    text: 'Inactiva'
  }
};

// Estados de Inventarios
export const INVENTARIO_ESTADOS = {
  BUEN_ESTADO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - buen estado, actual
    text: 'Buen Estado'
  },
  NUEVO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - nuevo, futuro
    text: 'Nuevo'
  },
  REGULAR: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - regular, pendiente
    text: 'Regular'
  },
  MALO: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - malo, error
    text: 'Malo'
  },
  REPARACION: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - reparación, pendiente
    text: 'En Reparación'
  },
  ARCHIVADO: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - archivado, completado
    text: 'Archivado'
  }
};

// Estados de Objetivos
export const OBJETIVO_ESTADOS = {
  EN_PROGRESO: {
    icon: 'CheckCircle',
    color: '#81c784', // Verde - en progreso, actual
    text: 'En Progreso'
  },
  PLANEADO: {
    icon: 'PendingActions',
    color: '#64b5f6', // Azul - planeado, futuro
    text: 'Planeado'
  },
  PENDIENTE: {
    icon: 'Engineering',
    color: '#ffb74d', // Naranja - pendiente, on hold
    text: 'Pendiente'
  },
  COMPLETADO: {
    icon: 'BookmarkAdded',
    color: '#bdbdbd', // Gris - completado, archivado
    text: 'Completado'
  },
  CANCELADO: {
    icon: 'Cancel',
    color: '#e57373', // Rojo - cancelado, error
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
    color: '#bdbdbd', // Gris pastel
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
  'PendingActions': PendingActionsOutlinedIcon,
  'CheckCircle': CheckCircleOutlinedIcon,
  'Engineering': EngineeringOutlinedIcon,
  'BookmarkAdded': BookmarkAddedOutlinedIcon,
  'DescriptionIcon': DescriptionOutlinedIcon,
  'Cancel': CancelOutlinedIcon,
  'Pause': PauseOutlinedIcon,
  'Error': ErrorOutlineOutlinedIcon,
  'NewReleases': NewReleasesOutlinedIcon,
  'Warning': WarningAmberOutlinedIcon
};

// Exportar todos los estados para compatibilidad
export const STATUS_COLORS = {
  // Propiedades
  DISPONIBLE: PROPIEDAD_ESTADOS.DISPONIBLE,
  OCUPADA: PROPIEDAD_ESTADOS.OCUPADA,
  MANTENIMIENTO: PROPIEDAD_ESTADOS.MANTENIMIENTO,
  RESERVADA: PROPIEDAD_ESTADOS.RESERVADA,
  ARCHIVADA: PROPIEDAD_ESTADOS.ARCHIVADA,
  
  // Contratos
  ACTIVO: CONTRATO_ESTADOS.ACTIVO,
  PLANEADO: CONTRATO_ESTADOS.PLANEADO,
  FINALIZADO: CONTRATO_ESTADOS.FINALIZADO,
  MANTENIMIENTO: CONTRATO_ESTADOS.MANTENIMIENTO,
  CANCELADO: CONTRATO_ESTADOS.CANCELADO,
  
  // Inquilinos
  ACTIVO: INQUILINO_ESTADOS.ACTIVO,
  RESERVADO: INQUILINO_ESTADOS.RESERVADO,
  PENDIENTE: INQUILINO_ESTADOS.PENDIENTE,
  INACTIVO: INQUILINO_ESTADOS.INACTIVO,
  SIN_CONTRATO: INQUILINO_ESTADOS.SIN_CONTRATO,
  CANCELADO: INQUILINO_ESTADOS.CANCELADO,
  
  // Proyectos
  EN_PROGRESO: PROYECTO_ESTADOS.EN_PROGRESO,
  PLANEADO: PROYECTO_ESTADOS.PLANEADO,
  PENDIENTE: PROYECTO_ESTADOS.PENDIENTE,
  COMPLETADO: PROYECTO_ESTADOS.COMPLETADO,
  CANCELADO: PROYECTO_ESTADOS.CANCELADO,
  
  // Tareas
  EN_PROGRESO: TAREA_ESTADOS.EN_PROGRESO,
  PLANEADA: TAREA_ESTADOS.PLANEADA,
  PENDIENTE: TAREA_ESTADOS.PENDIENTE,
  COMPLETADA: TAREA_ESTADOS.COMPLETADA,
  CANCELADA: TAREA_ESTADOS.CANCELADA,
  
  // Transacciones
  PAGADO: TRANSACCION_ESTADOS.PAGADO,
  PLANEADO: TRANSACCION_ESTADOS.PLANEADO,
  PENDIENTE: TRANSACCION_ESTADOS.PENDIENTE,
  COMPLETADA: TRANSACCION_ESTADOS.COMPLETADA,
  CANCELADA: TRANSACCION_ESTADOS.CANCELADA,
  
  // Transacciones Recurrentes
  ACTIVO: TRANSACCION_RECURRENTE_ESTADOS.ACTIVO,
  PLANEADO: TRANSACCION_RECURRENTE_ESTADOS.PLANEADO,
  PAUSADO: TRANSACCION_RECURRENTE_ESTADOS.PAUSADO,
  FINALIZADO: TRANSACCION_RECURRENTE_ESTADOS.FINALIZADO,
  CANCELADO: TRANSACCION_RECURRENTE_ESTADOS.CANCELADO,
  
  // BankConnection
  ACTIVA: BANK_CONNECTION_ESTADOS.ACTIVA,
  PLANEADA: BANK_CONNECTION_ESTADOS.PLANEADA,
  ERROR: BANK_CONNECTION_ESTADOS.ERROR,
  INACTIVA: BANK_CONNECTION_ESTADOS.INACTIVA,
  
  // Inventarios
  BUEN_ESTADO: INVENTARIO_ESTADOS.BUEN_ESTADO,
  NUEVO: INVENTARIO_ESTADOS.NUEVO,
  REGULAR: INVENTARIO_ESTADOS.REGULAR,
  MALO: INVENTARIO_ESTADOS.MALO,
  REPARACION: INVENTARIO_ESTADOS.REPARACION,
  ARCHIVADO: INVENTARIO_ESTADOS.ARCHIVADO,
  
  // Objetivos
  EN_PROGRESO: OBJETIVO_ESTADOS.EN_PROGRESO,
  PLANEADO: OBJETIVO_ESTADOS.PLANEADO,
  PENDIENTE: OBJETIVO_ESTADOS.PENDIENTE,
  COMPLETADO: OBJETIVO_ESTADOS.COMPLETADO,
  CANCELADO: OBJETIVO_ESTADOS.CANCELADO
};

// Función para obtener el componente de icono del estado (con props predefinidas)
export function getStatusIconComponent(estado, tipo = 'PROPIEDAD') {
  const iconName = getEstadoIcon(estado, tipo);
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para estado: ${estado}, tipo: ${tipo}, iconName: ${iconName}`);
    return React.createElement(PendingActionsOutlinedIcon, { sx: { fontSize: '0.9rem' } });
  }
  
  return React.createElement(IconComponent, { sx: { fontSize: '0.9rem' } });
}

// Función para obtener solo el componente de icono (sin props)
export function getStatusIconComponentRaw(estado, tipo = 'PROPIEDAD') {
  const iconName = getEstadoIcon(estado, tipo);
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para estado: ${estado}, tipo: ${tipo}, iconName: ${iconName}`);
    return PendingActionsOutlinedIcon;
  }
  
  return IconComponent;
} 