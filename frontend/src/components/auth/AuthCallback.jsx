import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import clienteAxios from '../../config/axios';

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

// Determinar el ambiente actual
const env = import.meta.env.MODE || 'development';
const currentConfig = config[env];

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
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          console.error('Error en callback:', error);
          toast.error('Error en la autenticación con Google');
          navigate('/login');
          return;
        }

        if (!code) {
          console.error('No se recibió código de autorización');
          toast.error('Error en la autenticación');
          navigate('/login');
          return;
        }

        // Realizar la petición al backend con el código
        const response = await clienteAxios.get(`${currentConfig.authPrefix}/google/callback?code=${code}`);
        const { token, refreshToken } = response.data;

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

        // Verificar autenticación
        const authResult = await checkAuth();
        
        if (authResult) {
          console.log('Autenticación exitosa, redirigiendo al dashboard');
          toast.success('¡Bienvenido!');
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Fallo en la verificación de autenticación');
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