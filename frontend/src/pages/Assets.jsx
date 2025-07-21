import React, { useEffect, useState, useCallback } from 'react';
import { Grid, Box, Typography, Skeleton, Paper, IconButton, Menu, MenuItem, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';

import PropiedadCard from '../components/propiedades/PropiedadCard';
import clienteAxios from '../config/axios';
import {
  HomeWork,
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

} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
// Importaciones modulares de propiedades
import { 
  StatusChip, 
  StyledDialog,
  StyledTextField,
  CategoryChip,
  StyledSectionTitle,
  PropiedadDetail
} from '../components/propiedades';
import { getEstadoColor, getEstadoText, getStatusIconComponent } from '../components/common/StatusSystem';
import { calcularEstadisticasPropiedad } from '../components/propiedades/propiedadUtils';



import { EntityToolbar } from '../components/EntityViews';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';

export function Assets() {


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
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);
  const [propiedadDetailOpen, setPropiedadDetailOpen] = useState(false);
  const [expandedPropiedades, setExpandedPropiedades] = useState(new Set());


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

      
      // Obtener propiedades y calcular estadísticas
      const propiedadesRes = await clienteAxios.get('/api/propiedades?withRelated=true');
      const propiedades = propiedadesRes.data.docs || [];
      setPropiedades(propiedades);
      
      // Usar la función centralizada para calcular estadísticas de propiedades
      const propiedadesStats = propiedades.reduce((stats, propiedad) => {
        const propiedadStats = calcularEstadisticasPropiedad(propiedad);
        
        stats.total += propiedadStats.total;
        stats.ocupadas += propiedadStats.ocupadas;
        stats.disponibles += propiedadStats.disponibles;
        stats.mantenimiento += propiedadStats.mantenimiento;
        stats.reservadas += propiedadStats.reservadas;
        
        return stats;
      }, {
        total: 0,
        ocupadas: 0,
        disponibles: 0,
        mantenimiento: 0,
        reservadas: 0
      });

      // Calcular porcentaje de ocupación usando la lógica centralizada
      const porcentajeOcupacion = propiedadesStats.total > 0 
        ? Math.round((propiedadesStats.ocupadas / (propiedadesStats.total - propiedadesStats.mantenimiento)) * 100)
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
        const transaccionesStats = await clienteAxios.get('/api/transacciones/stats');

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
          // Si hay error obteniendo las transacciones, devolver la cuenta sin modificar
          console.error(`Error al obtener transacciones para cuenta ${cuenta.nombre}:`, err);
          return cuenta;
        }
      }));
      
      setAccounts(cuentasConBalance);
    } catch (error) {
      // Ignorar errores por cancelación, son parte del control de flujo
      if (error.cancelado) {

        return;
      }
      
      console.error('Error al cargar cuentas:', error);
      console.error('Detalles del error:', error.response?.data);
      toast.error('Error al cargar cuentas');
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
      // Ignorar errores por cancelación, son parte del control de flujo
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
          toast.error('Error al cargar datos de assets');
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

  const handlePropiedadToggleExpand = (propiedadId) => {
    setExpandedPropiedades(prev => {
      const newSet = new Set();
      if (!prev.has(propiedadId)) {
        newSet.add(propiedadId);
      }
      return newSet;
    });
  };

  const handlePropiedadClick = (propiedad) => {
    setSelectedPropiedad(propiedad);
    setPropiedadDetailOpen(true);
  };

  const handlePropiedadDetailClose = () => {
    setPropiedadDetailOpen(false);
    setSelectedPropiedad(null);
  };

  const handlePropiedadEdit = () => {
    // Redirigir a la página de edición de propiedades
    window.location.href = `/propiedades/${selectedPropiedad._id}/edit`;
  };

  const handlePropiedadDelete = async () => {
    if (!selectedPropiedad) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      try {
        await clienteAxios.delete(`/api/propiedades/${selectedPropiedad._id}`);
        toast.success('Propiedad eliminada correctamente');
        handlePropiedadDetailClose();
        fetchStats(); // Recargar datos
      } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        toast.error('Error al eliminar la propiedad');
      }
    }
  };

  const FinanceSection = () => (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between'
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
          justifyContent: 'space-between'
        }}>
          {/* Métricas de propiedades */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Icono genérico para el resumen de propiedades */}
            <HomeWork sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              {pluralize(stats.propiedades.total, 'Propiedad', 'Propiedades')}
            </Typography>
          </Box>

          {/* Controles y ocupación */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              px: 0.75,
              py: 0.25,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <PercentIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.7rem' }}>
                {`${stats.propiedades.porcentajeOcupacion}%`}
              </Typography>
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
        </Box>

        {/* Sección colapsable */}
        <Collapse in={isPropertiesDetailOpen}>
          <Box sx={{ 
            pt: 0.25, 
            mt: 0.25, 
            pb: 0, 
            borderTop: 1, 
            borderColor: 'divider'
          }}>
            {/* Listado de propiedades detallado */}
            {propiedades.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                No hay propiedades registradas.
              </Typography>
            )}
            {propiedades.map((prop, index) => (
              <Box key={prop._id} sx={{ 
                mb: index === propiedades.length - 1 ? 0 : 0.75
              }}>
                <PropiedadCard
                  propiedad={prop}
                  onEdit={handlePropiedadEdit}
                  onDelete={handlePropiedadDelete}
                  isAssets={true}
                  isExpanded={expandedPropiedades.has(prop._id)}
                  onToggleExpand={() => handlePropiedadToggleExpand(prop._id)}
                  onOpenDetail={handlePropiedadClick}
                  viewMode="grid"
                  setViewMode={() => {}}
                />
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const StatBox = ({ title, value, loading }) => (
    <Box sx={{ 
      p: 2, 
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
    <Box sx={{ width: '100%' }}>
      <EntityToolbar />
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
              p: 1.5, 
              height: '100%',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              backgroundColor: '#181818 !important',
              '&.MuiPaper-root': {
                backgroundColor: '#181818 !important'
              }
            }}>
              <PropertiesSection />
            </Paper>
          </Grid>

          {/* Sección de Cuentas */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              backgroundColor: '#181818 !important',
              '&.MuiPaper-root': {
                backgroundColor: '#181818 !important'
              }
            }}>
              <FinanceSection />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Modal de detalle de propiedad */}
      {selectedPropiedad && (
        <PropiedadDetail
          propiedad={selectedPropiedad}
          open={propiedadDetailOpen}
          onClose={handlePropiedadDetailClose}
          onEdit={handlePropiedadEdit}
          onDelete={handlePropiedadDelete}
        />
      )}

    </Box>
  );
}

export default Assets;
