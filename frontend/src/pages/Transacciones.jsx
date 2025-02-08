import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  AccountBalanceOutlined as BankIcon,
  CurrencyExchangeOutlined as MoneyIcon
} from '@mui/icons-material';
import { 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';

export function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { enqueueSnackbar } = useSnackbar();

  const fetchTransacciones = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/transacciones');
      setTransacciones(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar transacciones', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchMonedas = useCallback(async () => {
    try {
      console.log('Cargando monedas...');
      const response = await clienteAxios.get('/monedas');
      console.log('Monedas recibidas:', response.data);
      const monedasData = response.data.docs || [];
      setMonedas(monedasData);
      return monedasData;
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
      return [];
    }
  }, [enqueueSnackbar]);

  const fetchCuentas = useCallback(async () => {
    try {
      console.log('Cargando cuentas...');
      const response = await clienteAxios.get('/cuentas');
      console.log('Cuentas recibidas:', response.data);
      const cuentasData = response.data.docs || [];
      setCuentas(cuentasData);
      return cuentasData;
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      enqueueSnackbar('Error al cargar cuentas', { variant: 'error' });
      return [];
    }
  }, [enqueueSnackbar]);

  const fetchInitialData = useCallback(async () => {
    try {
      console.log('Iniciando carga de datos...');
      const [monedasData, cuentasData] = await Promise.all([
        fetchMonedas(),
        fetchCuentas()
      ]);
      console.log('Datos cargados:', { monedas: monedasData, cuentas: cuentasData });
      await fetchTransacciones();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  }, [fetchTransacciones, fetchMonedas, fetchCuentas]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCreateMoneda = useCallback(async (data) => {
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
  }, [enqueueSnackbar]);

  const handleCreateCuenta = useCallback(async (data) => {
    try {
      console.log('Creando cuenta con datos:', data);
      const response = await clienteAxios.post('/cuentas', { 
        nombre: data.nombre,
        moneda: data.monedaId,
        tipo: data.tipo
      });
      
      const newCuenta = response.data;
      console.log('Cuenta creada:', newCuenta);
      
      await setCuentas(prev => {
        const updated = [...prev, newCuenta];
        console.log('Estado de cuentas actualizado:', updated);
        return updated;
      });

      await fetchCuentas();
      
      enqueueSnackbar('Cuenta creada exitosamente', { variant: 'success' });
      return newCuenta;
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar(
        'Error al crear la cuenta: ' + 
        (error.response?.data?.error || error.message), 
        { variant: 'error' }
      );
      throw error;
    }
  }, [enqueueSnackbar, fetchCuentas]);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      const datosAEnviar = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        categoria: formData.categoria,
        estado: formData.estado,
        monedaId: formData.monedaId,
        cuentaId: formData.cuentaId,
        tipo: 'INGRESO' // Por defecto, podríamos hacer esto configurable
      };

      const response = await clienteAxios.post('/transacciones', datosAEnviar);
      
      if (response.status === 201) {
        enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
        setIsFormOpen(false);
        setFormKey(prev => prev + 1);
        await fetchTransacciones();
      }
    } catch (error) {
      console.error('Error completo:', error.response?.data || error);
      const mensajeError = error.response?.data?.error || 'Error al crear la transacción';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTransacciones]);

  const handleOpenForm = useCallback(async () => {
    try {
      console.log('Abriendo formulario...');
      await Promise.all([fetchMonedas(), fetchCuentas()]);
      setFormKey(prev => prev + 1);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error al abrir formulario:', error);
      enqueueSnackbar('Error al cargar datos del formulario', { variant: 'error' });
    }
  }, [fetchMonedas, fetchCuentas, enqueueSnackbar]);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setFormKey(prev => prev + 1);
  }, []);

  // Campos del formulario
  const formFields = [
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'INGRESO', label: 'Ingreso' },
        { value: 'EGRESO', label: 'Egreso' }
      ]
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'text',
      required: true
    },
    {
      name: 'monto',
      label: 'Monto',
      type: 'number',
      required: true
    },
    {
      name: 'fecha',
      label: 'Fecha',
      type: 'date',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0]
    },
    {
      name: 'categoria',
      label: 'Categoría',
      type: 'select',
      required: true,
      options: [
        { value: 'ALQUILER', label: 'Alquiler' },
        { value: 'SERVICIOS', label: 'Servicios' },
        { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
        { value: 'IMPUESTOS', label: 'Impuestos' },
        { value: 'OTROS', label: 'Otros' }
      ]
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'PENDIENTE', label: 'Pendiente' },
        { value: 'PAGADO', label: 'Pagado' },
        { value: 'CANCELADO', label: 'Cancelado' }
      ]
    },
    {
      name: 'monedaId',
      label: 'Moneda',
      type: 'relational',
      required: true,
      options: monedas.map(m => ({
        value: m.id || m._id,
        label: `${m.nombre} (${m.simbolo})`
      })),
      onCreateNew: handleCreateMoneda,
      createFields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'simbolo', label: 'Símbolo', required: true }
      ],
      createTitle: 'Nueva Moneda'
    },
    {
      name: 'cuentaId',
      label: 'Cuenta',
      type: 'relational',
      required: true,
      options: cuentas.map(c => ({
        value: c.id || c._id,
        label: c.nombre
      })),
      onCreateNew: handleCreateCuenta,
      createFields: [
        { name: 'nombre', label: 'Nombre', required: true },
        { 
          name: 'monedaId',
          label: 'Moneda', 
          type: 'relational',
          required: true,
          options: monedas.map(m => ({
            value: m.id || m._id,
            label: `${m.nombre} (${m.simbolo})`
          })),
          onCreateNew: handleCreateMoneda,
          createFields: [
            { name: 'codigo', label: 'Código', required: true },
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'simbolo', label: 'Símbolo', required: true }
          ],
          createTitle: 'Nueva Moneda'
        },
        { 
          name: 'tipo', 
          label: 'Tipo', 
          type: 'select',
          required: true,
          options: [
            { value: 'EFECTIVO', label: 'Efectivo' },
            { value: 'BANCO', label: 'Banco' },
            { value: 'CASA', label: 'Casa' }
          ]
        }
      ],
      createTitle: 'Nueva Cuenta'
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={handleOpenForm}
        navigationItems={[
          {
            icon: <BankIcon sx={{ fontSize: 18 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <MoneyIcon sx={{ fontSize: 18 }} />,
            label: 'Monedas',
            to: '/monedas'
          }
        ]}
      />
      <EntityDetails 
        title="Transacciones"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={handleOpenForm}
          >
            Nueva Transacción
          </Button>
        }
      >
        {transacciones.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState onAdd={handleOpenForm} />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>{new Date(transaccion.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{transaccion.descripcion}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaccion.tipo} 
                        color={transaccion.tipo === 'INGRESO' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {transaccion.monto} {monedas.find(m => m.id === transaccion.monedaId)?.simbolo}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaccion.estado}
                        color={
                          transaccion.estado === 'PAGADO' ? 'success' :
                          transaccion.estado === 'PENDIENTE' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </EntityDetails>

      {isFormOpen && (
        <EntityForm
          key={formKey}
          open={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          title="Nueva Transacción"
          fields={formFields}
        />
      )}
    </Container>
  );
}

export default Transacciones;
