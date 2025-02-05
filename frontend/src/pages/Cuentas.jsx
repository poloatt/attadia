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
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';

export function Cuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedMonedas, setExpandedMonedas] = useState([]);
  const [showValues, setShowValues] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchCuentas = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/cuentas');
      setCuentas(response.data);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      enqueueSnackbar('Error al cargar cuentas', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchMonedas = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/monedas');
      setMonedas(response.data);
    } catch (error) {
      console.error('Error al cargar monedas:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchCuentas(),
        fetchMonedas()
      ]);
    };
    fetchData();
  }, [fetchCuentas, fetchMonedas]);

  useEffect(() => {
    if (cuentas.length > 0) {
      const monedasIds = [...new Set(cuentas.map(cuenta => cuenta.moneda?.id))];
      setExpandedMonedas(prev => {
        const newIds = monedasIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [cuentas]);

  useEffect(() => {
    fetchMonedas();
  }, [fetchMonedas]);

  console.log(monedas);

  const handleCreateMoneda = async (data) => {
    try {
      const response = await clienteAxios.post('/monedas', data);
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

  const handleFormSubmit = async (formData) => {
    try {
      const response = await clienteAxios.post('/cuentas', formData);
      setCuentas(prev => [...prev, response.data]);
      setExpandedMonedas(prev => [...new Set([...prev, response.data.moneda?.id])]);
      setIsFormOpen(false);
      enqueueSnackbar('Cuenta creada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      enqueueSnackbar('Error al crear la cuenta', { variant: 'error' });
    }
  };

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
        value: m.id,
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
    return cuentas.reduce((grupos, cuenta) => {
      const monedaId = cuenta.moneda?.id;
      if (!grupos[monedaId]) {
        grupos[monedaId] = {
          moneda: cuenta.moneda,
          cuentas: []
        };
      }
      grupos[monedaId].cuentas.push(cuenta);
      return grupos;
    }, {});
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <EntityToolbar
        onAdd={() => setIsFormOpen(true)}
        navigationItems={[
          {
            icon: <CurrencyIcon sx={{ fontSize: 20 }} />,
            label: 'Monedas',
            to: '/monedas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          }
        ]}
        showValues={showValues}
        onToggleValues={() => setShowValues(!showValues)}
      />
      
      <Box sx={{ mt: 3 }}>
        {Object.values(getCuentasAgrupadasPorMoneda()).map((grupo) => (
          <Paper 
            key={grupo.moneda?.id} 
            sx={{ mb: 2, overflow: 'hidden' }}
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
              <Typography variant="subtitle2" color="text.secondary">
                {grupo.moneda?.nombre} ({grupo.moneda?.simbolo})
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleMonedaToggle(grupo.moneda?.id)}
                sx={{
                  transform: expandedMonedas.includes(grupo.moneda?.id) ? 
                    'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  p: 0.5
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {expandedMonedas.includes(grupo.moneda?.id) && (
              <Box>
                {grupo.cuentas.map((cuenta) => (
                  <Box
                    key={cuenta.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 0
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTipoIcon(cuenta.tipo)}
                      <Typography variant="body2">
                        {cuenta.nombre}
                      </Typography>
                      <Chip 
                        label={cuenta.tipo.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 20,
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: cuenta.saldo >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {showValues 
                        ? `${cuenta.moneda?.simbolo} ${cuenta.saldo?.toFixed(2) || '0.00'}`
                        : '****'
                      }
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Box>

      <EntityForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title="Nueva Cuenta"
        fields={formFields}
        relatedFields={[
          { name: 'monedaId', endpoint: '/monedas' }
        ]}
        onFetchRelatedData={async () => {
          const monedasRes = await clienteAxios.get('/monedas');
          return {
            monedas: monedasRes.data
          };
        }}
      />
    </Container>
  );
}

export default Cuentas; 