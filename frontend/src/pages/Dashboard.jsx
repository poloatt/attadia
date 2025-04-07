import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Skeleton, 
  Paper, 
  IconButton, 
  Menu, 
  MenuItem, 
  Collapse,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Link } from 'react-router-dom';
import EntityToolbar from '../components/EntityToolbar';
import { FooterNavigation } from '../navigation/navigationbar';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  AccountBalanceOutlined as BankIcon,
  CreditCardOutlined as CardIcon,
  AttachMoneyOutlined as AttachMoneyIcon,
  AccountBalanceWalletOutlined as WalletIcon,
<<<<<<< HEAD
  FitnessCenterOutlined as RutinasIcon,
  AssignmentOutlined as TaskIcon,
  TimerOutlined as PeriodIcon,
  TrendingDownOutlined as GastosIcon,
  TrendingUpOutlined as IngresosIcon,
=======
>>>>>>> develop
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
<<<<<<< HEAD
  CalendarMonthOutlined as CalendarMonthIcon,
  LocationOn as LocationOnIcon,
  SquareFoot as SquareFootIcon,
  Bed as BedIcon,
  BathtubOutlined as BathtubOutlinedIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Inventory2Outlined as InventoryIcon,
  ExpandLess as ExpandLessIcon,
  HomeWork
=======
  Inventory2Outlined as InventoryIcon,
  TrendingDownOutlined as GastosIcon,
  TrendingUpOutlined as IngresosIcon,
  TimerOutlined as PeriodIcon
>>>>>>> develop
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import EntityForm from '../components/EntityViews/EntityForm';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityCards from '../components/EntityViews/EntityCards';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import PropiedadForm from '../components/propiedades/PropiedadForm';
import PropiedadList from '../components/propiedades/PropiedadList';
import { useSnackbar } from 'notistack';
import TransaccionForm from '../components/transacciones/TransaccionForm';

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
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { showValues } = useValuesVisibility();
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isPropertiesDetailOpen, setIsPropertiesDetailOpen] = useState(false);
  const [inquilinos, setInquilinos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [isDaylistOpen, setIsDaylistOpen] = useState(false);
<<<<<<< HEAD
  const [expandedProperties, setExpandedProperties] = useState({});
  const [propiedades, setPropiedades] = useState([]);
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isPropiedadFormOpen, setIsPropiedadFormOpen] = useState(false);
  const [isTransaccionFormOpen, setIsTransaccionFormOpen] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handlePropertyExpand = (propertyId) => {
    setExpandedProperties(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };
=======
>>>>>>> develop

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener propiedades, contratos e inquilinos
      const [propiedadesRes, contratosRes, inquilinosRes] = await Promise.all([
        clienteAxios.get('/api/propiedades?populate=contratos,inquilinos'),
        clienteAxios.get('/api/contratos/activos'),
        clienteAxios.get('/api/inquilinos/activos')
      ]);
      
      const propiedades = propiedadesRes.data.docs || [];
      const contratosData = contratosRes.data.docs || [];
      const inquilinosData = inquilinosRes.data.docs || [];
      
      // Guardar las propiedades en el estado
      setPropiedades(propiedades);
      setContratos(contratosData);
      setInquilinos(inquilinosData);
      
      // Calcular estadísticas de propiedades
      const propiedadesStats = propiedades.reduce((stats, propiedad) => {
        stats.total++;
        
        // Determinar estado actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Verificar contratos activos
        const tieneContratoActivo = contratosData.some(contrato => {
          const inicio = new Date(contrato.fechaInicio);
          const fin = new Date(contrato.fechaFin);
          return inicio <= hoy && fin >= hoy && (contrato.propiedad?._id === propiedad._id || contrato.propiedad === propiedad._id);
        });

        // Verificar contratos reservados
        const tieneContratoReservado = contratosData.some(contrato => {
          const inicio = new Date(contrato.fechaInicio);
          return inicio > hoy && contrato.estado === 'RESERVADO' && (contrato.propiedad?._id === propiedad._id || contrato.propiedad === propiedad._id);
        });

        // Determinar estado
        if (tieneContratoActivo) {
          stats.ocupadas++;
        } else if (propiedad.estado === 'MANTENIMIENTO') {
          stats.mantenimiento++;
        } else if (tieneContratoReservado || propiedad.estado === 'RESERVADA') {
          stats.reservadas++;
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

      // Actualizar el estado con las nuevas estadísticas
      setStats(prevStats => ({
        ...prevStats,
        propiedades: {
          ...propiedadesStats,
          porcentajeOcupacion
        }
      }));

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/cuentas');
      const cuentas = response.data.docs || [];
      
      // Obtener los balances de cada cuenta
      const cuentasConBalance = await Promise.all(cuentas.map(async (cuenta) => {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          const transaccionesResponse = await clienteAxios.get(`/api/transacciones/by-cuenta/${cuenta._id || cuenta.id}`, {
            params: {
              fechaFin: today,
              estado: 'PAGADO'
            }
          });
          
          const transacciones = transaccionesResponse.data.docs || [];

          const balance = transacciones.reduce((acc, trans) => {
            const monto = parseFloat(trans.monto) || 0;
            return trans.tipo === 'INGRESO' ? acc + monto : acc - monto;
          }, 0);
          
          return {
            ...cuenta,
            saldo: balance.toFixed(2)
          };
        } catch (err) {
          return cuenta;
        }
      }));
      
      setAccounts(cuentasConBalance);
    } catch (error) {
      if (!error.cancelado) {
      console.error('Error al cargar cuentas:', error);
      toast.error('Error al cargar cuentas');
      }
    }
  }, []);

  const fetchInquilinosYContratos = useCallback(async () => {
    try {
      const [inquilinosResponse, contratosResponse] = await Promise.all([
        clienteAxios.get('/api/inquilinos/activos'),
        clienteAxios.get('/api/contratos/activos')
      ]);
      
      const inquilinosData = inquilinosResponse.data.docs || [];
      const contratosData = contratosResponse.data.docs || [];
      
      setInquilinos(inquilinosData);
      setContratos(contratosData);
    } catch (error) {
      if (error.cancelado) {
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

  const FinanceSection = ({ stats, isFinanceOpen, handleFinanceToggle }) => (
    <Box sx={{ 
      bgcolor: 'background.default',
      borderRadius: 0
    }}>
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
                  return <AttachMoneyIcon sx={{ fontSize: 18 }} />;
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

  const PropertiesSection = ({ propiedades, stats, onEdit, onDelete }) => {
    return (
        <Box sx={{ 
<<<<<<< HEAD
        bgcolor: 'background.default',
        borderRadius: 0,
        '& .MuiBox-root': {
          borderBottom: 'none'  // Elimina la línea divisoria entre propiedades
        },
        '& .MuiListItem-root': {  // Reduce el espacio entre elementos
          py: 0.25  // Reduce el padding vertical
        },
        '& .MuiCollapse-root': {  // Reduce el espacio en los detalles expandidos
          '& .MuiBox-root': {
            py: 0.5
          }
        }
      }}>
        <PropiedadList 
          propiedades={propiedades}
          onEdit={onEdit}
          onDelete={onDelete}
          isDashboard={true}
        />
=======
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
                  <PeriodIcon sx={{ fontSize: 18 }} />
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
>>>>>>> develop
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

  // Función para manejar la edición de una propiedad
  const handleEditPropiedad = (propiedad) => {
    navigate(`/propiedades/${propiedad._id}/editar`);
  };

  // Función para manejar la eliminación de una propiedad
  const handleDeletePropiedad = async (propiedadId) => {
    try {
      await clienteAxios.delete(`/api/propiedades/${propiedadId}`);
      enqueueSnackbar('Propiedad eliminada con éxito', { variant: 'success' });
      // Recargar los datos
      fetchStats();
    } catch (error) {
      console.error('Error al eliminar la propiedad:', error);
      enqueueSnackbar('Error al eliminar la propiedad', { variant: 'error' });
    }
  };

  const handleFinanceToggle = () => {
    setIsFinanceOpen(!isFinanceOpen);
  };

  return (
<<<<<<< HEAD
    <Box sx={{ p: 3 }}>
      {/* Sección de Propiedades */}
      <Box sx={{ 
        mb: 3,
        p: 1.5,
        bgcolor: 'background.paper',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'divider',
        '& > .MuiTypography-h6': {
          position: 'relative',
          fontFamily: "'Roboto Condensed', sans-serif",
          letterSpacing: '0.5px',
          textTransform: 'capitalize',
          fontSize: '0.875rem',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: '40px',
            height: '2px',
            bgcolor: 'primary.main',
            opacity: 0.7
=======
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <EntityToolbar
        showAddButton={false}
        showBackButton={false}
        showDivider={false}
        navigationItems={[
          {
            icon: <WalletIcon sx={{ fontSize: 21.6 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <BuildingIcon sx={{ fontSize: 21.6 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 21.6 }} />,
            label: 'Inventario',
            to: '/inventario'
>>>>>>> develop
          }
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 0 }}>
            Propiedades
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              component={Link} 
              to="/propiedades"
              size="small"
              sx={{ p: 0.5 }}
            >
              <HomeWork sx={{ fontSize: '1.1rem' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setIsPropiedadFormOpen(true)}
              sx={{ p: 0.5 }}
            >
              <AddIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Box>
        </Box>
        <PropertiesSection 
          propiedades={propiedades}
          stats={stats}
          onEdit={handleEditPropiedad}
          onDelete={handleDeletePropiedad}
        />
      </Box>

      {/* PropiedadForm Dialog */}
      <PropiedadForm
        open={isPropiedadFormOpen}
        onClose={() => setIsPropiedadFormOpen(false)}
        onSubmit={async (data) => {
          try {
            await clienteAxios.post('/api/propiedades', data);
            enqueueSnackbar('Propiedad creada exitosamente', { variant: 'success' });
            fetchStats();
            setIsPropiedadFormOpen(false);
          } catch (error) {
            console.error('Error al crear propiedad:', error);
            enqueueSnackbar('Error al crear la propiedad', { variant: 'error' });
          }
        }}
      />

      {/* Sección de Finanzas */}
            <Box sx={{ 
        mb: 3,
        p: 1.5,
        bgcolor: 'background.paper',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'divider',
        '& > .MuiTypography-h6': {
          position: 'relative',
          fontFamily: "'Roboto Condensed', sans-serif",
          letterSpacing: '0.5px',
          textTransform: 'capitalize',
          fontSize: '0.875rem',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: '40px',
            height: '2px',
            bgcolor: 'primary.main',
            opacity: 0.7
          }
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 0 }}>
            Finanzas
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              component={Link} 
              to="/transacciones"
              size="small"
              sx={{ p: 0.5 }}
            >
              <WalletIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setIsTransaccionFormOpen(true)}
              sx={{ p: 0.5 }}
            >
              <AddIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Box>
        </Box>
        <FinanceSection 
          stats={stats}
          isFinanceOpen={isFinanceOpen}
          handleFinanceToggle={handleFinanceToggle}
        />
            </Box>
<<<<<<< HEAD

      {/* TransaccionForm Dialog */}
      <TransaccionForm
        open={isTransaccionFormOpen}
        onClose={() => setIsTransaccionFormOpen(false)}
        onSubmit={async (data) => {
          try {
            await clienteAxios.post('/api/transacciones', data);
            enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
            fetchStats();
            fetchAccounts();
            setIsTransaccionFormOpen(false);
          } catch (error) {
            console.error('Error al crear transacción:', error);
            enqueueSnackbar('Error al crear la transacción', { variant: 'error' });
          }
        }}
      />
    </Box>
=======
          </Paper>
        </Grid>
      </Grid>
    </Container>
>>>>>>> develop
  );
}

export default Dashboard;
