import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute = () => {
  const { user, isLoading } = useAuth();

  // Mientras verifica la autenticación, muestra un loader
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Si no hay usuario, redirige al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestra el contenido protegido
  return <Outlet />;
}; 