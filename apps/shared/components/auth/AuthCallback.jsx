import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import clienteAxios from '../../config/axios.js';
import { useAppConfig } from '../../hooks/useAppDetection.js';

// Constantes
const ERROR_MESSAGES = {
  'auth_failed': 'La autenticación con Google falló',
  'no_user_info': 'No se pudo obtener la información del usuario',
  'server_error': 'Error en el servidor',
  'token_missing': 'No se recibió el token de autenticación',
  'access_denied': 'El usuario canceló la autenticación',
  'invalid_request': 'Solicitud de autenticación inválida',
  'unauthorized_client': 'Cliente no autorizado',
  'unsupported_response_type': 'Tipo de respuesta no soportado',
  'invalid_scope': 'Alcance inválido',
  'no_auth_code': 'No se recibió código de autorización',
  'default': 'Error desconocido en la autenticación'
};

const TIMEOUT_DURATION = 10000; // 10 segundos
const WELCOME_DELAY = 100; // 100ms

// Utilidades
const isDevelopment = process.env.NODE_ENV === 'development';

const log = (message, data = null) => {
  if (isDevelopment) {
    console.log(message, data || '');
  }
};

const logError = (message, error = null) => {
  console.error(message, error || '');
};

// Función para limpiar tokens y estado de autenticación
const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  delete clienteAxios.defaults.headers.common['Authorization'];
};

// Función para configurar tokens
const setAuthTokens = (token, refreshToken) => {
  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Función simplificada para extraer parámetros de URL
const extractUrlParams = (location) => {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  
  return {
    token: urlParams.get('token') || hashParams.get('token'),
    refreshToken: urlParams.get('refreshToken') || hashParams.get('refreshToken'),
    error: urlParams.get('error') || hashParams.get('error'),
    redirect: urlParams.get('redirect') || hashParams.get('redirect')
  };
};

// Función para validar token JWT
const validateJWTToken = (token) => {
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    
    // Verificar que el token no esté expirado
    if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
      throw new Error('El token ha expirado');
    }
    
    return tokenPayload;
  } catch (error) {
    throw new Error(`Token inválido: ${error.message}`);
  }
};

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  const { appName, appTitle, appPath } = useAppConfig();
  const hasProcessed = useRef(false);

  log('🔍 AuthCallback renderizado:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    hasProcessed: hasProcessed.current,
    appName,
    appTitle,
    appPath
  });

  // Función para manejar errores y redirigir
  const handleError = (message, error = null, shouldClearAuth = true) => {
    logError(message, error);
    if (shouldClearAuth) {
      clearAuthState();
    }
    toast.error(typeof message === 'string' ? message : 'Error en la autenticación');
    navigate('/login');
  };

  // Función para actualizar contexto de autenticación con timeout
  const updateAuthContext = async (tokenPayload) => {
    if (!tokenPayload.user) return;
    
    log('Actualizando contexto de autenticación...');
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Verificación de autenticación tardó demasiado')), TIMEOUT_DURATION)
    );
    
    try {
      await Promise.race([checkAuth(), timeoutPromise]);
      log('Contexto de autenticación actualizado exitosamente');
    } catch (authError) {
      console.warn('Error al actualizar contexto (continuando):', authError.message);
      // Continuar sin bloquear, el token ya está guardado
    }
  };

  // Función principal simplificada para manejar el callback
  const handleCallback = async () => {
    try {
      hasProcessed.current = true;
      log('Iniciando manejo de callback de Google');
      
      // Extraer parámetros de URL
      const { token, refreshToken, error, redirect } = extractUrlParams(location);
      
      log('Parámetros encontrados:', {
        token: token ? 'presente' : 'ausente',
        error: error || 'ninguno'
      });

      // Manejar errores de callback
      if (error) {
        const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES.default;
        handleError(`Error en callback: ${error}`, null, false);
        return;
      }

      // Verificar que se recibió el token
      if (!token) {
        logError('No se recibió token de autenticación');
        handleError('Sesión de autenticación inválida. Por favor, inicia sesión nuevamente.', null, false);
        return;
      }

      // Validar el token JWT
      let tokenPayload;
      try {
        tokenPayload = validateJWTToken(token);
        log('Token validado exitosamente');
      } catch (tokenError) {
        handleError('Token de autenticación inválido', tokenError);
        return;
      }

      // Configurar tokens en el estado de la aplicación
      setAuthTokens(token, refreshToken);

      // Actualizar contexto de autenticación
      await updateAuthContext(tokenPayload);
      
      // Mostrar mensaje de bienvenida y redirigir
      toast.dismiss();
      setTimeout(() => {
        toast.success(`¡Bienvenido a ${appTitle}!`, { id: 'welcome-message' });
      }, WELCOME_DELAY);
      
      // Si viene redirect, respetarlo; si no, ir a la home de la app detectada
      const target = redirect && redirect.startsWith('/') ? redirect : appPath;
      navigate(target, { replace: true });
      
    } catch (error) {
      handleError('Error en el callback', error);
    }
  };

  useEffect(() => {
    // Prevenir múltiples ejecuciones
    if (hasProcessed.current) {
      log('🔍 AuthCallback ya procesado, ignorando');
      return;
    }

    log('🔍 AuthCallback useEffect ejecutado');
    handleCallback();
  }, [navigate, location.search, checkAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Procesando autenticación...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}

export default AuthCallback; 
