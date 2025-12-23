import React from 'react';

// Sistema centralizado de estados para toda la aplicación
// Unifica iconos, colores y textos para todos los chips de estado

// Importaciones modulares de iconos de Material-UI - usando iconos básicos que siempre existen
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
// Usar WarningAmber para estados de error para compatibilidad amplia
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';

// ============================================================================
// ESTADOS BASE CENTRALES
// ============================================================================
// Estados centrales definidos por significado, no por nombre
// Estos son los estados base que se mapean a cada tipo de entidad
const ESTADOS_BASE = {
  PENDING: {
    color: '#ffd54f', // Amarillo - pendiente/open/sin progreso/reservada/no asignada/no iniciada
    icon: 'BookmarkBorderOutlined'
  },
  IN_PROGRESS: {
    color: '#64b5f6', // Azul - en progreso/a tiempo/planeada
    icon: 'BookmarkAdded'
  },
  COMPLETED: {
    color: '#81c784', // Verde - completada/pagado/finalizado
    icon: 'BookmarkAdded'
  },
  BLOCKED: {
    color: '#ff9800', // Naranja - atrasada/retrasada/bloqueada/overbudget
    icon: 'BookmarkBorderOutlined'
  },
  CANCELLED: {
    color: '#9e9e9e', // Gris - cancelada
    icon: 'BookmarkBorderOutlined'
  },
  ARCHIVED: {
    color: '#bdbdbd', // Gris claro - archivada
    icon: 'BookmarkAdded'
  }
};

// ============================================================================
// MAPEO DE ESTADOS POR TIPO DE ENTIDAD
// ============================================================================
// Mapea estados específicos de cada tipo de entidad a estados base
const ESTADO_MAP = {
  PROPIEDAD: {
    DISPONIBLE: 'PENDING',
    RESERVADA: 'IN_PROGRESS',
    OCUPADA: 'IN_PROGRESS',
    MANTENIMIENTO: 'BLOCKED',
    ARCHIVADA: 'ARCHIVED'
  },
  CONTRATO: {
    PENDIENTE: 'PENDING',
    PLANEADO: 'IN_PROGRESS',
    ACTIVO: 'IN_PROGRESS',
    FINALIZADO: 'COMPLETED',
    MANTENIMIENTO: 'BLOCKED',
    CANCELADO: 'CANCELLED'
  },
  INQUILINO: {
    PENDIENTE: 'PENDING',
    RESERVADO: 'IN_PROGRESS',
    ACTIVO: 'IN_PROGRESS',
    INACTIVO: 'ARCHIVED',
    SIN_CONTRATO: 'ARCHIVED',
    CANCELADO: 'CANCELLED'
  },
  PROYECTO: {
    PENDIENTE: 'PENDING',
    PLANEADO: 'IN_PROGRESS',
    EN_PROGRESO: 'IN_PROGRESS',
    COMPLETADO: 'COMPLETED',
    CANCELADO: 'CANCELLED'
  },
  TAREA: {
    PENDIENTE: 'PENDING',
    PLANEADA: 'PENDING',
    EN_PROGRESO: 'IN_PROGRESS',
    COMPLETADA: 'COMPLETED',
    BLOQUEADA: 'BLOCKED',
    RETRASADA: 'BLOCKED',
    CANCELADA: 'CANCELLED'
  },
  TRANSACCION: {
    PENDIENTE: 'PENDING',
    PLANEADO: 'IN_PROGRESS',
    PAGADO: 'COMPLETED',
    COMPLETADA: 'COMPLETED',
    CANCELADA: 'CANCELLED'
  },
  TRANSACCION_RECURRENTE: {
    PLANEADO: 'IN_PROGRESS',
    ACTIVO: 'IN_PROGRESS',
    PAUSADO: 'BLOCKED',
    FINALIZADO: 'COMPLETED',
    CANCELADO: 'CANCELLED'
  },
  BANK_CONNECTION: {
    PLANEADA: 'IN_PROGRESS',
    ACTIVA: 'IN_PROGRESS',
    ERROR: 'BLOCKED',
    INACTIVA: 'ARCHIVED'
  },
  INVENTARIO: {
    NUEVO: 'PENDING',
    REGULAR: 'BLOCKED',
    MALO: 'BLOCKED',
    REPARACION: 'BLOCKED',
    BUEN_ESTADO: 'COMPLETED',
    ARCHIVADO: 'ARCHIVED'
  },
  OBJETIVO: {
    PENDIENTE: 'PENDING',
    PLANEADO: 'IN_PROGRESS',
    EN_PROGRESO: 'IN_PROGRESS',
    COMPLETADO: 'COMPLETED',
    CANCELADO: 'CANCELLED'
  }
};

// ============================================================================
// TEXTOS PERSONALIZADOS POR TIPO/ESTADO
// ============================================================================
// Textos específicos para cada estado de cada tipo de entidad
const TEXT_MAP = {
  PROPIEDAD: {
    DISPONIBLE: 'Disponible',
    RESERVADA: 'Reservada',
    OCUPADA: 'Ocupada',
    MANTENIMIENTO: 'Mantenimiento',
    ARCHIVADA: 'Archivada'
  },
  CONTRATO: {
    PENDIENTE: 'Pendiente',
    PLANEADO: 'Planeado',
    ACTIVO: 'Activo',
    FINALIZADO: 'Finalizado',
    MANTENIMIENTO: 'Mantenimiento',
    CANCELADO: 'Cancelado'
  },
  INQUILINO: {
    PENDIENTE: 'Pendiente',
    RESERVADO: 'Reservado',
    ACTIVO: 'Activo',
    INACTIVO: 'Inactivo',
    SIN_CONTRATO: 'Sin contrato',
    CANCELADO: 'Cancelado'
  },
  PROYECTO: {
    PENDIENTE: 'Pendiente',
    PLANEADO: 'Planeado',
    EN_PROGRESO: 'En progreso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado'
  },
  TAREA: {
    PENDIENTE: 'Pendiente',
    PLANEADA: 'Planeada',
    EN_PROGRESO: 'En progreso',
    COMPLETADA: 'Completada',
    BLOQUEADA: 'Bloqueada',
    RETRASADA: 'Retrasada',
    CANCELADA: 'Cancelada'
  },
  TRANSACCION: {
    PENDIENTE: 'Pendiente',
    PLANEADO: 'Planeado',
    PAGADO: 'Pagado',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada'
  },
  TRANSACCION_RECURRENTE: {
    PLANEADO: 'Planeado',
    ACTIVO: 'Activo',
    PAUSADO: 'Pausado',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado'
  },
  BANK_CONNECTION: {
    PLANEADA: 'Planeada',
    ACTIVA: 'Activa',
    ERROR: 'Error',
    INACTIVA: 'Inactiva'
  },
  INVENTARIO: {
    NUEVO: 'Nuevo',
    REGULAR: 'Regular',
    MALO: 'Malo',
    REPARACION: 'En Reparación',
    BUEN_ESTADO: 'Buen Estado',
    ARCHIVADO: 'Archivado'
  },
  OBJETIVO: {
    PENDIENTE: 'Pendiente',
    PLANEADO: 'Planeado',
    EN_PROGRESO: 'En Progreso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado'
  }
};

// ============================================================================
// ICONOS ESPECIALES POR TIPO/ESTADO
// ============================================================================
// Iconos personalizados que difieren del estado base
const ICON_OVERRIDE_MAP = {
  PROPIEDAD: {
    MANTENIMIENTO: 'EngineeringOutlined'
  },
  CONTRATO: {
    MANTENIMIENTO: 'EngineeringOutlined'
  },
  BANK_CONNECTION: {
    ACTIVA: 'CheckCircle',
    PLANEADA: 'PendingActions',
    ERROR: 'Cancel',
    INACTIVA: 'BookmarkAdded'
  },
  INVENTARIO: {
    BUEN_ESTADO: 'CheckCircle',
    NUEVO: 'PendingActions',
    REGULAR: 'Engineering',
    MALO: 'Cancel',
    REPARACION: 'Engineering',
    ARCHIVADO: 'BookmarkAdded'
  },
  OBJETIVO: {
    EN_PROGRESO: 'CheckCircle',
    PLANEADO: 'PendingActions',
    PENDIENTE: 'Engineering',
    COMPLETADO: 'BookmarkAdded',
    CANCELADO: 'Cancel'
  }
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtiene información completa de un estado (color, icono, texto)
 * @param {string} estado - Nombre del estado (ej: 'PENDIENTE', 'ACTIVO')
 * @param {string} tipo - Tipo de entidad (ej: 'TAREA', 'PROYECTO')
 * @returns {Object} Objeto con color, icon y text
 */
export function getEstadoInfo(estado, tipo = 'PROPIEDAD') {
  if (!estado) {
    return {
      icon: 'PendingActions',
      color: '#bdbdbd',
      text: 'Desconocido'
    };
  }

  const tipoUpper = tipo.toUpperCase();
  const estadoUpper = estado.toUpperCase();

  // Obtener el estado base mapeado
  const estadoBaseKey = ESTADO_MAP[tipoUpper]?.[estadoUpper];
  const estadoBase = estadoBaseKey ? ESTADOS_BASE[estadoBaseKey] : null;

  if (!estadoBase) {
    // Fallback si no se encuentra el mapeo
    return {
      icon: 'PendingActions',
      color: '#bdbdbd',
      text: estado || 'Desconocido'
    };
  }

  // Obtener icono (con override si existe)
  const iconOverride = ICON_OVERRIDE_MAP[tipoUpper]?.[estadoUpper];
  const icon = iconOverride || estadoBase.icon;

  // Obtener texto personalizado
  const text = TEXT_MAP[tipoUpper]?.[estadoUpper] || estado;

  return {
    icon,
    color: estadoBase.color,
    text
  };
}

/**
 * Obtiene solo el icono del estado
 */
export function getEstadoIcon(estado, tipo = 'PROPIEDAD') {
  return getEstadoInfo(estado, tipo).icon;
}

/**
 * Obtiene solo el color del estado
 */
export function getEstadoColor(estado, tipo = 'PROPIEDAD') {
  return getEstadoInfo(estado, tipo).color;
}

/**
 * Obtiene solo el texto del estado
 */
export function getEstadoText(estado, tipo = 'PROPIEDAD') {
  return getEstadoInfo(estado, tipo).text;
}

// ============================================================================
// MAPEO DE ICONOS A COMPONENTES DE MATERIAL-UI
// ============================================================================
export const ICON_MAP = {
  'BookmarkAdded': CircleIcon,
  'BookmarkBorderOutlined': RadioButtonUncheckedIcon,
  'EngineeringOutlined': EngineeringOutlinedIcon,
  'CheckCircle': CheckCircleOutlinedIcon,
  'PendingActions': PendingActionsOutlinedIcon,
  'Cancel': CancelOutlinedIcon,
  'Engineering': EngineeringOutlinedIcon,
  'Pause': PauseOutlinedIcon,
  'ErrorOutline': WarningAmberOutlinedIcon,
  'NewReleases': NewReleasesOutlinedIcon,
  'WarningAmber': WarningAmberOutlinedIcon,
  'Description': DescriptionOutlinedIcon
};

// ============================================================================
// EXPORTS DE COMPATIBILIDAD
// ============================================================================
// Generar los exports de compatibilidad desde los estados base
// Esto mantiene la compatibilidad con código existente que importa TAREA_ESTADOS, etc.

function generateEstadoExport(tipo) {
  const tipoUpper = tipo.toUpperCase();
  const estadoMap = ESTADO_MAP[tipoUpper] || {};
  const textMap = TEXT_MAP[tipoUpper] || {};
  const iconOverrideMap = ICON_OVERRIDE_MAP[tipoUpper] || {};

  const exportObj = {};
  for (const [estado, estadoBaseKey] of Object.entries(estadoMap)) {
    const estadoBase = ESTADOS_BASE[estadoBaseKey];
    const iconOverride = iconOverrideMap[estado];
    exportObj[estado] = {
      icon: iconOverride || estadoBase.icon,
      color: estadoBase.color,
      text: textMap[estado] || estado
    };
  }
  return exportObj;
}

export const PROPIEDAD_ESTADOS = generateEstadoExport('PROPIEDAD');
export const CONTRATO_ESTADOS = generateEstadoExport('CONTRATO');
export const INQUILINO_ESTADOS = generateEstadoExport('INQUILINO');
export const PROYECTO_ESTADOS = generateEstadoExport('PROYECTO');
export const TAREA_ESTADOS = generateEstadoExport('TAREA');
export const TRANSACCION_ESTADOS = generateEstadoExport('TRANSACCION');
export const TRANSACCION_RECURRENTE_ESTADOS = generateEstadoExport('TRANSACCION_RECURRENTE');
export const BANK_CONNECTION_ESTADOS = generateEstadoExport('BANK_CONNECTION');
export const INVENTARIO_ESTADOS = generateEstadoExport('INVENTARIO');
export const OBJETIVO_ESTADOS = generateEstadoExport('OBJETIVO');

// ============================================================================
// FUNCIONES DE ICONOS
// ============================================================================

/**
 * Obtiene el componente de icono del estado (con props predefinidas)
 */
export function getStatusIconComponent(estado, tipo = 'PROPIEDAD') {
  const iconName = getEstadoIcon(estado, tipo);
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para estado: ${estado}, tipo: ${tipo}, iconName: ${iconName}`);
    return React.createElement(PendingActionsOutlinedIcon, { sx: { fontSize: '0.9rem' } });
  }
  
  return React.createElement(IconComponent, { sx: { fontSize: '0.9rem' } });
}

/**
 * Obtiene solo el componente de icono (sin props)
 */
export function getStatusIconComponentRaw(estado, tipo = 'PROPIEDAD') {
  const iconName = getEstadoIcon(estado, tipo);
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para estado: ${estado}, tipo: ${tipo}, iconName: ${iconName}`);
    return PendingActionsOutlinedIcon;
  }
  
  return IconComponent;
}
