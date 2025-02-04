import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function GoogleCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (token) {
        // Guardar el token
        localStorage.setItem('token', token);
        // Verificar la autenticación
        await checkAuth();
        // Redirigir al dashboard
        navigate('/dashboard');
      } else {
        // Si no hay token, redirigir al login
        navigate('/login');
      }
    };

    handleGoogleCallback();
  }, [navigate, checkAuth]);

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