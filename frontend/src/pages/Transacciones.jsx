import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Button, Fab } from '@mui/material';

import { 
  AccountBalanceOutlined as BankIcon,
  CurrencyExchangeOutlined as MoneyIcon,
  AutorenewOutlined as RecurrentIcon,
  PersonOutlineOutlined,
  ApartmentOutlined as BuildingIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import PaidIcon from '@mui/icons-material/Paid';
import FabNuevaTransaccion from '../components/transacciones/FabNuevaTransaccion';

import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
import TransaccionTable from '../components/transacciones/TransaccionTable';
import TransaccionForm from '../components/transacciones/TransaccionForm';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useAPI } from '../hooks/useAPI';

export function Transacciones() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [editingTransaccion, setEditingTransaccion] = useState(null);
  const { showValues } = useValuesVisibility();

  // Usar nuestro hook personalizado para cargar datos
  const { 
    data: monedasData, 
    loading: monedasLoading, 
    error: monedasError 
  } = useAPI('/api/monedas');

  const { 
    data: cuentasData, 
    loading: cuentasLoading, 
    error: cuentasError 
  } = useAPI('/api/cuentas');

  const { 
    data: transaccionesData, 
    loading: transaccionesLoading, 
    error: transaccionesError,
    refetch: refetchTransacciones 
  } = useAPI('/api/transacciones', { 
    params: { limit: 1000, sort: '-fecha' } 
  });

  // Extraer arrays de datos de las respuestas paginadas
  const monedas = monedasData?.docs || [];
  const cuentas = cuentasData?.docs || [];
  const transacciones = transaccionesData?.docs || [];

  // Estado de carga general
  const isLoading = monedasLoading || cuentasLoading || transaccionesLoading;

  // Para errores
  useEffect(() => {
    if (monedasError) {
      enqueueSnackbar('Error al cargar monedas: ' + monedasError.message, { variant: 'error' });
    }
    if (cuentasError) {
      enqueueSnackbar('Error al cargar cuentas: ' + cuentasError.message, { variant: 'error' });
    }
    if (transaccionesError) {
      enqueueSnackbar('Error al cargar transacciones: ' + transaccionesError.message, { variant: 'error' });
    }
  }, [monedasError, cuentasError, transaccionesError, enqueueSnackbar]);

  const handleCreateMoneda = useCallback(async (data) => {
    try {
      const response = await clienteAxios.post('/api/monedas', data);
      const newMoneda = response.data;
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
      const response = await clienteAxios.post('/api/cuentas', { 
        nombre: data.nombre,
        moneda: data.monedaId,
        tipo: data.tipo
      });
      
      const newCuenta = response.data;
      console.log('Cuenta creada:', newCuenta);
      
      // Refrescar los datos después de crear la cuenta
      refetchTransacciones();
      
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
  }, [enqueueSnackbar, refetchTransacciones]);

  const handleEdit = useCallback(async (transaccion) => {
    try {
      console.log('Editando transacción:', transaccion);
      
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
  }, [enqueueSnackbar]);

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
        response = await clienteAxios.put(`/api/transacciones/${editingTransaccion._id}`, datosAEnviar);
        console.log('Respuesta del servidor:', response.data);
        enqueueSnackbar('Transacción actualizada exitosamente', { variant: 'success' });
      } else {
        console.log('Creando nueva transacción');
        response = await clienteAxios.post('/api/transacciones', datosAEnviar);
        enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
      }
      
      setIsFormOpen(false);
      setEditingTransaccion(null);
      setFormKey(prev => prev + 1);
      refetchTransacciones();
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
  }, [enqueueSnackbar, refetchTransacciones, editingTransaccion, cuentas]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/api/transacciones/${id}`);
      enqueueSnackbar('Transacción eliminada exitosamente', { variant: 'success' });
      refetchTransacciones();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      enqueueSnackbar('Error al eliminar la transacción', { variant: 'error' });
    }
  }, [enqueueSnackbar, refetchTransacciones]);

  const handleOpenForm = useCallback(() => {
    setEditingTransaccion(null);
    setFormKey(prev => prev + 1);
    setIsFormOpen(true);
  }, []);

  // Escuchar evento del Header para abrir formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail?.type === 'transaccion') {
        handleOpenForm();
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, [handleOpenForm]);

  return (
    <Box sx={{ px: 0, width: '100%', position: 'relative', minHeight: '80vh', bgcolor: 'background.default' }}>

      <FabNuevaTransaccion onClick={handleOpenForm} />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <EmptyState
            title="Cargando transacciones..."
            description="Por favor espera mientras cargamos tus datos."
            icon="loading"
          />
        </Box>
      ) : transacciones.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <EmptyState
            title="No hay transacciones"
            description="Comienza creando tu primera transacción."
            buttonText="Nueva Transacción"
            onButtonClick={handleOpenForm}
            icon="empty"
          />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <TransaccionTable
            transacciones={transacciones}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showVisibilityToggle={true}
            showValues={showValues}
          />
        </Box>
      )}

      {isFormOpen && (
        <TransaccionForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingTransaccion || {}}
          isEditing={!!editingTransaccion}
        />
      )}
    </Box>
  );
}

export default Transacciones;

