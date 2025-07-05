import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import {
  HomeOutlined as HomeIcon,
  Engineering as EngineeringIcon,
  BusinessOutlined as BusinessIcon,
  StoreOutlined as ServicesIcon,
  Description as ContractIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  BookmarkAdded as ReservedIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountIcon,
  MonetizationOnOutlined as CurrencyIcon,
  People as PeopleIcon,
  LocationOnOutlined as LocationIcon,
  Schedule as ScheduleIcon,
  ListAlt as ListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import EntityGridView, { SECTION_CONFIGS, EntityHeader } from '../EntityViews/EntityGridView';
import { 
  getEstadoLabel, 
  getEstadoColor, 
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal, 
  formatFecha 
} from './contratoUtils';
import getEntityHeaderProps from '../EntityViews/entityHeaderProps.jsx';

// Función para obtener el ícono del tipo de contrato
const getContratoIcon = (tipo) => {
  const iconMap = {
    'ALQUILER': HomeIcon,
    'MANTENIMIENTO': EngineeringIcon,
    'VENTA': BusinessIcon,
    'SERVICIOS': ServicesIcon
  };
  return iconMap[tipo] || ContractIcon;
};

// Función para obtener el ícono del estado del contrato
const getContratoStatusIcon = (estado) => {
  const statusIcons = {
    'ACTIVO': CheckCircleIcon,
    'RESERVADO': ReservedIcon,
    'PLANEADO': PendingIcon,
    'FINALIZADO': PersonIcon,
    'PENDIENTE': PendingIcon,
    'MANTENIMIENTO': EngineeringIcon
  };
  return statusIcons[estado] || PersonIcon;
};

// Función para calcular duración del contrato
const calcularDuracionContrato = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  if (meses > 0) {
    return `${meses} mes${meses > 1 ? 'es' : ''}`;
  } else {
    return `${dias} día${dias > 1 ? 's' : ''}`;
  }
};

// Función para calcular monto total del contrato
const calcularMontoTotal = (contrato) => {
  const montoMensual = contrato.montoMensual || 0;
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  
  if (meses > 0) {
    return montoMensual * meses;
  } else {
    return montoMensual * (dias / 30);
  }
};

// Función para obtener datos relacionados de un contrato
const obtenerDatosRelacionados = (contrato, relatedData) => {
  // Obtener datos de propiedad
  const propiedadData = (() => {
    if (contrato.propiedad && typeof contrato.propiedad === 'object' && contrato.propiedad.titulo) {
      return contrato.propiedad;
    }
    return relatedData.propiedades?.find(p => p._id === contrato.propiedad);
  })();

  // Obtener datos de inquilinos
  const inquilinosData = (() => {
    if (!contrato.inquilino || contrato.inquilino.length === 0) return [];
    if (contrato.inquilino[0] && typeof contrato.inquilino[0] === 'object' && contrato.inquilino[0].nombre) {
      return contrato.inquilino;
    }
    return contrato.inquilino?.map(inquilinoId => 
      relatedData.inquilinos?.find(i => i._id === inquilinoId)
    ).filter(Boolean) || [];
  })();

  // Obtener datos de cuenta
  const cuentaData = (() => {
    if (contrato.cuenta && typeof contrato.cuenta === 'object' && contrato.cuenta.nombre) {
      return contrato.cuenta;
    }
    return relatedData.cuentas?.find(c => c._id === contrato.cuenta);
  })();

  // Obtener datos de moneda
  const monedaData = (() => {
    if (cuentaData?.moneda) {
      if (typeof cuentaData.moneda === 'object') {
        return cuentaData.moneda;
      }
      return relatedData.monedas?.find(m => m._id === cuentaData.moneda);
    }
    if (contrato.moneda) {
      if (typeof contrato.moneda === 'object') {
        return contrato.moneda;
      }
      return relatedData.monedas?.find(m => m._id === contrato.moneda);
    }
    return null;
  })();

  return {
    propiedad: propiedadData,
    inquilinos: inquilinosData,
    cuenta: cuentaData,
    moneda: monedaData
  };
};

// Función para crear secciones estándar para un contrato
const crearSeccionesContrato = (contrato, relatedData) => {
  const datos = obtenerDatosRelacionados(contrato, relatedData);
  
  // Calcular valores
  const diasRestantes = calcularTiempoRestante(contrato.fechaFin);
  const duracionTotal = calcularDuracionTotal(contrato.fechaInicio, contrato.fechaFin);
  const montoMensual = contrato.montoMensual || 0;
  const montoTotal = calcularMontoTotal(contrato);
  const simboloMoneda = datos.moneda?.simbolo || '$';
  const nombreCuenta = datos.cuenta?.nombre || 'No especificada';
  const moneda = datos.moneda?.nombre || 'No especificada';

  // Primera sección primaria: Tiempo restante + Inquilinos
  const seccionTiempoInquilinos = {
    type: 'primary',
    left: [
      {
        icon: CalendarIcon,
        label: 'Restantes',
        value: diasRestantes ? `${diasRestantes}` : 'Finalizado',
        color: 'warning.main',
        position: 'left'
      },
      {
        icon: ScheduleIcon,
        label: 'Duración',
        value: `de ${duracionTotal}`,
        color: 'info.main',
        position: 'left'
      }
    ],
    right: datos.inquilinos.map(inq => ({
      icon: PeopleIcon,
      label: 'Inquilino',
      value: `${inq.nombre} ${inq.apellido}`,
      color: 'text.secondary',
      position: 'right'
    }))
  };

  // Segunda sección primaria: Cuenta + Alquiler
  const seccionCuentaAlquiler = {
    type: 'primary',
    left: [
      {
        icon: CurrencyIcon,
        label: 'Moneda',
        value: simboloMoneda,
        color: 'text.secondary',
        position: 'left'
      },
      {
        icon: AccountIcon,
        label: 'Cuenta',
        value: nombreCuenta,
        color: 'text.secondary',
        position: 'left'
      }
    ],
    right: [
      {
        icon: MoneyIcon,
        label: 'Alquiler mensual',
        value: `${simboloMoneda} ${montoMensual.toLocaleString()}`,
        color: 'text.secondary',
        position: 'right'
      },
      {
        icon: AccountIcon,
        label: 'Alquiler total',
        value: `${simboloMoneda} ${montoTotal.toLocaleString()}`,
        color: 'text.secondary',
        position: 'right'
      }
    ]
  };

  // Crear secciones usando las configuraciones estándar
  const secciones = [
    // Sección 1: Tiempo restante + Inquilinos (primaria)
    seccionTiempoInquilinos,
    
    // Sección 2: Cuenta + Alquiler (primaria)
    seccionCuentaAlquiler,
    
    // Sección 3: Ubicación (secundaria) - solo si hay propiedad
    SECTION_CONFIGS.ubicacion(datos.propiedad)
  ];

  return secciones;
};

// Configuraciones para diferentes tipos de datos
const contratosConfig = (relatedData) => ({
  getIcon: (contrato) => {
    const iconMap = {
      'ALQUILER': HomeIcon,
      'MANTENIMIENTO': EngineeringIcon,
      'VENTA': BusinessIcon,
      'SERVICIOS': ServicesIcon
    };
    return iconMap[contrato.tipoContrato] || ContractIcon;
  },
  getIconColor: (contrato) => {
    const estado = getEstadoContrato(contrato);
    return getEstadoColor(estado);
  },
  getTitle: (contrato) => {
    const propiedadData = (() => {
      if (contrato.propiedad && typeof contrato.propiedad === 'object' && contrato.propiedad.titulo) {
        return contrato.propiedad;
      }
      return relatedData.propiedades?.find(p => p._id === contrato.propiedad);
    })();
    return propiedadData?.titulo || 'Sin propiedad';
  },
  getSubtitle: (contrato) => {
    const estado = getEstadoContrato(contrato);
    return getEstadoLabel(estado);
  },
  getHoverInfo: (contrato) => {
    const montoMensual = contrato.montoMensual || 0;
    const monedaData = (() => {
      const cuentaData = (() => {
        if (contrato.cuenta && typeof contrato.cuenta === 'object' && contrato.cuenta.nombre) {
          return contrato.cuenta;
        }
        return relatedData.cuentas?.find(c => c._id === contrato.cuenta);
      })();
      
      if (cuentaData?.moneda) {
        if (typeof cuentaData.moneda === 'object') {
          return cuentaData.moneda;
        }
        return relatedData.monedas?.find(m => m._id === cuentaData.moneda);
      }
      if (contrato.moneda) {
        if (typeof contrato.moneda === 'object') {
          return contrato.moneda;
        }
        return relatedData.monedas?.find(m => m._id === contrato.moneda);
      }
      return null;
    })();
    
    return `${monedaData?.simbolo || '$'} ${montoMensual.toLocaleString()} mensual`;
  }
});

const inquilinosConfig = {
  getIcon: () => PeopleIcon,
  getTitle: (inquilino) => `${inquilino.nombre} ${inquilino.apellido}`,
  getSubtitle: (inquilino) => inquilino.estado || 'PENDIENTE'
};

// Configuración para información financiera
const financieroConfig = (contratos) => {
  if (!contratos || contratos.length === 0) {
    return [];
  }

  // Calcular estadísticas
  const contratosActivos = contratos.filter(c => getEstadoContrato(c) === 'ACTIVO');
  const contratosFinalizados = contratos.filter(c => getEstadoContrato(c) === 'FINALIZADO');
  
  const totalIngresos = contratosActivos.reduce((sum, c) => {
    if (c.tipoContrato === 'MANTENIMIENTO') return sum;
    return sum + (c.montoMensual || 0);
  }, 0);

  const promedioMensual = contratosActivos.length > 0 ? totalIngresos / contratosActivos.length : 0;

  return [
    {
      icon: CheckCircleIcon,
      label: 'Contratos Activos',
      value: contratosActivos.length,
      color: '#4caf50'
    },
    {
      icon: PersonIcon,
      label: 'Contratos Finalizados',
      value: contratosFinalizados.length,
      color: '#9e9e9e'
    },
    {
      icon: MoneyIcon,
      label: 'Ingresos Mensuales',
      value: `$${totalIngresos.toLocaleString()}`,
      color: '#2196f3'
    },
    {
      icon: CurrencyIcon,
      label: 'Promedio Mensual',
      value: `$${promedioMensual.toLocaleString()}`,
      color: '#ff9800'
    }
  ];
};

// Función para obtener inquilinos únicos de contratos
const obtenerInquilinosUnicos = (contratos, relatedData) => {
  if (!contratos || contratos.length === 0) {
    return [];
  }

  // Obtener todos los inquilinos únicos de los contratos
  const inquilinosUnicos = new Map();
  contratos.forEach(contrato => {
    if (contrato.inquilino && contrato.inquilino.length > 0) {
      contrato.inquilino.forEach(inquilino => {
        const id = typeof inquilino === 'object' ? inquilino._id : inquilino;
        if (!inquilinosUnicos.has(id)) {
          const inquilinoData = typeof inquilino === 'object' ? inquilino : 
            relatedData.inquilinos?.find(i => i._id === inquilino);
          if (inquilinoData) {
            inquilinosUnicos.set(id, inquilinoData);
          }
        }
      });
    }
  });

  return Array.from(inquilinosUnicos.values());
};

// Componente principal ContratosGridView
const ContratosGridView = ({ 
  type, 
  contratos, 
  title,
  showEmpty = true,
  relatedData = {},
  onEdit,
  onDelete,
  viewMode,
  onToggleView
}) => {
  // Log en el componente principal
  console.log('ContratosGridView principal contratos:', contratos);

  const renderContent = () => {
    // Log en el renderContent
    console.log('ContratosGridView renderContent contratos:', contratos);
    switch (type) {
      case 'contratos':
        if (!contratos || contratos.length === 0) {
          return (
            <Box sx={{ 
              p: 1.5, 
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                No hay contratos registrados
              </Typography>
            </Box>
          );
        }

        return (
          <Box>
            {contratos.map((contrato, index) => {
              const secciones = crearSeccionesContrato(contrato, relatedData);
              const estado = getEstadoContrato(contrato);
              const datos = obtenerDatosRelacionados(contrato, relatedData);
              
              return (
                <Box key={contrato._id || index} sx={{ mb: 2 }}>
                  {/* Solo la entidad principal usa EntityHeader */}
                  {(() => {
                    const headerProps = getEntityHeaderProps({
                      entity: contrato,
                      type: 'contrato',
                      onView: onToggleView,
                      onEdit,
                      onDelete,
                      onExpand: () => {}
                    });
                    return <EntityHeader {...headerProps} />;
                  })()}
                  {/* Secciones organizadas con opción de colapsar */}
                  <EntityGridView
                    type="sections"
                    sections={secciones}
                    sectionGridSize={{ xs: 6, sm: 6, md: 6, lg: 6 }}
                    showCollapseButton={true}
                    isCollapsed={false}
                  />
                </Box>
              );
            })}
          </Box>
        );
      case 'financiero':
        return (
          <EntityGridView
            type="info"
            data={financieroConfig(contratos)}
            gridSize={{ xs: 6, sm: 6, md: 3, lg: 3 }}
            emptyMessage="No hay contratos para mostrar información financiera"
          />
        );
      case 'inquilinos':
        const inquilinos = obtenerInquilinosUnicos(contratos, relatedData);
        return (
          <EntityGridView
            type="list"
            data={inquilinos}
            config={inquilinosConfig}
            gridSize={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}
            emptyMessage="No hay inquilinos registrados en los contratos"
          />
        );
      default:
        return (
          <Box sx={{ 
            p: 1.5, 
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Tipo de vista no reconocido: {type}
            </Typography>
          </Box>
        );
    }
  };

  return renderContent();
};

export default ContratosGridView; 