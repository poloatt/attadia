import React from 'react';
import { Box, Chip } from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import { useState, useEffect } from 'react';
import clienteAxios from '../config/axios';
import { useLocation } from 'react-router-dom';

export default function Footer({ isDesktop = false, isSidebarOpen = false }) {
  const [connectionStatus, setConnectionStatus] = useState({
    backend: false,
    database: false,
    loading: true
  });
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const response = await clienteAxios.get('/api/health');
        setConnectionStatus({
          backend: true,
          database: true,
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

  useEffect(() => {
    // Mostrar el footer solo en la ruta principal o assets
    if (location.pathname === '/' || location.pathname === '/assets') {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000); // Ocultar después de 3 segundos
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [location]);

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0, // Posicionar en el espacio reservado del BottomNavigation
        width: isDesktop && isSidebarOpen ? 'calc(100% - 280px)' : '100%',
        height: '32px',
        backgroundColor: 'rgba(26, 27, 30, 0.8)',
        color: 'rgba(255, 255, 255, 0.7)',
        opacity: visible ? 1 : 0, // Cambiar opacidad
        transform: visible ? 'translateY(0)' : 'translateY(10px)', // Desplazamiento
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1201, // Por encima del BottomNavigation (1200)
        left: 0,
        right: 0,
        transition: 'opacity 0.5s ease, transform 0.5s ease, margin-left 0.3s cubic-bezier(0.4,0,0.2,1)', // Mejorar la transición
        marginLeft: isDesktop && isSidebarOpen ? '280px' : 0,
      }}
    >
      <Box
        sx={{
          width: '100%',
          px: { xs: 1, sm: 2, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
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
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '& .MuiChip-label': {
              fontSize: '0.75rem',
              px: 1
            }
          }}
        />
      </Box>
    </Box>
  );
} 
