import React, { useEffect, useState } from 'react';
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
  TaskAltOutlined as RutinasIcon,
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
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    propiedades: {
      total: 0,
      ocupadas: 0,
      disponibles: 0,
      porcentajeOcupacion: 0
    },
    finanzas: {
      ingresosMensuales: 0,
      egresosMensuales: 0,
      balanceTotal: 0,
      monedaPrincipal: 'USD'
    },
    tareas: {
      pendientes: 0,
    },
    proyectos: {
      activos: 0,
    },
  });
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [showValues, setShowValues] = useState(true);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isPropertiesDetailOpen, setIsPropertiesDetailOpen] = useState(false);
  const [inquilinos, setInquilinos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [isDaylistOpen, setIsDaylistOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [propiedadesStats, transaccionesStats] = await Promise.all([
          clienteAxios.get('/propiedades/stats'),
          clienteAxios.get('/transacciones/stats')
        ]);

        const propiedadesData = propiedadesStats.data;
        const porcentajeOcupacion = propiedadesData.total > 0 
          ? Math.round((propiedadesData.ocupadas / propiedadesData.total) * 100)
          : 0;

        const transaccionesData = transaccionesStats.data;
        
        setStats({
          propiedades: {
            ...propiedadesData,
            porcentajeOcupacion
          },
          finanzas: transaccionesData
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAccounts = async () => {
      try {
        const response = await clienteAxios.get('/cuentas');
        setAccounts(response.data);
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      }
    };

    const fetchInquilinosYContratos = async () => {
      try {
        const [inquilinosRes, contratosRes] = await Promise.all([
          clienteAxios.get('/inquilinos/activos'),
          clienteAxios.get('/contratos/activos')
        ]);
        setInquilinos(inquilinosRes.data);
        setContratos(contratosRes.data);
      } catch (error) {
        console.error('Error al cargar inquilinos y contratos:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        toast.error('Error al cargar los datos. Por favor, intente nuevamente.');
      }
    };

    fetchStats();
    fetchAccounts();
    fetchInquilinosYContratos();
  }, []);

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
            <IngresosIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Typography variant="body2" sx={{ color: 'success.main' }}>
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
          {accounts.map((account) => (
            <Box 
              key={account.id}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {account.nombre === 'Efectivo' && <MoneyIcon sx={{ fontSize: 18 }} />}
                {account.nombre === 'ICBC' && <BankIcon sx={{ fontSize: 18 }} />}
                {account.nombre === 'Wise' && <CardIcon sx={{ fontSize: 18 }} />}
                <Typography variant="body2">{account.nombre}</Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ color: Number(account.saldo) >= 0 ? 'success.main' : 'error.main' }}
              >
                {showValues ? 
                  `${account.moneda} ${parseFloat(account.saldo).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}` : 
                  '****'
                }
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );

  const PropertiesSection = () => {
    const [propertyPeriod, setPropertyPeriod] = useState(1); // 1, 3, o 12 meses

    const handlePropertyPeriodClick = () => {
      const periods = [1, 3, 12];
      const currentIndex = periods.indexOf(propertyPeriod);
      const nextIndex = (currentIndex + 1) % periods.length;
      setPropertyPeriod(periods[nextIndex]);
    };

    return (
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
              {`${stats.propiedades.total} Propiedades`}
            </Typography>
          </Box>
        </Box>

        {/* Controles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Período */}
          <Typography variant="caption" color="text.secondary">
            {`${propertyPeriod}m`}
          </Typography>
          <IconButton size="small" onClick={handlePropertyPeriodClick} sx={{ p: 0.5 }}>
            <PeriodIcon sx={{ fontSize: 18 }} />
          </IconButton>

          {/* Collapse */}
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
            icon: <ProjectIcon sx={{ fontSize: 20 }} />,
            label: 'Proyectos',
            to: '/proyectos'
          }
        ]}
        showValues={showValues}
        onToggleValues={() => setShowValues(!showValues)}
      />

      <Grid container spacing={2}>
        {/* Assets Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <PropertiesSection />
            {isPropertiesDetailOpen && (
              <Box sx={{ 
                pt: 0.5,
                mt: 0.5,
                borderTop: 1,
                borderColor: 'divider',
                display: 'flex',
                gap: 2
              }}>
                {/* Contratos activos */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ProjectIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {`${contratos.length} contratos activos`}
                    </Typography>
                  </Box>
                </Box>

                {/* Inquilinos activos */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InquilinosIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {inquilinos.length > 0 
                        ? inquilinos.map(inquilino => inquilino.nombre).join(', ')
                        : 'Sin inquilinos activos'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
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

        {/* Daylist Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TaskAltOutlined sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {`${stats.tareas?.pendientes || 0} tareas pendientes`}
                  </Typography>
                </Box>
              </Box>

              <IconButton 
                size="small" 
                onClick={() => setIsDaylistOpen(!isDaylistOpen)}
                sx={{
                  p: 0.5,
                  transform: isDaylistOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            <Collapse in={isDaylistOpen}>
              {/* ... contenido del Daylist ... */}
            </Collapse>
          </Paper>
        </Grid>

        {/* Projects Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ProjectIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {`${stats.proyectos?.activos || 0} proyectos activos`}
                  </Typography>
                </Box>
              </Box>

              <IconButton 
                size="small" 
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                sx={{
                  p: 0.5,
                  transform: isProjectsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            <Collapse in={isProjectsOpen}>
              {/* ... contenido de Projects ... */}
            </Collapse>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
