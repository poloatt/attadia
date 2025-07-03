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
  if (!inquilinos || inquilinos.length === 0) {
    return (
      <Box sx={{ 
        p: 1.5, 
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          No hay inquilinos registrados
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {inquilinos.map((inquilino, index) => (
        <Grid item xs={6} sm={6} md={6} lg={6} key={inquilino._id || index}>
          <InquilinoCard inquilino={inquilino} />
        </Grid>
      ))}
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

// Componente para mostrar contratos en grid
const ContratosGrid = ({ contratos }) => {
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
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {contratos.map((contrato, index) => {
        const estado = getEstadoContrato(contrato);
        const IconComponent = getContratoIcon(contrato.tipoContrato);
        return (
          <Grid item xs={3} sm={3} md={2.4} lg={2} key={contrato._id || index}>
            <GeometricPaper 
              component={Link}
              to={`/contratos/${contrato._id}`}
              sx={{ 
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                cursor: 'pointer',
                minHeight: '50px'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                width: '100%',
                height: '100%'
              }}>
                {/* Icono a la izquierda */}
                <IconComponent 
                  sx={{ 
                    fontSize: '1.2rem', 
                    color: getContratoStatusColor(estado),
                    flexShrink: 0
                  }} 
                />
                
                {/* Contenido a la derecha */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.1,
                  flex: 1,
                  overflow: 'hidden'
                }}>
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
                    {contrato.tipoContrato === 'MANTENIMIENTO' ? 'Mantenimiento' : 'Alquiler'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                    {estado}
                  </Typography>
                </Box>
              </Box>
            </GeometricPaper>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Componente para mostrar inventario en grid
const InventarioGrid = ({ inventario }) => {
  if (!inventario || inventario.length === 0) {
    return (
      <Box sx={{ 
        p: 1.5, 
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          No hay elementos en el inventario
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {inventario.map((item, index) => (
        <Grid item xs={3} sm={3} md={2.4} lg={2} key={item._id || index}>
          <GeometricPaper sx={{ minHeight: '50px' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              height: '100%',
              width: '100%'
            }}>
              {/* Icono a la izquierda */}
              <InventoryIcon 
                sx={{ 
                  fontSize: '1.2rem', 
                  color: 'text.secondary',
                  flexShrink: 0
                }} 
              />
              
              {/* Contenido a la derecha */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.1,
                flex: 1,
                overflow: 'hidden'
              }}>
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
                  {item.nombre}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  Cant: {item.cantidad || 1}
                </Typography>
              </Box>
            </Box>
          </GeometricPaper>
        </Grid>
      ))}
    </Grid>
  );
};

// Componente para mostrar ubicación en grid horizontal
const UbicacionGrid = ({ direccion, ciudad, metrosCuadrados }) => {
  const ubicacionData = [
    {
      icon: AddressIcon,
      label: 'Dirección',
      value: direccion,
      color: 'primary.main'
    },
    {
      icon: CityIcon,
      label: 'Ciudad',
      value: ciudad,
      color: 'secondary.main'
    },
    {
      icon: AreaIcon,
      label: 'Superficie',
      value: `${metrosCuadrados}m²`,
      color: 'success.main'
    }
  ];

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {ubicacionData.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Grid item xs={4} sm={4} md={4} lg={4} key={index}>
            <GeometricPaper sx={{ minHeight: '50px' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                height: '100%',
                width: '100%',
                justifyContent: 'flex-start'
              }}>
                {/* Icono centrado a la izquierda */}
                <IconComponent 
                  sx={{ 
                    fontSize: '1.3rem', 
                    color: item.color,
                    flexShrink: 0
                  }} 
                />
                
                {/* Contenido centrado verticalmente */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.2,
                  flex: 1,
                  justifyContent: 'center',
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
                    {item.value}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.6rem',
                      color: 'text.secondary',
                      fontWeight: 400,
                      lineHeight: 1.1
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Box>
            </GeometricPaper>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Componente para mostrar información financiera en grid
const FinancieroGrid = ({ precio, simboloMoneda, nombreCuenta, moneda }) => {
  const financieroData = [
    {
      icon: MoneyIcon,
      label: 'Precio Mensual',
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
      icon: BankIcon,
      label: 'Cuenta',
      value: nombreCuenta,
      color: 'text.secondary'
    },
    {
      icon: CurrencyIcon,
      label: 'Moneda',
      value: moneda || 'No especificada',
      color: 'text.secondary'
    }
  ];

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {financieroData.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Grid item xs={3} sm={3} md={3} lg={3} key={index}>
            <GeometricPaper sx={{ minHeight: '50px' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                height: '100%',
                width: '100%',
                justifyContent: 'flex-start'
              }}>
                {/* Icono centrado a la izquierda */}
                <IconComponent 
                  sx={{ 
                    fontSize: '1.3rem', 
                    color: item.color,
                    flexShrink: 0
                  }} 
                />
                
                {/* Contenido centrado verticalmente */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.2,
                  flex: 1,
                  justifyContent: 'center',
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
                    {item.value}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.6rem',
                      color: 'text.secondary',
                      fontWeight: 400,
                      lineHeight: 1.1
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Box>
            </GeometricPaper>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Componente compacto para vista grid colapsada (solo elementos esenciales)
const CompactGridView = ({ 
  direccion, 
  ciudad,
  precio, 
  simboloMoneda, 
  nombreCuenta, 
  inquilinos, 
  habitaciones = [],
  contratos = [],
  inventario = []
}) => {
  const totalItems = (habitaciones?.length || 0) + (inquilinos?.length || 0) + (contratos?.length || 0) + (inventario?.length || 0);
  const compactItems = [
    {
      icon: AddressIcon,
      label: 'Dirección',
      value: direccion,
      color: 'primary.main'
    },
    {
      icon: CityIcon,
      label: 'Ciudad',
      value: ciudad,
      color: 'secondary.main'
    },
    {
      icon: MoneyIcon,
      label: 'Precio Mensual',
      value: `${simboloMoneda} ${precio.toLocaleString()}`,
      color: 'text.secondary'
    },
    {
      icon: InventoryIcon,
      label: 'Total items',
      value: totalItems,
      color: 'text.secondary'
    }
  ];

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {compactItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Grid item xs={6} sm={6} md={6} lg={6} key={index}>
            <GeometricPaper sx={{ minHeight: '50px' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                height: '100%',
                width: '100%',
                justifyContent: 'flex-start'
              }}>
                <IconComponent 
                  sx={{ 
                    fontSize: '1.3rem', 
                    color: item.color,
                    flexShrink: 0
                  }} 
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.2,
                  flex: 1,
                  justifyContent: 'center',
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
                    {item.value}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.6rem',
                      color: 'text.secondary',
                      fontWeight: 400,
                      lineHeight: 1.1
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Box>
            </GeometricPaper>
          </Grid>
        );
      })}
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
      case 'contratos':
        return <ContratosGrid contratos={data} />;
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