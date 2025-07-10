import React, { useState } from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import googleWalletLogo from './logos/google-wallet.png';

export default function GoogleWalletConnectButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    // Aquí iría la lógica real de integración con Google Wallet
    setTimeout(() => {
      setLoading(false);
      if (onSuccess) onSuccess();
    }, 1200);
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
      <img src={googleWalletLogo} alt="Google Wallet" style={{ maxWidth: 120, width: '100%', height: 40, objectFit: 'contain' }} />
    </Button>
  );
} 