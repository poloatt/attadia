import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
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
import axios from 'axios';
import { useSnackbar } from 'notistack';

export function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Cargar datos iniciales
  useEffect(() => {
    fetchTransacciones();
    fetchMonedas();
    fetchCuentas();
  }, []);

  // Obtener transacciones
  const fetchTransacciones = async () => {
    try {
      const response = await axios.get('/api/transacciones');
      setTransacciones(response.data);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar transacciones', { variant: 'error' });
    }
  };

  // Obtener monedas y cuentas para el formulario
  const fetchMonedas = async () => {
    try {
      const response = await axios.get('/api/monedas');
      setMonedas(response.data);
    } catch (error) {
      console.error('Error al cargar monedas:', error);
    }
  };

  const fetchCuentas = async () => {
    try {
      const response = await axios.get('/api/cuentas');
      setCuentas(response.data);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    }
  };

  // Agregar estas funciones
  const handleCreateMoneda = async (data) => {
    try {
      const response = await axios.post('/api/monedas', data);
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

  const handleCreateCuenta = async (nombre) => {
    try {
      const response = await axios.post('/api/cuentas', { 
        nombre,
        numero: nombre,
        tipo: 'EFECTIVO',
        monedaId: 1,
        usuarioId: null
      });
      
      const newCuenta = response.data;
      setCuentas(prev => [...prev, newCuenta]);
      enqueueSnackbar('Cuenta creada exitosamente', { variant: 'success' });
      return newCuenta;
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      enqueueSnackbar(
        'Error al crear la cuenta: ' + 
        (error.response?.data?.error || error.message), 
        { variant: 'error' }
      );
      throw error;
    }
  };

  // Manejar el envío del formulario
  const handleFormSubmit = async (formData) => {
    try {
      // Validar que todos los campos requeridos estén presentes
      if (!formData.descripcion || !formData.monto || !formData.categoria || 
          !formData.estado || !formData.monedaId || !formData.cuentaId) {
        enqueueSnackbar('Todos los campos son requeridos', { variant: 'error' });
        return;
      }

      // Asegurarnos que los datos están en el formato correcto
      const datosAEnviar = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        categoria: formData.categoria,
        estado: formData.estado,
        monedaId: parseInt(formData.monedaId),
        cuentaId: parseInt(formData.cuentaId)
      };

      console.log('Datos a enviar:', datosAEnviar);

      const response = await axios.post('/api/transacciones', datosAEnviar);
      
      if (response.status === 201) {
        enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
        setIsFormOpen(false);
        fetchTransacciones();
      }
    } catch (error) {
      console.error('Error completo:', error.response?.data || error);
      const mensajeError = error.response?.data?.error || 'Error al crear la transacción';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    }
  };

  // Campos del formulario
  const formFields = [
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
      component: 'creatable',
      required: true,
      variant: 'buttons',
      displaySymbol: true,
      options: monedas.map(m => ({
        value: m.id,
        label: `${m.nombre} (${m.simbolo})`,
        simbolo: m.simbolo
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
      component: 'creatable',
      required: true,
      variant: 'select',
      options: cuentas.map(c => ({
        value: c.id,
        label: c.nombre
      })),
      onCreateNew: handleCreateCuenta,
      createFields: [
        { name: 'nombre', label: 'Nombre', required: true }
      ],
      createTitle: 'Nueva Cuenta'
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => setIsFormOpen(true)}
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
            onClick={() => setIsFormOpen(true)}
          >
            Nueva Transacción
          </Button>
        }
      >
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Moneda</TableCell>
                <TableCell>Cuenta</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Categoría</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacciones.map((trans) => (
                <TableRow key={trans.id}>
                  <TableCell>{new Date(trans.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{trans.descripcion}</TableCell>
                  <TableCell align="right">
                    {trans.moneda?.simbolo} {trans.monto.toFixed(2)}
                  </TableCell>
                  <TableCell>{trans.moneda?.nombre}</TableCell>
                  <TableCell>{trans.cuenta?.nombre}</TableCell>
                  <TableCell>
                    <Chip 
                      label={trans.estado}
                      color={trans.estado === 'PAGADO' ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={trans.categoria}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title="Nueva Transacción"
        fields={formFields}
      />
    </Container>
  );
}

export default Transacciones;
