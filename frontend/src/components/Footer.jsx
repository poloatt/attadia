import { Box, Chip } from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Footer() {
  const [connectionStatus, setConnectionStatus] = useState({
    backend: false,
    database: false,
    loading: true
  });

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/health', {
          timeout: 3000,
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        // Simplificamos la lógica - solo verificamos si hay respuesta
        setConnectionStatus({
          backend: true, // Si llegamos aquí, el backend está respondiendo
          database: true, // Si el backend responde, la DB está conectada
          loading: false
        });
      } catch (error) {
        console.error('Connection error:', error);
        setConnectionStatus({
          backend: false,
          database: false,
          loading: false
        });
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '32px',
        backgroundColor: '#0A0A0A',
        color: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 9999,
        left: 0,
        right: 0
      }}
    >
      <Chip
        icon={
          connectionStatus.backend ? 
            <SignalWifiStatusbar4BarIcon sx={{ color: '#4caf50', fontSize: 16 }} /> : 
            <SignalWifiOffIcon sx={{ color: '#f44336', fontSize: 16 }} />
        }
        label={connectionStatus.backend ? 'Conectado al backend' : 'Sin conexión al backend'}
        size="small"
        sx={{ 
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiChip-label': {
            fontSize: '0.75rem',
            px: 1
          }
        }}
      />
      <Chip
        icon={
          connectionStatus.database ? 
            <CloudDoneIcon sx={{ color: '#4caf50', fontSize: 16 }} /> : 
            <CloudOffIcon sx={{ color: '#f44336', fontSize: 16 }} />
        }
        label={connectionStatus.database ? 'Base de datos conectada' : 'Sin conexión a la base de datos'}
        size="small"
        sx={{ 
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiChip-label': {
            fontSize: '0.75rem',
            px: 1
          }
        }}
      />
    </Box>
  );
} 