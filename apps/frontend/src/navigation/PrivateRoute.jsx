import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function PrivateRoute() {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (error && error.response?.status !== 401) {
      toast.error('Error de conexión');
    }
  }, [error]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Outlet />;
  }

  return <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

const LoadingScreen = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <CircularProgress />
    </div>
  );
}; 
