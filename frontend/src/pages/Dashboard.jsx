import React, { useEffect, useState, useCallback } from 'react';
import { Container, Grid, Box, Typography, Skeleton, Paper, IconButton, Menu, MenuItem, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';
import EntityToolbar from '../components/EntityToolbar';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  AccountBalanceOutlined as BankIcon,
  CreditCardOutlined as CardIcon,
  AttachMoneyOutlined as MoneyIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  FitnessCenterOutlined as RutinasIcon,
  AssignmentOutlined as TaskIcon,
  AssignmentOutlined as ProjectIcon,
  TimerOutlined as PeriodIcon,
  TrendingDownOutlined as GastosIcon,
  TrendingUpOutlined as IngresosIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  HomeOutlined as HomeIcon,
  PercentOutlined as PercentIcon,
  CheckCircleOutline as OccupiedIcon,
  PeopleOutline as InquilinosIcon,
  TaskAltOutlined as TaskAltOutlined,
  HandymanOutlined as MaintenanceIcon,
  BookmarkOutlined as ReservedIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
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
    },
    tareas: {
      pendientes: 0,
      total: 0,
      completadas: 0,
      enProgreso: 0
    },
    proyectos: {
      activos: 0,
      total: 0,
      completados: 0,
      enPausa: 0
    },
  });
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { showValues } = useValuesVisibility();
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isPropertiesDetailOpen, setIsPropertiesDetailOpen] = useState(false);
  const [inquilinos, setInquilinos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [isDaylistOpen, setIsDaylistOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Iniciando fetchStats...');
      
      // Primero obtenemos las estadísticas de propiedades
      const propiedadesStats = await clienteAxios.get('/propiedades/stats');
      console.log('Estadísticas de propiedades:', propiedadesStats.data);
      
      const propiedadesData = propiedadesStats.data;
      const porcentajeOcupacion = propiedadesData.total > 0 
        ? Math.round((propiedadesData.ocupadas / propiedadesData.total) * 100)
        : 0;

      // Intentamos obtener las estadísticas de transacciones
      let transaccionesData = {
        ingresosMensuales: 0,
        egresosMensuales: 0,
        balanceTotal: 0,
        monedaPrincipal: 'USD',
        monedaColor: '#75AADB'
      };

      try {
        const transaccionesStats = await clienteAxios.get('/transacciones/stats');
        console.log('Estadísticas de transacciones:', transaccionesStats.data);
        transaccionesData = transaccionesStats.data;
      } catch (transaccionesError) {
        console.error('Error al obtener estadísticas de transacciones:', transaccionesError);
      }

      setStats(prevStats => ({
        ...prevStats,
        propiedades: {
          ...propiedadesData,
          porcentajeOcupacion
        },
        finanzas: {
          ...transaccionesData,
          monedaColor: transaccionesData.monedaColor || '#75AADB'
        }
      }));
    } catch (error) {
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
      const response = await clienteAxios.get('/cuentas');
      const cuentas = response.data.docs || [];
      console.log('Cuentas obtenidas:', cuentas);
      
      // Obtener los balances de cada cuenta
      const cuentasConBalance = await Promise.all(cuentas.map(async (cuenta) => {
        try {
          const today = new Date().toISOString().split('T')[0];
          console.log(`Obteniendo transacciones para cuenta ${cuenta.nombre} (${cuenta._id})`);
          
          const transaccionesResponse = await clienteAxios.get(`/transacciones/by-cuenta/${cuenta._id || cuenta.id}`, {
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

          console.log(`Balance calculado para ${cuenta.nombre}:`, balance);

          // Asegurarnos de que la moneda tenga la información correcta
          const monedaInfo = cuenta.moneda || {};
          
          return {
            ...cuenta,
            saldo: balance,
            moneda: {
              ...monedaInfo,
              simbolo: monedaInfo.simbolo || '$',
              nombre: monedaInfo.nombre || 'USD',
              color: monedaInfo.color || '#75AADB' // Celeste Argentina por defecto
            },
            tipo: cuenta.tipo || 'OTRO'
          };
        } catch (error) {
          console.error(`Error al obtener balance de cuenta ${cuenta._id}:`, error);
          console.error('Detalles del error:', error.response?.data);
          return {
            ...cuenta,
            saldo: 0,
            moneda: {
              ...cuenta.moneda,
              simbolo: cuenta.moneda?.simbolo || '$',
              nombre: cuenta.moneda?.nombre || 'USD',
              color: cuenta.moneda?.color || '#75AADB'
            },
            tipo: cuenta.tipo || 'OTRO'
          };
        }
      }));

      console.log('Cuentas procesadas con balance:', cuentasConBalance);
      setAccounts(cuentasConBalance);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      console.error('Detalles del error:', error.response?.data);
    }
  }, []);

  const fetchInquilinosYContratos = useCallback(async () => {
    try {
      console.log('Iniciando fetchInquilinosYContratos...');
      const [inquilinosRes, contratosRes] = await Promise.all([
        clienteAxios.get('/inquilinos/activos'),
        clienteAxios.get('/contratos/activos')
      ]);

      console.log('Respuesta de inquilinos:', inquilinosRes.data);
      console.log('Respuesta de contratos:', contratosRes.data);

      // Obtener inquilinos activos
      const inquilinosActivos = (inquilinosRes.data.docs || []).filter(inquilino => {
        console.log('Procesando inquilino:', inquilino);
        const esActivo = inquilino.estado === 'ACTIVO';
        console.log(`¿El inquilino ${inquilino.nombre} está activo?:`, esActivo);
        return esActivo;
      });

      // Obtener contratos activos
      const contratosActivos = (contratosRes.data.docs || []).filter(contrato => {
        console.log('Procesando contrato:', contrato);
        const esActivo = contrato.estado === 'ACTIVO';
        console.log(`¿El contrato ${contrato._id} está activo?:`, esActivo);
        return esActivo;
      });

      console.log('Inquilinos activos filtrados:', inquilinosActivos);
      console.log('Contratos activos filtrados:', contratosActivos);

      setInquilinos(inquilinosActivos);
      setContratos(contratosActivos);

    } catch (error) {
      console.error('Error al cargar inquilinos y contratos:', error);
      console.error('Detalles del error:', error.response?.data);
      toast.error('Error al cargar inquilinos y contratos');
    }
  }, []);

  const fetchTasksAndProjects = useCallback(async () => {
    try {
      console.log('Obteniendo estadísticas de tareas y proyectos...');
      
      // Obtener todas las tareas y proyectos
      const [tareasRes, proyectosRes] = await Promise.all([
        clienteAxios.get('/tareas'),
        clienteAxios.get('/proyectos')
      ]);

      console.log('Tareas obtenidas:', tareasRes.data);
      console.log('Proyectos obtenidos:', proyectosRes.data);
      
      // Calcular estadísticas de tareas
      const tareasList = tareasRes.data.docs || [];
      const tareas = {
        pendientes: tareasList.filter(t => t.estado === 'PENDIENTE').length,
        enProgreso: tareasList.filter(t => t.estado === 'EN_PROGRESO').length,
        completadas: tareasList.filter(t => t.estado === 'COMPLETADA').length,
        total: tareasList.length
      };

      // Calcular estadísticas de proyectos
      const proyectosList = proyectosRes.data.docs || [];
      const proyectos = {
        activos: proyectosList.filter(p => p.estado === 'EN_PROGRESO').length,
        completados: proyectosList.filter(p => p.estado === 'COMPLETADO').length,
        enPausa: proyectosList.filter(p => p.estado === 'PENDIENTE').length,
        total: proyectosList.length
      };

      console.log('Estadísticas calculadas de tareas:', tareas);
      console.log('Estadísticas calculadas de proyectos:', proyectos);

      setStats(prevStats => ({
        ...prevStats,
        tareas,
        proyectos
      }));
    } catch (error) {
      console.error('Error al obtener estadísticas de tareas y proyectos:', error);
      console.error('Detalles del error:', error.response?.data);
      toast.error('Error al cargar estadísticas de tareas y proyectos');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchAccounts(),
        fetchInquilinosYContratos(),
        fetchTasksAndProjects()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAccounts, fetchInquilinosYContratos, fetchTasksAndProjects]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchStats(),
          fetchAccounts(),
          fetchInquilinosYContratos(),
          fetchTasksAndProjects()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    
    const interval = setInterval(loadAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchAccounts, fetchInquilinosYContratos, fetchTasksAndProjects]);

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
          <Box sx={{ 
            pt: 0.5,
            mt: 0.5,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            {/* Estados de propiedades */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              mb: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <OccupiedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {pluralize(stats.propiedades.ocupadas, 'Ocupada', 'Ocupadas')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MaintenanceIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {`${stats.propiedades.mantenimiento} En Mantenimiento`}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <HomeIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {pluralize(stats.propiedades.disponibles, 'Disponible', 'Disponibles')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ReservedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {pluralize(stats.propiedades.reservadas, 'Reservada', 'Reservadas')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Contratos e inquilinos */}
            <Box sx={{ 
              display: 'flex',
              gap: 2,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider'
            }}>
              {/* Contratos activos */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ProjectIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {contratos.length > 0 
                      ? `${pluralize(contratos.length, 'contrato activo', 'contratos activos')}: ${contratos.map(contrato => contrato.propiedad?.titulo || 'Sin título').join(', ')}`
                      : 'Sin contratos activos'
                    }
                  </Typography>
                </Box>
              </Box>

              {/* Inquilinos activos */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InquilinosIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {inquilinos.length > 0 
                      ? `${pluralize(inquilinos.length, 'inquilino activo', 'inquilinos activos')}: ${inquilinos.map(inquilino => inquilino.nombre).join(', ')}`
                      : 'Sin inquilinos activos'
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    );
  };

  const TasksAndProjectsSection = () => {
    // Función auxiliar para formatear el texto de conteo
    const formatCountText = (count, type) => {
      if (count === 0) {
        return `Sin ${type}`;
      }
      return `${count} ${type}`;
    };

    // Calcular tareas activas (pendientes + en progreso)
    const tareasActivas = stats.tareas.pendientes + stats.tareas.enProgreso;

    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Métricas principales */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Tareas */}
            <Box 
              component={Link} 
              to="/tareas"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <TaskAltOutlined sx={{ fontSize: 18, color: 'inherit' }} />
              <Typography variant="body2" color="inherit">
                {formatCountText(tareasActivas, 'tareas activas')}
              </Typography>
            </Box>

            {/* Proyectos */}
            <Box 
              component={Link}
              to="/proyectos"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <ProjectIcon sx={{ fontSize: 18, color: 'inherit' }} />
              <Typography variant="body2" color="inherit">
                {formatCountText(stats.proyectos.activos, 'proyectos activos')}
              </Typography>
            </Box>
          </Box>

          {/* Control de expansión */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              sx={{
                p: 0.5,
                transform: isProjectsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: 'text.secondary'
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Sección colapsable */}
        <Collapse in={isProjectsOpen}>
          <Box sx={{ 
            mt: 0.5,
            pt: 0.5,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 2
            }}>
              {/* Sección de Tareas */}
              <Box>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#f44336', fontSize: '8px' }}>●</span> Pendientes: {stats.tareas.pendientes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#2196f3', fontSize: '8px' }}>●</span> En Progreso: {stats.tareas.enProgreso}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#4caf50', fontSize: '8px' }}>●</span> Completadas: {stats.tareas.completadas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24,
                    fontWeight: 500,
                    mt: 0.5,
                    pt: 0.5,
                    borderTop: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <span style={{ color: '#757575', fontSize: '8px' }}>●</span> Total: {stats.tareas.total}
                  </Typography>
                </Box>
              </Box>

              {/* Sección de Proyectos */}
              <Box>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#2196f3', fontSize: '8px' }}>●</span> Activos: {stats.proyectos.activos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#ff9800', fontSize: '8px' }}>●</span> En Pausa: {stats.proyectos.enPausa}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24
                  }}>
                    <span style={{ color: '#4caf50', fontSize: '8px' }}>●</span> Completados: {stats.proyectos.completados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    height: 24,
                    fontWeight: 500,
                    mt: 0.5,
                    pt: 0.5,
                    borderTop: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <span style={{ color: '#757575', fontSize: '8px' }}>●</span> Total: {stats.proyectos.total}
                  </Typography>
                </Box>
              </Box>
            </Box>
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

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <EntityToolbar
        showAddButton={false}
        showBackButton={false}
        showDivider={false}
        navigationItems={[
          {
            icon: <WalletIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          },
          {
            icon: <TaskAltOutlined sx={{ fontSize: 20 }} />,
            label: 'Tareas',
            to: '/tareas'
          }
        ]}
      />

      <Grid container spacing={2}>
        {/* Assets Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <PropertiesSection />
            <Box sx={{ 
              mt: 1,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider'
            }}>
              <FinanceSection />
            </Box>
          </Paper>
        </Grid>

        {/* Tasks and Projects Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <TasksAndProjectsSection />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
