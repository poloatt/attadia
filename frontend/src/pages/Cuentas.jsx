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
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';

export function Cuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedMonedas, setExpandedMonedas] = useState([]);
  const [showValues, setShowValues] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const [editingCuenta, setEditingCuenta] = useState(null);

  const fetchCuentas = useCallback(async () => {
    try {
      console.log('Solicitando cuentas...');
      const response = await clienteAxios.get('/cuentas');
      console.log('Respuesta completa de cuentas:', response);

      // Asegurarnos de que tenemos datos válidos
      const cuentasData = response.data?.docs || response.data || [];
      const cuentasProcesadas = Array.isArray(cuentasData) ? cuentasData : [];

      console.log('Cuentas procesadas:', cuentasProcesadas);
      setCuentas(cuentasProcesadas);
      return cuentasProcesadas;
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar cuentas', { variant: 'error' });
      return [];
    }
  }, [enqueueSnackbar]);

  const fetchMonedas = useCallback(async () => {
    try {
      console.log('Solicitando monedas...');
      const response = await clienteAxios.get('/monedas');
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
        simbolo: moneda.simbolo || '$'
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

  const handleEdit = useCallback((cuenta) => {
    setEditingCuenta(cuenta);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (cuentaId) => {
    try {
      await clienteAxios.delete(`/cuentas/${cuentaId}`);
      setCuentas(prev => prev.filter(c => c.id !== cuentaId));
      enqueueSnackbar('Cuenta eliminada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      enqueueSnackbar('Error al eliminar la cuenta', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleFormSubmit = async (formData) => {
    try {
      console.log('Datos del formulario recibidos:', formData);
      
      const datosAEnviar = {
        nombre: formData.nombre,
        numero: formData.numero,
        tipo: formData.tipo,
        moneda: formData.monedaId
      };

      console.log('Datos a enviar al servidor:', datosAEnviar);
      
      let response;
      if (editingCuenta) {
        response = await clienteAxios.put(`/cuentas/${editingCuenta.id}`, datosAEnviar);
        setCuentas(prev => prev.map(c => 
          c.id === editingCuenta.id ? response.data : c
        ));
      } else {
        response = await clienteAxios.post('/cuentas', datosAEnviar);
        setCuentas(prev => [...prev, response.data]);
      }

      console.log('Respuesta del servidor:', response.data);
      
      setExpandedMonedas(prev => [...new Set([...prev, response.data.moneda])]);
      setIsFormOpen(false);
      setEditingCuenta(null);
      enqueueSnackbar(
        editingCuenta ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente', 
        { variant: 'success' }
      );
      
      await fetchCuentas();
    } catch (error) {
      console.error('Error completo:', error.response?.data || error);
      const mensajeError = error.response?.data?.error || 
        (editingCuenta ? 'Error al actualizar la cuenta' : 'Error al crear la cuenta');
      enqueueSnackbar(mensajeError, { variant: 'error' });
    }
  };

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
    console.log('Cuentas actuales:', cuentas);
    console.log('Monedas actuales:', monedas);

    // Si no hay monedas cargadas, crear un grupo "Sin moneda"
    if (monedas.length === 0) {
      return {
        'sin-moneda': {
          moneda: {
            nombre: 'Sin moneda asignada',
            simbolo: '$',
            _id: 'sin-moneda'
          },
          cuentas: cuentas.map(cuenta => ({
            ...cuenta,
            id: cuenta._id || cuenta.id,
            saldo: cuenta.saldo || 0,
            tipo: cuenta.tipo || 'OTRO',
            nombre: cuenta.nombre || 'Sin nombre'
          }))
        }
      };
    }

    const grupos = cuentas.reduce((grupos, cuenta) => {
      // Usar let en lugar de const para poder reasignar
      let grupoId = cuenta.moneda;
      let moneda = monedas.find(m => m._id === cuenta.moneda || m.id === cuenta.moneda);
      
      // Si no se encuentra la moneda, asignar a grupo "sin moneda"
      if (!moneda) {
        console.log('Moneda no encontrada para cuenta:', cuenta);
        grupoId = 'sin-moneda';
        moneda = {
          nombre: 'Sin moneda asignada',
          simbolo: '$',
          _id: 'sin-moneda'
        };
      }

      if (!grupos[grupoId]) {
        grupos[grupoId] = {
          moneda: moneda,
          cuentas: []
        };
      }

      const cuentaProcesada = {
        ...cuenta,
        id: cuenta._id || cuenta.id,
        saldo: cuenta.saldo || 0,
        tipo: cuenta.tipo || 'OTRO',
        nombre: cuenta.nombre || 'Sin nombre'
      };

      console.log('Cuenta procesada:', cuentaProcesada);
      grupos[grupoId].cuentas.push(cuentaProcesada);
      return grupos;
    }, {});

    console.log('Grupos procesados:', grupos);
    return grupos;
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
      
      {isFormOpen && (
        <EntityForm
          open={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          fields={formFields}
          title="Cuenta"
          initialData={editingCuenta || {}}
          isEditing={!!editingCuenta}
        />
      )}
      
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
                    <Typography variant="subtitle2" color="text.secondary">
                      {grupo.moneda.nombre} ({grupo.moneda.simbolo})
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleMonedaToggle(monedaId)}
                      sx={{
                        transform: expandedMonedas.includes(monedaId) ? 
                          'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        p: 0.5
                      }}
                    >
                      <ExpandMoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  {expandedMonedas.includes(monedaId) && (
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
                                  color: (cuenta.saldo || 0) >= 0 ? 'success.main' : 'error.main'
                                }}
                              >
                                {showValues 
                                  ? `${grupo.moneda.simbolo} ${(cuenta.saldo || 0).toFixed(2)}`
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
                  )}
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