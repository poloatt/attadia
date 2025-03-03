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
    apiPrefix: '/api'
  },
  production: {
    authPrefix: '/api/auth',
    apiPrefix: '/api'
  }
};

const env = import.meta.env.MODE || 'development';
const currentConfig = config[env];

// Configurar axios para enviar credenciales
clienteAxios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null
  });

  const checkAuth = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setState(prev => ({ ...prev, user: null, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const { data } = await clienteAxios.get(`${currentConfig.authPrefix}/check`);
      
      if (data.authenticated && data.user) {
        setState(prev => ({ ...prev, user: data.user, loading: false }));
        console.log('Usuario autenticado:', data.user);
      } else {
        console.warn('No se recibieron datos de usuario');
        setState(prev => ({ ...prev, user: null, loading: false }));
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Error en checkAuth:', error);
      if (error.response?.status === 401) {
        // Intentar refresh token
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const { data: refreshData } = await clienteAxios.post(`${currentConfig.authPrefix}/refresh`, {
              refreshToken
            });
            if (refreshData.token) {
              localStorage.setItem('token', refreshData.token);
              clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${refreshData.token}`;
              return checkAuth(); // Intentar de nuevo con el nuevo token
            }
          }
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError);
        }
      }
      setState(prev => ({ 
        ...prev, 
        user: null, 
        error: error.message,
        loading: false 
      }));
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
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
        error: 'Error al iniciar sesión con Google. Por favor, intenta de nuevo.',
        loading: false
      }));
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      await checkAuth();
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  const value = {
    user: state.user,
    login,
    loginWithGoogle,
    handleGoogleCallback,
    checkAuth,
    logout: async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        await clienteAxios.post(`${currentConfig.authPrefix}/logout`);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        setState({ user: null, loading: false, error: null });
      }
    },
    loading: state.loading,
    error: state.error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth };
