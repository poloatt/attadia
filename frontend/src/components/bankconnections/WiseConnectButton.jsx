import React, { useState } from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import wiseLogo from './logos/wise.png';

export default function WiseConnectButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    // Aquí iría la lógica real de integración con Wise
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
      <img src={wiseLogo} alt="Wise" style={{ maxWidth: 120, width: '100%', height: 40, objectFit: 'contain' }} />
    </Button>
  );
} 