import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  AccountBalanceOutlined as BankIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  TrendingUpOutlined as TrendingIcon,
  PersonSearchOutlined as PersonIcon,
  RepeatOutlined as RepeatIcon,
  AttachMoneyOutlined as MoneyIcon,
  ConstructionOutlined as ConstructionIcon
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { CommonForm, CommonGrid } from '../components/common';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useAPI } from '../hooks/useAPI';
import { Toolbar } from '../navigation';

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
      id: 'transacciones',
      title: 'Transacciones',
      icon: MoneyIcon,
      path: '/assets/finanzas/transacciones',
      color: '#4CAF50',
      description: 'Gestiona tus ingresos y gastos diarios'
    },
    {
      id: 'cuentas',
      title: 'Cuentas',
      icon: BankIcon,
      path: '/assets/finanzas/cuentas',
      color: '#2196F3',
      description: 'Administra tus cuentas bancarias y efectivo'
    },
    {
      id: 'monedas',
      title: 'Monedas',
      icon: CurrencyIcon,
      path: '/assets/finanzas/monedas',
      color: '#FF9800',
      description: 'Configura y gestiona las diferentes monedas'
    },
    {
      id: 'inversiones',
      title: 'Inversiones',
      icon: TrendingIcon,
      path: '/assets/finanzas/inversiones',
      color: '#9C27B0',
      description: 'Seguimiento de inversiones y portafolios',
      isUnderConstruction: true
    },
    {
      id: 'deudores',
      title: 'Deudores',
      icon: PersonIcon,
      path: '/assets/finanzas/deudores',
      color: '#F44336',
      description: 'Controla préstamos y deudas pendientes',
      isUnderConstruction: true
    },
    {
      id: 'recurrente',
      title: 'Recurrente',
      icon: RepeatIcon,
      path: '/assets/finanzas/recurrente',
      color: '#607D8B',
      description: 'Transacciones automáticas y suscripciones',
      isUnderConstruction: true
    }
  ];

  // Configuración para CommonGrid
  const gridConfig = {
    groupBy: (item) => ({
      key: 'finanzas',
      title: 'Secciones de Finanzas',
      icon: <MoneyIcon />
    }),
    getTitle: (item) => item.title,
    getSubtitle: (item) => item.description,
    getIcon: (item) => item.icon,
    getColor: (item) => item.color,
    onItemClick: (item) => navigate(item.path),
    getDetails: (item) => {
      // Si el item está en construcción, mostrar un detalle
      if (item.isUnderConstruction) {
        return [
          {
            icon: <ConstructionIcon sx={{ fontSize: 14 }} />,
            text: 'En construcción'
          }
        ];
      }
      return []; // Array vacío para items normales
    },
    getActions: (item) => ({
      actions: item.isUnderConstruction ? [
        {
          icon: 'construction',
          tooltip: 'En construcción',
          onClick: () => {},
          disabled: true
        }
      ] : []
    })
  };

  return (
    <Box component="main" className="page-main-content" sx={{ width: '100%', flex: 1, px: { xs: 1, sm: 2, md: 3 }, py: 2, pb: { xs: 10, sm: 4 }, display: 'flex', flexDirection: 'column' }}>
      {/* Formularios modales para crear submodelos */}
      <CommonForm open={openCuenta} onClose={() => setOpenCuenta(false)} onSubmit={handleSubmitCuenta} title="Nueva Cuenta" fields={formFieldsCuenta} initialData={{}} isEditing={false} />
      <CommonForm open={openMoneda} onClose={() => setOpenMoneda(false)} onSubmit={handleSubmitMoneda} title="Nueva Moneda" fields={formFieldsMoneda} initialData={{}} isEditing={false} />
      <CommonForm open={openTransaccion} onClose={() => setOpenTransaccion(false)} onSubmit={handleSubmitTransaccion} title="Nueva Transacción" fields={formFieldsTransaccion} initialData={{}} isEditing={false} />
      
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CommonGrid 
          data={finanzasSections}
          config={gridConfig}
          gridProps={{ xs: 6, sm: 4, md: 3 }}
        />
      </Box>
    </Box>
  );
} 