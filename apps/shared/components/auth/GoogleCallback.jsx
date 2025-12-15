import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clienteAxios from '../../config/axios.js';

function GoogleCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        
        if (!token) {
          console.error('No se recibió token en el callback');
          navigate('/auth/error?message=no_token');
          return;
        }

        // Guardar tokens
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Configurar el token en axios
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Redirigir a inicio (flujo legacy no usado)
        navigate('/');
      } catch (error) {
        console.error('Error en el callback de Google:', error);
        navigate('/auth/error?message=auth_failed');
      }
    };

    handleGoogleCallback();
  }, [navigate]); // Remover checkAuth de las dependencias

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Procesando autenticación...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}

export default GoogleCallback; 
