import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import clienteAxios from '../config/axios';

const AuthContext = createContext();

// Configuración según el ambiente
const config = {
  development: {
    authPrefix: '/auth',
    apiPrefix: '/api'
  },
  production: {
    authPrefix: '/api/auth',
    apiPrefix: '/api'
  }
};

// Determinar el ambiente actual
const env = import.meta.env.MODE || 'development';
const currentConfig = config[env];

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
        console.log('No se encontró token en localStorage');
        setState({ user: null, loading: false, error: null });
        return { error: 'No token found' };
      }

      console.log('Token encontrado en localStorage:', token.substring(0, 20) + '...');

      // Verificar que el token esté configurado en axios
      if (clienteAxios.defaults.headers.common['Authorization'] !== `Bearer ${token}`) {
        console.log('Configurando token en Axios');
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('Realizando petición de verificación...');
      console.log('Headers de la petición:', {
        ...clienteAxios.defaults.headers.common,
        Authorization: clienteAxios.defaults.headers.common['Authorization']?.substring(0, 20) + '...'
      });
      
      const response = await clienteAxios.get(`${currentConfig.authPrefix}/check`);
      console.log('Respuesta de verificación:', response.data);
      
      if (!response.data.authenticated) {
        console.log('Usuario no autenticado según la respuesta');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
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
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
      }
      
      setState({ 
        user: null, 
        loading: false, 
        error: error.response?.data?.error || error.message || 'Error de autenticación'
      });
      
      return { error: error.response?.data || error.message || 'Error de autenticación' };
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
      const response = await clienteAxios.post(`${currentConfig.authPrefix}/login`, credentials);
      const { token, refreshToken } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
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

      const response = await clienteAxios.get(`${currentConfig.authPrefix}/google/url`);
      
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
      await clienteAxios.post(`${currentConfig.authPrefix}/logout`);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Incluso si hay un error, limpiamos el estado local
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
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
