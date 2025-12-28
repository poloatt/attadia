import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import clienteAxios from '../config/axios';
import currentConfig, { getCurrentAppUrl } from '../config/envConfig';
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
  const lastCheckStart = useRef(null); // Para evitar quedarnos colgados en loading
  const lastVerificationAttempt = useRef(0); // Para debounce de verificaciones desde PWA

  // Función simplificada para verificar autenticación
  const checkAuth = useCallback(async () => {
    if (isChecking.current) {
      return isAuthenticated;
    }

    try {
      isChecking.current = true;
      lastCheckStart.current = Date.now();
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
      lastCheckStart.current = Date.now();
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
      
      // Guardar información del último usuario de Google si tiene googleId
      if (userData?.googleId) {
        try {
          const lastGoogleUser = {
            nombre: userData.nombre,
            email: userData.email,
            googleId: userData.googleId,
            timestamp: Date.now()
          };
          localStorage.setItem('lastGoogleUser', JSON.stringify(lastGoogleUser));
        } catch (error) {
          // Silenciar errores al guardar
          if (process.env.NODE_ENV === 'development') {
            console.log('Error al guardar último usuario de Google:', error);
          }
        }
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
  const loginWithGoogle = useCallback(async (options = {}) => {
    const { forceSelectAccount = false, loginHint } = options || {};
    try {
      setLoading(true);
      setError(null);
      
      // Timeout optimizado para Google OAuth
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La petición tardó demasiado')), 20000)
      );
      
      // Usar un origin web válido para apps (foco/atta/pulso) incluso en contenedores nativos
      const appOrigin = getCurrentAppUrl() || window.location.origin;

      const params = new URLSearchParams();
      params.set('origin', appOrigin);
      if (forceSelectAccount) {
        params.set('forceSelectAccount', 'true');
      }
      // Validar que loginHint sea un email válido antes de enviarlo
      if (loginHint && typeof loginHint === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(loginHint.trim())) {
          params.set('loginHint', loginHint.trim());
        } else if (process.env.NODE_ENV === 'development') {
          console.warn('loginHint inválido, ignorando:', loginHint);
        }
      }

      const requestPromise = clienteAxios.get(
        `${currentConfig.authPrefix}/google/url?${params.toString()}`,
        { withCredentials: false }
      );
      
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
        
        // Guardar información del último usuario de Google si tiene googleId
        if (data.user?.googleId) {
          try {
            const lastGoogleUser = {
              nombre: data.user.nombre,
              email: data.user.email,
              googleId: data.user.googleId,
              timestamp: Date.now()
            };
            localStorage.setItem('lastGoogleUser', JSON.stringify(lastGoogleUser));
          } catch (error) {
            // Silenciar errores al guardar
            if (process.env.NODE_ENV === 'development') {
              console.log('Error al guardar último usuario de Google:', error);
            }
          }
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
      // No limpiar lastGoogleUser para mantener la información del perfil
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

  // Detectar si estamos en PWA/móvil
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator?.standalone === true) ||
    (document.referrer && document.referrer.includes('android-app://'))
  );

  // Detectar si estamos en móvil
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Inicialización única
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      // En móviles/PWAs, dar un pequeño delay para asegurar que localStorage esté disponible
      const initDelay = (isPWA || isMobile) ? 300 : 0;
      
      setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          // Llamar checkAuth directamente sin dependencia para evitar re-ejecuciones
          const initializeAuth = async () => {
            try {
              isChecking.current = true;
              lastCheckStart.current = Date.now();
              const token = localStorage.getItem('token');
              
              if (!token) {
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                return false;
              }

              // Configurar token en axios
              clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              
              // Timeout estándar (no aumentamos porque no soluciona el problema de fondo)
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
              
              // En móviles/PWAs, si es timeout o error de red, no limpiar tokens inmediatamente
              // Permitir que el usuario intente de nuevo
              const isNetworkError = error.message?.includes('Timeout') || 
                                    error.message?.includes('Network') ||
                                    error.message?.includes('ERR_') ||
                                    !error.response;
              
              if (isNetworkError && (isPWA || isMobile)) {
                // En móviles, si es error de red, mantener tokens pero mostrar login
                // El usuario puede intentar de nuevo
                setUser(null);
                setIsAuthenticated(false);
                setError(null); // No mostrar error para no asustar al usuario
                setLoading(false);
                return false;
              }
              
              // Para otros errores o desktop, limpiar tokens
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
              lastCheckStart.current = null;
            }
          };
          
          initializeAuth();
        } else {
          setLoading(false);
        }
      }, initDelay);
    }
  }, []); // Sin dependencias para evitar re-ejecuciones

  // Listeners para eventos de ciclo de vida (importante para webapps en smartphones)
  useEffect(() => {
    // Función helper para verificar tokens de forma segura
    const VERIFICATION_DEBOUNCE_MS = 2000; // 2 segundos entre verificaciones

    const verifyTokensOnResume = async () => {
      // Prevenir múltiples verificaciones simultáneas desde diferentes listeners
      if (isChecking.current) {
        return;
      }

      // Debounce: evitar verificaciones muy frecuentes desde múltiples eventos de PWA
      const now = Date.now();
      if (now - lastVerificationAttempt.current < VERIFICATION_DEBOUNCE_MS) {
        return; // Ignorar si la última verificación fue hace menos de 2 segundos
      }
      lastVerificationAttempt.current = now;

      try {
        // Watchdog: si hay un check en progreso demasiado tiempo, forzar reset
        if (isChecking.current && lastCheckStart.current) {
          const elapsed = Date.now() - lastCheckStart.current;
          if (elapsed > 15000) { // 15 segundos
            if (process.env.NODE_ENV === 'development') {
              console.log('Watchdog de auth: check en progreso demasiado tiempo, reseteando estado');
            }
            isChecking.current = false;
            lastCheckStart.current = null;
            // Limpiar tokens locales para evitar loops infinitos
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            delete clienteAxios.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
        }

        // Si después de aplicar el watchdog seguimos en un check activo, no lanzar otro
        if (isChecking.current) {
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        // Solo verificar si el usuario está autenticado pero puede haber expirado el token
        if (isAuthenticated && user) {
          // Verificar token de forma silenciosa (sin cambiar loading state)
          // Timeout más corto para evitar que Render piense que el servicio está caído
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000) // Reducido a 3 segundos
          );
          
          clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const requestPromise = clienteAxios.get(`${currentConfig.authPrefix}/check`);
          
          try {
            const { data } = await Promise.race([requestPromise, timeoutPromise]);
            if (!data.authenticated || !data.user) {
              // Token inválido, intentar refresh
              await checkAuth();
            }
          } catch (error) {
            // Si falla, intentar refresh token solo si es 401
            // Ignorar timeouts para evitar que Render piense que el servicio está caído
            if (error.response?.status === 401) {
              await checkAuth();
            }
            // Silenciar otros errores (timeouts, network errors) para evitar reinicios
          }
        }
      } catch (error) {
        // Silenciar errores en verificación de fondo
        if (process.env.NODE_ENV === 'development') {
          console.log('Error en verificación de tokens al reanudar:', error.message);
        }
      }
    };

    // Listener para cuando la app vuelve a primer plano (visibilitychange)
    // Con debounce para evitar múltiples peticiones simultáneas
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Delay más largo para evitar peticiones inmediatas que puedan causar reinicios
        setTimeout(() => {
          verifyTokensOnResume();
        }, 500); // Aumentado a 500ms para dar tiempo al backend
      }
    };

    // Listener para cuando la página se restaura desde cache (pageshow)
    // Esto es crítico para PWAs en smartphones
    const handlePageShow = (event) => {
      // event.persisted indica que la página se cargó desde cache
      if (event.persisted) {
        // Delay más largo en móviles para asegurar que localStorage esté disponible
        // Y para evitar peticiones inmediatas que puedan causar reinicios
        const delay = isPWA || isMobile ? 1000 : 500; // Aumentado para dar más tiempo
        setTimeout(() => {
          verifyTokensOnResume();
        }, delay);
      }
    };

    // Listener adicional para focus (cuando la app vuelve a primer plano)
    // Específico para PWAs en móviles - CON DEBOUNCE
    const handleFocus = () => {
      if (isPWA || isMobile) {
        // Delay más largo para evitar peticiones inmediatas
        setTimeout(() => {
          verifyTokensOnResume();
        }, 800); // Aumentado para dar más tiempo al backend
      }
    };

    // Agregar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user, checkAuth, isPWA, isMobile]); // Dependencias necesarias para la verificación

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
