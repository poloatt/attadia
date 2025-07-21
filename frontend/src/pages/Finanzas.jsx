import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EntityToolbar } from '../components/EntityViews';
import { 
  AccountBalanceOutlined as BankIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  TrendingUpOutlined as TrendingIcon,
  PersonSearchOutlined as PersonIcon,
  RepeatOutlined as RepeatIcon,
  AttachMoneyOutlined as MoneyIcon
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import EntityForm from '../components/EntityViews/EntityForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useAPI } from '../hooks/useAPI';

const FinanzasCard = ({ title, description, icon: Icon, path, color = 'primary.main' }) => {
  const navigate = useNavigate();

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: 1
        }
      }}
    >
      <CardActionArea onClick={() => navigate(path)}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Icon sx={{ fontSize: 32, color, mr: 2 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default function Finanzas() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  // Estados para los formularios modales
  const [openCuenta, setOpenCuenta] = useState(false);
  const [openMoneda, setOpenMoneda] = useState(false);
  const [openTransaccion, setOpenTransaccion] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [editingMoneda, setEditingMoneda] = useState(null);
  const [editingTransaccion, setEditingTransaccion] = useState(null);

  // Cargar datos necesarios para los formularios
  const { data: monedasData } = useAPI('/api/monedas');
  const monedas = monedasData?.docs || [];

  // Campos para el formulario de cuentas
  const formFieldsCuenta = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'numero', label: 'Número', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
      { value: 'EFECTIVO', label: 'Efectivo' },
      { value: 'BANCO', label: 'Banco' },
      { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
      { value: 'CRIPTO', label: 'Cripto' },
      { value: 'OTRO', label: 'Otro' }
    ] },
    { name: 'monedaId', label: 'Moneda', type: 'select', required: true, options: monedas.map(m => ({ value: m._id || m.id, label: `${m.nombre} (${m.simbolo})` })) }
  ];
  // Campos para el formulario de monedas
  const formFieldsMoneda = [
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'simbolo', label: 'Símbolo', type: 'text', required: true }
  ];
  // Campos para el formulario de transacciones (simplificado)
  const formFieldsTransaccion = [
    { name: 'descripcion', label: 'Descripción', type: 'text', required: true },
    { name: 'monto', label: 'Monto', type: 'number', required: true },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'cuenta', label: 'Cuenta', type: 'select', required: true, options: [] }, // Opciones a cargar si se desea
    { name: 'moneda', label: 'Moneda', type: 'select', required: true, options: monedas.map(m => ({ value: m._id || m.id, label: `${m.nombre} (${m.simbolo})` })) }
  ];

  // Handlers de submit (puedes mejorarlos según tu lógica de backend)
  const handleSubmitCuenta = useCallback(async (data) => {
    await clienteAxios.post('/api/cuentas', data);
    enqueueSnackbar('Cuenta creada exitosamente', { variant: 'success' });
    setOpenCuenta(false);
  }, [enqueueSnackbar]);
  const handleSubmitMoneda = useCallback(async (data) => {
    await clienteAxios.post('/api/monedas', data);
    enqueueSnackbar('Moneda creada exitosamente', { variant: 'success' });
    setOpenMoneda(false);
  }, [enqueueSnackbar]);
  const handleSubmitTransaccion = useCallback(async (data) => {
    await clienteAxios.post('/api/transacciones', data);
    enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
    setOpenTransaccion(false);
  }, [enqueueSnackbar]);

  // Listener para el AddButton multinivel
  useEffect(() => {
    const handleHeaderAdd = (e) => {
      if (e.detail?.type === 'transacciones') setOpenTransaccion(true);
      if (e.detail?.type === 'cuentas') setOpenCuenta(true);
      if (e.detail?.type === 'monedas') setOpenMoneda(true);
      if (e.detail?.type === 'recurrente') navigate('/assets/finanzas/recurrente', { state: { openAdd: true } });
    };
    window.addEventListener('headerAddButtonClicked', handleHeaderAdd);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAdd);
  }, [navigate]);

  const finanzasSections = [
    {
      title: 'Transacciones',
      // description: 'Gestiona tus ingresos y gastos diarios, categoriza transacciones y mantén un control detallado de tu flujo de dinero.',
      icon: MoneyIcon,
      path: '/assets/finanzas/transacciones',
      color: '#4CAF50'
    },
    {
      title: 'Cuentas',
      // description: 'Administra tus cuentas bancarias, efectivo, billeteras digitales y otros instrumentos financieros.',
      icon: BankIcon,
      path: '/assets/finanzas/cuentas',
      color: '#2196F3'
    },
    {
      title: 'Monedas',
      // description: 'Configura y gestiona las diferentes monedas que utilizas en tus transacciones y cuentas.',
      icon: CurrencyIcon,
      path: '/assets/finanzas/monedas',
      color: '#FF9800'
    },
    {
      title: 'Inversiones',
      // description: 'Realiza seguimiento de tus inversiones, portafolios y rendimientos financieros.',
      icon: TrendingIcon,
      path: '/assets/finanzas/inversiones',
      color: '#9C27B0'
    },
    {
      title: 'Deudores',
      // description: 'Controla préstamos, deudas pendientes y gestiona cobros de manera eficiente.',
      icon: PersonIcon,
      path: '/assets/finanzas/deudores',
      color: '#F44336'
    },
    {
      title: 'Recurrente',
      // description: 'Configura transacciones automáticas, suscripciones y pagos periódicos.',
      icon: RepeatIcon,
      path: '/assets/finanzas/recurrente',
      color: '#607D8B'
    }
  ];

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar />
      {/* Formularios modales para crear submodelos */}
      <EntityForm open={openCuenta} onClose={() => setOpenCuenta(false)} onSubmit={handleSubmitCuenta} title="Nueva Cuenta" fields={formFieldsCuenta} initialData={{}} isEditing={false} />
      <EntityForm open={openMoneda} onClose={() => setOpenMoneda(false)} onSubmit={handleSubmitMoneda} title="Nueva Moneda" fields={formFieldsMoneda} initialData={{}} isEditing={false} />
      <EntityForm open={openTransaccion} onClose={() => setOpenTransaccion(false)} onSubmit={handleSubmitTransaccion} title="Nueva Transacción" fields={formFieldsTransaccion} initialData={{}} isEditing={false} />
      <Box sx={{ 
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        pb: { xs: 10, sm: 4 },
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ width: '100%', maxWidth: 700 }}>
          {finanzasSections.map((section, idx) => (
            <Grid item xs={6} sm={4} md={3} key={section.path} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: section.color,
                    transform: 'translateY(-2px)',
                    boxShadow: 1
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 90,
                  maxWidth: 160,
                  width: '100%',
                  cursor: 'pointer',
                  borderRadius: 2,
                  px: 0.5,
                  py: 1.2,
                  bgcolor: '#181818'
                }}
                onClick={() => navigate(section.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <section.icon sx={{ fontSize: 32, color: idx % 2 === 0 ? '#fff' : '#bdbdbd' }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, textAlign: 'center', color: '#fff', fontSize: '1rem' }}>
                  {section.title}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
} 