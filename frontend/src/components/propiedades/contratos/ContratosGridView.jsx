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
import { CommonCard } from '../../common/CommonCard';
import { 
  getEstadoLabel, 
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal, 
  formatFecha,
  calcularProgresoContrato,
  calcularAlquilerMensualPromedio,
  calcularPrecioTotalContrato,
  generarCuotasMensuales,
  crearSeccionesContrato,
  calcularMontoTotalEstimado,
  obtenerDatosRelacionados
} from './contratoUtils';
import { getEstadoColor } from '../../common/StatusSystem';
import { CommonHeader as getEntityHeaderProps } from '../../common';
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
    return getEstadoColor(inquilino.estado, 'INQUILINO');
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
  getTitle: (propiedad) => propiedad.alias || 'Sin alias',
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



// Eliminar las funciones locales duplicadas: calcularMontoTotal, crearSeccionesContrato, etc.
// Usar solo las importadas de contratoUtils.js en todo el archivo

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
          <CommonCard
            type="list"
            data={data}
            config={inquilinosConfig}
            gridSize={{ xs: 6, sm: 6, md: 6, lg: 6 }}
            emptyMessage="No hay inquilinos registrados"
          />
        );
      case 'propiedades':
        return (
          <CommonCard
            type="list"
            data={data}
            config={propiedadesConfig}
            gridSize={{ xs: 6, sm: 6, md: 6, lg: 6 }}
            emptyMessage="No hay propiedades registradas"
          />
        );
      case 'transacciones':
        return (
          <CommonCard
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
          <CommonCard
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
            value: `${contrato?.moneda?.simbolo || '$'} ${calcularAlquilerMensualPromedio(contrato).toLocaleString()}`,
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
            value: `${contrato?.moneda?.simbolo || '$'} ${calcularMontoTotalEstimado(contrato).toLocaleString()}`,
            color: 'text.secondary'
          }
        ];
        const seccionFinanciera = SECTION_CONFIGS.financiero(
          contrato?.moneda?.simbolo || '$', 
          contrato?.cuenta?.nombre || 'No especificada', 
          datosFinancierosAdicionales
        );
        return (
          <CommonCard
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
          montoMensual: calcularAlquilerMensualPromedio(contrato),
          tipoContrato: contrato?.tipoContrato || data?.tipoContrato,
          esMantenimiento: contrato?.esMantenimiento || data?.esMantenimiento
        };
        
        // Crear secciones según el estado extendido
        let secciones = crearSeccionesContrato(
          contratoData,
          relatedData,
          [] // Pasar array vacío en lugar de booleano
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
                : <CommonCard 
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
          montoMensual: calcularAlquilerMensualPromedio(contrato),
          tipoContrato: contrato?.tipoContrato || data?.tipoContrato,
          esMantenimiento: contrato?.esMantenimiento || data?.esMantenimiento
        };
        const seccionesCompact = crearSeccionesContrato(
          contratoDataCompact,
          relatedData,
          [] // Pasar array vacío en lugar de booleano
        );
        return (
          <CommonCard
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
