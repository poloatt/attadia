import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import clienteAxios from '../config/axios';

const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Configuración según el ambiente
const config = {
  development: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  },
  production: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.present.attadia.com',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'https://present.attadia.com'
  }
};

const env = import.meta.env.MODE || 'development';
const currentConfig = config[env];

console.log('Ambiente de autenticación:', env);
console.log('Configuración:', currentConfig);

// Configurar axios con la URL base y credenciales
clienteAxios.defaults.baseURL = currentConfig.baseUrl;
clienteAxios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setState(prev => ({ ...prev, user: null, loading: false, isAuthenticated: false }));
        return false;
      }

      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await clienteAxios.get(`${currentConfig.authPrefix}/check`);
      
      if (data.authenticated && data.user) {
        setState(prev => ({ 
          ...prev, 
          user: data.user, 
          loading: false, 
          isAuthenticated: true,
          error: null 
        }));
        console.log('Usuario autenticado:', data.user);
        return true;
      } else {
        console.warn('No se recibieron datos de usuario');
        setState(prev => ({ 
          ...prev, 
          user: null, 
          loading: false, 
          isAuthenticated: false 
        }));
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        return false;
      }
    } catch (error) {
      console.error('Error en checkAuth:', error);
      if (error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const { data: refreshData } = await clienteAxios.post(`${currentConfig.authPrefix}/refresh`, {
              refreshToken
            });
            if (refreshData.token) {
              localStorage.setItem('token', refreshData.token);
              if (refreshData.refreshToken) {
                localStorage.setItem('refreshToken', refreshData.refreshToken);
              }
              clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${refreshData.token}`;
              return checkAuth();
            }
          }
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError);
        }
      }
      setState(prev => ({ 
        ...prev, 
        user: null, 
        error: error.response?.data?.message || error.message,
        loading: false,
        isAuthenticated: false
      }));
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      return false;
    }
  }, []);

  const login = async (credentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await clienteAxios.post(`${currentConfig.authPrefix}/login`, credentials);
      const { token, refreshToken } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const authResult = await checkAuth();
      if (!authResult) {
        throw new Error('Fallo en la verificación de autenticación');
      }
      return response.data;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.message || error.message,
        isAuthenticated: false 
      }));
      throw error;
    }
  };

  const loginWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await clienteAxios.get(`${currentConfig.authPrefix}/google/url`);
      
      if (data.url) {
        console.log('Redirigiendo a Google OAuth...');
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.response?.data?.message || 'Error al iniciar sesión con Google',
        loading: false,
        isAuthenticated: false
      }));
      throw error;
    }
  }, []);

  const handleGoogleCallback = useCallback(async (code) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data } = await clienteAxios.post(`${currentConfig.authPrefix}/google/callback`, { code });
      
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
      setState(prev => ({ 
        ...prev, 
        user: null,
        error: 'Error al completar la autenticación con Google',
        loading: false
      }));
    }
  }, [checkAuth]);

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('token');
      if (token) {
        await clienteAxios.post(`${currentConfig.authPrefix}/logout`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      setState({ 
        user: null, 
        loading: false, 
        error: null, 
        isAuthenticated: false 
      });
      window.location.href = `${currentConfig.frontendUrl}/login`;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    login,
    loginWithGoogle,
    handleGoogleCallback,
    checkAuth,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth };
