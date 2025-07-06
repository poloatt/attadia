import React, { useEffect, useState, useCallback } from 'react';
import { Grid, Box, Typography, Skeleton, Paper, IconButton, Menu, MenuItem, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';

import ContratoDetail from '../components/contratos/ContratoDetail';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  AccountBalanceOutlined as BankIcon,
  CreditCardOutlined as CardIcon,
  AttachMoneyOutlined as MoneyIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  HomeOutlined as HomeIcon,
  PercentOutlined as PercentIcon,
  CheckCircleOutline as OccupiedIcon,
  PeopleOutline as InquilinosIcon,
  HandymanOutlined as MaintenanceIcon,
  BookmarkOutlined as ReservedIcon,
  HealthAndSafety as HealthIcon,
  Inventory2Outlined as InventoryIcon,
  TrendingDownOutlined as GastosIcon,
  TrendingUpOutlined as IngresosIcon,
  TimerOutlined as PeriodIcon,
  FitnessCenterOutlined as RutinasIcon,
  FolderOutlined as TaskIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  VisibilityOutlined as VisibilityOutlinedIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { StatusChip } from '../components/propiedades/PropiedadCard';
import { STATUS_ICONS, STATUS_COLORS } from '../components/propiedades/PropiedadCard';

// Función para calcular el progreso de ocupación de la propiedad (copiada de PropiedadCard.jsx)
const calcularProgresoOcupacion = (propiedad) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  // Encontrar contrato activo
  const contratoActivo = (propiedad.contratos || []).find(contrato => {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
  });
  if (!contratoActivo) {
    return {
      porcentaje: 0,
      diasTranscurridos: 0,
      diasTotales: 0,
      diasRestantes: 0,
      estadoTiempo: 'Sin contrato',
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false,
      estado: 'DISPONIBLE',
      contrato: null
    };
  }
  const inicio = new Date(contratoActivo.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(contratoActivo.fechaFin);
  fin.setHours(0, 0, 0, 0);
  // Calcular días totales del contrato
  const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  // Calcular días transcurridos
  const diasTranscurridos = Math.max(0, Math.min(diasTotales, Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))));
  // Calcular días restantes
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));
  // Estado textual
  let estadoTiempo = '';
  if (hoy < inicio) {
    estadoTiempo = 'No iniciado';
  } else if (hoy > fin) {
    estadoTiempo = 'Finalizado';
  } else {
    estadoTiempo = `${diasRestantes} días restantes`;
  }
  // Calcular porcentaje
  const porcentaje = diasTotales > 0 ? Math.min(100, (diasTranscurridos / diasTotales) * 100) : 0;
  // Calcular montos (usando el precio de la propiedad)
  const montoMensual = propiedad.precio || 0;
  const montoAcumulado = (diasTranscurridos / 30) * montoMensual;
  const montoTotal = (diasTotales / 30) * montoMensual;
  // Determinar estado
  let estado = 'OCUPADA';
  if (contratoActivo.esMantenimiento || contratoActivo.tipoContrato === 'MANTENIMIENTO') {
    estado = 'MANTENIMIENTO';
  }
  return {
    porcentaje,
    diasTranscurridos,
    diasTotales,
    diasRestantes,
    estadoTiempo,
    montoAcumulado,
    montoTotal,
    tieneContrato: true,
    contrato: contratoActivo,
    estado
  };
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { showValues } = useValuesVisibility();
  const [isAccountsOpen, setIsAccountsOpen] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [isPropertiesDetailOpen, setIsPropertiesDetailOpen] = useState(true);
  const [inquilinos, setInquilinos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [isDaylistOpen, setIsDaylistOpen] = useState(false);
  const [propiedades, setPropiedades] = useState([]);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [contratoDetailOpen, setContratoDetailOpen] = useState(false);

  const [stats, setStats] = useState({
    propiedades: {
      total: 0,
      ocupadas: 0,
      disponibles: 0,
      mantenimiento: 0,
      reservadas: 0,
      porcentajeOcupacion: 0
    },
    finanzas: {
      ingresosMensuales: 0,
      egresosMensuales: 0,
      balanceTotal: 0,
      monedaPrincipal: 'USD',
      monedaColor: '#75AADB'
    }
  });

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Iniciando fetchStats...');
      
      // Obtener propiedades y calcular estadísticas
      const propiedadesRes = await clienteAxios.get('/api/propiedades');
      const propiedades = propiedadesRes.data.docs || [];
      setPropiedades(propiedades);
      
      // Calcular estadísticas de propiedades
      const propiedadesStats = propiedades.reduce((stats, propiedad) => {
        stats.total++;
        
        // Determinar estado actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Verificar contratos activos
        const tieneContratoActivo = (propiedad.contratos || []).some(contrato => {
          return contrato.estado === 'ACTIVO';
        });

        // Verificar contratos reservados
        const tieneContratoReservado = (propiedad.contratos || []).some(contrato => {
          return contrato.estado === 'PLANEADO';
        });

        // Determinar estado
        if (tieneContratoActivo) {
          stats.ocupadas++;
          stats.disponibles = Math.max(0, stats.disponibles - 1);
        } else if (propiedad.estado === 'MANTENIMIENTO') {
          stats.mantenimiento++;
          stats.disponibles = Math.max(0, stats.disponibles - 1);
        } else if (tieneContratoReservado || propiedad.estado === 'RESERVADA') {
          stats.reservadas++;
          stats.disponibles = Math.max(0, stats.disponibles - 1);
        } else {
          stats.disponibles++;
        }
        
        return stats;
      }, {
        total: 0,
        ocupadas: 0,
        disponibles: 0,
        mantenimiento: 0,
        reservadas: 0
      });

      // Calcular porcentaje de ocupación
      const porcentajeOcupacion = propiedadesStats.total > 0 
        ? Math.round((propiedadesStats.ocupadas / (propiedadesStats.total - propiedadesStats.mantenimiento)) * 100)
        : 0;

      console.log('Estadísticas calculadas:', {
        ...propiedadesStats,
        porcentajeOcupacion
      });

      // Intentamos obtener las estadísticas de transacciones
      let transaccionesData = {
        ingresosMensuales: 0,
        egresosMensuales: 0,
        balanceTotal: 0,
        monedaPrincipal: 'USD',
        monedaColor: '#75AADB'
      };

      try {
        const transaccionesStats = await clienteAxios.get('/api/transacciones/stats');
        console.log('Estadísticas de transacciones:', transaccionesStats.data);
        transaccionesData = transaccionesStats.data;
      } catch (transaccionesError) {
        console.error('Error al obtener estadísticas de transacciones:', transaccionesError);
      }

      setStats(prevStats => ({
        ...prevStats,
        propiedades: {
          ...propiedadesStats,
          porcentajeOcupacion
        },
        finanzas: {
          ...transaccionesData,
          monedaColor: transaccionesData.monedaColor || '#75AADB'
        }
      }));
    } catch (error) {
      // Ignorar errores por cancelación, son parte del control de flujo
      if (error.cancelado) {
        console.log('Petición de estadísticas cancelada para evitar múltiples solicitudes');
        return;
      }
      
      console.error('Error al cargar estadísticas:', error);
      console.error('Detalles del error:', error.response?.data);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      console.log('Obteniendo cuentas...');
      const response = await clienteAxios.get('/api/cuentas');
      const cuentas = response.data.docs || [];
      console.log('Cuentas obtenidas:', cuentas);
      
      // Obtener los balances de cada cuenta
      const cuentasConBalance = await Promise.all(cuentas.map(async (cuenta) => {
        try {
          const today = new Date().toISOString().split('T')[0];
          console.log(`Obteniendo transacciones para cuenta ${cuenta.nombre} (${cuenta._id})`);
          
          const transaccionesResponse = await clienteAxios.get(`/api/transacciones/by-cuenta/${cuenta._id || cuenta.id}`, {
            params: {
              fechaFin: today,
              estado: 'PAGADO'
            }
          });
          
          const transacciones = transaccionesResponse.data.docs || [];
          console.log(`Transacciones obtenidas para ${cuenta.nombre}:`, transacciones);

          const balance = transacciones.reduce((acc, trans) => {
            const monto = parseFloat(trans.monto) || 0;
            return trans.tipo === 'INGRESO' ? acc + monto : acc - monto;
          }, 0);
          
          return {
            ...cuenta,
            saldo: balance.toFixed(2)
          };
        } catch (err) {
          // Si hay error obteniendo las transacciones, devolver la cuenta sin modificar
          console.error(`Error al obtener transacciones para cuenta ${cuenta.nombre}:`, err);
          return cuenta;
        }
      }));
      
      setAccounts(cuentasConBalance);
    } catch (error) {
      // Ignorar errores por cancelación, son parte del control de flujo
      if (error.cancelado) {
        console.log('Petición de cuentas cancelada para evitar múltiples solicitudes');
        return;
      }
      
      console.error('Error al cargar cuentas:', error);
      console.error('Detalles del error:', error.response?.data);
      toast.error('Error al cargar cuentas');
    }
  }, []);

  const fetchInquilinosYContratos = useCallback(async () => {
    try {
      console.log('Iniciando fetchInquilinosYContratos...');
      const [inquilinosResponse, contratosResponse] = await Promise.all([
        clienteAxios.get('/api/inquilinos/activos'),
        clienteAxios.get('/api/contratos/activos')
      ]);
      
      const inquilinosData = inquilinosResponse.data.docs || [];
      const contratosData = contratosResponse.data.docs || [];
      
      setInquilinos(inquilinosData);
      setContratos(contratosData);
    } catch (error) {
      // Ignorar errores por cancelación, son parte del control de flujo
      if (error.cancelado) {
        console.log('Petición de inquilinos/contratos cancelada para evitar múltiples solicitudes');
        return;
      }
      
      console.error('Error al cargar inquilinos y contratos:', error);
      console.error('Detalles del error:', error.response?.data);
      toast.error('Error al cargar datos de inquilinos y contratos');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchAccounts(),
        fetchInquilinosYContratos()
      ]);
    } catch (error) {
      // Ignorar errores por cancelación
      if (!error.cancelado) {
        console.error('Error al cargar datos:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAccounts, fetchInquilinosYContratos]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchStats(),
          fetchAccounts(),
          fetchInquilinosYContratos()
        ]);
      } catch (error) {
        // Ignorar errores por cancelación
        if (!error.cancelado) {
          console.error('Error al cargar datos:', error);
          toast.error('Error al cargar datos del dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    
    const interval = setInterval(loadAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchAccounts, fetchInquilinosYContratos]);

  const handlePeriodClick = () => {
    const periods = [7, 30, 90];
    const currentIndex = periods.indexOf(selectedPeriod);
    const nextIndex = (currentIndex + 1) % periods.length;
    setSelectedPeriod(periods[nextIndex]);
  };

  const FinanceSection = () => (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Métricas principales */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Cantidad de cuentas */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BankIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" color="text.secondary">
              {`${accounts.length} Cuentas`}
            </Typography>
          </Box>

          {/* Ingresos */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IngresosIcon sx={{ fontSize: 18, color: stats.finanzas.monedaColor || '#75AADB' }} />
            <Typography variant="body2" sx={{ color: stats.finanzas.monedaColor || '#75AADB' }}>
              {showValues ? `${stats.finanzas.monedaPrincipal} ${stats.finanzas.ingresosMensuales}` : '****'}
            </Typography>
          </Box>

          {/* Gastos */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GastosIcon sx={{ fontSize: 18, color: 'error.main' }} />
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              {showValues ? `${stats.finanzas.monedaPrincipal} ${stats.finanzas.egresosMensuales}` : '****'}
            </Typography>
          </Box>
        </Box>

        {/* Controles de finanzas */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {`${selectedPeriod}d`}
          </Typography>

          <IconButton size="small" onClick={handlePeriodClick} sx={{ p: 0.5 }}>
            <PeriodIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <IconButton 
            size="small" 
            onClick={() => setIsAccountsOpen(!isAccountsOpen)}
            sx={{
              p: 0.5,
              transform: isAccountsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Cuentas colapsables */}
      <Collapse in={isAccountsOpen}>
        <Box sx={{ 
          mt: 0.5,
          pt: 0.5,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          {accounts.map((account) => {
            const monedaSymbol = account.moneda?.simbolo || '$';
            const saldo = parseFloat(account.saldo) || 0;
            
            const getTipoIcon = (tipo) => {
              switch (tipo) {
                case 'BANCO':
                  return <BankIcon sx={{ fontSize: 18 }} />;
                case 'EFECTIVO':
                  return <MoneyIcon sx={{ fontSize: 18 }} />;
                default:
                  return <CardIcon sx={{ fontSize: 18 }} />;
              }
            };
            
            return (
              <Box 
                key={account._id || account.id}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTipoIcon(account.tipo)}
                  <Typography variant="body2">{account.nombre}</Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: saldo >= 0 ? account.moneda?.color || '#75AADB' : 'error.main',
                    fontWeight: 500
                  }}
                >
                  {showValues ? 
                    `${monedaSymbol} ${saldo.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}` : 
                    '****'
                  }
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );

  const PropertiesSection = () => {
    // Función auxiliar para pluralizar
    const pluralize = (count, singular, plural) => {
      return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
    };

    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Métricas de propiedades */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BuildingIcon sx={{ fontSize: 18 }} />
              <Typography
                component={Link}
                to="/propiedades"
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'underline',
                  '&:hover': { cursor: 'pointer' }
                }}
              >
                {pluralize(stats.propiedades.total, 'Propiedad', 'Propiedades')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PercentIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary">
                {`${stats.propiedades.porcentajeOcupacion}% Ocupación`}
              </Typography>
            </Box>
          </Box>

          {/* Controles */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={() => setIsPropertiesDetailOpen(!isPropertiesDetailOpen)}
              sx={{
                p: 0.5,
                transform: isPropertiesDetailOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Sección colapsable */}
        <Collapse in={isPropertiesDetailOpen}>
          <Box sx={{ pt: 0.5, mt: 0.5, borderTop: 1, borderColor: 'divider' }}>
            {/* Listado de propiedades detallado */}
            {propiedades.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                No hay propiedades registradas.
              </Typography>
            )}
            {propiedades.map((prop) => (
              <Paper key={prop._id} sx={{ p: 2, mb: 2, bgcolor: '#111', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BuildingIcon sx={{ fontSize: 18 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{prop.titulo || 'Sin título'}</Typography>
                  <StatusChip customcolor={STATUS_COLORS[prop.estado] || 'text.secondary'}>
                    {STATUS_ICONS[prop.estado] || null}
                    {prop.estado ? prop.estado.charAt(0) + prop.estado.slice(1).toLowerCase() : 'N/A'}
                  </StatusChip>
                </Box>
                {/* Inquilinos con icono individual */}
                {Array.isArray(prop.inquilinos) && prop.inquilinos.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {prop.inquilinos.map((inq) => (
                        <Box key={inq._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="body2" color="primary.main">
                            {inq.nombre} {inq.apellido}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                {/* Contratos referenciados con icono y botón de ver detalle */}
                {Array.isArray(prop.contratos) && prop.contratos.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {prop.contratos.map((contrato) => (
                        <Box key={contrato._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DescriptionOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="body2" color="primary.main">
                            {(() => {
                              const fechaInicio = contrato.fechaInicio ? new Date(contrato.fechaInicio) : null;
                              const fechaFin = contrato.fechaFin ? new Date(contrato.fechaFin) : null;
                              
                              if (fechaInicio && fechaFin) {
                                const inicioStr = fechaInicio.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                                const finStr = fechaFin.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                                return `${inicioStr} - ${finStr}`;
                              } else if (fechaInicio) {
                                const inicioStr = fechaInicio.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                                return `${inicioStr} - Sin fecha fin`;
                              } else {
                                return 'Sin fechas';
                              }
                            })()}
                          </Typography>
                          <IconButton size="small" onClick={() => handleOpenContratoDetail(contrato)}>
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                    {/* Total de contratos */}
                    {(() => {
                      // Calcular el progreso de ocupación para obtener el total correcto
                      const progresoOcupacion = calcularProgresoOcupacion(prop);
                      const totalContratos = progresoOcupacion.montoTotal;
                      
                      if (totalContratos > 0) {
                        const simboloMoneda = prop.cuenta?.moneda?.simbolo || 
                                            prop.moneda?.simbolo || 
                                            prop.contratos[0]?.moneda?.simbolo || 
                                            prop.contratos[0]?.cuenta?.moneda?.simbolo || '$';
                        
                        return (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <MoneyIcon sx={{ fontSize: 18, color: 'text.primary' }} />
                            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                              Total: {simboloMoneda} {totalContratos.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const StatBox = ({ title, value, loading }) => (
    <Box sx={{ 
      p: 2, 
      bgcolor: 'background.paper',
      borderRadius: 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
    }}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {loading ? (
        <Skeleton width={100} height={40} />
      ) : (
        <Typography variant="h6" sx={{ mt: 1 }}>
          {value}
        </Typography>
      )}
    </Box>
  );

  const handleOpenContratoDetail = (contrato) => {
    setSelectedContrato(contrato);
    setContratoDetailOpen(true);
  };

  const handleCloseContratoDetail = () => {
    setContratoDetailOpen(false);
    setSelectedContrato(null);
  };

  const handleEditContrato = (contrato) => {
    // Implementar edición de contrato si es necesario
    console.log('Editar contrato:', contrato);
  };

  const handleDeleteContrato = (contratoId) => {
    // Implementar eliminación de contrato si es necesario
    console.log('Eliminar contrato:', contratoId);
  };

  return (
    <Box sx={{ width: '100%' }}>


      {/* Contenido principal */}
      <Box sx={{ 
        width: '100%', 
        px: { xs: 1, sm: 2, md: 3 },
        py: 1
      }}>
        <Grid container spacing={2}>
          {/* Sección de Propiedades */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              bgcolor: '#111'
            }}>
              <PropertiesSection />
            </Paper>
          </Grid>

          {/* Sección de Cuentas */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              bgcolor: '#111'
            }}>
              <FinanceSection />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {selectedContrato && (
        <ContratoDetail
          contrato={selectedContrato}
          open={contratoDetailOpen}
          onClose={handleCloseContratoDetail}
          onEdit={handleEditContrato}
          onDelete={handleDeleteContrato}
        />
      )}
    </Box>
  );
}

export default Dashboard;
