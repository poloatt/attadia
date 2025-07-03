import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  GridOn as GridIcon,
  List as ListIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';
import { 
  getEstadoLabel, 
  getEstadoColor, 
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal, 
  formatFecha 
} from './contratoUtils';

// Componente Paper estilizado minimalista con fondo del tema
const GeometricPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: 0,
  border: 'none',
  backgroundColor: theme.palette.background.default,
  boxShadow: 'none',
  transition: 'none',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '80px',
  overflow: 'visible',
}));

const CellBox = styled(Box)(({ theme, borderRight, borderBottom }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 1.5, 1.5, 1.5),
  borderRight: borderRight ? `1px solid ${theme.palette.divider}` : 'none',
  borderBottom: borderBottom ? `1px solid ${theme.palette.divider}` : 'none',
  minHeight: 48,
  background: 'none',
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

const CellPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  padding: theme.spacing(0, 1, 0, 1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minHeight: 12,
  height: '100%',
}));

// Componente individual para contrato con hover
const ContratoCard = ({ contrato, relatedData, onEdit, onDelete, viewMode, onToggleView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { showValues, maskNumber } = useValuesVisibility();
  const estado = getEstadoContrato(contrato);
  const IconComponent = getContratoIcon(contrato.tipoContrato);
  const StatusIcon = getContratoStatusIcon(estado);

  // Debug: Verificar montoMensual en cada contrato
  console.log('🔍 ContratoCard montoMensual:', {
    id: contrato._id,
    montoMensual: contrato.montoMensual,
    tipo: typeof contrato.montoMensual,
    esMantenimiento: contrato.esMantenimiento,
    tipoContrato: contrato.tipoContrato,
    contratoCompleto: contrato // Ver todo el objeto contrato
  });

  // Obtener datos relacionados
  const propiedadData = (() => {
    if (contrato.propiedad && typeof contrato.propiedad === 'object' && contrato.propiedad.titulo) {
      return contrato.propiedad;
    }
    return relatedData.propiedades?.find(p => p._id === contrato.propiedad);
  })();

  const inquilinosData = (() => {
    if (!contrato.inquilino || contrato.inquilino.length === 0) return [];
    if (contrato.inquilino[0] && typeof contrato.inquilino[0] === 'object' && contrato.inquilino[0].nombre) {
      return contrato.inquilino;
    }
    return contrato.inquilino?.map(inquilinoId => 
      relatedData.inquilinos?.find(i => i._id === inquilinoId)
    ).filter(Boolean) || [];
  })();

  const cuentaData = (() => {
    if (contrato.cuenta && typeof contrato.cuenta === 'object' && contrato.cuenta.nombre) {
      return contrato.cuenta;
    }
    return relatedData.cuentas?.find(c => c._id === contrato.cuenta);
  })();

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

  // Calcular información temporal
  const tiempoRestante = calcularTiempoRestante(contrato.fechaFin);
  const duracionTotal = calcularDuracionTotal(contrato.fechaInicio, contrato.fechaFin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(contrato.fechaFin);
  const estaFinalizado = fin < hoy;

  // Primer inquilino
  const primerInquilino = inquilinosData[0];

  // Color para el estado
  const estadoColor = getEstadoColor(estado);

  // Subtítulo: solo nombre de la propiedad (sin duración)
  const subtitulo = propiedadData?.titulo || 'Sin propiedad';

  // Log completo del contrato para debug
  console.log('GRID contrato completo:', contrato);

  return (
    <Box sx={{ mb: 2, px: 1.5, pt: 1.5, bgcolor: 'transparent' }}>
      {/* Header unificado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 0.5, pt: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.primary', lineHeight: 1.2 }}>
            {subtitulo}
          </Typography>
          <Box component="span" sx={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: estadoColor,
            ml: 1,
            height: 16,
            px: 0.5,
            py: 0,
            borderRadius: 1,
            background: 'none',
            fontWeight: 500
          }}>
            <span style={{ fontSize: '0.9em', marginRight: 2 }}>•</span> {getEstadoLabel(estado)}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={viewMode === 'list' ? 'Cambiar a vista grid' : 'Cambiar a vista lista'}>
            <IconButton onClick={() => onToggleView && onToggleView()} size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
              {viewMode === 'list' ? <GridIcon /> : <ListIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(contrato)} sx={{ color: 'text.secondary', p: 0.5 }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => onDelete(contrato._id)} sx={{ color: 'text.secondary', p: 0.5 }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {/* Grid de información con estilo de lista */}
      <Grid container spacing={2} sx={{ px: 0, pb: 0 }}>
        {/* Días restantes */}
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <CellPaper sx={{ p: 1.5, gap: 1 }}>
            <CalendarIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.1 }}>
                {tiempoRestante || 'Finalizado'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 400, lineHeight: 1.1 }}>
                Días restantes
              </Typography>
            </Box>
          </CellPaper>
        </Grid>
        {/* Inquilinos */}
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <CellPaper sx={{ p: 1.5, gap: 1 }}>
            <PersonIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.1 }}>
                {inquilinosData.length} {inquilinosData.length === 1 ? 'inquilino' : 'inquilinos'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 400, lineHeight: 1.1 }}>
                Inquilinos
              </Typography>
            </Box>
          </CellPaper>
        </Grid>
        {/* Monto mensual */}
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <CellPaper sx={{ p: 1.5, gap: 1 }}>
            <MoneyIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.1 }}>
                {monedaData?.simbolo || '$'} {contrato.montoMensual?.toLocaleString() || 0}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 400, lineHeight: 1.1 }}>
                Alquiler mensual
              </Typography>
            </Box>
          </CellPaper>
        </Grid>
        {/* Cuenta */}
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <CellPaper sx={{ p: 1.5, gap: 1 }}>
            <AccountIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.1 }}>
                {cuentaData?.nombre || 'Sin cuenta'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 400, lineHeight: 1.1 }}>
                Cuenta
              </Typography>
            </Box>
          </CellPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Componente para mostrar contratos en grid
const ContratosGrid = ({ contratos, relatedData, onEdit, onDelete, viewMode, onToggleView }) => {
  // Debug: Verificar contratos que llegan a la grid
  console.log('ContratosGrid contratos:', contratos);

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
    <Grid container spacing={0} sx={{ p: 0, pt: 0, pb: 0 }}>
      {contratos.map((contrato, index) => {
        console.log('ContratosGrid contrato:', contrato);
        return (
          <Grid item xs={12} sm={12} md={12} lg={12} key={contrato.id || contrato._id || index}>
            <ContratoCard 
              contrato={contrato} 
              relatedData={relatedData}
              onEdit={onEdit}
              onDelete={onDelete}
              viewMode={viewMode}
              onToggleView={onToggleView}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

// Componente para mostrar información financiera en grid
const FinancieroGrid = ({ contratos, relatedData }) => {
  if (!contratos || contratos.length === 0) {
    return (
      <Box sx={{ 
        p: 1.5, 
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          No hay contratos para mostrar información financiera
        </Typography>
      </Box>
    );
  }

  // Calcular estadísticas
  const contratosActivos = contratos.filter(c => getEstadoContrato(c) === 'ACTIVO');
  const contratosFinalizados = contratos.filter(c => getEstadoContrato(c) === 'FINALIZADO');
  
  const totalIngresos = contratosActivos.reduce((sum, c) => {
    if (c.tipoContrato === 'MANTENIMIENTO') return sum;
    return sum + (c.montoMensual || 0);
  }, 0);

  const promedioMensual = contratosActivos.length > 0 ? totalIngresos / contratosActivos.length : 0;

  const financieroData = [
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

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {financieroData.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Grid item xs={6} sm={6} md={3} lg={3} key={index}>
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

// Componente para mostrar información de inquilinos en grid
const InquilinosGrid = ({ contratos, relatedData }) => {
  if (!contratos || contratos.length === 0) {
    return (
      <Box sx={{ 
        p: 1.5, 
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          No hay contratos para mostrar inquilinos
        </Typography>
      </Box>
    );
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

  const inquilinos = Array.from(inquilinosUnicos.values());

  if (inquilinos.length === 0) {
    return (
      <Box sx={{ 
        p: 1.5, 
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          No hay inquilinos registrados en los contratos
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={0.75} sx={{ p: 0.75 }}>
      {inquilinos.map((inquilino, index) => (
        <Grid item xs={6} sm={4} md={3} lg={2.4} key={inquilino._id || index}>
          <GeometricPaper sx={{ minHeight: '50px' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              height: '100%',
              width: '100%'
            }}>
              <PeopleIcon 
                sx={{ 
                  fontSize: '1.2rem', 
                  color: 'text.secondary',
                  flexShrink: 0
                }} 
              />
              
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
                  {inquilino.nombre} {inquilino.apellido}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  {inquilino.estado || 'PENDIENTE'}
                </Typography>
              </Box>
            </Box>
          </GeometricPaper>
        </Grid>
      ))}
    </Grid>
  );
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
        return <ContratosGrid contratos={contratos} relatedData={relatedData} onEdit={onEdit} onDelete={onDelete} viewMode={viewMode} onToggleView={onToggleView} />;
      case 'financiero':
        return <FinancieroGrid contratos={contratos} relatedData={relatedData} />;
      case 'inquilinos':
        return <InquilinosGrid contratos={contratos} relatedData={relatedData} />;
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