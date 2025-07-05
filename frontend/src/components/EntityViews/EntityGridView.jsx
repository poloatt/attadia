import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import ContratoDetail from '../contratos/ContratoDetail';
import InquilinoDetail from '../inquilinos/InquilinoDetail';
import {
  LocationOnOutlined as AddressIcon,
  LocationCityOutlined as CityIcon,
  SquareFootOutlined as AreaIcon,
  MonetizationOnOutlined as MoneyIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  AccountBalance as BankIcon,
  AttachMoney as CurrencyIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Description as ContractIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  StoreOutlined,
  Bed as BedIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

// Componente Paper estilizado minimalista con fondo del tema
const GeometricPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(0.05, 0.7),
  border: 'none',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(240,240,240,1)',
  boxShadow: '0 1px 0 0 rgba(0,0,0,0.18)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'all 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '14px',
  '&:hover': {
    backgroundColor: 'rgba(40,40,40,1)',
  }
}));

// Componente Paper específico para elementos más compactos
const CompactPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(0.03, 0.5),
  border: 'none',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(240,240,240,1)',
  boxShadow: '0 1px 0 0 rgba(0,0,0,0.18)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'all 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '12px',
  '&:hover': {
    backgroundColor: 'rgba(40,40,40,1)',
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

// Componente estandarizado para encabezado de entidad con título y estado y acciones a la derecha
const EntityHeader = ({ title, status, statusLabel, statusColor, icon: Icon, iconColor, actions }) => (
  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
    {/* Columna izquierda: ícono, título, chip de estado */}
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
      {Icon && (
        <Icon sx={{ fontSize: '1.2rem', color: iconColor, flexShrink: 0, mt: 0.2 }} />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {status && (
          <GeometricChip
            label={statusLabel || status}
            sx={{
              backgroundColor: statusColor,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: 0,
              height: 24,
              minWidth: 'fit-content',
              mt: 0.2
            }}
          />
        )}
      </Box>
    </Box>
    {/* Columna derecha: acciones */}
    {actions && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {actions}
      </Box>
    )}
  </Box>
);

// Configuraciones pre-definidas para secciones estándar
const SECTION_CONFIGS = {
  // Sección financiera estándar (primaria)
  financiero: (simboloMoneda, nombreCuenta, datosAdicionales = []) => {
    // Extraer datos adicionales
    const montoMensual = datosAdicionales[0]?.value || '';
    const deposito = datosAdicionales[1]?.value || '';
    return {
      type: 'primary',
      left: [
        {
          icon: null, // Sin ícono, solo el símbolo de moneda
          label: 'Moneda',
          value: simboloMoneda || '$',
          subtitle: nombreCuenta || 'No especificada',
          color: 'text.secondary',
          position: 'left',
          showLargeCurrency: true // Flag especial para mostrar moneda grande
        }
      ],
      right: [
        {
          icon: MoneyIcon,
          label: 'Montos',
          value: [montoMensual, deposito],
          color: 'text.secondary',
          position: 'right'
        }
      ]
    };
  },

  // Sección de ubicación estándar (primaria)
  ubicacion: (propiedad) => {
    if (!propiedad) {
      return {
        type: 'primary',
        left: [],
        right: [],
        hidden: true
      };
    }

    const getIconoPropiedad = (tipo) => {
      const iconMap = {
        'CASA': HomeIcon,
        'DEPARTAMENTO': ApartmentIcon,
        'APARTAMENTO': ApartmentIcon,
        'LOCAL': StoreOutlined
      };
      return iconMap[tipo?.toUpperCase()] || HomeIcon;
    };

    // Solo mostrar si hay dirección o ciudad
    if (!propiedad.direccion && !propiedad.ciudad) {
      return {
        type: 'primary',
        left: [],
        right: [],
        hidden: true
      };
    }

    return {
      type: 'primary',
      left: [
        {
          icon: getIconoPropiedad(propiedad.tipo),
          label: 'Ubicación',
          value: [propiedad.direccion, propiedad.ciudad].filter(Boolean).join(', '),
          color: 'primary.main',
          position: 'left'
        }
      ],
      right: [
        {
          icon: AreaIcon,
          label: 'Superficie',
          value: propiedad.metrosCuadrados ? `${propiedad.metrosCuadrados}m²` : 'No especificada',
          color: 'text.secondary',
          position: 'right'
        }
      ]
    };
  },

  // Sección de inquilinos estándar (primaria)
  inquilinos: (inquilinos = [], contratos = []) => {
    const nombresInquilinos = inquilinos.map(inq => `${inq.nombre} ${inq.apellido}`).filter(Boolean).join(', ');
    
    // Crear links a contratos activos
    const contratosActivos = contratos.filter(contrato => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const inicio = new Date(contrato.fechaInicio);
      const fin = new Date(contrato.fechaFin);
      return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
    });
    
    const contratosLinks = contratosActivos.map((contrato, idx) => ({
      text: `Contrato ${idx + 1}`,
      link: `/contratos/${contrato._id}`,
      contratoId: contrato._id,
      contrato: contrato,
      tipo: contrato.tipoContrato || 'Sin especificar'
    }));
    
    return {
      type: 'primary',
      left: [
        {
          icon: PeopleIcon,
          value: nombresInquilinos || 'Sin inquilinos',
          color: 'text.secondary',
          position: 'left'
        }
      ],
      right: [
        {
          icon: ContractIcon,
          value: contratosLinks.length > 0 ? 'Contratos activos' : 'Sin contratos activos',
          color: contratosLinks.length > 0 ? 'primary.main' : 'text.secondary',
          position: 'right',
          links: contratosLinks // Agregar links para renderizado especial
        }
      ]
    };
  },

  // Sección de tiempo estándar (secundaria)
  tiempo: (diasRestantes, duracionTotal) => ({
    type: 'secondary',
    data: [
      {
        icon: CalendarIcon,
        label: 'Restantes',
        value: diasRestantes ? `${diasRestantes} días` : 'Finalizado',
        color: 'warning.main'
      },
      {
        icon: ScheduleIcon,
        label: 'Duración',
        value: duracionTotal || 'No especificada',
        color: 'info.main'
      }
    ]
  }),

  // Sección de inventario estándar (secundaria)
  inventario: (items = []) => ({
    type: 'secondary',
    data: items.map(item => ({
      icon: item.icon || DepositIcon,
      label: item.label || 'Item',
      value: item.value || 'No especificado',
      color: item.color || 'text.secondary'
    }))
  }),

  // Sección de resumen de inventario (primaria)
  resumenInventario: (inventario = []) => {
    const totalItems = inventario.length;
    
    // Calcular total de cantidad si los items tienen propiedad cantidad
    const totalCantidad = inventario.reduce((sum, item) => {
      return sum + (item.cantidad || 1);
    }, 0);
    
    // Agrupar por categoría si existe
    const categorias = inventario.reduce((acc, item) => {
      const categoria = item.categoria || item.tipo || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = 0;
      }
      acc[categoria]++;
      return acc;
    }, {});

    const numCategorias = Object.keys(categorias).length;
    
    // Determinar el texto a mostrar
    const textoInventario = totalItems === 0 
      ? 'Sin inventario' 
      : totalItems === 1 
        ? '1 elemento' 
        : `${totalItems} elementos`;
    
    const textoCategorias = numCategorias === 0 
      ? 'Sin categorías' 
      : numCategorias === 1 
        ? '1 categoría' 
        : `${numCategorias} categorías`;

    return {
      type: 'primary',
      left: [
        {
          icon: InventoryIcon,
          label: 'Inventario',
          value: textoInventario,
          color: 'text.secondary',
          position: 'left'
        }
      ],
      right: [
        {
          icon: DepositIcon,
          label: 'Categorías',
          value: textoCategorias,
          color: 'text.secondary',
          position: 'right'
        }
      ]
    };
  },

  // Sección de habitaciones en cuadrados (especial)
  habitaciones: (habitaciones = []) => ({
    type: 'habitaciones',
    data: habitaciones.map(habitacion => ({
      icon: habitacion.icon || BedIcon,
      label: habitacion.tipo || 'Habitación',
      value: habitacion.nombre || habitacion.tipo || 'Sin nombre',
      color: habitacion.color || 'text.secondary',
      metrosCuadrados: habitacion.metrosCuadrados
    }))
  })
};

// Componente para renderizar sección con layout izquierda/derecha
const SectionRenderer = ({ section, isCollapsed = false, onContratoDetail = null, inquilinos = [] }) => {
  if (section.hidden) return null;

  // Detectar si es sección especial (ubicación, finanzas, inquilinos/contratos) que usan value como array o string
  const isSpecial = section.left && section.left.length === 1 && (Array.isArray(section.left[0]?.value) || typeof section.left[0]?.value === 'string');

  // Si es sección financiera, mostrar monto mensual arriba y depósito abajo, con estilos distintos
  const isFinanciera = isSpecial && section.left[0]?.label === 'Moneda' && section.right?.[0]?.label === 'Montos';
  const isFinancieraLarge = isFinanciera && section.left[0]?.showLargeCurrency;
  
  // Si es sección de tiempo con números grandes
  const isTiempoLarge = section.left[0]?.showLargeNumber && section.right?.[0]?.showLargeNumber;
  
  // Si es sección de inquilinos con links a contratos
  const isInquilinosConLinks = isSpecial && section.right?.[0]?.links && Array.isArray(section.right[0].links);

  if (isFinancieraLarge) {
    // Nueva versión con símbolo de moneda grande a la izquierda
    const simboloMoneda = section.left[0]?.value || '$';
    const nombreCuenta = section.left[0]?.subtitle || 'No especificada';
    const iconRight = section.right?.[0]?.icon;
    const valuesRight = Array.isArray(section.right?.[0]?.value) ? section.right?.[0]?.value : [section.right?.[0]?.value];
    
    return (
      <GeometricPaper sx={{ minHeight: '40px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {/* Columna 1: Símbolo de moneda y cuenta */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.3
          }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: '1.2rem',
                lineHeight: 1,
                m: 0,
                color: 'text.primary'
              }}
            >
              {simboloMoneda}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1,
                m: 0,
                textAlign: 'center'
              }}
            >
              {nombreCuenta}
            </Typography>
          </Box>
          
          {/* Separador vertical */}
          <Box sx={{ 
            width: '1px', 
            backgroundColor: 'divider',
            mx: 1,
            height: '60%'
          }} />
          
          {/* Columna 2: Monto mensual */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.3
          }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: '0.8rem',
                lineHeight: 1,
                m: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              {valuesRight[0] || ''}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1,
                m: 0,
                textAlign: 'center'
              }}
            >
              mensual
            </Typography>
          </Box>
          
          {/* Separador vertical */}
          <Box sx={{ 
            width: '1px', 
            backgroundColor: 'divider',
            mx: 1,
            height: '60%'
          }} />
          
          {/* Columna 3: Monto total */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.3
          }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: '0.8rem',
                lineHeight: 1,
                m: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              {valuesRight[1] || ''}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1,
                m: 0,
                textAlign: 'center'
              }}
            >
              total
            </Typography>
          </Box>
        </Box>
      </GeometricPaper>
    );
  } else if (isTiempoLarge) {
    // Nueva versión con números grandes para la sección de tiempo
    const valorIzquierda = section.left[0]?.value || '0';
    const subtituloIzquierda = section.left[0]?.subtitle || '';
    const valorDerecha = section.right?.[0]?.value || '0';
    const subtituloDerecha = section.right?.[0]?.subtitle || '';
    
    return (
      <GeometricPaper sx={{ minHeight: '40px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {/* Número grande y etiqueta izquierda */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.3
          }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: '1.4rem',
                lineHeight: 1,
                m: 0,
                color: 'text.primary'
              }}
            >
              {valorIzquierda}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1,
                m: 0,
                textAlign: 'center'
              }}
            >
              {subtituloIzquierda}
            </Typography>
          </Box>
          {/* Número grande y etiqueta derecha */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.3
          }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: '1.4rem',
                lineHeight: 1,
                m: 0,
                color: 'text.primary'
              }}
            >
              {valorDerecha}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1,
                m: 0,
                textAlign: 'center'
              }}
            >
              {subtituloDerecha}
            </Typography>
          </Box>
        </Box>
      </GeometricPaper>
    );
  } else if (isInquilinosConLinks) {
    // Renderizado especial para sección de inquilinos con links a contratos
    const iconLeft = section.left[0]?.icon;
    const valueLeft = section.left[0]?.value || '';
    const iconRight = section.right[0]?.icon;
    const valueRight = section.right[0]?.value || '';
    const links = section.right[0]?.links || [];
    const inquilinosArr = inquilinos;
    return (
      <GeometricPaper sx={{ minHeight: '40px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {/* Parte izquierda: Inquilinos */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            pr: 1,
            justifyContent: 'center'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flex: 1,
              justifyContent: 'center'
            }}>
              {iconLeft && React.createElement(iconLeft, { 
                sx: { 
                  fontSize: '1.2rem', 
                  color: 'text.secondary',
                  flexShrink: 0
                } 
              })}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0,
                flex: 1,
                overflow: 'hidden',
                alignItems: 'center'
              }}>
                {inquilinosArr.length > 0 ? (
                  inquilinosArr.map((inq, idx) => (
                    <Box key={inq._id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          lineHeight: 1,
                          m: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center'
                        }}
                      >
                        {inq.nombre} {inq.apellido}
                      </Typography>
                      <IconButton size="small" onClick={() => handleInquilinoDetail(inq._id)} sx={{ p: 0.2, color: 'primary.main' }}>
                        <ViewIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Box>
                  ))
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      lineHeight: 1,
                      m: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}
                  >
                    Sin inquilinos
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Separador vertical */}
          <Box sx={{ 
            width: '1px', 
            backgroundColor: 'divider',
            mx: 1
          }} />

          {/* Parte derecha: Contratos con links */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            pl: 0.5,
            justifyContent: 'center'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flex: 1,
              justifyContent: 'flex-start'
            }}>
              {iconRight && React.createElement(iconRight, { 
                sx: { 
                  fontSize: '1.2rem', 
                  color: 'text.secondary',
                  flexShrink: 0
                } 
              })}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.2,
                flex: 1,
                overflow: 'hidden',
                alignItems: 'flex-start'
              }}>
                {/* Links a contratos - solo mostrar links, no texto descriptivo */}
                {links.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1 }}>
                    {links.map((link, idx) => (
                      onContratoDetail ? (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3,
                            cursor: 'pointer',
                            justifyContent: 'flex-start',
                            '&:hover': {
                              '& .contrato-text': {
                                color: 'primary.light',
                                textDecoration: 'underline'
                              },
                              '& .view-icon': {
                                color: 'primary.light'
                              }
                            }
                          }}
                          onClick={() => onContratoDetail(link.contratoId)}
                        >
                          <Typography
                            variant="caption"
                            className="contrato-text"
                            sx={{ 
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              color: 'primary.main',
                              lineHeight: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {link.text}
                          </Typography>
                          <ViewIcon 
                            className="view-icon"
                            sx={{ 
                              fontSize: '0.9rem', 
                              color: 'primary.main',
                              flexShrink: 0
                            }} 
                          />
                        </Box>
                      ) : (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3,
                            justifyContent: 'flex-start'
                          }}
                        >
                          <Typography
                            component={Link}
                            to={link.link}
                            variant="caption"
                            sx={{ 
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              color: 'primary.main',
                              lineHeight: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              '&:hover': {
                                color: 'primary.light',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {link.text}
                          </Typography>
                          <ViewIcon 
                            sx={{ 
                              fontSize: '0.9rem', 
                              color: 'primary.main',
                              flexShrink: 0
                            }} 
                          />
                        </Box>
                      )
                    ))}
                  </Box>
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      lineHeight: 1,
                      m: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'text.secondary'
                    }}
                  >
                    Sin contratos activos
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </GeometricPaper>
    );
  } else if (isFinanciera) {
    const iconLeft = section.left[0]?.icon;
    const colorLeft = section.left[0]?.color;
    const valuesLeft = Array.isArray(section.left[0]?.value) ? section.left[0]?.value : [section.left[0]?.value];
    const iconRight = section.right?.[0]?.icon;
    const colorRight = section.right?.[0]?.color;
    const valuesRight = Array.isArray(section.right?.[0]?.value) ? section.right?.[0]?.value : [section.right?.[0]?.value];
    // Monto mensual y depósito
    const montoMensual = valuesRight[0] || '';
    const deposito = valuesRight[1] || '';
    return (
      <GeometricPaper sx={{ minHeight: '40px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {/* Ícono izquierda */}
          {iconLeft && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', pr: 1.5, minWidth: 28 }}>
              {React.createElement(iconLeft, { sx: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)' } })}
            </Box>
          )}
          {/* Valores izquierda */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, justifyContent: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  m: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
              {section.left[0]?.value}
              </Typography>
            {section.left[0]?.subtitle && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 400,
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1,
                  m: 0,
                  mt: 0.2
                }}
              >
                {section.left[0]?.subtitle}
              </Typography>
            )}
          </Box>
          {/* Ícono derecha */}
          {iconRight && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', pl: 1.5, minWidth: 28 }}>
              {React.createElement(iconRight, { sx: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)' } })}
            </Box>
          )}
          {/* Monto mensual y depósito en dos líneas */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, justifyContent: 'center', alignItems: 'flex-start' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  m: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
              {section.right[0]?.value}
              </Typography>
            {section.right[0]?.subtitle && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 400,
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1,
                  m: 0,
                  mt: 0.2
                }}
              >
                {section.right[0]?.subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </GeometricPaper>
    );
  }

  // Si es locación, separar dirección y ciudad en dos líneas con estilos distintos
  const isLocacion = isSpecial && section.left[0]?.label === 'Ubicación';

  if (isLocacion) {
    const iconLeft = section.left[0]?.icon;
    const colorLeft = section.left[0]?.color;
    const ubicacionValue = section.left[0]?.value || '';
    // Separar dirección y ciudad
    let direccion = '', ciudad = '';
    if (typeof ubicacionValue === 'string') {
      [direccion, ciudad] = ubicacionValue.split(',').map(s => s.trim());
    } else if (Array.isArray(ubicacionValue)) {
      [direccion, ciudad] = ubicacionValue;
    }
    const iconRight = section.right?.[0]?.icon;
    const colorRight = section.right?.[0]?.color;
    const valuesRight = Array.isArray(section.right?.[0]?.value) ? section.right?.[0]?.value : [section.right?.[0]?.value];
    return (
      <GeometricPaper sx={{ minHeight: '40px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {/* Ícono izquierda */}
          {iconLeft && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', pr: 1.5, minWidth: 28 }}>
              {React.createElement(iconLeft, { sx: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)' } })}
            </Box>
          )}
          {/* Dirección y ciudad */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, justifyContent: 'center' }}>
            {direccion && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  m: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {direccion}
              </Typography>
            )}
            {ciudad && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 400,
                  fontSize: '0.68rem',
                  color: 'text.secondary',
                  lineHeight: 1,
                  m: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {ciudad}
              </Typography>
            )}
          </Box>
          {/* Ícono derecha */}
          {iconRight && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', pl: 1.5, minWidth: 28 }}>
              {React.createElement(iconRight, { sx: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)' } })}
            </Box>
          )}
          {/* Valores derecha */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
            {valuesRight.map((value, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  m: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: idx === 1 ? 'text.secondary' : 'inherit'
                }}
              >
                {value}
              </Typography>
            ))}
          </Box>
        </Box>
      </GeometricPaper>
    );
  }

  return (
    <GeometricPaper sx={{ minHeight: '40px' }}>
      <Box sx={{ 
        display: 'flex', 
        height: '100%',
        width: '100%'
      }}>
        {/* Parte izquierda */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          pr: 1
        }}>
          {section.left.map((item, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flex: 1
            }}>
              <item.icon 
                sx={{ 
                  fontSize: '1.2rem', 
                  color: item.color,
                  flexShrink: 0
                }} 
              />
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0,
                flex: 1,
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    lineHeight: 1,
                    m: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Separador vertical */}
        <Box sx={{ 
          width: '1px', 
          backgroundColor: 'divider',
          mx: 1
        }} />

        {/* Parte derecha */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          pl: 1
        }}>
          {section.right.map((item, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flex: 1
            }}>
              <item.icon 
                sx={{ 
                  fontSize: '1.2rem', 
                  color: item.color,
                  flexShrink: 0
                }} 
              />
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0,
                flex: 1,
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    lineHeight: 1,
                    m: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </GeometricPaper>
  );
};

// Componente para renderizar sección secundaria
const SecondarySectionRenderer = ({ section, isCollapsed = false }) => {
  if (isCollapsed) return null;

  return (
    <GeometricPaper sx={{ minHeight: '50px' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 0,
        height: '100%',
        width: '100%'
      }}>
        {section.data.map((item, itemIndex) => {
          const IconComponent = item.icon;
          return (
            <Box key={itemIndex} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flex: 1
            }}>
              <IconComponent 
                sx={{ 
                  fontSize: '0.8rem', 
                  color: item.color,
                  flexShrink: 0
                }} 
              />
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0,
                flex: 1,
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    lineHeight: 1,
                    m: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </GeometricPaper>
  );
};

// Componente para mostrar secciones estándar organizadas
const StandardSections = ({ sections, gridSize = { xs: 6, sm: 6, md: 6, lg: 6 }, isCollapsed = false, onContratoDetail = null, inquilinos = [] }) => {
  const seccionesPrimarias = sections.filter(s => s.type === 'primary' && !s.hidden);
  const seccionesSecundarias = sections.filter(s => s.type === 'secondary');
  const seccionesHabitaciones = sections.filter(s => s.type === 'habitaciones');

  return (
    <Grid container spacing={0.3} sx={{ p: 0 }}>
      {/* Secciones primarias - siempre visibles */}
      {seccionesPrimarias.map((section, sectionIndex) => (
        <Grid item {...gridSize} key={`primary-${sectionIndex}`}>
          <SectionRenderer section={section} isCollapsed={isCollapsed} onContratoDetail={onContratoDetail} inquilinos={inquilinos} />
        </Grid>
      ))}
      
      {/* Secciones de habitaciones - solo visibles si no está colapsado */}
      {seccionesHabitaciones.map((section, sectionIndex) => (
        <Grid item xs={12} key={`habitaciones-${sectionIndex}`}>
          <HabitacionesRenderer section={section} isCollapsed={isCollapsed} />
        </Grid>
      ))}
      
      {/* Secciones secundarias - solo visibles si no está colapsado */}
      {seccionesSecundarias.map((section, sectionIndex) => (
        <Grid item {...gridSize} key={`secondary-${sectionIndex}`}>
          <SecondarySectionRenderer section={section} isCollapsed={isCollapsed} />
        </Grid>
      ))}
    </Grid>
  );
};

// Componente individual para elementos con hover horizontal
const EntityCard = ({ 
  item, 
  config, 
  isCompact = false,
  linkTo = null,
  gridSize = { xs: 6, sm: 6, md: 6, lg: 6 }
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const PaperComponent = isCompact ? CompactPaper : GeometricPaper;
  
  const cardContent = (
    <PaperComponent
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ cursor: linkTo ? 'pointer' : 'default', minHeight: isCompact ? '40px' : '50px' }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        height: '100%',
        width: '100%'
      }}>
        {/* Icono a la izquierda */}
        {config.getIcon && (() => {
          const IconComponent = config.getIcon(item);
          return (
            <IconComponent 
              sx={{ 
                fontSize: isCompact ? '1rem' : '1.2rem', 
                color: config.getIconColor ? config.getIconColor(item) : 'text.primary',
                flexShrink: 0
              }} 
            />
          );
        })()}
        
        {/* Contenido a la derecha */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0,
          flex: 1,
          overflow: 'hidden'
        }}>
          {!isHovered ? (
            // Vista normal
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: isCompact ? '0.6rem' : '0.7rem',
                  lineHeight: 1,
                  m: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {config.getTitle(item)}
              </Typography>
              {config.getSubtitle && (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  {config.getSubtitle(item)}
                </Typography>
              )}
            </>
          ) : (
            // Vista hover
            <>
              <Typography variant="body2" sx={{ fontSize: isCompact ? '0.65rem' : '0.7rem', fontWeight: 600, color: 'primary.main' }}>
                {config.getTitle(item)}
              </Typography>
              {config.getHoverInfo && (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'warning.main' }}>
                  {config.getHoverInfo(item)}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    </PaperComponent>
  );

  if (linkTo) {
    return (
      <Box component={Link} to={linkTo} sx={{ textDecoration: 'none', color: 'inherit' }}>
        {cardContent}
      </Box>
    );
  }

  return cardContent;
};

// Componente para mostrar elementos en grid con paginación opcional
const EntityGrid = ({ 
  items, 
  config, 
  isCompact = false,
  fixedSlots = null,
  itemsPerPage = null,
  gridSize = { xs: 6, sm: 6, md: 6, lg: 6 },
  emptyMessage = "No hay elementos registrados"
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  if (!items || items.length === 0) {
    if (fixedSlots) {
      return (
        <Box sx={{ position: 'relative', minHeight: isCompact ? '104px' : '120px' }}>
          <Grid container spacing={0.3} sx={{ p: 0 }}>
            {Array.from({ length: fixedSlots }).map((_, index) => (
              <Grid item {...gridSize} key={`empty-${index}`}>
                <CompactPaper sx={{ 
                  minHeight: isCompact ? '40px' : '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {index === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {emptyMessage}
                    </Typography>
                  )}
                </CompactPaper>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        p: 1.5, 
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  let displayItems = items;
  let totalPages = 1;

  if (itemsPerPage && fixedSlots) {
    totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    
    // Crear array de elementos fijos, rellenando con null los espacios vacíos
    displayItems = Array.from({ length: fixedSlots }, (_, index) => 
      currentItems[index] || null
    );
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ 
        minHeight: isCompact ? '104px' : '120px',
        paddingRight: totalPages > 1 ? '24px' : '0px'
      }}>
        <Grid container spacing={0.3} sx={{ p: 0 }}>
          {displayItems.map((item, index) => (
            <Grid item {...gridSize} key={item?._id || item?.id || `slot-${index}`}>
              {item ? (
                <EntityCard 
                  item={item} 
                  config={config} 
                  isCompact={isCompact}
                  linkTo={config.getLinkTo ? config.getLinkTo(item) : null}
                />
              ) : (
                <CompactPaper sx={{ 
                  minHeight: isCompact ? '40px' : '50px',
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
      
      {/* Flecha sutil para más elementos */}
      {totalPages > 1 && (
        <Box 
          onClick={handleNextPage}
          sx={{ 
            position: 'absolute',
            right: 0,
            top: '12px',
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
      
      {/* Indicador de página */}
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

// Componente para mostrar información en grid horizontal
const InfoGrid = ({ data, config, gridSize = { xs: 4, sm: 4, md: 4, lg: 4 } }) => {
  return (
    <Grid container spacing={0.3} sx={{ p: 0 }}>
      {data.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Grid item {...gridSize} key={index}>
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
                  gap: 0.1,
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
                </Box>
              </Box>
            </GeometricPaper>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Componente para renderizar habitaciones en cuadrados con navegación
const HabitacionesRenderer = ({ section, isCollapsed = false }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(section.data.length / itemsPerPage);
  
  if (isCollapsed) return null;

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = section.data.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <GeometricPaper sx={{ minHeight: '48px', position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        width: '100%'
      }}>
        {/* Título de la sección */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: 0.5,
          px: 0.5
        }}>
          <BedIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ 
            fontWeight: 500,
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}>
            Habitaciones ({section.data.length})
          </Typography>
        </Box>

        {/* Grid de habitaciones */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 0.2,
          px: 0.5,
          flex: 1
        }}>
          {currentItems.map((habitacion, index) => (
            <Box
              key={index}
              sx={{
                minHeight: '48px',
                height: '48px',
                aspectRatio: '1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              {/* Ícono */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: habitacion.color
              }}>
                {React.createElement(habitacion.icon, { sx: { fontSize: '0.7rem' } })}
              </Box>
              {/* Nombre */}
              {(() => {
                // Procesar el nombre para máximo dos líneas y capitalizar
                const raw = habitacion.value || '';
                const clean = raw.replace(/_/g, ' ');
                const words = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                let displayName = '';
                if (words.length === 1) {
                  displayName = words[0];
                } else {
                  displayName = words[0] + '\n' + words.slice(1).join(' ');
                }
                return (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.52rem',
                      fontWeight: 500,
                      textAlign: 'center',
                      lineHeight: 1,
                      overflow: 'hidden',
                      whiteSpace: 'pre-line',
                      maxHeight: '2em',
                      px: 0.1,
                      m: 0,
                      p: 0
                    }}
                  >
                    {displayName}
                  </Typography>
                );
              })()}
              {/* Metros cuadrados */}
              {habitacion.metrosCuadrados && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.45rem',
                    color: 'text.secondary',
                    textAlign: 'center',
                    lineHeight: 1
                  }}
                >
                  {habitacion.metrosCuadrados}m²
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Navegación */}
        {totalPages > 1 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mt: 0.5,
            px: 0.5
          }}>
            {/* Botón anterior */}
            <IconButton
              size="small"
              onClick={handlePrevPage}
              sx={{
                color: 'text.secondary',
                p: 0.25,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <ExpandMoreIcon sx={{ 
                fontSize: '0.9rem', 
                transform: 'rotate(90deg)' 
              }} />
            </IconButton>

            {/* Indicadores de página */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <Box
                  key={pageIndex}
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: pageIndex === currentPage 
                      ? 'text.secondary' 
                      : 'rgba(255, 255, 255, 0.2)',
                    transition: 'backgroundColor 0.2s ease'
                  }}
                />
              ))}
            </Box>

            {/* Botón siguiente */}
            <IconButton
              size="small"
              onClick={handleNextPage}
              sx={{
                color: 'text.secondary',
                p: 0.25,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <ExpandMoreIcon sx={{ 
                fontSize: '0.9rem', 
                transform: 'rotate(-90deg)' 
              }} />
            </IconButton>
          </Box>
        )}
      </Box>
    </GeometricPaper>
  );
};

// Componente principal EntityGridView
const EntityGridView = ({ 
  type = 'list',
  data,
  config,
  title,
  showEmpty = true,
  isCompact = false,
  fixedSlots = null,
  itemsPerPage = null,
  gridSize = { xs: 6, sm: 6, md: 6, lg: 6 },
  emptyMessage = "No hay elementos registrados",
  // Nuevas props para secciones estándar
  sections = null,
  sectionGridSize = { xs: 6, sm: 6, md: 6, lg: 6 },
  isCollapsed = false,
  showCollapseButton = false,
  onToggleCollapse = null,
  // Props para manejo de contratos
  contratos = [],
  onEditContrato = null,
  onDeleteContrato = null,
  inquilinos = []
}) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [inquilinoDetailOpen, setInquilinoDetailOpen] = useState(false);
  const [selectedInquilino, setSelectedInquilino] = useState(null);

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    }
  };

  const handleContratoDetail = (contratoId) => {
    const contrato = contratos.find(c => c._id === contratoId);
    if (contrato) {
      setSelectedContrato(contrato);
      setDetailOpen(true);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedContrato(null);
  };

  const handleEditContrato = (contrato) => {
    if (onEditContrato) {
      onEditContrato(contrato);
    }
    handleCloseDetail();
  };

  const handleDeleteContrato = (contratoId) => {
    if (onDeleteContrato) {
      onDeleteContrato(contratoId);
    }
    handleCloseDetail();
  };

  const handleInquilinoDetail = (inquilinoId) => {
    const inq = inquilinos.find(i => i._id === inquilinoId);
    if (inq) {
      setSelectedInquilino(inq);
      setInquilinoDetailOpen(true);
    }
  };

  const handleCloseInquilinoDetail = () => {
    setInquilinoDetailOpen(false);
    setSelectedInquilino(null);
  };

  const renderContent = () => {
    switch (type) {
      case 'list':
        return (
          <EntityGrid 
            items={data} 
            config={config}
            isCompact={isCompact}
            fixedSlots={fixedSlots}
            itemsPerPage={itemsPerPage}
            gridSize={gridSize}
            emptyMessage={emptyMessage}
          />
        );
      case 'info':
        return <InfoGrid data={data} config={config} gridSize={gridSize} />;
      case 'sections':
        return <StandardSections sections={sections} gridSize={sectionGridSize} isCollapsed={collapsed} onContratoDetail={handleContratoDetail} inquilinos={inquilinos} />;
      case 'habitaciones':
        return <HabitacionesRenderer section={data} isCollapsed={collapsed} />;
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
      {/* Header con título y botón de colapsar */}
      {(title || showCollapseButton) && (
        <Box sx={{ 
          mb: 1, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          )}
          {showCollapseButton && (
            <IconButton
              onClick={handleToggleCollapse}
              size="small"
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          )}
        </Box>
      )}
      
      {/* Contenido */}
      {renderContent()}
      
      {/* Popup de detalle de contrato */}
      {selectedContrato && (
        <ContratoDetail
          open={detailOpen}
          onClose={handleCloseDetail}
          contrato={selectedContrato}
          onEdit={handleEditContrato}
          onDelete={handleDeleteContrato}
          relatedData={{}}
        />
      )}
      {/* Popup de detalle de inquilino */}
      {selectedInquilino && (
        <InquilinoDetail
          open={inquilinoDetailOpen}
          onClose={handleCloseInquilinoDetail}
          inquilino={selectedInquilino}
        />
      )}
    </Box>
  );
};

export default EntityGridView;
export { 
  EntityCard, 
  EntityGrid, 
  InfoGrid, 
  StandardSections, 
  SectionRenderer, 
  SecondarySectionRenderer, 
  HabitacionesRenderer,
  GeometricPaper, 
  CompactPaper, 
  GeometricChip, 
  EntityHeader,
  SECTION_CONFIGS 
}; 