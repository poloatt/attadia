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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Iniciando manejo de callback de Google');
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const error = params.get('error');

        if (error) {
          console.error('Error en callback:', error);
          toast.error(ERROR_MESSAGES[error] || ERROR_MESSAGES.default);
          navigate('/login');
          return;
        }

        if (!token) {
          console.error('No se recibió token de autenticación');
          toast.error(ERROR_MESSAGES.token_missing);
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

        // Esperar un momento inicial para asegurar que el token esté procesado
        console.log('Esperando procesamiento inicial del token...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Función para verificar autenticación con reintentos
        const verifyAuth = async (retries = 5, delay = 1000) => {
          for (let i = 0; i < retries; i++) {
            try {
              console.log(`Intento ${i + 1} de verificación de autenticación`);
              
              // Esperar un momento antes de cada intento
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              const { data } = await clienteAxios.get('/api/auth/check');
              
              console.log(`Respuesta del intento ${i + 1}:`, {
                authenticated: data.authenticated,
                hasUser: !!data.user,
                error: data.error,
                userEmail: data.user?.email
              });
              
              if (data.authenticated && data.user) {
                console.log('Autenticación exitosa en intento', i + 1);
                return { success: true, data };
              } else {
                console.log('Verificación falló en intento', i + 1, data);
                if (data.error) {
                  console.log('Error específico:', data.error);
                }
              }
            } catch (verifyError) {
              console.error(`Error en intento ${i + 1}:`, verifyError);
              if (i === retries - 1) {
                throw verifyError;
              }
            }
          }
          return { success: false };
        };

        // Intentar verificación con reintentos
        const authResult = await verifyAuth();
        
        if (authResult.success) {
          console.log('Autenticación exitosa, redirigiendo a assets');
          toast.success('¡Bienvenido!');
          navigate('/assets/finanzas', { replace: true });
        } else {
          // Si fallan todos los reintentos, intentar con checkAuth como último recurso
          console.log('Intentando verificación con checkAuth como fallback');
          const checkAuthResult = await checkAuth();
          
          if (checkAuthResult) {
            console.log('Autenticación exitosa con checkAuth, redirigiendo a assets');
            toast.success('¡Bienvenido!');
            navigate('/assets/finanzas', { replace: true });
          } else {
            throw new Error('Fallo en la verificación de autenticación después de múltiples intentos');
          }
        }
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
