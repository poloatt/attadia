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
      const token = localStorage.getItem('token');
      
      if (!token) {
        setState({ user: null, loading: false, error: null });
        return { error: 'No token found' };
      }

      // Si ya tenemos un usuario y el token es el mismo, no necesitamos verificar
      if (state.user && clienteAxios.defaults.headers.common['Authorization'] === `Bearer ${token}`) {
        return { user: state.user };
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await clienteAxios.get('/auth/check');
      
      if (!response.data.authenticated) {
        localStorage.removeItem('token');
        delete clienteAxios.defaults.headers.common['Authorization'];
        setState({ user: null, loading: false, error: 'No autenticado' });
        return { error: 'No autenticado' };
      }
      
      setState({ 
        user: response.data.user, 
        loading: false, 
        error: null 
      });
      
      return { user: response.data.user };
    } catch (error) {
      console.error('Error en checkAuth:', error.response || error);
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
  }, [state.user]);

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
      
      // Verificar el servidor solo una vez al inicio
      if (!window._serverHealthChecked) {
        try {
          await clienteAxios.get('/health');
          window._serverHealthChecked = true;
        } catch (error) {
          throw new Error('El servidor no está disponible. Por favor, intenta más tarde.');
        }
      }

      const response = await clienteAxios.get('/auth/google/url');
      
      if (!response.data?.url) {
        throw new Error('No se recibió la URL de autenticación');
      }
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error al iniciar el proceso de autenticación con Google:', error);
      
      let errorMessage = 'Error al conectar con el servidor';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'No se puede conectar con el servidor. Por favor, verifica que el servidor esté corriendo.';
      } else if (error.response?.status === 404) {
        errorMessage = 'La ruta de autenticación no está disponible';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setState({ 
        ...state, 
        loading: false, 
        error: errorMessage
      });
      
      throw new Error(errorMessage);
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
