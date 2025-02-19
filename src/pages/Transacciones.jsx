import React, { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { AutorenewOutlined as RecurrentIcon } from '@mui/icons-material';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import BankIcon from '@mui/icons-material/Bank';
import CurrencyIcon from '@mui/icons-material/CurrencyExchange';

const mapearCategoriaValida = (categoriaAntigua) => {
  const categoriasValidas = [
    'Salud y Belleza',
    'Contabilidad y Facturas',
    'Transporte',
    'Comida y Mercado',
    'Fiesta',
    'Ropa',
    'Tecnología',
    'Otro'
  ];

  // Si la categoría es válida, la devolvemos
  if (categoriasValidas.includes(categoriaAntigua)) {
    return categoriaAntigua;
  }

  // Mapeo de categorías antiguas a nuevas
  const mapeo = {
    'ALQUILER': 'Contabilidad y Facturas',
    'SERVICIOS': 'Contabilidad y Facturas',
    'COMIDA': 'Comida y Mercado',
    'SALUD': 'Salud y Belleza',
    // Agregar más mapeos según sea necesario
  };

  // Si existe un mapeo, lo usamos
  if (mapeo[categoriaAntigua]) {
    return mapeo[categoriaAntigua];
  }

  // Si no hay mapeo, devolvemos 'Otro'
  return 'Otro';
};

export function Transacciones() {
  const { enqueueSnackbar } = useSnackbar();

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
        c.id === formData.cuenta
      );

      if (!cuentaSeleccionada) {
        console.log('Cuentas disponibles:', cuentas);
        console.log('ID de cuenta buscado:', formData.cuenta);
        throw new Error('La cuenta seleccionada no existe');
      }

      const datosAEnviar = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        categoria: mapearCategoriaValida(formData.categoria),
        estado: formData.estado || 'PENDIENTE',
        cuenta: cuentaSeleccionada._id || cuentaSeleccionada.id,
        tipo: formData.tipo || 'INGRESO'
      };

      console.log('Datos procesados a enviar:', datosAEnviar);
      
      let response;
      if (editingTransaccion) {
        console.log('Actualizando transacción:', editingTransaccion._id);
        response = await clienteAxios.put(`/transacciones/${editingTransaccion._id}`, datosAEnviar);
        enqueueSnackbar('Transacción actualizada exitosamente', { variant: 'success' });
      } else {
        console.log('Creando nueva transacción');
        response = await clienteAxios.post('/transacciones', datosAEnviar);
        enqueueSnackbar('Transacción creada exitosamente', { variant: 'success' });
      }
      
      console.log('Respuesta del servidor:', response.data);
      
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
        // Redirigir al login
        window.location.href = '/login';
        return;
      }
      
      const mensajeError = error.response?.data?.message || error.message || 'Error al guardar la transacción';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchTransacciones, editingTransaccion, cuentas]);

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        navigationItems={[
          {
            icon: <RecurrentIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones Recurrentes',
            to: '/recurrente'
          },
          {
            icon: <BankIcon sx={{ fontSize: 20 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <CurrencyIcon sx={{ fontSize: 20 }} />,
            label: 'Monedas',
            to: '/monedas'
          }
        ]}
        onAdd={() => setIsFormOpen(true)}
      />
    </Container>
  );
} 