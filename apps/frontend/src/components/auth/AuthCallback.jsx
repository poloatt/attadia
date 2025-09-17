import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import clienteAxios from '../../config/axios';
// import { logEnvironment } from '../../config/envConfig';

// Registrar información del entorno para depuración
// logEnvironment();

const ERROR_MESSAGES = {
  'auth_failed': 'La autenticación con Google falló',
  'no_user_info': 'No se pudo obtener la información del usuario',
  'server_error': 'Error en el servidor',
  'token_missing': 'No se recibió el token de autenticación',
  'default': 'Error desconocido en la autenticación'
};

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  console.log('🔍 AuthCallback renderizado:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  });

  useEffect(() => {
    console.log('🔍 AuthCallback useEffect ejecutado');
    const handleCallback = async () => {
      try {
        console.log('Iniciando manejo de callback de Google');
        
        // Buscar parámetros tanto en location.search como en la URL completa
        let params = new URLSearchParams(location.search);
        let token = params.get('token');
        let refreshToken = params.get('refreshToken');
        let error = params.get('error');
        
        // Si no se encuentran en location.search, buscar en la URL completa
        if (!token && !error) {
          const urlParams = new URLSearchParams(window.location.search);
          token = urlParams.get('token');
          refreshToken = urlParams.get('refreshToken');
          error = urlParams.get('error');
        }
        
        console.log('Parámetros encontrados:', {
          token: token ? 'presente' : 'ausente',
          refreshToken: refreshToken ? 'presente' : 'ausente',
          error: error || 'ninguno',
          locationSearch: location.search,
          windowLocationSearch: window.location.search,
          fullUrl: window.location.href
        });

        if (error) {
          console.error('Error en callback:', error);
          toast.error(ERROR_MESSAGES[error] || ERROR_MESSAGES.default);
          navigate('/login');
          return;
        }

        if (!token) {
          console.error('No se recibió token de autenticación');
          console.log('Redirigiendo a login porque no hay token en el callback');
          toast.error('Sesión de autenticación inválida. Por favor, inicia sesión nuevamente.');
          navigate('/login');
          return;
        }

        console.log('Token recibido:', {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          refreshTokenPresent: !!refreshToken
        });

        // Guardar tokens
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Configurar axios
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verificación rápida del token
        console.log('Token recibido exitosamente, validando...');
        
        // Decodificar el token JWT para obtener la información del usuario
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token decodificado:', tokenPayload);
          
          // Verificar que el token no esté expirado
          if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
            throw new Error('El token ha expirado');
          }
          
          // Actualizar el contexto de autenticación con timeout
          if (tokenPayload.user) {
            console.log('Actualizando contexto de autenticación...');
            
            // Timeout para checkAuth
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout: Verificación de autenticación tardó demasiado')), 5000)
            );
            
            const authPromise = checkAuth();
            
            try {
              await Promise.race([authPromise, timeoutPromise]);
              console.log('Contexto de autenticación actualizado exitosamente');
            } catch (authError) {
              console.warn('Error al actualizar contexto (continuando):', authError.message);
              // Continuar sin bloquear, el token ya está guardado
            }
          }
        } catch (tokenError) {
          console.error('Error al procesar token:', tokenError);
          // Si hay error con el token, limpiar y redirigir
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete clienteAxios.defaults.headers.common['Authorization'];
          toast.error('Token de autenticación inválido');
          navigate('/login');
          return;
        }
        
        toast.success('¡Bienvenido!');
        navigate('/assets/finanzas', { replace: true });
      } catch (error) {
        console.error('Error en el callback:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        toast.error(error.response?.data?.message || 'Error en la autenticación');
        navigate('/login');
      }
    };

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
