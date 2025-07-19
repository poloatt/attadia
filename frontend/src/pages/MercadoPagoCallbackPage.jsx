import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useMercadoPago } from '../hooks/useMercadoPago';

export function MercadoPagoCallbackPage() {
  const navigate = useNavigate();
  const { processCallback } = useMercadoPago();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
      const state = urlParams.get('state');
      const errorParam = urlParams.get('error');
    
      if (errorParam) {
        console.error('Error en autorización MercadoPago:', errorParam);
        setError(`Error de autorización: ${errorParam}`);
        setStatus('error');
        return;
      }
      
      if (!code) {
        console.error('No se recibió código de autorización');
        setError('No se recibió código de autorización de MercadoPago');
        setStatus('error');
        return;
      }
      
      // Validar el parámetro state para prevenir CSRF
      const savedState = localStorage.getItem('mercadopago_state');
      if (state && savedState && state !== savedState) {
        console.error('State validation failed:', { received: state, expected: savedState });
        setError('Error de seguridad: parámetro state inválido');
        setStatus('error');
      return;
    }
    
      try {
        console.log('Procesando código de autorización MercadoPago:', { code, state });
        await processCallback(code, state);
        setStatus('success');
        
        // Limpiar el state del localStorage
        localStorage.removeItem('mercadopago_state');
        
        // Redirigir después de un breve delay para mostrar el mensaje de éxito
        setTimeout(() => {
          navigate('/assets/finanzas/cuentas');
        }, 2000);
      } catch (error) {
          console.error('Error al conectar con MercadoPago:', error);
        setError(error.message);
        setStatus('error');
        
        // Limpiar el state del localStorage en caso de error
        localStorage.removeItem('mercadopago_state');
      }
    };

    handleCallback();
  }, [processCallback, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Conectando con MercadoPago...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Por favor espera mientras procesamos tu autorización
            </Typography>
          </Box>
        );
      
      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'success.main' }}>
              ¡Conexión exitosa!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tu cuenta de MercadoPago ha sido conectada correctamente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirigiendo a cuentas...
            </Typography>
          </Box>
        );
      
      case 'error':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Error de conexión
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Redirigiendo a cuentas en 5 segundos...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <a 
                href="/assets/finanzas/cuentas" 
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                Hacer clic aquí para ir ahora
              </a>
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };

  // Redirigir automáticamente en caso de error después de 5 segundos
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => {
          navigate('/assets/finanzas/cuentas');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  if (!import.meta.env.PROD) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Box sx={{ maxWidth: 400, width: '100%', mx: 2, bgcolor: 'background.paper', borderRadius: 0, boxShadow: 1, p: 3 }}>
          <Alert severity="info">
            <Typography variant="h6">Mercado Pago solo está disponible en producción</Typography>
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ 
        maxWidth: 400, 
        width: '100%', 
        mx: 2,
        bgcolor: 'background.paper',
        borderRadius: 0,
        boxShadow: 1,
        p: 3
      }}>
        {renderContent()}
      </Box>
    </Box>
  );
}

export default MercadoPagoCallbackPage; 
