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
      // Solicitar la URL de autorización al backend
      const { data } = await clienteAxios.get('/api/bankconnections/mercadopago/auth-url', {
        params: { redirect_uri: REDIRECT_URI }
      });
      window.location.href = data.authUrl;
    } catch (err) {
      setLoading(false);
      if (onError) onError(err);
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