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
    if (code) {
      clienteAxios.post('/api/bankconnections/mercadopago/callback', { code })
        .then(() => {
          enqueueSnackbar('¡Conexión MercadoPago exitosa!', { variant: 'success' });
          navigate('/assets/finanzas/cuentas');
        })
        .catch(() => {
          enqueueSnackbar('Error al conectar con MercadoPago', { variant: 'error' });
          navigate('/assets/finanzas/cuentas');
        });
    }
  }, [enqueueSnackbar, navigate]);

  return <div>Conectando con MercadoPago...</div>;
}

export default MercadoPagoCallbackPage; 