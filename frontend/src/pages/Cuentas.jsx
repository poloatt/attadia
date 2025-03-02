import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityForm from '../components/EntityViews/EntityForm';
import { 
  CurrencyExchangeOutlined as CurrencyIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  AccountBalanceOutlined as BankIcon,
  CreditCardOutlined as CardIcon,
  AttachMoneyOutlined as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  AutorenewOutlined as RecurrentIcon,
  PersonOutlineOutlined as DeudoresIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Cuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedMonedas, setExpandedMonedas] = useState([]);
  const { showValues } = useValuesVisibility();
  const { enqueueSnackbar } = useSnackbar();
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [balances, setBalances] = useState({});
  const [balancesPorMoneda, setBalancesPorMoneda] = useState({});

  const fetchBalanceCuenta = useCallback(async (cuentaId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await clienteAxios.get(`/transacciones/by-cuenta/${cuentaId}`, {
        params: {
          fechaFin: today,
          estado: 'PAGADO'
        }
      });
      
      const transacciones = response.data.docs || [];
      const balance = transacciones.reduce((acc, trans) => {
        if (trans.tipo === 'INGRESO') {
          return acc + trans.monto;
        } else {
          return acc - trans.monto;
        }
      }, 0);
      
      return balance;
    } catch (error) {
      console.error('Error al obtener balance de cuenta:', error);
      return 0;
    }
  }, []);

  const fetchCuentas = useCallback(async () => {
    try {
      console.log('Solicitando cuentas...');
      const response = await clienteAxios.get('/api/cuentas');
      console.log('Respuesta de cuentas:', response.data);

      let cuentasData = response.data?.docs || response.data || [];
      
      if (!Array.isArray(cuentasData)) {
        console.log('Datos de cuentas no es un array, intentando extraer de:', cuentasData);
        cuentasData = cuentasData.data || cuentasData.items || [];
      }

      const cuentasProcesadas = cuentasData.map(cuenta => ({
        ...cuenta,
        id: cuenta._id || cuenta.id,
        nombre: cuenta.nombre || 'Sin nombre',
        numero: cuenta.numero || '',
        tipo: cuenta.tipo || 'OTRO',
        moneda: cuenta.moneda?._id || cuenta.moneda?.id || cuenta.moneda
      }));

      console.log('Cuentas procesadas:', cuentasProcesadas);
      setCuentas(cuentasProcesadas);

      // Obtener balances para cada cuenta
      const balancesTemp = {};
      for (const cuenta of cuentasProcesadas) {
        balancesTemp[cuenta.id] = await fetchBalanceCuenta(cuenta.id);
      }
      setBalances(balancesTemp);

      // Calcular balances por moneda
      const balancesPorMonedaTemp = {};
      cuentasProcesadas.forEach(cuenta => {
        const monedaId = cuenta.moneda?._id || cuenta.moneda?.id || cuenta.moneda;
        if (!balancesPorMonedaTemp[monedaId]) {
          balancesPorMonedaTemp[monedaId] = 0;
        }
        balancesPorMonedaTemp[monedaId] += balancesTemp[cuenta.id] || 0;
      });
      setBalancesPorMoneda(balancesPorMonedaTemp);

      return cuentasProcesadas;
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar cuentas', { variant: 'error' });
      return [];
    }
  }, [enqueueSnackbar, fetchBalanceCuenta]);

  const fetchMonedas = useCallback(async () => {
    try {
      console.log('Solicitando monedas...');
      const response = await clienteAxios.get('/api/monedas');
      console.log('Respuesta completa de monedas:', response);

      // Asegurarnos de que tenemos datos válidos
      let monedasData = response.data?.docs || response.data || [];
      
      // Si no es un array, intentar extraer los datos de otra propiedad
      if (!Array.isArray(monedasData)) {
        console.log('Datos de monedas no es un array, intentando extraer de:', monedasData);
        monedasData = monedasData.data || monedasData.items || [];
      }

      const monedasProcesadas = monedasData.map(moneda => ({
        ...moneda,
        id: moneda._id || moneda.id,
        nombre: moneda.nombre || 'Sin nombre',
        simbolo: moneda.simbolo || '$',
        color: moneda.color || '#75AADB' // Color por defecto
      }));

      console.log('Monedas procesadas:', monedasProcesadas);
      setMonedas(monedasProcesadas);
      return monedasProcesadas;
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
      return [];
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const initData = async () => {
      try {
        await fetchMonedas();
        const cuentasData = await fetchCuentas();
        
        // Establecer los IDs de las monedas como expandidos
        const monedasIds = [...new Set(cuentasData.map(cuenta => cuenta.moneda?.id))];
        console.log('Monedas expandidas:', monedasIds);
        setExpandedMonedas(monedasIds);
      } catch (error) {
        console.error('Error en la carga inicial:', error);
      }
    };

    initData();
  }, [fetchMonedas, fetchCuentas]);

  useEffect(() => {
    if (cuentas.length > 0) {
      const monedasIds = [...new Set(cuentas.map(cuenta => cuenta.moneda?.id))];
      setExpandedMonedas(prev => {
        const newIds = monedasIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [cuentas]);

  console.log(monedas);

  const handleCreateMoneda = async (data) => {
    try {
      const response = await clienteAxios.post('/api/monedas', data);
      const newMoneda = response.data;
      setMonedas(prev => [...prev, newMoneda]);
      enqueueSnackbar('Moneda creada exitosamente', { variant: 'success' });
      return newMoneda;
    } catch (error) {
      console.error('Error al crear moneda:', error);
      enqueueSnackbar('Error al crear moneda', { variant: 'error' });
      throw error;
    }
  };

  const handleEdit = useCallback((cuenta) => {
    const monedaId = cuenta.moneda?._id || cuenta.moneda?.id || cuenta.moneda;
    setEditingCuenta({
      ...cuenta,
      monedaId: monedaId
    });
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      console.log('Intentando eliminar cuenta con ID:', id);
      
      if (!id) {
        console.error('ID de cuenta no válido:', id);
        enqueueSnackbar('Error: ID de cuenta no válido', { variant: 'error' });
        return;
      }

      const response = await clienteAxios.delete(`/api/cuentas/${id}`);
      console.log('Respuesta de eliminación:', response);

      if (response.status === 200) {
        setCuentas(prev => prev.filter(c => (c._id !== id && c.id !== id)));
        enqueueSnackbar('Cuenta eliminada exitosamente', { variant: 'success' });
      } else {
        throw new Error('Error al eliminar la cuenta');
      }
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al eliminar la cuenta', 
        { variant: 'error' }
      );
    }
  }, [enqueueSnackbar]);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      console.log('Enviando datos del formulario:', formData);
      
      // Asegurarnos de que tenemos un ID de moneda válido
      const monedaId = formData.monedaId;
      if (!monedaId) {
        enqueueSnackbar('Error: Debe seleccionar una moneda', { variant: 'error' });
        return;
      }

      const datosAEnviar = {
        nombre: formData.nombre?.trim(),
        numero: formData.numero?.trim(),
        tipo: formData.tipo,
        moneda: monedaId, // Asegurarnos de enviar el ID de la moneda
        activo: true,
        ...(editingCuenta ? { _id: editingCuenta?._id || editingCuenta?.id } : {})
      };

      console.log('Datos procesados para enviar:', datosAEnviar);

      let response;
      if (editingCuenta) {
        response = await clienteAxios.put(`/api/cuentas/${editingCuenta._id || editingCuenta.id}`, datosAEnviar);
      } else {
        response = await clienteAxios.post('/api/cuentas', datosAEnviar);
      }

      console.log('Respuesta del servidor:', response.data);
      
      setIsFormOpen(false);
      setEditingCuenta(null);
      enqueueSnackbar(
        editingCuenta ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente',
        { variant: 'success' }
      );

      // Recargar datos
      await fetchCuentas();
      await fetchMonedas();
    } catch (error) {
      console.error('Error al guardar cuenta:', error);
      const errorMessage = error.response?.data?.error || 'Error al guardar la cuenta';
      console.error('Mensaje de error:', errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  }, [editingCuenta, enqueueSnackbar, fetchCuentas, fetchMonedas]);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingCuenta(null);
  }, []);

  const handleMonedaToggle = (monedaId) => {
    setExpandedMonedas(prev => {
      if (prev.includes(monedaId)) {
        return prev.filter(id => id !== monedaId);
      }
      return [...prev, monedaId];
    });
  };

  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true
    },
    {
      name: 'numero',
      label: 'Número',
      type: 'text',
      required: true
    },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'EFECTIVO', label: 'Efectivo' },
        { value: 'BANCO', label: 'Banco' },
        { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
        { value: 'CRIPTO', label: 'Cripto' },
        { value: 'OTRO', label: 'Otro' }
      ]
    },
    {
      name: 'monedaId',
      label: 'Moneda',
      type: 'select',
      required: true,
      options: monedas.map(m => ({
        value: m._id || m.id,
        label: `${m.nombre} (${m.simbolo})`
      })),
      onCreateNew: handleCreateMoneda,
      createButtonText: 'Crear Nueva Moneda',
      createTitle: 'Nueva Moneda',
      createFields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'simbolo', label: 'Símbolo', required: true }
      ]
    }
  ];

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

  const getCuentasAgrupadasPorMoneda = () => {
    console.log('Cuentas actuales:', cuentas);
    console.log('Monedas actuales:', monedas);

    return cuentas.reduce((grupos, cuenta) => {
      let monedaId = cuenta.moneda?._id || cuenta.moneda;
      let moneda = monedas.find(m => m._id === monedaId || m.id === monedaId);
      
      if (!moneda) {
        console.log('Moneda no encontrada para cuenta:', cuenta);
        monedaId = 'sin-moneda';
        moneda = {
          nombre: 'Sin moneda asignada',
          simbolo: '$',
          _id: 'sin-moneda'
        };
      }

      if (!grupos[monedaId]) {
        grupos[monedaId] = {
          moneda: moneda,
          cuentas: [],
          balance: balancesPorMoneda[monedaId] || 0
        };
      }

      const cuentaProcesada = {
        ...cuenta,
        id: cuenta._id || cuenta.id,
        saldo: balances[cuenta.id] || 0,
        tipo: cuenta.tipo || 'OTRO',
        nombre: cuenta.nombre || 'Sin nombre',
        moneda: monedaId
      };

      console.log('Cuenta procesada:', cuentaProcesada);
      grupos[monedaId].cuentas.push(cuentaProcesada);
      return grupos;
    }, {});
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <EntityToolbar
        onAdd={() => setIsFormOpen(true)}
        navigationItems={[
          {
            icon: <CurrencyIcon sx={{ fontSize: 21.6 }} />,
            label: 'Monedas',
            to: '/monedas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 21.6 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <RecurrentIcon sx={{ fontSize: 21.6 }} />,
            label: 'Recurrentes',
            to: '/recurrente'
          },
          {
            icon: <DeudoresIcon sx={{ fontSize: 21.6 }} />,
            label: 'Deudores',
            to: '/deudores'
          }
        ]}
      />
      
      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCuenta(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
        fields={formFields}
        initialData={editingCuenta || {}}
        isEditing={!!editingCuenta}
      />
      
      <Box sx={{ mt: 3 }}>
        {cuentas.length === 0 ? (
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
            <EmptyState onAdd={() => setIsFormOpen(true)} />
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            {Object.entries(getCuentasAgrupadasPorMoneda()).map(([monedaId, grupo]) => {
              console.log('Renderizando grupo:', { monedaId, grupo });
              if (!grupo.moneda) {
                console.log('Moneda no encontrada para grupo:', monedaId);
                return null;
              }
              
              return (
                <Paper 
                  key={monedaId}
                  sx={{ 
                    mb: 2, 
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    bgcolor: 'background.default',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {grupo.moneda.nombre} ({grupo.moneda.simbolo})
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: grupo.balance >= 0 ? grupo.moneda.color || '#75AADB' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {showValues ? `${grupo.moneda.simbolo} ${grupo.balance.toFixed(2)}` : '****'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    {grupo.cuentas.map((cuenta) => {
                      console.log('Renderizando cuenta:', cuenta);
                      return (
                        <Box
                          key={cuenta._id || cuenta.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            '&:last-child': {
                              borderBottom: 0
                            },
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            flex: 1
                          }}>
                            {getTipoIcon(cuenta.tipo)}
                            <Typography variant="body2">
                              {cuenta.nombre || 'Sin nombre'}
                            </Typography>
                            <Chip 
                              label={cuenta.tipo ? cuenta.tipo.replace('_', ' ') : 'OTRO'}
                              size="small"
                              variant="outlined"
                              color={cuenta.tipo ? 'default' : 'warning'}
                              sx={{ 
                                height: 20,
                                '& .MuiChip-label': {
                                  px: 1,
                                  fontSize: '0.75rem'
                                }
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: cuenta.saldo >= 0 ? grupo.moneda.color || '#75AADB' : 'error.main',
                                fontWeight: 500
                              }}
                            >
                              {showValues 
                                ? `${grupo.moneda.simbolo} ${cuenta.saldo.toFixed(2)}`
                                : '****'
                              }
                            </Typography>

                            <EntityActions
                              onEdit={() => handleEdit(cuenta)}
                              onDelete={() => handleDelete(cuenta._id || cuenta.id)}
                              itemName={`la cuenta ${cuenta.nombre}`}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default Cuentas; 