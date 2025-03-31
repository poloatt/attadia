import { useState, useEffect } from 'react';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await clienteAxios.get('/api/users/profile/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await clienteAxios.post('/api/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      enqueueSnackbar('Inicio de sesión exitoso', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al iniciar sesión',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    enqueueSnackbar('Sesión cerrada exitosamente', { variant: 'success' });
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await clienteAxios.post('/api/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      enqueueSnackbar('Registro exitoso', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al registrar usuario',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
    checkAuth
  };
}; 