import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import clienteAxios from '../config/axios';

const AuthContext = createContext();

// Configuración según el ambiente
const config = {
  development: {
    authPrefix: '/api/auth',
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

// Configurar axios para enviar credenciales
clienteAxios.defaults.withCredentials = true;

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
    if (state.loading) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const token = localStorage.getItem('token');
      
      if (!token) {
        setState(prev => ({ ...prev, user: null }));
        return;
      }

      const { data } = await clienteAxios.get('/auth/me');
      
      if (data.user) {
        setState(prev => ({ ...prev, user: data.user }));
        // Actualizar el último acceso
        console.log('Usuario autenticado:', data.user);
      } else {
        console.warn('No se recibieron datos de usuario');
        setState(prev => ({ ...prev, user: null }));
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Error en checkAuth:', error);
      setState(prev => ({ ...prev, error: error.message }));
      setState(prev => ({ ...prev, user: null }));
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.loading]);

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

  const loginWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await clienteAxios.get('/auth/google/url');
      
      if (data.url) {
        console.log('Redirigiendo a Google OAuth...');
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setState(prev => ({ ...prev, error: 'Error al iniciar sesión con Google. Por favor, intenta de nuevo.' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const handleGoogleCallback = useCallback(async (code) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data } = await clienteAxios.post('/auth/google/callback', { code });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        await checkAuth();
      } else {
        throw new Error('No se recibió el token de autenticación');
      }
    } catch (error) {
      console.error('Error en callback de Google:', error);
      setState(prev => ({ ...prev, error: 'Error al completar la autenticación con Google' }));
      setState(prev => ({ ...prev, user: null }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [checkAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
