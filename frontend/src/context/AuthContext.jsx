import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import clienteAxios from '../config/axios';

const AuthContext = createContext();

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem('token');
      
      if (!token) {
        setState({ user: null, loading: false, error: null });
        return { error: 'No token found' };
      }

      // Asegurarse de que el token esté configurado en axios
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await clienteAxios.get('/auth/check');
      setState({ user: response.data, loading: false, error: null });
      return { user: response.data };
    } catch (error) {
      console.error('Error en checkAuth:', error);
      // Si hay un error de autenticación, limpiar el token
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        delete clienteAxios.defaults.headers.common['Authorization'];
      }
      setState({ 
        user: null, 
        loading: false, 
        error: error.response?.data || error 
      });
      return { error: error.response?.data || error };
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setState({ user: null, loading: false, error: null });
    }
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await clienteAxios.post('/auth/login', credentials);
      const { token } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      localStorage.setItem('token', token);
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const authResult = await checkAuth();
      if (authResult.error) {
        throw authResult.error;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setState({ ...state, loading: false, error: error.response?.data || error });
      throw error.response?.data || error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await clienteAxios.get('/auth/google/url');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error al iniciar el proceso de autenticación con Google:', error);
      setState({ 
        ...state, 
        loading: false, 
        error: error.response?.data || error 
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await clienteAxios.post('/auth/logout');
      localStorage.removeItem('token');
      delete clienteAxios.defaults.headers.common['Authorization'];
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Incluso si hay un error, limpiamos el estado local
      localStorage.removeItem('token');
      delete clienteAxios.defaults.headers.common['Authorization'];
      setState({ user: null, loading: false, error: error });
    }
  };

  const value = {
    user: state.user,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
    loading: state.loading,
    error: state.error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, useAuth };
