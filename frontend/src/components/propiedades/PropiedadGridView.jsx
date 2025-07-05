import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import {
  PeopleOutlined as PeopleIcon,
  BedOutlined as BedIcon,
  BathtubOutlined as BathtubIcon,
  DescriptionOutlined as ContractIcon,
  Inventory2Outlined as InventoryIcon,
  CheckCircle,
  PendingActions,
  Engineering,
  BookmarkAdded,
  Person,
  SingleBed,
  KingBed,
  ChairOutlined,
  KitchenOutlined,
  ShowerOutlined,
  LocalLaundryServiceOutlined,
  AccountBalance,
  HomeOutlined,
  BusinessOutlined,
  StoreOutlined,
  LocationOnOutlined as AddressIcon,
  LocationCityOutlined as CityIcon,
  SquareFootOutlined as AreaIcon,
  MonetizationOnOutlined as MoneyIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  AccountBalance as BankIcon,
  AttachMoney as CurrencyIcon
} from '@mui/icons-material';
import EntityGridView, { SECTION_CONFIGS, EntityHeader } from '../EntityViews/EntityGridView';
import getEntityHeaderProps from '../EntityViews/entityHeaderProps.jsx';
import { Link } from 'react-router-dom';

// Configuraciones para diferentes tipos de datos

// Configuraciones para diferentes tipos de datos
const inquilinosConfig = {
  getIcon: (inquilino) => {
    const statusIcons = {
      'ACTIVO': CheckCircle,
      'RESERVADO': BookmarkAdded,
      'PENDIENTE': PendingActions,
      'INACTIVO': Person
    };
    return statusIcons[inquilino.estado] || Person;
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

const habitacionesConfig = {
  getIcon: (habitacion) => {
  const iconMap = {
    'DORMITORIO': BedIcon,
    'DORMITORIO_PRINCIPAL': KingBed,
    'DORMITORIO_SECUNDARIO': SingleBed,
    'BANO': BathtubIcon,
    'COCINA': KitchenOutlined,
    'SALA': ChairOutlined,
    'COMEDOR': ChairOutlined,
    'LAVANDERIA': LocalLaundryServiceOutlined,
    'BALCON': HomeOutlined,
    'TERRAZA': HomeOutlined
  };
    return iconMap[habitacion.tipo] || BedIcon;
  },
  getTitle: (habitacion) => habitacion.nombre || habitacion.tipo.replace('_', ' '),
  getHoverInfo: (habitacion) => habitacion.metrosCuadrados ? `${habitacion.metrosCuadrados}m²` : 'Sin medidas'
};

const contratosConfig = {
  getIcon: (contrato) => {
    const iconMap = {
      'ALQUILER': HomeOutlined,
      'MANTENIMIENTO': Engineering,
      'VENTA': BusinessOutlined,
      'SERVICIOS': StoreOutlined
    };
    return iconMap[contrato.tipoContrato] || ContractIcon;
  },
  getIconColor: (contrato) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    
    let estado;
    if (inicio <= hoy && fin > hoy) {
      estado = 'ACTIVO';
    } else if (inicio > hoy) {
      estado = contrato.estado === 'RESERVADO' ? 'RESERVADO' : 'PLANEADO';
    } else if (fin < hoy) {
      estado = 'FINALIZADO';
    } else {
      estado = contrato.estado || 'PENDIENTE';
    }
    
    const statusColors = {
      'ACTIVO': '#4caf50',
      'RESERVADO': '#ff9800',
      'PLANEADO': '#2196f3',
      'FINALIZADO': '#9e9e9e',
      'PENDIENTE': '#f44336'
    };
    return statusColors[estado] || '#9e9e9e';
  },
  getTitle: (contrato, index) => (
    <Link to={`/contratos/${contrato._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {`Contrato ${index + 1}`}
    </Link>
  ),
  getSubtitle: (contrato) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    
    if (inicio <= hoy && fin > hoy) {
      return 'ACTIVO';
    } else if (inicio > hoy) {
      return contrato.estado === 'RESERVADO' ? 'RESERVADO' : 'PLANEADO';
    } else if (fin < hoy) {
      return 'FINALIZADO';
    }
    return contrato.estado || 'PENDIENTE';
  },
  getLinkTo: (contrato) => `/contratos/${contrato._id}`,
  getInquilinos: (contrato) => {
    if (!contrato.inquilino || !Array.isArray(contrato.inquilino)) return [];
    return contrato.inquilino.map(i => i && (i.nombre || i.apellido) ? `${i.nombre || ''} ${i.apellido || ''}`.trim() : '').filter(Boolean);
  }
};

const inventarioConfig = {
  getIcon: () => InventoryIcon,
  getTitle: (item) => item.nombre,
  getSubtitle: (item) => `Cant: ${item.cantidad || 1}`
};

// Función para crear secciones estándar para una propiedad
const crearSeccionesPropiedad = (propiedad, precio, simboloMoneda, nombreCuenta, moneda, inquilinos, habitaciones, contratos, inventario, extendida = false) => {
  // Calcular progreso de ocupación para obtener el total prorrateado
  const calcularProgresoOcupacion = (prop) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // Encontrar contrato activo
    const contratoActivo = (prop.contratos || []).find(contrato => {
      const inicio = new Date(contrato.fechaInicio);
      const fin = new Date(contrato.fechaFin);
      return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
    });
    if (!contratoActivo) {
      return { montoTotal: 0 };
    }
    const inicio = new Date(contratoActivo.fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(contratoActivo.fechaFin);
    fin.setHours(0, 0, 0, 0);
    const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
    const montoMensual = prop.precio || 0;
    const montoTotal = (diasTotales / 30) * montoMensual;
    return { montoTotal };
  };

  const progresoOcupacion = calcularProgresoOcupacion(propiedad);

  const datosFinancierosAdicionales = [
    {
      icon: MoneyIcon,
      label: 'Mensual',
      value: `${simboloMoneda} ${precio.toLocaleString()}`,
      color: 'text.secondary'
    },
    {
      icon: DepositIcon,
      label: 'Depósito',
      value: `${simboloMoneda} ${(precio * 2).toLocaleString()}`,
      color: 'text.secondary'
    },
    {
      icon: MoneyIcon,
      label: 'Total',
      value: `${simboloMoneda} ${progresoOcupacion.montoTotal.toLocaleString()}`,
      color: 'text.secondary'
    }
  ];

  // Crear secciones base (siempre visibles)
  const secciones = [
    SECTION_CONFIGS.ubicacion(propiedad),
    SECTION_CONFIGS.financiero(simboloMoneda, nombreCuenta, datosFinancierosAdicionales),
    SECTION_CONFIGS.inquilinos(inquilinos, contratos, inquilinos)
  ];

  // Si es vista extendida, agregar habitaciones e inventario
  if (extendida) {
    // Sección de habitaciones
    if (habitaciones && habitaciones.length > 0) {
      secciones.push(SECTION_CONFIGS.habitaciones(habitaciones));
    }
    
    // Sección de resumen de inventario (siempre mostrar en vista extendida)
    secciones.push(SECTION_CONFIGS.resumenInventario(inventario || []));
  }

  return secciones;
};

// Función para obtener el ícono del tipo de propiedad
const getPropiedadIcon = (tipo) => {
  const iconMap = {
    'CASA': HomeOutlined,
    'DEPARTAMENTO': BusinessOutlined,
    'APARTAMENTO': BusinessOutlined,
    'LOCAL': StoreOutlined
  };
  return iconMap[tipo?.toUpperCase()] || HomeOutlined;
};

// Función para obtener el estado de la propiedad
const getPropiedadEstado = (propiedad) => {
  if (!propiedad) return 'DISPONIBLE';
  
  const contratosActivos = propiedad.contratos?.filter(c => {
    const hoy = new Date();
    const inicio = new Date(c.fechaInicio);
    const fin = new Date(c.fechaFin);
    return inicio <= hoy && fin >= hoy;
  }) || [];
  
  if (contratosActivos.length > 0) {
    return 'OCUPADA';
  }
  
  return propiedad.estado || 'DISPONIBLE';
};

// Función para obtener el color del estado
const getPropiedadEstadoColor = (estado) => {
  const statusColors = {
    'DISPONIBLE': '#4caf50',
    'OCUPADA': '#ff9800',
    'MANTENIMIENTO': '#2196f3',
    'RESERVADA': '#9c27b0'
  };
  return statusColors[estado] || '#9e9e9e';
};

// Render personalizado para la sección de contratos activos
function ContratosActivosSection({ contratos }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const contratosActivos = (contratos || []).filter(c => {
    const inicio = new Date(c.fechaInicio);
    const fin = new Date(c.fechaFin);
    return inicio <= hoy && fin > hoy;
  });
  if (contratosActivos.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
      {contratosActivos.map((contrato, idx) => (
        <Box key={contrato._id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.01)', px: 1, py: 0.5, borderRadius: 0 }}>
          {/* Inquilinos a la izquierda */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            {(contrato.inquilino || []).map((i, iidx) => (
              <Typography key={i._id || iidx} variant="caption" sx={{ fontSize: '0.75rem', color: 'text.primary', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
                {i && (i.nombre || i.apellido) ? `${i.nombre || ''} ${i.apellido || ''}`.trim() : ''}
              </Typography>
            ))}
          </Box>
          {/* Link a la derecha */}
          <Box sx={{ flexShrink: 0 }}>
            <Link to={`/contratos/${contrato._id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
              {`Contrato ${idx + 1}`}
            </Link>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Componente principal PropiedadGridView
const PropiedadGridView = ({ 
  type, 
  data, 
  title,
  showEmpty = true,
  direccion,
  ciudad,
  metrosCuadrados,
  precio,
  simboloMoneda,
  nombreCuenta,
  moneda,
  // Nuevos props para usar con secciones estándar
  propiedad = null,
  inquilinos = [],
  habitaciones = [],
  contratos = [],
  inventario = [],
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
      case 'habitaciones':
        return (
          <EntityGridView
            type="list"
            data={data}
            config={habitacionesConfig}
            isCompact={true}
            fixedSlots={8}
            itemsPerPage={8}
            gridSize={{ xs: 3, sm: 3, md: 3, lg: 3 }}
            emptyMessage="Sin habitaciones"
          />
        );
      case 'contratos':
        return (
          <ContratosActivosSection contratos={contratos} />
        );
      case 'inventario':
        return (
          <EntityGridView
            type="list"
            data={data}
            config={inventarioConfig}
            gridSize={{ xs: 3, sm: 3, md: 2.4, lg: 2 }}
            emptyMessage="No hay elementos en el inventario"
          />
        );
      case 'ubicacion':
        const seccionUbicacion = SECTION_CONFIGS.ubicacion(propiedad || { direccion, ciudad, metrosCuadrados });
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
            value: `${simboloMoneda} ${precio.toLocaleString()}`,
            color: 'text.secondary'
          },
          {
            icon: DepositIcon,
            label: 'Depósito',
            value: `${simboloMoneda} ${(precio * 2).toLocaleString()}`,
            color: 'text.secondary'
          },
          {
            icon: MoneyIcon,
            label: 'Total',
            value: `${simboloMoneda} ${progresoOcupacion.montoTotal.toLocaleString()}`,
            color: 'text.secondary'
          }
        ];
        const seccionFinanciera = SECTION_CONFIGS.financiero(simboloMoneda, nombreCuenta, datosFinancierosAdicionales);
        return (
          <EntityGridView
            type="info"
            data={[...seccionFinanciera.left, ...seccionFinanciera.right]}
            gridSize={{ xs: 3, sm: 3, md: 3, lg: 3 }}
          />
        );
      case 'sections':
        // Unificar datos para asegurar que siempre haya dirección, ciudad, metrosCuadrados y tipo
        const propiedadData = {
          ...(propiedad || {}),
          direccion: (propiedad && propiedad.direccion) || direccion,
          ciudad: (propiedad && propiedad.ciudad) || ciudad,
          metrosCuadrados: (propiedad && propiedad.metrosCuadrados) || metrosCuadrados,
          tipo: (propiedad && propiedad.tipo) || (typeof tipo !== 'undefined' ? tipo : undefined)
        };
        
        // Crear secciones según el estado extendido (usar prop extendida si está disponible)
        let secciones = crearSeccionesPropiedad(
          propiedadData,
          precio,
          simboloMoneda,
          nombreCuenta,
          moneda,
          inquilinos,
          habitaciones,
          contratos,
          inventario,
          data?.extendida || false // Usar la prop extendida del data si está disponible
        );
        // Buscar el índice de la sección de inquilinos
        const idxInquilinos = secciones.findIndex(s => s.left && s.left[0]?.icon === PeopleIcon);
        if (idxInquilinos !== -1) {
          secciones[idxInquilinos] = {
            type: 'custom-inquilinos',
            render: () => (
              <EntityGridView
                type="list"
                data={inquilinos}
                config={inquilinosConfig}
                gridSize={{ xs: 6, sm: 6, md: 6, lg: 6 }}
                emptyMessage="Sin inquilinos"
                inquilinos={inquilinos}
              />
            )
          };
        }
        // Reemplazar la sección de contratos estándar por el renderer personalizado
        const idxContratos = secciones.findIndex(s => s.left && s.left[0]?.icon === ContractIcon);
        if (idxContratos !== -1) {
          secciones[idxContratos] = {
            type: 'custom-contratos',
            render: () => <ContratosActivosSection contratos={contratos} />
          };
        }
        return (
          <Box>
            {secciones.map((section, i) =>
              section.type === 'custom-contratos'
                ? section.render()
                : section.type === 'custom-inquilinos'
                  ? section.render()
                  : <EntityGridView 
                      key={i} 
                      type="sections" 
                      sections={[section]} 
                      sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }} 
                      showCollapseButton={false} 
                      isCollapsed={false}
                      contratos={contratos}
                      onEditContrato={onEdit}
                      onDeleteContrato={onDelete}
                      inquilinos={inquilinos}
                    />
            )}
          </Box>
        );
      case 'compact':
        // Unificar datos para asegurar que siempre haya dirección, ciudad, metrosCuadrados y tipo
        const propiedadDataCompact = {
          ...(propiedad || {}),
          direccion: (propiedad && propiedad.direccion) || direccion,
          ciudad: (propiedad && propiedad.ciudad) || ciudad,
          metrosCuadrados: (propiedad && propiedad.metrosCuadrados) || metrosCuadrados,
          tipo: (propiedad && propiedad.tipo) || (typeof tipo !== 'undefined' ? tipo : undefined)
        };
        const seccionesCompact = crearSeccionesPropiedad(
          propiedadDataCompact,
          precio,
          simboloMoneda,
          nombreCuenta,
          moneda,
          inquilinos,
          habitaciones,
          contratos,
          inventario,
          false // Vista colapsada por defecto
        );
        return (
          <EntityGridView
            type="sections"
            sections={seccionesCompact}
            sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
            showCollapseButton={false}
            isCollapsed={false}
            contratos={contratos}
            onEditContrato={onEdit}
            onDeleteContrato={onDelete}
            inquilinos={inquilinos}
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
    <Box>
      {title && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {renderContent()}
    </Box>
  );
};

export default PropiedadGridView;

export { crearSeccionesPropiedad };