import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  AccountBalanceOutlined as BankIcon,
  CurrencyExchangeOutlined as MoneyIcon,
  AutorenewOutlined as RecurrentIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
import TransaccionForm from '../components/transacciones/TransaccionForm';
import TransaccionTable from '../components/transacciones/TransaccionTable';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';

export function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [editingTransaccion, setEditingTransaccion] = useState(null);
  const { showValues } = useValuesVisibility();

  const fetchTransacciones = useCallback(async () => {
    try {
      console.log('Solicitando transacciones...');
      const response = await clienteAxios.get('/transacciones?limit=1000&sort=-fecha');
      console.log('Transacciones recibidas:', response.data);
      setTransacciones(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar transacciones', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchMonedas = useCallback(async () => {
    try {
      console.log('Cargando monedas...');
      const response = await clienteAxios.get('/monedas');
      console.log('Respuesta completa de monedas:', response);
      console.log('Monedas recibidas:', response.data);
      
      if (!response.data || !Array.isArray(response.data.docs)) {
        console.error('Formato de respuesta inválido para monedas:', response.data);
        enqueueSnackbar('Error en el formato de datos de monedas', { variant: 'error' });
        return [];
      }

      const monedasData = response.data.docs.map(moneda => ({
        ...moneda,
        _id: moneda._id || moneda.id, // Aseguramos tener _id
        nombre: moneda.nombre || 'Sin nombre', // Valor por defecto
        simbolo: moneda.simbolo || '$' // Valor por defecto
      }));

      console.log('Monedas procesadas:', monedasData);
      setMonedas(monedasData);
      return monedasData;
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      console.error('Detalles del error:', error.response?.data);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
      return [];
    }
  }, [enqueueSnackbar]);

  const fetchCuentas = useCallback(async () => {
    try {
      console.log('Cargando cuentas...');
      const response = await clienteAxios.get('/cuentas');
      console.log('Respuesta completa de cuentas:', response);
      console.log('Cuentas recibidas:', response.data);
      
      if (!response.data || !Array.isArray(response.data.docs)) {
        console.error('Formato de respuesta inválido para cuentas:', response.data);
        enqueueSnackbar('Error en el formato de datos de cuentas', { variant: 'error' });
        return [];
      }

      const cuentasData = response.data.docs.map(cuenta => ({
        ...cuenta,
        _id: cuenta._id || cuenta.id, // Aseguramos tener _id
        nombre: cuenta.nombre || 'Sin nombre' // Valor por defecto
      }));

      console.log('Cuentas procesadas:', cuentasData);
      setCuentas(cuentasData);
      return cuentasData;
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      console.error('Detalles del error:', error.response?.data);
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

  const handleEdit = useCallback(async (transaccion) => {
    try {
      console.log('Editando transacción:', transaccion);
      await Promise.all([fetchMonedas(), fetchCuentas()]);
      
      // Asegurarse de que la cuenta esté en el formato correcto
      const transaccionFormateada = {
        ...transaccion,
        cuenta: transaccion.cuenta?._id || transaccion.cuenta?.id || transaccion.cuenta,
        moneda: transaccion.moneda?._id || transaccion.moneda?.id || transaccion.moneda
      };
      
      console.log('Transacción formateada para edición:', transaccionFormateada);
      setEditingTransaccion(transaccionFormateada);
      setFormKey(prev => prev + 1);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error al preparar edición:', error);
      enqueueSnackbar('Error al cargar datos para edición', { variant: 'error' });
    }
  }, [fetchMonedas, fetchCuentas, enqueueSnackbar]);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      console.log('Datos del formulario recibidos:', formData);
      
      // Verificar autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      // Validar que la cuenta exista
      const cuentaSeleccionada = cuentas.find(c => 
        c._id === formData.cuenta || 
        c.id === formData.cuenta ||
        c._id === formData.cuenta?._id ||
        c.id === formData.cuenta?._id
      );

      if (!cuentaSeleccionada) {
        console.log('Cuentas disponibles:', cuentas);
        console.log('ID de cuenta buscado:', formData.cuenta);
        throw new Error('La cuenta seleccionada no existe');
      }

      const datosAEnviar = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha || new Date().toISOString(),
        categoria: formData.categoria,
        estado: formData.estado || 'PENDIENTE',
        cuenta: cuentaSeleccionada._id || cuentaSeleccionada.id,
        tipo: formData.tipo || 'INGRESO',
        moneda: formData.moneda
      };

      console.log('Datos procesados a enviar:', datosAEnviar);
      
      let response;
      if (editingTransaccion) {
        console.log('Actualizando transacción:', editingTransaccion._id);
        response = await clienteAxios.put(`/transacciones/${editingTransaccion._id}`, datosAEnviar);
        console.log('Respuesta del servidor:', response.data);
        enqueueSnackbar('Transacción actualizada exitosamente', { variant: 'success' });
      } else {
        console.log('Creando nueva transacción');
        response = await clienteAxios.post('/transacciones', datosAEnviar);
        enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
      }
      
      setIsFormOpen(false);
      setEditingTransaccion(null);
      setFormKey(prev => prev + 1);
      await fetchTransacciones();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Detalles del error:', error.response?.data);
      
      // Manejar error de autenticación
      if (error.response?.status === 401) {
        enqueueSnackbar('Sesión expirada. Por favor, inicia sesión nuevamente.', { 
          variant: 'error',
          autoHideDuration: 5000
        });
        window.location.href = '/login';
        return;
      }
      
      const mensajeError = error.response?.data?.message || error.message || 'Error al guardar la transacción';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTransacciones, editingTransaccion, cuentas]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/transacciones/${id}`);
      enqueueSnackbar('Transacción eliminada exitosamente', { variant: 'success' });
      fetchTransacciones();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      enqueueSnackbar('Error al eliminar la transacción', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTransacciones]);

  const handleOpenForm = useCallback(async () => {
    try {
      console.log('Abriendo formulario...');
      await Promise.all([fetchMonedas(), fetchCuentas()]);
      setEditingTransaccion(null);
      setFormKey(prev => prev + 1);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error al abrir formulario:', error);
      enqueueSnackbar('Error al cargar datos del formulario', { variant: 'error' });
    }
  }, [fetchMonedas, fetchCuentas, enqueueSnackbar]);

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
      options: monedas.map(m => {
        console.log('Procesando moneda para opciones:', m);
        return {
          value: m._id,
          label: `${m.nombre || 'Sin nombre'} (${m.simbolo || '$'})`
        };
      }),
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
      options: cuentas.map(c => {
        console.log('Procesando cuenta para opciones:', c);
        return {
          value: c._id,
          label: c.nombre || 'Sin nombre'
        };
      }),
      onCreateNew: handleCreateCuenta,
      createFields: [
        { name: 'nombre', label: 'Nombre', required: true },
        { 
          name: 'monedaId',
          label: 'Moneda', 
          type: 'relational',
          required: true,
          options: monedas.map(m => ({
            value: m._id,
            label: `${m.nombre || 'Sin nombre'} (${m.simbolo || '$'})`
          }))
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
            icon: <RecurrentIcon sx={{ fontSize: 18 }} />,
            label: 'Transacciones Recurrentes',
            to: '/recurrente'
          },
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
        showValues={showValues}
        onToggleValues={() => {}}
      />
      <EntityDetails 
        title="Transacciones"
        subtitle="Gestiona tus ingresos y gastos"
        icon={<MoneyIcon />}
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingTransaccion(null);
              setIsFormOpen(true);
            }}
            sx={{
              borderRadius: 1,
              textTransform: 'none'
            }}
          >
            Nueva Transacción
          </Button>
        }
      >
        {transacciones.length === 0 ? (
          <EmptyState 
            onAdd={() => setIsFormOpen(true)}
            message="No hay transacciones registradas"
            submessage="Haz clic en el botón para agregar una nueva transacción"
          />
        ) : (
          <TransaccionTable 
            transacciones={transacciones}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showValues={showValues}
          />
        )}
      </EntityDetails>

      {isFormOpen && (
        <TransaccionForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTransaccion(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingTransaccion || {}}
          isEditing={!!editingTransaccion}
        />
      )}
    </Container>
  );
}

export default Transacciones;

