import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  Engineering as EngineeringIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Engineering as MaintenanceIcon,
  BookmarkAdded as ReservedIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  GridOn as GridIcon,
  List as ListIcon
} from '@mui/icons-material';
import { useValuesVisibility } from '../../context/ValuesVisibilityContext';
import { 
  getEstadoLabel, 
  getEstadoColor, 
  getEstadoColorTheme, 
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal, 
  formatFecha 
} from './contratoUtils';

const ContratosListView = ({ 
  contratos = [], 
  relatedData = {}, 
  onEdit, 
  onDelete,
  onToggleView,
  viewMode
}) => {
  const [expandedGroups, setExpandedGroups] = useState({
    alquiler: true,
    mantenimiento: true
  });

  // Agrupar contratos por tipo y estado usando solo estadoActual
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

    contratos.forEach(contrato => {
      const tipo = contrato.tipoContrato === 'MANTENIMIENTO' ? 'mantenimiento' : 'alquiler';
      const estado = contrato.estadoActual;
      if (!estado) return; // ignorar si no hay estadoActual
      switch (estado) {
        case 'ACTIVO':
          grupos[tipo].activos.push(contrato);
          break;
        case 'RESERVADO':
          grupos.alquiler.reservados.push(contrato);
          break;
        case 'PLANEADO':
          grupos[tipo].planeados.push(contrato);
          break;
        case 'FINALIZADO':
          grupos[tipo].finalizados.push(contrato);
          break;
        case 'MANTENIMIENTO':
          grupos.mantenimiento.activos.push(contrato);
          break;
        default:
          break;
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

  // Ordenar contratos según el Dashboard usando solo estadoActual
  const contratosOrdenados = [...contratos].sort((a, b) => {
    const estadoA = a.estadoActual;
    const estadoB = b.estadoActual;
    const orden = {
      'ACTIVO': 0,
      'RESERVADO': 1,
      'PLANEADO': 2,
      'FINALIZADO': 3,
      'MANTENIMIENTO': 4
    };
    return (orden[estadoA] ?? 99) - (orden[estadoB] ?? 99);
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {contratosOrdenados.map((contrato, index) => (
          <Grid item xs={12} sm={12} md={12} lg={12} key={contrato._id || contrato.id || `contrato-${index}`}>
            <ContratoCard
              contrato={contrato}
              relatedData={relatedData}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleView={onToggleView}
              viewMode={viewMode}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Componente de tarjeta de contrato
const ContratoCard = ({ contrato, relatedData, onEdit, onDelete, onToggleView, viewMode }) => {
  const { showValues, maskNumber } = useValuesVisibility();
  const [expanded, setExpanded] = useState(true); // Ahora por defecto extendido

  const {
    fechaInicio,
    fechaFin,
    observaciones,
    estado,
    tipoContrato
  } = contrato;

  // Buscar datos relacionados - verificar si los inquilinos ya están populated
  const inquilinosData = (() => {
    if (!contrato.inquilino || contrato.inquilino.length === 0) return [];
    
    // Si el primer inquilino es un objeto (populated), usar directamente
    if (contrato.inquilino[0] && typeof contrato.inquilino[0] === 'object' && contrato.inquilino[0].nombre) {
      return contrato.inquilino;
    }
    
    // Si no, buscar en los datos relacionados
    return contrato.inquilino?.map(inquilinoId => 
      relatedData.inquilinos?.find(i => i._id === inquilinoId)
    ).filter(Boolean) || [];
  })();

  // Determinar si los inquilinos están inactivos
  const inquilinosInactivos = inquilinosData.some(inquilino => inquilino?.estado === 'INACTIVO');
  
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

  // Log completo del contrato para debug
  console.log('LIST contrato completo:', contrato);

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
      {/* Header con título y estado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {tipoContrato === 'MANTENIMIENTO' ? (
            <EngineeringIcon sx={{ color: 'warning.main', fontSize: '1.1rem' }} />
          ) : (
            <HomeIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary', lineHeight: 1.2 }}>
            {(() => {
              if (contrato.propiedad && typeof contrato.propiedad === 'object' && contrato.propiedad.titulo) {
                return contrato.propiedad.titulo;
              }
              const propiedadData = relatedData.propiedades?.find(p => p._id === contrato.propiedad);
              return propiedadData?.titulo || 'Propiedad no encontrada';
            })()}
          </Typography>
          <Box component="span" sx={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: getEstadoColorTheme(estado),
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
          <Tooltip title={expanded ? 'Colapsar detalles' : 'Expandir detalles'}>
            <IconButton size="small" onClick={() => setExpanded(e => !e)} sx={{ color: 'text.secondary', p: 0.5, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Fechas */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
              {estaFinalizado ? `Duración: ${duracionTotal}` : tiempoRestante || 'Contrato finalizado'}
            </Typography>
          </Box>
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
        </Box>
      </Collapse>

      {/* Inquilinos */}
      {tipoContrato !== 'MANTENIMIENTO' && inquilinosData.length > 0 && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PeopleIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {inquilinosData.length} {inquilinosData.length === 1 ? 'inquilino' : 'inquilinos'}
              </Typography>
            </Box>
            <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {inquilinosData.map((inquilino, idx) => (
                <Typography key={inquilino._id || idx} variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {inquilino.nombre}
                </Typography>
              ))}
            </Box>
          </Box>
        </Collapse>
      )}

      {/* Sección financiera colapsable */}
      {tipoContrato !== 'MANTENIMIENTO' && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 0.25 }}>
            <Box 
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
                Alquiler mensual: {(() => {
                  // Para contratos de mantenimiento, no mostrar monto
                  if (contrato.tipoContrato === 'MANTENIMIENTO' || contrato.esMantenimiento) {
                    return 'N/A (Mantenimiento)';
                  }
                  
                  // Primero verificar si la cuenta ya está populated en el contrato
                  let cuentaData, monedaData;
                  if (contrato.cuenta && typeof contrato.cuenta === 'object') {
                    cuentaData = contrato.cuenta;
                    monedaData = cuentaData.moneda;
                  } else {
                    // Si no, buscar en los datos relacionados
                    cuentaData = relatedData.cuentas?.find(c => c._id === contrato.cuenta);
                    monedaData = cuentaData?.moneda;
                  }
                  
                  // Si no encontramos moneda a través de la cuenta, buscar directamente
                  if (!monedaData && contrato.moneda) {
                    if (typeof contrato.moneda === 'object') {
                      monedaData = contrato.moneda;
                    } else {
                      monedaData = relatedData.monedas?.find(m => m._id === contrato.moneda);
                    }
                  }
                  
                  const simbolo = monedaData?.simbolo || '$';
                  const monto = contrato.montoMensual || 0;
                  
                  // Debug específico para montoMensual - comparar con vista grid
                  console.log('🔍 LIST montoMensual:', {
                    contratoId: contrato._id,
                    montoMensual: contrato.montoMensual,
                    tipo: typeof contrato.montoMensual,
                    montoCalculado: monto,
                    esMantenimiento: contrato.esMantenimiento,
                    simbolo: simbolo,
                    contratoCompleto: contrato // Ver todo el objeto contrato
                  });
                  
                  return showValues ? 
                    `${simbolo}${monto}` : 
                    maskNumber(monto, simbolo);
                })()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {(contrato.deposito || 0) > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Depósito: {(() => {
                  // Usar la misma lógica que arriba para obtener la moneda
                  let cuentaData, monedaData;
                  if (contrato.cuenta && typeof contrato.cuenta === 'object') {
                    cuentaData = contrato.cuenta;
                    monedaData = cuentaData.moneda;
                  } else {
                    cuentaData = relatedData.cuentas?.find(c => c._id === contrato.cuenta);
                    monedaData = cuentaData?.moneda;
                  }
                  
                  if (!monedaData && contrato.moneda) {
                    if (typeof contrato.moneda === 'object') {
                      monedaData = contrato.moneda;
                    } else {
                      monedaData = relatedData.monedas?.find(m => m._id === contrato.moneda);
                    }
                  }
                  
                  const simbolo = monedaData?.simbolo || '$';
                  return showValues ? 
                    `${simbolo}${contrato.deposito}` : 
                    maskNumber(contrato.deposito, simbolo);
                })()}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Cuenta: {(() => {
                // Verificar si la cuenta ya está populated en el contrato
                if (contrato.cuenta && typeof contrato.cuenta === 'object' && contrato.cuenta.nombre) {
                  return contrato.cuenta.nombre;
                }
                // Si no, buscar en los datos relacionados
                const cuentaData = relatedData.cuentas?.find(c => c._id === contrato.cuenta);
                return cuentaData?.nombre || 'No especificada';
              })()}
            </Typography>
          </Box>
        </Collapse>
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

export default ContratosListView; 