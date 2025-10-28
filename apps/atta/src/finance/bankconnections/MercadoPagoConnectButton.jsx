import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { FORM_HEIGHTS } from '@shared/config/uiConstants';
import { useMercadoPago } from '@shared/hooks/useMercadoPago';
import { isMercadoPagoEnabled } from '@shared/config/mercadopago';
import mercadopagoLogo from './logos/mercadopago.svg';

export default function MercadoPagoConnectButton({ onSuccess, onError, fullWidth = false }) {
  const { connecting, connect } = useMercadoPago();

  const handleConnect = async () => {
    try {
      await connect();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
    }
  };

  if (!isMercadoPagoEnabled()) return null;

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      sx={{
        minWidth: 0,
        minHeight: 48,
        width: fullWidth ? '100%' : 'auto',
        bgcolor: 'transparent',
        borderRadius: 0,
        boxShadow: 'none',
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        '&:hover': { bgcolor: 'grey.900' },
        '&:disabled': { opacity: 0.6 }
      }}
      fullWidth={fullWidth}
    >
      {connecting ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        <img 
          src={mercadopagoLogo} 
          alt="MercadoPago" 
          style={{ 
            maxWidth: 120, 
            width: '100%', 
            height: FORM_HEIGHTS.input, 
            objectFit: 'contain' 
          }} 
        />
      )}
    </Button>
  );
} 