import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import clienteAxios from '../config/axios';
import currentConfig from '../config/envConfig';

const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

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

  // Refs para evitar múltiples llamadas
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const CHECK_COOLDOWN = 2000; // 2 segundos entre checks

  const checkAuth = useCallback(async () => {
    try {
      // Prevenir múltiples llamadas simultáneas
      if (isCheckingRef.current) {
        console.log('🔄 Check auth ya en progreso, saltando...');
        return state.isAuthenticated;
      }
      
      // Rate limiting para evitar demasiadas peticiones
      const now = Date.now();
      if (now - lastCheckTimeRef.current < CHECK_COOLDOWN) {
        console.log('🕒 Check auth en cooldown, saltando...');
        return state.isAuthenticated;
      }
      
      isCheckingRef.current = true;
      lastCheckTimeRef.current = now;

      const token = localStorage.getItem('token');
      if (!token) {
        setState(prev => ({ ...prev, user: null, loading: false, isAuthenticated: false }));
        isCheckingRef.current = false;
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
        isCheckingRef.current = false;
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          user: null, 
          loading: false, 
          isAuthenticated: false 
        }));
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        isCheckingRef.current = false;
        return false;
      }
    } catch (error) {
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
              
              // Verificar directamente con el nuevo token
              const { data: verifyData } = await clienteAxios.get(`${currentConfig.authPrefix}/check`);
              if (verifyData.authenticated && verifyData.user) {
                setState(prev => ({ 
                  ...prev, 
                  user: verifyData.user, 
                  loading: false, 
                  isAuthenticated: true,
                  error: null 
                }));
                isCheckingRef.current = false;
                return true;
              }
            }
          }
        } catch (refreshError) {
          console.log('🚨 Error al refrescar token:', refreshError.message);
          // Limpiar tokens inválidos
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete clienteAxios.defaults.headers.common['Authorization'];
        }
      }
      setState(prev => ({ 
        ...prev, 
        user: null, 
        error: error.response?.data?.message || error.message,
        loading: false,
        isAuthenticated: false
      }));
      isCheckingRef.current = false;
      return false;
    }
  }, [state.isAuthenticated]);

  const login = async (credentials) => {
    try {
      // Prevenir múltiples logins simultáneos
      if (state.loading || isCheckingRef.current) {
        console.log('🔄 Login ya en progreso, saltando...');
        return;
      }
      
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
      
      // Establecer estado directamente sin llamar checkAuth
      setState(prev => ({ 
        ...prev, 
        user: user || null,
        loading: false, 
        isAuthenticated: true,
        error: null 
      }));
      
      // Resetear el ref de checking
      isCheckingRef.current = false;
      lastCheckTimeRef.current = Date.now();
      
      return response.data;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.message || error.message,
        isAuthenticated: false 
      }));
      isCheckingRef.current = false;
      throw error;
    }
  };

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
        
        // Establecer estado directamente
        setState(prev => ({ 
          ...prev, 
          user: data.user || null,
          loading: false,
          isAuthenticated: true,
          error: null
        }));
        
        // Resetear refs
        isCheckingRef.current = false;
        lastCheckTimeRef.current = Date.now();
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
      console.log('Error en logout:', error.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      
      // Resetear refs
      isCheckingRef.current = false;
      lastCheckTimeRef.current = 0;
      
      setState({ 
        user: null, 
        loading: false, 
        error: null, 
        isAuthenticated: false 
      });
      
      // Redirigir solo si no estamos ya en login
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/auth')) {
        window.location.href = `${currentConfig.frontendUrl}/login`;
      }
    }
  };

  useEffect(() => {
    // Solo ejecutar una vez al montar el componente
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setState(prev => ({ ...prev, loading: false, isAuthenticated: false }));
    }
  }, []); // Sin dependencias para evitar re-ejecuciones

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
