import React, { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { useNavigate } from 'react-router-dom';

// Este componente procesa el callback OAuth de MercadoPago.
// Recibe el parámetro 'code' en la URL y lo envía al backend para intercambiarlo por access_token.
// El backend debe implementar el flujo según https://www.mercadopago.com.ar/developers/es/reference/oauth/_oauth_token/post
export function MercadoPagoCallbackPage() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Error en autorización MercadoPago:', error);
      enqueueSnackbar(`Error de autorización: ${error}`, { variant: 'error' });
      navigate('/assets/finanzas/cuentas');
      return;
    }
    
    if (code) {
      console.log('Procesando código de autorización MercadoPago:', code);
      clienteAxios.post('/api/bankconnections/mercadopago/callback', { code })
        .then((response) => {
          console.log('Conexión MercadoPago exitosa:', response.data);
          enqueueSnackbar('¡Conexión MercadoPago exitosa!', { variant: 'success' });
          navigate('/assets/finanzas/cuentas');
        })
        .catch((error) => {
          console.error('Error al conectar con MercadoPago:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
          enqueueSnackbar(`Error al conectar con MercadoPago: ${errorMessage}`, { variant: 'error' });
          navigate('/assets/finanzas/cuentas');
        });
    } else {
      console.error('No se recibió código de autorización');
      enqueueSnackbar('No se recibió código de autorización de MercadoPago', { variant: 'error' });
      navigate('/assets/finanzas/cuentas');
    }
  }, [enqueueSnackbar, navigate]);

  return <div>Conectando con MercadoPago...</div>;
}

export default MercadoPagoCallbackPage; 