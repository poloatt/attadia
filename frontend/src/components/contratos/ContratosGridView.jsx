import React from 'react';
import {
  Box,
  Typography
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
  ExpandMore as ExpandMoreIcon,
  LocationCityOutlined as CityIcon,
  SquareFootOutlined as AreaIcon,
  AccountBalanceWalletOutlined as DepositIcon
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
import { calcularProgresoContrato } from './ContratoCard.jsx';
import getEntityHeaderProps from '../EntityViews/entityHeaderProps.jsx';
import { Link } from 'react-router-dom';

// Configuraciones para diferentes tipos de datos
const inquilinosConfig = {
  getIcon: (inquilino) => {
    const statusIcons = {
      'ACTIVO': CheckCircleIcon,
      'RESERVADO': ReservedIcon,
      'PENDIENTE': PendingIcon,
      'INACTIVO': PersonIcon
    };
    return statusIcons[inquilino.estado] || PersonIcon;
  },
  getIconColor: (inquilino) => {
    const statusColors = {
      'ACTIVO': '#4caf50',
      'RESERVADO': '#ff9800',
      'PENDIENTE': '#2196f3',
      'INACTIVO': '#9e9e9e'
    };
    return statusColors[inquilino.estado] || '#9e9e9e';
  },
  getTitle: (inquilino) => `${inquilino.nombre} ${inquilino.apellido}`,
  getSubtitle: (inquilino) => inquilino.estado,
  getHoverInfo: (inquilino) => {
    if (inquilino.contrato) {
      return `${new Date(inquilino.contrato.fechaInicio).toLocaleDateString()} - ${new Date(inquilino.contrato.fechaFin).toLocaleDateString()}`;
    }
    return 'Sin contrato';
  }
};

const propiedadesConfig = {
  getIcon: (propiedad) => {
    const iconMap = {
      'CASA': HomeIcon,
      'DEPARTAMENTO': BusinessIcon,
      'APARTAMENTO': BusinessIcon,
      'LOCAL': ServicesIcon
    };
    return iconMap[propiedad.tipo] || HomeIcon;
  },
  getTitle: (propiedad) => propiedad.titulo || 'Sin título',
  getSubtitle: (propiedad) => propiedad.ciudad || '',
  getHoverInfo: (propiedad) => propiedad.metrosCuadrados ? `${propiedad.metrosCuadrados}m²` : 'Sin medidas'
};

const transaccionesConfig = {
  getIcon: () => MoneyIcon,
  getTitle: (transaccion) => transaccion.descripcion || 'Sin descripción',
  getSubtitle: (transaccion) => `${transaccion.moneda?.simbolo || '$'} ${transaccion.monto?.toLocaleString() || 0}`,
  getHoverInfo: (transaccion) => transaccion.fecha ? new Date(transaccion.fecha).toLocaleDateString() : 'Sin fecha'
};

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

// Función para obtener el estado del contrato
const getContratoEstado = (contrato) => {
  if (!contrato) return 'PLANEADO';
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  if (contrato.esMantenimiento || contrato.tipoContrato === 'MANTENIMIENTO') {
    if (inicio <= hoy && fin >= hoy) {
      return 'MANTENIMIENTO';
    } else if (inicio > hoy) {
      return 'PLANEADO';
    } else {
      return 'FINALIZADO';
    }
  }
  
  if (inicio <= hoy && fin >= hoy) {
    return 'ACTIVO';
  } else if (inicio > hoy) {
    return 'PLANEADO';
  } else {
    return 'FINALIZADO';
  }
};

// Función para obtener el color del estado
const getContratoEstadoColor = (estado) => {
  const statusColors = {
    'ACTIVO': '#4caf50',
    'PLANEADO': '#2196f3',
    'FINALIZADO': '#9e9e9e',
    'MANTENIMIENTO': '#ff9800',
    'RESERVADO': '#9c27b0'
  };
  return statusColors[estado] || '#9e9e9e';
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
const crearSeccionesContrato = (contrato, relatedData, extendida = false) => {
  const datos = obtenerDatosRelacionados(contrato, relatedData);
  
  // Calcular valores
  const progresoContrato = calcularProgresoContrato(contrato);
  const montoMensual = contrato.montoMensual || 0;
  const montoTotal = calcularMontoTotal(contrato);
  const simboloMoneda = datos.moneda?.simbolo || '$';
  const nombreCuenta = datos.cuenta?.nombre || 'No especificada';
  const moneda = datos.moneda?.nombre || 'No especificada';

  // Datos adicionales para la sección financiera
  const datosFinancierosAdicionales = [
    {
      icon: MoneyIcon,
      label: 'Mensual',
      value: `${simboloMoneda} ${montoMensual.toLocaleString()}`,
      color: 'text.secondary'
    },
    {
      icon: DepositIcon,
      label: 'Depósito',
      value: `${simboloMoneda} ${(contrato.deposito || 0).toLocaleString()}`,
      color: 'text.secondary'
    },
    {
      icon: MoneyIcon,
      label: 'Total',
      value: `${simboloMoneda} ${progresoContrato.montoTotal.toLocaleString()}`,
      color: 'text.secondary'
    }
  ];

  // Crear secciones base (siempre visibles)
  const secciones = [
    // Sección de tiempo (primaria)
    {
      type: 'primary',
      left: [
        {
          icon: null,
          label: 'restantes',
          value: progresoContrato.diasRestantes !== null && progresoContrato.diasRestantes !== undefined && progresoContrato.diasRestantes !== false
            ? progresoContrato.diasRestantes
            : 'Finalizado',
          subtitle: progresoContrato.diasRestantes !== null && progresoContrato.diasRestantes !== undefined && progresoContrato.diasRestantes !== false ? 'DÍAS RESTANTES' : '',
          color: 'warning.main',
          position: 'left',
          showLargeNumber: true
        }
      ],
      right: [
        {
          icon: null,
          label: 'totales',
          value: progresoContrato.diasTotales || '0',
          subtitle: 'DÍAS EN TOTAL',
          color: 'info.main',
          position: 'right',
          showLargeNumber: true
        }
      ]
    },
    // Sección financiera (primaria)
    SECTION_CONFIGS.financiero(simboloMoneda, nombreCuenta, datosFinancierosAdicionales)
  ];

  // Si es vista extendida, agregar ubicación (sin título)
  if (extendida && datos.propiedad) {
    // Clonar la propiedad pero sin el título
    const ubicacionSinTitulo = { ...datos.propiedad };
    delete ubicacionSinTitulo.titulo;
    secciones.push(SECTION_CONFIGS.ubicacion(ubicacionSinTitulo));
  }

  return secciones;
};

// Render personalizado para la sección de transacciones recurrentes
function TransaccionesRecurrentesSection({ transaccionesRecurrentes, moneda }) {
  if (!transaccionesRecurrentes || transaccionesRecurrentes.length === 0) return null;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
      {transaccionesRecurrentes.map((transaccion, idx) => (
        <Box key={idx} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          justifyContent: 'space-between', 
          bgcolor: 'rgba(255,255,255,0.01)', 
          px: 1, 
          py: 0.5, 
          borderRadius: 0 
        }}>
          {/* Concepto a la izquierda */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <Typography variant="caption" sx={{ 
              fontSize: '0.75rem', 
              color: 'text.primary', 
              whiteSpace: 'nowrap', 
              textOverflow: 'ellipsis', 
              overflow: 'hidden', 
              maxWidth: '100%' 
            }}>
              {transaccion.concepto}
            </Typography>
            <Typography variant="caption" sx={{ 
              fontSize: '0.65rem', 
              color: 'text.secondary' 
            }}>
              Día {transaccion.diaVencimiento}
            </Typography>
          </Box>
          {/* Monto a la derecha */}
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="caption" sx={{ 
              fontSize: '0.75rem', 
              color: 'text.primary',
              fontWeight: 500
            }}>
              {moneda?.simbolo || '$'} {transaccion.monto?.toLocaleString() || 0}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Componente principal ContratosGridView
const ContratosGridView = ({ 
  type, 
  data, 
  title,
  showEmpty = true,
  // Props específicos para contratos
  contrato = null,
  contratos = [],
  relatedData = {},
  onView,
  onEdit,
  onDelete,
  onExpand
}) => {
  const renderContent = () => {
    switch (type) {
      case 'inquilinos':
        return (
          <EntityGridView
            type="list"
            data={data}
            config={inquilinosConfig}
            gridSize={{ xs: 6, sm: 6, md: 6, lg: 6 }}
            emptyMessage="No hay inquilinos registrados"
          />
        );
      case 'propiedades':
        return (
          <EntityGridView
            type="list"
            data={data}
            config={propiedadesConfig}
            gridSize={{ xs: 6, sm: 6, md: 6, lg: 6 }}
            emptyMessage="No hay propiedades registradas"
          />
        );
      case 'transacciones':
        return (
          <EntityGridView
            type="list"
            data={data}
            config={transaccionesConfig}
            gridSize={{ xs: 6, sm: 6, md: 4, lg: 3 }}
            emptyMessage="No hay transacciones registradas"
          />
        );
      case 'transaccionesRecurrentes':
        return (
          <TransaccionesRecurrentesSection 
            transaccionesRecurrentes={data} 
            moneda={relatedData.moneda}
          />
        );
      case 'ubicacion':
        const seccionUbicacion = SECTION_CONFIGS.ubicacion(contrato?.propiedad);
        if (seccionUbicacion.hidden) {
          return (
            <Box sx={{ 
              p: 1.5, 
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                No hay información de ubicación disponible
              </Typography>
            </Box>
          );
        }
        return (
          <EntityGridView
            type="info"
            data={seccionUbicacion.left}
            gridSize={{ xs: 4, sm: 4, md: 4, lg: 4 }}
          />
        );
      case 'financiero':
        const datosFinancierosAdicionales = [
          {
            icon: MoneyIcon,
            label: 'Mensual',
            value: `${contrato?.moneda?.simbolo || '$'} ${(contrato?.montoMensual || 0).toLocaleString()}`,
            color: 'text.secondary'
          },
          {
            icon: DepositIcon,
            label: 'Depósito',
            value: `${contrato?.moneda?.simbolo || '$'} ${(contrato?.deposito || 0).toLocaleString()}`,
            color: 'text.secondary'
          },
          {
            icon: MoneyIcon,
            label: 'Total',
            value: `${contrato?.moneda?.simbolo || '$'} ${calcularMontoTotal(contrato).toLocaleString()}`,
            color: 'text.secondary'
          }
        ];
        const seccionFinanciera = SECTION_CONFIGS.financiero(
          contrato?.moneda?.simbolo || '$', 
          contrato?.cuenta?.nombre || 'No especificada', 
          datosFinancierosAdicionales
        );
        return (
          <EntityGridView
            type="info"
            data={[...seccionFinanciera.left, ...seccionFinanciera.right]}
            gridSize={{ xs: 3, sm: 3, md: 3, lg: 3 }}
          />
        );
      case 'sections':
        // Unificar datos para asegurar que siempre haya información completa
        const contratoData = {
          ...(contrato || {}),
          propiedad: contrato?.propiedad || data?.propiedad,
          inquilino: contrato?.inquilino || data?.inquilino,
          cuenta: contrato?.cuenta || data?.cuenta,
          moneda: contrato?.moneda || data?.moneda,
          fechaInicio: contrato?.fechaInicio || data?.fechaInicio,
          fechaFin: contrato?.fechaFin || data?.fechaFin,
          montoMensual: contrato?.montoMensual || data?.montoMensual,
          tipoContrato: contrato?.tipoContrato || data?.tipoContrato,
          esMantenimiento: contrato?.esMantenimiento || data?.esMantenimiento
        };
        
        // Crear secciones según el estado extendido
        let secciones = crearSeccionesContrato(
          contratoData,
          relatedData,
          data?.extendida || false
        );
        
        // Reemplazar la sección de transacciones recurrentes por el renderer personalizado
        if (contratoData.transaccionesRecurrentes && contratoData.transaccionesRecurrentes.length > 0) {
          secciones.push({
            type: 'custom-transacciones',
            render: () => (
              <TransaccionesRecurrentesSection 
                transaccionesRecurrentes={contratoData.transaccionesRecurrentes} 
                moneda={contratoData.moneda}
              />
            )
          });
        }
        
        return (
          <Box>
            {secciones.map((section, i) =>
              section.type === 'custom-transacciones'
                ? section.render()
                : <EntityGridView 
                    key={i} 
                    type="sections" 
                    sections={[section]} 
                    title={i === 0 ? title : null} // Solo mostrar título en la primera sección
                    sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }} 
                    showCollapseButton={false} 
                    isCollapsed={false} 
                  />
            )}
          </Box>
        );
      case 'compact':
        // Unificar datos para asegurar que siempre haya información completa
        const contratoDataCompact = {
          ...(contrato || {}),
          propiedad: contrato?.propiedad || data?.propiedad,
          inquilino: contrato?.inquilino || data?.inquilino,
          cuenta: contrato?.cuenta || data?.cuenta,
          moneda: contrato?.moneda || data?.moneda,
          fechaInicio: contrato?.fechaInicio || data?.fechaInicio,
          fechaFin: contrato?.fechaFin || data?.fechaFin,
          montoMensual: contrato?.montoMensual || data?.montoMensual,
          tipoContrato: contrato?.tipoContrato || data?.tipoContrato,
          esMantenimiento: contrato?.esMantenimiento || data?.esMantenimiento
        };
        const seccionesCompact = crearSeccionesContrato(
          contratoDataCompact,
          relatedData,
          false // Vista colapsada por defecto
        );
        return (
          <EntityGridView
            type="sections"
            sections={seccionesCompact}
            sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
            showCollapseButton={false}
            isCollapsed={false}
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

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {renderContent()}
    </Box>
  );
};

export default ContratosGridView;

export { crearSeccionesContrato }; 