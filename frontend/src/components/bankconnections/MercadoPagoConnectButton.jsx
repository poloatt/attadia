import React, { useState } from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import clienteAxios from '../../config/axios';
import mercadopagoLogo from './logos/mercadopago.svg';

const REDIRECT_URI = window.location.origin + '/mercadopago/callback';

export default function MercadoPagoConnectButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      console.log('Solicitando URL de autorización MercadoPago con redirect_uri:', REDIRECT_URI);
      
      // Solicitar la URL de autorización al backend
      const { data } = await clienteAxios.get('/api/bankconnections/mercadopago/auth-url', {
        params: { redirect_uri: REDIRECT_URI }
      });
      
      console.log('URL de autorización recibida:', data.authUrl);
      window.location.href = data.authUrl;
    } catch (err) {
      setLoading(false);
      console.error('Error obteniendo URL de autorización MercadoPago:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      if (onError) onError(new Error(`Error conectando con MercadoPago: ${errorMessage}`));
    }
  };

  return (
    <Button
      onClick={handleConnect}
      sx={{
        minWidth: 0,
        minHeight: 48,
        width: '100%',
        bgcolor: 'transparent',
        borderRadius: 0,
        boxShadow: 'none',
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        '&:hover': { bgcolor: 'grey.900' }
      }}
      fullWidth
    >
      <img src={mercadopagoLogo} alt="MercadoPago" style={{ maxWidth: 120, width: '100%', height: 40, objectFit: 'contain' }} />
    </Button>
  );
} 