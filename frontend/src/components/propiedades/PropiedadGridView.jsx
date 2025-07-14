import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip
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
  AttachMoney as CurrencyIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import EntityGridView, { SECTION_CONFIGS, EntityHeader } from '../EntityViews/EntityGridView';
import getEntityHeaderProps from '../EntityViews/entityHeaderProps.jsx';
import { Link } from 'react-router-dom';
import ContratoDetail from './contratos/ContratoDetail';
import { pluralizar, getEstadoContrato, getInquilinoStatusColor, agruparHabitaciones, calcularProgresoOcupacion } from './propiedadUtils';
import { SeccionInquilinos, SeccionHabitaciones, SeccionInventario, SeccionDocumentos } from './SeccionesPropiedad';
import { getInquilinosByPropiedad } from './inquilinos';

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
    // Mapeo completo según el modelo de Habitaciones.js
    const iconMap = {
      'BAÑO': BathtubIcon,
      'TOILETTE': BathtubIcon,
      'DORMITORIO_DOBLE': KingBed,
      'DORMITORIO_SIMPLE': SingleBed,
      'ESTUDIO': ChairOutlined, // desktop_mac -> ChairOutlined
      'COCINA': KitchenOutlined,
      'DESPENSA': InventoryIcon, // inventory_2 -> InventoryIcon
      'SALA_PRINCIPAL': ChairOutlined, // weekend -> ChairOutlined
      'PATIO': HomeOutlined, // yard -> HomeOutlined
      'JARDIN': HomeOutlined, // park -> HomeOutlined
      'TERRAZA': HomeOutlined, // deck -> HomeOutlined
      'LAVADERO': LocalLaundryServiceOutlined,
      'OTRO': BedIcon // room -> BedIcon
    };
    return iconMap[habitacion.tipo] || BedIcon;
  },
  getTitle: (habitacion) => habitacion.nombrePersonalizado || habitacion.tipo.replace('_', ' '),
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

const documentosConfig = {
  getIcon: (documento) => {
    const iconMap = {
      'GASTO_FIJO': MoneyIcon,
      'GASTO_VARIABLE': MoneyIcon,
      'MANTENIMIENTO': Engineering,
      'ALQUILER': HomeOutlined,
      'CONTRATO': ContractIcon,
      'PAGO': DepositIcon,
      'COBRO': CurrencyIcon
    };
    return iconMap[documento.categoria] || ContractIcon;
  },
  getIconColor: (documento) => {
    const colorMap = {
      'GASTO_FIJO': '#f44336',
      'GASTO_VARIABLE': '#ff9800',
      'MANTENIMIENTO': '#2196f3',
      'ALQUILER': '#4caf50',
      'CONTRATO': '#9c27b0',
      'PAGO': '#4caf50',
      'COBRO': '#ff9800'
    };
    return colorMap[documento.categoria] || '#9e9e9e';
  },
  getTitle: (documento) => documento.nombre,
  getSubtitle: (documento) => documento.categoria.replace('_', ' '),
  getHoverInfo: (documento) => {
    const fecha = new Date(documento.fechaCreacion).toLocaleDateString();
    const tamano = documento.tamano ? `${(documento.tamano / 1024).toFixed(1)} KB` : 'Sin tamaño';
    return `${fecha} - ${tamano}`;
  },
  getLinkTo: (documento) => documento.url
};

// Función para crear secciones estándar para una propiedad
const crearSeccionesPropiedad = (propiedad, precio, simboloMoneda, nombreCuenta, moneda, habitaciones, contratos, inventario, documentos = [], extendida = false) => {
  // Calcular progreso de ocupación para obtener el total prorrateado
  const progresoOcupacion = calcularProgresoOcupacion(propiedad);

  // Obtener el array de inquilinos usando el helper
  const inquilinos = getInquilinosByPropiedad(propiedad);

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

  // Crear secciones base (sin documentos ni inquilinos)
  let secciones = [
    SECTION_CONFIGS.financiero(simboloMoneda, nombreCuenta, datosFinancierosAdicionales),
    SECTION_CONFIGS.ubicacion(propiedad)
  ];

  // Si es vista extendida, agregar habitaciones e inventario
  if (extendida) {
    if (habitaciones && habitaciones.length > 0) {
      secciones.push(SECTION_CONFIGS.habitaciones(habitaciones, inventario || []));
    }
    // Aquí puedes agregar otras secciones extendidas si las hubiera
  }

  // Unir documentos y contratos como documentos
  const documentosCompletos = [
    ...(documentos || []),
    ...(contratos || []).map(contrato => ({
      ...contrato,
      categoria: 'CONTRATO',
      // Si el contrato ya tiene inquilino poblado, lo deja; si no, intenta poblarlo desde la propiedad
      inquilino: contrato.inquilino || (Array.isArray(propiedad?.inquilinos) ? propiedad.inquilinos : []),
      url: contrato.documentoUrl || `/contratos/${contrato._id}`
    }))
  ];

  // SIEMPRE agregar la sección de documentos al final
  secciones.push(SECTION_CONFIGS.documentos(documentosCompletos));

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
    <Box>
      {contratosActivos.map((contrato, idx) => (
        <Box key={contrato._id || idx}>
          {/* Inquilinos a la izquierda */}
          <Box>
            {(contrato.inquilino || []).map((i, iidx) => (
              <Typography key={i._id || iidx} variant="caption">
                {i && (i.nombre || i.apellido) ? `${i.nombre || ''} ${i.apellido || ''}`.trim() : ''}
              </Typography>
            ))}
          </Box>
          {/* Link a la derecha */}
          <Box>
            <Link to={`/contratos/${contrato._id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
              {`Contrato ${idx + 1}`}
            </Link>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Render personalizado para la sección de documentos y contratos
function DocumentosSection({ documentosPorCategoria }) {
  if (!documentosPorCategoria || typeof documentosPorCategoria !== 'object') documentosPorCategoria = {};
  const [openContrato, setOpenContrato] = React.useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = React.useState(null);
  return (
    <Box>
      {Object.entries(documentosPorCategoria).map(([categoria, docs]) => {
        if (!docs.length) return null;
        // Contratos: render especial con ojo
        if (categoria === 'CONTRATOS') {
          return (
            <Box key="categoria-contratos">
              <Typography variant="caption">
                Contratos
              </Typography>
              {docs.map((contrato, idx) => (
                <Box key={`contrato-${contrato._id || idx}`}> 
                  <Typography variant="caption">
                    {`Contrato ${idx + 1} - ${(contrato.inquilino||[]).map(i => `${i.nombre || ''} ${i.apellido || ''}`.trim()).join(', ') || 'Sin inquilino'}`}
                  </Typography>
                  <Tooltip title="Ver contrato">
                    <IconButton size="small" onClick={() => { setContratoSeleccionado(contrato); setOpenContrato(true); }}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          );
        }
        // Otros documentos
        return (
          <Box key={`categoria-${categoria}`}>
            <Typography variant="caption">
              {categoria.charAt(0) + categoria.slice(1).toLowerCase().replace('_', ' ')}
            </Typography>
            {docs.map((doc, dIdx) => (
              <Box key={`doc-${doc._id || dIdx}`}> 
                <Typography variant="caption">
                  {doc.nombre}
                </Typography>
                <IconButton size="small" href={doc.url} target="_blank" rel="noopener noreferrer">
                  <VisibilityIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        );
      })}
      <ContratoDetail open={openContrato} onClose={() => setOpenContrato(false)} contrato={contratoSeleccionado} />
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
  habitaciones = [],
  contratos = [],
  inventario = [],
  documentos = [],
  onView,
  onEdit,
  onDelete,
  onExpand
}) => {
  const renderContent = () => {
    switch (type) {
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
            value: `${simboloMoneda} ${calcularProgresoOcupacion(propiedad).montoTotal.toLocaleString()}`,
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
          habitaciones,
          contratos,
          inventario,
          documentos,
          data?.extendida || false // Usar la prop extendida del data si está disponible
        );
        // Renderizar usando EntityGridView con sections
        return (
          <EntityGridView
            type="sections"
            sections={secciones}
            sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
            showCollapseButton={false}
            isCollapsed={false}
            contratos={contratos}
            onEditContrato={onEdit}
            onDeleteContrato={onDelete}
          />
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
          habitaciones,
          contratos,
          inventario,
          documentos,
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

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const contratoActivo = (contratos || []).find(contrato => {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
  });
  const progresoOcupacion = contratoActivo ? {
    diasTranscurridos: Math.max(0, Math.ceil((hoy - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))),
    diasTotales: Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))),
    porcentaje: Math.min(100, (Math.min(Math.max(0, Math.ceil((hoy - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))), Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24)))) / Math.max(1, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24)))) * 100),
    estado: contratoActivo.estado || 'ACTIVO',
    montoAcumulado: (Math.min(Math.max(0, Math.ceil((hoy - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))), Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24)))) / 30) * (precio || 0),
    montoTotal: (Math.max(0, Math.ceil((new Date(contratoActivo.fechaFin) - new Date(contratoActivo.fechaInicio)) / (1000 * 60 * 60 * 24))) / 30) * (precio || 0)
  } : {
    diasTranscurridos: 0,
    diasTotales: 0,
    porcentaje: 0,
    estado: 'PENDIENTE',
    montoAcumulado: 0,
    montoTotal: 0
  };

  return (
    <Box>
      {title && (
        <Typography variant="h6">
          {title}
        </Typography>
      )}
      {renderContent()}
    </Box>
  );
};

export default PropiedadGridView;

export { crearSeccionesPropiedad };