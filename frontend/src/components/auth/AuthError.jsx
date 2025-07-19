import { useLocation, Link } from 'react-router-dom';

function AuthError() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const message = params.get('message');

  const getErrorMessage = () => {
    switch (message) {
      case 'google_auth_failed':
        return 'La autenticación con Google ha fallado.';
      case 'no_token':
        return 'No se recibió el token de autenticación.';
      case 'auth_failed':
        return 'Error en el proceso de autenticación.';
      default:
        return 'Ha ocurrido un error durante la autenticación.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{getErrorMessage()}</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthError; 
