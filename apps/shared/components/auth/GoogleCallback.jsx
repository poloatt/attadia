import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clienteAxios from '../../config/axios.js';
import AppLoadingScreen from '../common/AppLoadingScreen.jsx';

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

  return <AppLoadingScreen message="Procesando autenticación…" />;
}

export default GoogleCallback; 
