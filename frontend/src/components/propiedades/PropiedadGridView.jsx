import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
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
import { Link } from 'react-router-dom';

// Componente Paper estilizado minimalista con fondo del tema
const GeometricPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(0.75),
  border: 'none',
  backgroundColor: theme.palette.background.default,
  transition: 'all 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '50px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  }
}));

// Componente Paper específico para habitaciones más compacto
const CompactPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(0.5),
  border: 'none',
  backgroundColor: theme.palette.background.default,
  transition: 'all 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '40px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  }
}));

// Chip estilizado geométrico
const GeometricChip = styled(Chip)(({ theme, customcolor }) => ({
  borderRadius: 0,
  backgroundColor: customcolor || theme.palette.action.selected,
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: '0.75rem',
  height: 24,
  '& .MuiChip-icon': {
    fontSize: '0.9rem',
    marginLeft: theme.spacing(0.5)
  }
}));

// Función para obtener el color del estado del inquilino
const getInquilinoStatusColor = (estado) => {
  const statusColors = {
    'ACTIVO': '#4caf50',
    'RESERVADO': '#ff9800',
    'PENDIENTE': '#2196f3',
    'INACTIVO': '#9e9e9e'
  };
  return statusColors[estado] || '#9e9e9e';
};

// Función para obtener el ícono del estado del inquilino
const getInquilinoStatusIcon = (estado) => {
  const statusIcons = {
    'ACTIVO': CheckCircle,
    'RESERVADO': BookmarkAdded,
    'PENDIENTE': PendingActions,
    'INACTIVO': Person
  };
  return statusIcons[estado] || Person;
};

// Función para obtener el ícono del tipo de habitación
const getHabitacionIcon = (tipo) => {
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
  return iconMap[tipo] || BedIcon;
};

// Función para obtener el color del estado del contrato
const getContratoStatusColor = (estado) => {
  const statusColors = {
    'ACTIVO': '#4caf50',
    'RESERVADO': '#ff9800',
    'PLANEADO': '#2196f3',
    'FINALIZADO': '#9e9e9e',
    'PENDIENTE': '#f44336'
  };
  return statusColors[estado] || '#9e9e9e';
};

// Función para obtener el ícono del tipo de contrato
const getContratoIcon = (tipo) => {
  const iconMap = {
    'ALQUILER': HomeOutlined,
    'MANTENIMIENTO': Engineering,
    'VENTA': BusinessOutlined,
    'SERVICIOS': StoreOutlined
  };
  return iconMap[tipo] || ContractIcon;
};

// Función para determinar el estado del contrato
const getEstadoContrato = (contrato) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  if (inicio <= hoy && fin >= hoy) {
    return 'ACTIVO';
  } else if (inicio > hoy) {
    return contrato.estado === 'RESERVADO' ? 'RESERVADO' : 'PLANEADO';
  } else if (fin < hoy) {
    return 'FINALIZADO';
  }
  return contrato.estado || 'PENDIENTE';
};

// Componente individual para inquilino con hover horizontal
const InquilinoCard = ({ inquilino }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = getInquilinoStatusIcon(inquilino.estado);

  return (
    <GeometricPaper
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ cursor: 'pointer', minHeight: '50px' }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        height: '100%',
        width: '100%'
      }}>
        {/* Icono a la izquierda */}
        <IconComponent 
          sx={{ 
            fontSize: '1.2rem', 
            color: getInquilinoStatusColor(inquilino.estado),
            flexShrink: 0
          }} 
        />
        
        {/* Contenido a la derecha */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0.25,
          flex: 1,
          overflow: 'hidden'
        }}>
          {!isHovered ? (
            // Vista normal: nombre + estado
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {inquilino.nombre} {inquilino.apellido}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                {inquilino.estado}
              </Typography>
            </>
          ) : (
            // Vista hover: información del contrato
            <>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'primary.main' }}>
                {inquilino.nombre} {inquilino.apellido}
              </Typography>
              {inquilino.contrato ? (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'warning.main' }}>
                  {new Date(inquilino.contrato.fechaInicio).toLocaleDateString()} - {new Date(inquilino.contrato.fechaFin).toLocaleDateString()}
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  Sin contrato
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    </GeometricPaper>
  );
};

// Componente para mostrar inquilinos en grid
const InquilinosGrid = ({ inquilinos }) => {
  // Obtener nombres completos
  const nombres = inquilinos && inquilinos.length > 0
    ? inquilinos.map(i => `${i.nombre} ${i.apellido}`).join(', ')
    : 'Sin inquilinos';
  // Obtener nombre de contrato (si existe)
  const contrato = inquilinos && inquilinos[0] && inquilinos[0].contrato;
  const nombreContrato = contrato && contrato.nombre ? contrato.nombre : 'Sin contrato';
  const contratoId = contrato && contrato._id;

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <GeometricPaper sx={{ minHeight: '50px' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            height: '100%',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Ícono de inquilinos a la izquierda */}
            <PeopleIcon 
              sx={{ 
                fontSize: '1.3rem', 
                color: 'primary.main',
                flexShrink: 0,
                mr: 1
              }} 
            />
            {/* Nombres de inquilinos */}
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'primary.main',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {nombres}
            </Typography>
            {/* Nombre del contrato y link a la derecha */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  textAlign: 'right',
                  mr: 1
                }}
              >
                {nombreContrato}
              </Typography>
              {contratoId && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.65rem',
                    color: 'primary.main',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.dark' }
                  }}
                  component={Link}
                  to={`/contratos/${contratoId}`}
                >
                  ver contrato
                </Typography>
              )}
            </Box>
          </Box>
        </GeometricPaper>
      </Grid>
    </Grid>
  );
};

// Componente individual para habitación con hover
const HabitacionCard = ({ habitacion }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = getHabitacionIcon(habitacion.tipo);

  return (
    <CompactPaper
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ cursor: 'pointer' }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 0.25,
        textAlign: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        {!isHovered ? (
          // Vista normal: icono + nombre
          <>
            <IconComponent 
              sx={{ 
                fontSize: '1.1rem', 
                color: 'text.primary' 
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                fontSize: '0.6rem',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {habitacion.nombre || habitacion.tipo.replace('_', ' ')}
            </Typography>
          </>
        ) : (
          // Vista hover: solo medidas, más gris y pequeño
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: '#9e9e9e', textAlign: 'center' }}>
              {habitacion.metrosCuadrados ? `${habitacion.metrosCuadrados}m²` : 'Sin medidas'}
            </Typography>
            {habitacion.descripcion && (
              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#757575', textAlign: 'center', lineHeight: 1.1 }}>
                {habitacion.descripcion}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </CompactPaper>
  );
};

// Componente para mostrar habitaciones en grid con paginación y espacio fijo
const HabitacionesGrid = ({ habitaciones }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8; // 2 filas x 4 columnas
  const fixedSlots = 8; // Siempre mostrar 8 espacios para mantener coherencia visual
  
  if (!habitaciones || habitaciones.length === 0) {
    return (
      <Box sx={{ position: 'relative', minHeight: '104px' }}> {/* Altura fija para 2 filas */}
        <Grid container spacing={0.75} sx={{ p: 0.75 }}>
          {/* Crear 8 espacios vacíos para mantener la estructura */}
          {Array.from({ length: fixedSlots }).map((_, index) => (
            <Grid item xs={3} sm={3} md={3} lg={3} key={`empty-${index}`}>
              <CompactPaper sx={{ 
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                                 {index === 0 && (
                   <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                     Sin habitaciones
                   </Typography>
                 )}
              </CompactPaper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const totalPages = Math.ceil(habitaciones.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHabitaciones = habitaciones.slice(startIndex, endIndex);
  
  // Crear array de 8 elementos, rellenando con null los espacios vacíos
  const displaySlots = Array.from({ length: fixedSlots }, (_, index) => 
    currentHabitaciones[index] || null
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ 
        minHeight: '104px', // Altura fija para 2 filas
        paddingRight: totalPages > 1 ? '24px' : '0px' // Espacio para la flecha
      }}>
        <Grid container spacing={0.75} sx={{ p: 0.75 }}>
          {displaySlots.map((habitacion, index) => (
            <Grid item xs={3} sm={3} md={3} lg={3} key={habitacion?._id || `slot-${index}`}>
              {habitacion ? (
                <HabitacionCard habitacion={habitacion} />
              ) : (
                <CompactPaper sx={{ 
                  minHeight: '40px',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}>
                  {/* Espacio vacío para mantener la estructura */}
                </CompactPaper>
              )}
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Flecha sutil para más habitaciones */}
      {totalPages > 1 && (
        <Box 
          onClick={handleNextPage}
          sx={{ 
            position: 'absolute',
            right: 0,
            top: '12px', // Alineado con el padding del grid
            width: '20px',
            height: '80px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderLeft: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          <Typography 
            sx={{ 
              fontSize: '0.9rem', 
              color: 'text.secondary',
              transform: 'rotate(90deg)',
              userSelect: 'none',
              fontWeight: 400
            }}
          >
            ›
          </Typography>
        </Box>
      )}
      
      {/* Indicador de página (opcional, muy sutil) */}
      {totalPages > 1 && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 6, 
          right: 28, 
          display: 'flex', 
          gap: 0.5 
        }}>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <Box
              key={pageIndex}
              sx={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                backgroundColor: pageIndex === currentPage 
                  ? 'text.secondary' 
                  : 'rgba(255, 255, 255, 0.2)',
                transition: 'backgroundColor 0.2s ease'
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// Componente para mostrar inventario en grid
const InventarioGrid = ({ inventario }) => {
  const totalItems = inventario ? inventario.reduce((total, item) => total + (item.cantidad || 1), 0) : 0;
  
  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <GeometricPaper sx={{ minHeight: '50px' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            height: '100%',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Lado izquierdo: Ícono de inventario */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              flexShrink: 0
            }}>
              <InventoryIcon 
                sx={{ 
                  fontSize: '1.3rem', 
                  color: 'primary.main'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'primary.main'
                }}
              >
                Inventario
              </Typography>
            </Box>

            {/* Lado derecho: Conteo de items */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'text.primary'
                }}
              >
                {totalItems}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  color: 'text.secondary'
                }}
              >
                {totalItems === 1 ? 'item' : 'items'}
              </Typography>
            </Box>
          </Box>
        </GeometricPaper>
      </Grid>
    </Grid>
  );
};

// Componente para mostrar ubicación en grid horizontal
const UbicacionGrid = ({ direccion, ciudad, metrosCuadrados }) => {
  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <GeometricPaper sx={{ minHeight: '50px' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            height: '100%',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Lado izquierdo: Dirección y ciudad */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 1.5,
              flex: 1
            }}>
              <AddressIcon 
                sx={{ 
                  fontSize: '1.3rem', 
                  color: 'primary.main',
                  flexShrink: 0,
                  mt: 0.5
                }} 
              />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.2,
                flex: 1,
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {direccion}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    lineHeight: 1.1,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {ciudad}
                </Typography>
              </Box>
            </Box>

            {/* Lado derecho: Superficie */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexShrink: 0,
              pl: 2,
              borderLeft: '1px solid',
              borderColor: 'divider'
            }}>
              <AreaIcon 
                sx={{ 
                  fontSize: '1.1rem', 
                  color: 'success.main'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'success.main'
                }}
              >
                {metrosCuadrados}m²
              </Typography>
            </Box>
          </Box>
        </GeometricPaper>
      </Grid>
    </Grid>
  );
};

// Componente para mostrar información financiera en grid
const FinancieroGrid = ({ precio, simboloMoneda, nombreCuenta, moneda }) => {
  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <GeometricPaper sx={{ minHeight: '50px' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            height: '100%',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Izquierda: Ícono de moneda y montos */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <CurrencyIcon sx={{ fontSize: '1.3rem', color: 'primary.main', flexShrink: 0 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.primary' }}>
                    {precio.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem', color: 'text.secondary' }}>
                    alquiler
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.primary' }}>
                    {(precio * 2).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem', color: 'text.secondary' }}>
                    depósito
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* Derecha: símbolo de moneda y cuenta */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2, minWidth: 60, justifyContent: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.3rem', lineHeight: 1, mb: 0.2, textAlign: 'center' }}>
                {simboloMoneda}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem', color: 'text.secondary', textAlign: 'center' }}>
                {nombreCuenta || 'Sin cuenta'}
              </Typography>
            </Box>
          </Box>
        </GeometricPaper>
      </Grid>
    </Grid>
  );
};

// Componente compacto para vista grid colapsada (solo elementos esenciales)
const CompactGridView = ({ 
  direccion, 
  ciudad,
  metrosCuadrados,
  precio, 
  simboloMoneda, 
  nombreCuenta, 
  inquilinos, 
  habitaciones = [],
  contratos = [],
  inventario = []
}) => {
  const totalItems = inventario ? inventario.reduce((total, item) => total + (item.cantidad || 1), 0) : 0;
  
  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {/* Ubicación */}
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <GeometricPaper sx={{ minHeight: '50px' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            height: '100%',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Lado izquierdo: Dirección y ciudad */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 1.5,
              flex: 1
            }}>
              <AddressIcon 
                sx={{ 
                  fontSize: '1.3rem', 
                  color: 'primary.main',
                  flexShrink: 0,
                  mt: 0.5
                }} 
              />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.2,
                flex: 1,
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {direccion}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    lineHeight: 1.1,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {ciudad}
                </Typography>
              </Box>
            </Box>

            {/* Lado derecho: Superficie */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexShrink: 0,
              pl: 2,
              borderLeft: '1px solid',
              borderColor: 'divider'
            }}>
              <AreaIcon 
                sx={{ 
                  fontSize: '1.1rem', 
                  color: 'success.main'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'success.main'
                }}
              >
                {metrosCuadrados}m²
              </Typography>
            </Box>
          </Box>
        </GeometricPaper>
      </Grid>

      {/* Financiero */}
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <GeometricPaper sx={{ minHeight: '50px' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            height: '100%',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Izquierda: Ícono de moneda y montos */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <CurrencyIcon sx={{ fontSize: '1.3rem', color: 'primary.main', flexShrink: 0 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.primary' }}>
                    {precio.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem', color: 'text.secondary' }}>
                    alquiler
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.primary' }}>
                    {(precio * 2).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem', color: 'text.secondary' }}>
                    depósito
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* Derecha: símbolo de moneda y cuenta */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2, minWidth: 60, justifyContent: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.3rem', lineHeight: 1, mb: 0.2, textAlign: 'center' }}>
                {simboloMoneda}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem', color: 'text.secondary', textAlign: 'center' }}>
                {nombreCuenta || 'Sin cuenta'}
              </Typography>
            </Box>
          </Box>
        </GeometricPaper>
      </Grid>
    </Grid>
  );
};

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
  moneda
}) => {
  const renderContent = () => {
    switch (type) {
      case 'inquilinos':
        return <InquilinosGrid inquilinos={data} />;
      case 'habitaciones':
        return <HabitacionesGrid habitaciones={data} />;
      case 'inventario':
        return <InventarioGrid inventario={data} />;
      case 'ubicacion':
        return <UbicacionGrid direccion={direccion} ciudad={ciudad} metrosCuadrados={metrosCuadrados} />;
      case 'financiero':
        return <FinancieroGrid precio={precio} simboloMoneda={simboloMoneda} nombreCuenta={nombreCuenta} moneda={moneda} />;
      case 'compact':
        return <CompactGridView direccion={direccion} ciudad={ciudad} precio={precio} simboloMoneda={simboloMoneda} nombreCuenta={nombreCuenta} inquilinos={data} habitaciones={data} contratos={data} inventario={data} />;
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
export { CompactGridView }; 