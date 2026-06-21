import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { AppLoadingScreen } from '../components/common';
import { toast } from 'react-hot-toast';

export function PrivateRoute() {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (error && error.response?.status !== 401) {
      toast.error('Error de conexión');
    }
  }, [error]);

  if (loading && !user) {
    return <AppLoadingScreen />;
  }

  if (user) {
    return <Outlet />;
  }

  return <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

export default PrivateRoute;
