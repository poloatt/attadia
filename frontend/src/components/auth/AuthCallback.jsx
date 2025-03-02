import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import clienteAxios from '../../config/axios';

// Configuración según el ambiente
const config = {
  development: {
    authPrefix: '/auth',
    apiPrefix: ''
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
        console.log('Iniciando manejo de callback');
        console.log('Ambiente:', env);
        console.log('Configuración:', currentConfig);
        
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const error = params.get('error');

        if (error) {
          console.error('Error en callback:', error);
          const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES.default;
          toast.error(errorMessage);
          navigate('/login', { replace: true });
          return;
        }

        if (!token || !refreshToken) {
          console.error('Token o refreshToken no encontrado en la URL');
          toast.error(ERROR_MESSAGES.token_missing);
          navigate('/login', { replace: true });
          return;
        }

        console.log('Tokens recibidos, procediendo a guardarlos');
        
        // Limpiar tokens existentes primero
        localStorage.clear(); // Limpiar todo el localStorage primero
        
        // Guardar nuevos tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Configurar Axios
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Tokens guardados y Axios configurado');
        
        // Verificar que el token se haya guardado correctamente
        const storedToken = localStorage.getItem('token');
        console.log('Token almacenado:', !!storedToken, storedToken);
        console.log('Headers de Axios:', clienteAxios.defaults.headers.common['Authorization']);
        
        // Verificar autenticación
        const authResult = await checkAuth();
        console.log('Resultado de checkAuth:', authResult);
        
        if (!authResult || authResult.error) {
          console.error('Error en checkAuth:', authResult?.error);
          throw new Error(authResult?.error || 'Error de autenticación');
        }

        // Redirigir al dashboard
        toast.success('¡Bienvenido!');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error en el manejo del callback:', error);
        // Limpiar tokens en caso de error
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete clienteAxios.defaults.headers.common['Authorization'];
        
        toast.error(ERROR_MESSAGES.default);
        navigate('/login', { replace: true });
      }
    };

    // Solo ejecutar si hay token en la URL
    const params = new URLSearchParams(location.search);
    if (params.get('token')) {
      handleCallback();
    }
  }, [navigate, location.search]); // Remover checkAuth de las dependencias

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