import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import clienteAxios from '../config/axios';
import currentConfig from '../config/envConfig';
import { useAppConfig } from '../hooks/useAppDetection.js';

const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación.
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Refs para control de estado
  const isInitialized = useRef(false);
  const isChecking = useRef(false);

  // Función simplificada para verificar autenticación
  const checkAuth = useCallback(async () => {
    if (isChecking.current) {
      return isAuthenticated;
    }

    try {
      isChecking.current = true;
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return false;
      }

      // Configurar token en axios
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Timeout más generoso para reducir errores falsos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Verificación de autenticación tardó demasiado')), 15000)
      );
      
      const requestPromise = clienteAxios.get(`${currentConfig.authPrefix}/check`);
      
      const { data } = await Promise.race([requestPromise, timeoutPromise]);
      
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setError(null);
        setLoading(false);
        return true;
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.log('Error en checkAuth:', error.message);
      
      // Si es 401, intentar refresh una sola vez
      if (error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            // Timeout para refresh también
            const refreshTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout en refresh token')), 10000)
            );
            
            const refreshRequestPromise = clienteAxios.post(`${currentConfig.authPrefix}/refresh-token`, {
              refreshToken
            });
            
            const { data: refreshData } = await Promise.race([refreshRequestPromise, refreshTimeoutPromise]);
            
            if (refreshData.token) {
              localStorage.setItem('token', refreshData.token);
              if (refreshData.refreshToken) {
                localStorage.setItem('refreshToken', refreshData.refreshToken);
              }
              
              clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${refreshData.token}`;
              
              // Verificar con el nuevo token - sin timeout adicional
              const { data: verifyData } = await clienteAxios.get(`${currentConfig.authPrefix}/check`);
              if (verifyData.authenticated && verifyData.user) {
                setUser(verifyData.user);
                setIsAuthenticated(true);
                setError(null);
                setLoading(false);
                return true;
              }
            }
          }
        } catch (refreshError) {
          console.log('Error al refrescar token:', refreshError.message);
        }
      }
      
      // Limpiar tokens inválidos
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      
      setUser(null);
      setIsAuthenticated(false);
      setError(error.response?.data?.message || error.message);
      setLoading(false);
      return false;
    } finally {
      isChecking.current = false;
    }
  }, []);

  // Login simplificado con protección contra múltiples llamadas
  const login = useCallback(async (credentials) => {
    // Prevenir múltiples llamadas simultáneas
    if (isChecking.current) {
      console.log('Login ya en progreso, ignorando llamada duplicada');
      return;
    }
    
    try {
      isChecking.current = true;
      setLoading(true);
      setError(null);
      
      const response = await clienteAxios.post(`${currentConfig.authPrefix}/login`, credentials);
      const { token, refreshToken, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      // Guardar tokens
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Configurar axios
      clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Log solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 LOGIN EXITOSO:', {
          userId: userData?.id,
          token: token ? 'presente' : 'ausente',
          refreshToken: refreshToken ? 'presente' : 'ausente'
        });
      }
      
      setUser(userData || null);
      setIsAuthenticated(true);
      setError(null);
      setLoading(false);
      
      return response.data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setError(error.response?.data?.message || error.message);
      setLoading(false);
      throw error;
    } finally {
      isChecking.current = false;
    }
  }, []);

  // Login con Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Timeout optimizado para Google OAuth
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La petición tardó demasiado')), 20000)
      );
      
      const requestPromise = clienteAxios.get(`${currentConfig.authPrefix}/google/url?origin=${window.location.origin}`);
      
      const { data } = await Promise.race([requestPromise, timeoutPromise]);
      
      if (data.url) {
        // Resetear loading antes de redirigir
        setLoading(false);
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL de autenticación');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      setLoading(false);
      throw error;
    }
  }, []);

  // Callback de Google
  const handleGoogleCallback = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await clienteAxios.post(`${currentConfig.authPrefix}/google/callback`, { code });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        setUser(data.user || null);
        setIsAuthenticated(true);
        setError(null);
        setLoading(false);
      } else {
        throw new Error('No se recibió el token de autenticación');
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setError('Error al completar la autenticación con Google');
      setLoading(false);
    }
  }, []);

  // Logout simplificado
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        await clienteAxios.post(`${currentConfig.authPrefix}/logout`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.log('Error en logout:', error.message);
    } finally {
      // Limpiar todo
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete clienteAxios.defaults.headers.common['Authorization'];
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
      
      // Redirigir solo si no estamos ya en login
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/auth')) {
        // Usar redirección simple y confiable
        window.location.replace('/#/login');
      }
    }
  }, []);

  // Inicialización única
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const token = localStorage.getItem('token');
      if (token) {
        // Llamar checkAuth directamente sin dependencia para evitar re-ejecuciones
        const initializeAuth = async () => {
          try {
            isChecking.current = true;
            const token = localStorage.getItem('token');
            
            if (!token) {
              setUser(null);
              setIsAuthenticated(false);
              setLoading(false);
              return false;
            }

            // Configurar token en axios
            clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Timeout más generoso para verificación inicial
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout: Verificación inicial tardó demasiado')), 12000)
            );
            
            const requestPromise = clienteAxios.get(`${currentConfig.authPrefix}/check`);
            
            const { data } = await Promise.race([requestPromise, timeoutPromise]);
            
            if (data.authenticated && data.user) {
              setUser(data.user);
              setIsAuthenticated(true);
              setError(null);
              setLoading(false);
              return true;
            } else {
              // Token inválido, limpiar
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              delete clienteAxios.defaults.headers.common['Authorization'];
              
              setUser(null);
              setIsAuthenticated(false);
              setLoading(false);
              return false;
            }
          } catch (error) {
            console.log('Error en inicialización de auth:', error.message);
            
            // Limpiar tokens inválidos
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            delete clienteAxios.defaults.headers.common['Authorization'];
            
            setUser(null);
            setIsAuthenticated(false);
            setError(error.response?.data?.message || error.message);
            setLoading(false);
            return false;
          } finally {
            isChecking.current = false;
          }
        };
        
        initializeAuth();
      } else {
        setLoading(false);
      }
    }
  }, []); // Sin dependencias para evitar re-ejecuciones

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
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
