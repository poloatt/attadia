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

// Detectar si es móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Configurar axios con la URL base y credenciales
clienteAxios.defaults.baseURL = currentConfig.baseUrl;
clienteAxios.defaults.withCredentials = true;

// Configuraciones específicas para móvil
if (isMobile) {
  clienteAxios.defaults.timeout = 30000; // 30 segundos para móvil
  clienteAxios.defaults.headers.common['X-Device-Type'] = 'mobile';
}

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
  const CHECK_COOLDOWN = isMobile ? 3000 : 2000; // 3 segundos en móvil, 2 en desktop
  const loginAttemptsRef = useRef(0);
  const maxLoginAttempts = 3;

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
      
      // Timeout específico para móvil
      const config = isMobile ? { timeout: 30000 } : {};
      const { data } = await clienteAxios.get(`${currentConfig.authPrefix}/check`, config);
      
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
      console.log('🚨 Error en checkAuth:', error.message);
      
      // Manejo específico para errores de red en móvil
      if (isMobile && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
        console.log('📱 Error de red en móvil, manteniendo estado actual');
        setState(prev => ({ ...prev, loading: false }));
        isCheckingRef.current = false;
        return state.isAuthenticated; // Mantener estado actual en caso de error de red
      }
      
      if (error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const { data: refreshData } = await clienteAxios.post(`${currentConfig.authPrefix}/refresh`, {
              refreshToken
            }, { timeout: isMobile ? 30000 : 10000 });
            
            if (refreshData.token) {
              localStorage.setItem('token', refreshData.token);
              if (refreshData.refreshToken) {
                localStorage.setItem('refreshToken', refreshData.refreshToken);
              }
              clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${refreshData.token}`;
              
              // Verificar directamente con el nuevo token
              const { data: verifyData } = await clienteAxios.get(`${currentConfig.authPrefix}/check`, { timeout: isMobile ? 30000 : 10000 });
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
      
      // Control de intentos de login
      if (loginAttemptsRef.current >= maxLoginAttempts) {
        const timeSinceLastAttempt = Date.now() - lastCheckTimeRef.current;
        if (timeSinceLastAttempt < 60000) { // 1 minuto de cooldown
          throw new Error('Demasiados intentos de login. Espera un momento antes de intentar nuevamente.');
        }
        loginAttemptsRef.current = 0; // Resetear contador
      }
      
      loginAttemptsRef.current++;
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Timeout específico para móvil
      const config = isMobile ? { timeout: 30000 } : {};
      const response = await clienteAxios.post(`${currentConfig.authPrefix}/login`, credentials, config);
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
      
      // Resetear contadores
      isCheckingRef.current = false;
      lastCheckTimeRef.current = Date.now();
      loginAttemptsRef.current = 0;
      
      return response.data;
    } catch (error) {
      console.log('🚨 Error en login:', error.message);
      
      // Manejo específico para errores de red en móvil
      if (isMobile && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
          isAuthenticated: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.response?.data?.message || error.message,
          isAuthenticated: false 
        }));
      }
      
      isCheckingRef.current = false;
      throw error;
    }
  };

  const loginWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const config = isMobile ? { timeout: 30000 } : {};
      const { data } = await clienteAxios.get(`${currentConfig.authPrefix}/google/url`, config);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
    } catch (error) {
      console.log('🚨 Error en loginWithGoogle:', error.message);
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

      const config = isMobile ? { timeout: 30000 } : {};
      const { data } = await clienteAxios.post(`${currentConfig.authPrefix}/google/callback`, { code }, config);
      
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
        loginAttemptsRef.current = 0;
      } else {
        throw new Error('No se recibió el token de autenticación');
      }
    } catch (error) {
      console.log('🚨 Error en handleGoogleCallback:', error.message);
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
        const config = isMobile ? { timeout: 15000 } : {};
        await clienteAxios.post(`${currentConfig.authPrefix}/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
          ...config
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
      loginAttemptsRef.current = 0;
      
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
