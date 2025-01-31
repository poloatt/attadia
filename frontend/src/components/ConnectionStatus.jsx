import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function ConnectionStatus() {
  const [backendStatus, setBackendStatus] = useState(true);
  const [dbStatus, setDbStatus] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Usamos el endpoint de getCurrentUser que sabemos que funciona
        const response = await axios.get('/api/auth/me', {
          withCredentials: true
        });
        console.log('Connection check response:', response.data);
        setBackendStatus(true);
        setDbStatus(true); // Si el backend responde, la DB está conectada
      } catch (error) {
        console.error('Error checking connection:', error);
        if (error.response) {
          // Si tenemos respuesta del servidor pero es error 401, el backend está up
          setBackendStatus(error.response.status === 401);
          setDbStatus(error.response.status === 401);
        } else {
          setBackendStatus(false);
          setDbStatus(false);
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      padding: '8px',
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 1000 // Aseguramos que esté por encima de otros elementos
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
        color: backendStatus ? '#4caf50' : '#f44336'
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: backendStatus ? '#4caf50' : '#f44336' 
        }} />
        {backendStatus ? 'Conectado al backend' : 'Sin conexión al backend'}
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
        color: dbStatus ? '#4caf50' : '#f44336'
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: dbStatus ? '#4caf50' : '#f44336' 
        }} />
        {dbStatus ? 'Base de datos conectada' : 'Sin conexión a la base de datos'}
      </div>
    </div>
  );
} 