import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import clienteAxios from '../config/axios';
import currentConfig from '../config/envConfig';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Configurar axios
clienteAxios.defaults.baseURL = currentConfig.baseUrl;
clienteAxios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  // Ref para evitar múltiples llamadas simultáneas
  const isCheckingRef = useRef(false);

  // Función para verificar autenticación (sin dependencias)
  const checkAuth = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isCheckingRef.current) {
      return state.isAuthenticated;
    }

    try {
      isCheckingRef.current = true;
      
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
        return true;
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        setState(prev => ({ 
          ...prev, 
          user: null, 
          loading: false, 
          isAuthenticated: false 
        }));
        return false;
      }
    } catch (error) {
      console.log('Error en checkAuth:', error.message);
      
      // Si es 401, intentar refresh token
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
              
              // Verificar con el nuevo token
              const { data: verifyData } = await clienteAxios.get(`${currentConfig.authPrefix}/check`);
              if (verifyData.authenticated && verifyData.user) {
                setState(prev => ({ 
                  ...prev, 
                  user: verifyData.user, 
                  loading: false, 
                  isAuthenticated: true,
                  error: null 
                }));
                return true;
              }
            }
          }
        } catch (refreshError) {
          console.log('Error al refrescar token:', refreshError.message);
        }
      }
      
      // Limpiar tokens y estado
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      setState(prev => ({ 
        ...prev, 
        user: null, 
        error: null,
        loading: false,
        isAuthenticated: false
      }));
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  }, []); // Sin dependencias para evitar loops

  // Login
  const login = useCallback(async (credentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await clienteAxios.post(`${currentConfig.authPrefix}/login`, credentials);
      const { token, refreshToken, user } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setState(prev => ({ 
        ...prev, 
        user: user || null,
        loading: false, 
        isAuthenticated: true,
        error: null 
      }));
      
      return response.data;
    } catch (error) {
      console.log('Error en login:', error.message);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.message || error.message,
        isAuthenticated: false 
      }));
      throw error;
    }
  }, []);

  // Login con Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await clienteAxios.get(`${currentConfig.authPrefix}/google/url`);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.response?.data?.message || 'Error al iniciar sesión con Google',
        loading: false,
        isAuthenticated: false
      }));
      throw error;
    }
  }, []);

  // Callback de Google
  const handleGoogleCallback = useCallback(async (code) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data } = await clienteAxios.post(`${currentConfig.authPrefix}/google/callback`, { code });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        setState(prev => ({ 
          ...prev, 
          user: data.user || null,
          loading: false,
          isAuthenticated: true,
          error: null
        }));
      } else {
        throw new Error('No se recibió el token de autenticación');
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        user: null,
        error: 'Error al completar la autenticación con Google',
        loading: false
      }));
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await clienteAxios.post(`${currentConfig.authPrefix}/logout`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.log('Error en logout:', error.message);
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
      
      // Redirigir a login
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/auth')) {
        window.location.href = `${currentConfig.frontendUrl}/login`;
      }
    }
  }, []);

  // Verificar auth al cargar (solo una vez)
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await checkAuth();
      } else {
        setState(prev => ({ ...prev, loading: false, isAuthenticated: false }));
      }
    };

    initializeAuth();
  }, []); // Sin dependencias para ejecutar solo una vez

  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
    loginWithGoogle,
    handleGoogleCallback,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth };
