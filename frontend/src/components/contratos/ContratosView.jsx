import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Collapse,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  MeetingRoom as RoomIcon,
  Engineering as EngineeringIcon,
  AccountBalance as AccountIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Engineering as MaintenanceIcon,
  BookmarkAdded as ReservedIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';

const ContratosView = ({ 
  contratos = [], 
  relatedData = {}, 
  onEdit, 
  onDelete 
}) => {
  const [expandedGroups, setExpandedGroups] = useState({
    alquiler: true,
    mantenimiento: true
  });

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Agrupar contratos por tipo y estado
  const contratosPorGrupo = useMemo(() => {
    const grupos = {
      alquiler: {
        activos: [],
        reservados: [],
        planeados: [],
        finalizados: []
      },
      mantenimiento: {
        activos: [],
        planeados: [],
        finalizados: []
      }
    };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    contratos.forEach(contrato => {
      const tipo = contrato.tipoContrato === 'MANTENIMIENTO' ? 'mantenimiento' : 'alquiler';
      const inicio = new Date(contrato.fechaInicio);
      const fin = new Date(contrato.fechaFin);
      
      // Determinar el estado basado en las fechas
      if (inicio <= hoy && fin > hoy) {
        grupos[tipo].activos.push(contrato);
      } else if (inicio > hoy) {
        if (tipo === 'alquiler' && contrato.estado === 'RESERVADO') {
          grupos.alquiler.reservados.push(contrato);
        } else {
          grupos[tipo].planeados.push(contrato);
        }
      } else if (fin <= hoy) {
        grupos[tipo].finalizados.push(contrato);
      }
    });

    return grupos;
  }, [contratos]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Función actualizada para determinar estado del contrato
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

  // Ordenar contratos según el Dashboard
  const contratosOrdenados = [...contratos].sort((a, b) => {
    const estadoA = getEstadoContrato(a);
    const estadoB = getEstadoContrato(b);
    const orden = {
      'ACTIVO': 0,
      'RESERVADO': 1,
      'PLANEADO': 2,
      'FINALIZADO': 3
    };
    return orden[estadoA] - orden[estadoB];
  });

  // Función para calcular tiempo restante
  const calcularTiempoRestante = (fechaFin) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    const diferenciaDias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias < 0) {
      return null;
    } else if (diferenciaDias > 90) {
      const meses = Math.floor(diferenciaDias / 30);
      return `${meses} meses restantes`;
    } else {
      return `${diferenciaDias} días restantes`;
    }
  };

  // Función para calcular duración total
  const calcularDuracionTotal = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                 (fin.getMonth() - inicio.getMonth());
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    if (meses > 0) {
      return `${meses} meses`;
    } else {
      return `${dias} días`;
    }
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'ACTIVO': return 'success.main';
      case 'FINALIZADO': return 'error.main';
      case 'PLANEADO': return 'warning.main';
      case 'MANTENIMIENTO': return 'warning.main';
      case 'RESERVADO': return 'info.main';
      default: return 'text.secondary';
    }
  };

  // Función para obtener la etiqueta del estado
  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'ACTIVO': return 'Contrato activo';
      case 'FINALIZADO': return 'Contrato finalizado';
      case 'PLANEADO': return 'Contrato planeado';
      case 'MANTENIMIENTO': return 'Contrato de mantenimiento';
      case 'RESERVADO': return 'Contrato reservado';
      default: return estado;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {contratosOrdenados.map(contrato => (
          <Grid item xs={12} sm={6} md={4} key={contrato._id}>
            <ContratoCard
              contrato={contrato}
              relatedData={relatedData}
              onEdit={onEdit}
              onDelete={onDelete}
              formatFecha={formatFecha}
              getEstadoContrato={getEstadoContrato}
              calcularTiempoRestante={calcularTiempoRestante}
              calcularDuracionTotal={calcularDuracionTotal}
              getEstadoColor={getEstadoColor}
              getEstadoLabel={getEstadoLabel}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Componente de tarjeta de contrato
const ContratoCard = ({ contrato, relatedData, onEdit, onDelete, formatFecha, getEstadoContrato, calcularTiempoRestante, calcularDuracionTotal, getEstadoColor, getEstadoLabel }) => {
  const { showValues, maskNumber } = useValuesVisibility();
  const [expandedSections, setExpandedSections] = useState({
    financial: false,
    inquilinos: false,
    detalles: false,
    fechas: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const {
    propiedad = {},
    habitacion = {},
    cuenta = {},
    inquilino = [],
    fechaInicio,
    fechaFin,
    montoMensual,
    deposito,
    observaciones,
    estado,
    tipoContrato
  } = contrato;

  const calcularPeriodo = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                 (fin.getMonth() - inicio.getMonth());
    return `${meses} meses`;
  };

  const periodo = calcularPeriodo(fechaInicio, fechaFin);

  const tiempoRestante = calcularTiempoRestante(fechaFin);
  const duracionTotal = calcularDuracionTotal(fechaInicio, fechaFin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin);
  const estaFinalizado = fin < hoy;

  return (
    <Box 
      sx={{ 
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        position: 'relative',
        backgroundColor: 'background.default',
        transition: 'all 0.2s ease',
        maxHeight: '500px',
        overflowY: 'auto',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      {/* Actions en la esquina superior derecha */}
      <Box sx={{
        position: 'absolute',
        top: 4,
        right: 4,
        display: 'flex',
        gap: 0.25
      }}>
        <Tooltip title="Editar">
          <IconButton 
            size="small" 
            onClick={() => onEdit(contrato)}
            sx={{ 
              color: 'text.secondary',
              padding: 0.25,
              '&:hover': { color: 'primary.main' }
            }}
          >
            <EditIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton 
            size="small" 
            onClick={() => onDelete(contrato._id)}
            sx={{ 
              color: 'text.secondary',
              padding: 0.25,
              '&:hover': { color: 'error.main' }
            }}
          >
            <DeleteIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Header con título y estado */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 0.5,
        pt: 0,
        pr: 5
      }}>
        {tipoContrato === 'MANTENIMIENTO' ? (
          <EngineeringIcon sx={{ color: 'warning.main', fontSize: '1.1rem' }} />
        ) : (
          <HomeIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
        )}
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.9rem',
          '& .estado': {
            fontSize: '0.75rem',
            fontWeight: 400
          }
        }}>
          {propiedad.titulo || 'Propiedad no encontrada'}
          <Typography 
            component="span" 
            className="estado"
            sx={{ 
              color: getEstadoColor(estado),
              ml: 0.5
            }}
          >
            • {getEstadoLabel(estado)}
          </Typography>
        </Typography>
      </Box>

      {/* Fechas */}
      <Box sx={{ mt: 0.25 }}>
        <Box 
          onClick={() => toggleSection('fechas')}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            cursor: 'pointer',
            '&:hover': { color: 'primary.main' }
          }}
        >
          <CalendarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
            {estaFinalizado ? 
              `Duración: ${duracionTotal}` : 
              tiempoRestante || 'Contrato finalizado'
            }
          </Typography>
          <IconButton
            size="small"
            sx={{
              p: 0.25,
              transform: expandedSections.fechas ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
        <Collapse in={expandedSections.fechas}>
          <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Inicio: {formatFecha(fechaInicio)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Fin: {formatFecha(fechaFin)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Duración total: {duracionTotal}
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {/* Inquilinos colapsables */}
      {tipoContrato !== 'MANTENIMIENTO' && inquilino.length > 0 && (
        <Box sx={{ mt: 0.25 }}>
          <Box 
            onClick={() => toggleSection('inquilinos')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <PeopleIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
              {inquilino.length} {inquilino.length === 1 ? 'inquilino' : 'inquilinos'}
            </Typography>
            <IconButton
              size="small"
              sx={{
                p: 0.25,
                transform: expandedSections.inquilinos ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Box>
          <Collapse in={expandedSections.inquilinos}>
            <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {inquilino.map(i => (
                <Box key={i._id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {i.nombre} {i.apellido}
                  </Typography>
                  {i.descripcion && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {i.descripcion}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Sección financiera colapsable */}
      {tipoContrato !== 'MANTENIMIENTO' && (
        <Box sx={{ mt: 0.25 }}>
          <Box 
            onClick={() => toggleSection('financial')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <MoneyIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
              Alquiler mensual: {showValues ? 
                `${cuenta?.moneda?.simbolo || '$'}${montoMensual || 0}` : 
                maskNumber(montoMensual, cuenta?.moneda?.simbolo)}
            </Typography>
            <IconButton
              size="small"
              sx={{
                p: 0.25,
                transform: expandedSections.financial ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Box>
          <Collapse in={expandedSections.financial}>
            <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {(deposito || 0) > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Depósito: {showValues ? 
                    `${cuenta?.moneda?.simbolo || '$'}${deposito}` : 
                    maskNumber(deposito, cuenta?.moneda?.simbolo)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Cuenta: {cuenta?.nombre || 'No especificada'}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Observaciones */}
      {observaciones && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.75rem' }}>
          {observaciones}
        </Typography>
      )}
    </Box>
  );
};

export default ContratosView; 