import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Propiedades } from './pages/Propiedades';
import { Layout } from './layouts/Layout';
import { Register } from './components/Register';
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import { Recurrente } from './pages/Recurrente';
import Rutinas from './pages/Rutinas';
import Lab from './pages/Lab';
import Proyectos from './pages/Proyectos';
import Perfil from './pages/Perfil';
import { Habitaciones } from './pages/Habitaciones';
import { Monedas } from './pages/Monedas';
import { Cuentas } from './pages/Cuentas';
import { Inquilinos } from './pages/Inquilinos';
import { Contratos } from './pages/Contratos';
import { Inventario } from './pages/Inventario';
import Dieta from './pages/Dieta';
import DataCorporal from './pages/DataCorporal';
import { Deudores } from './pages/Deudores';
import { Salud } from './pages/Salud';
import ErrorBoundary from './components/ErrorBoundary';
import theme from './context/ThemeContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import AuthCallback from './components/auth/AuthCallback';
import Tareas from './pages/Tareas';
import { ValuesVisibilityProvider } from './context/ValuesVisibilityContext';
import { Archivo } from './pages/Archivo';
import { NavigationBarProvider } from './context/NavigationBarContext';
import { useAuth } from './context/AuthContext';
import AuthError from './components/auth/AuthError';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <ValuesVisibilityProvider>
        <NavigationBarProvider>
          <ErrorBoundary>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/error" element={<AuthError />} />
              
              {/* Ruta raíz */}
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
              
              {/* Rutas protegidas */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/propiedades" element={<Propiedades />} />
                  <Route path="/transacciones" element={<Transacciones />} />
                  <Route path="/recurrente" element={<Recurrente />} />
                  <Route path="/rutinas" element={<Rutinas />} />
                  <Route path="/lab" element={<Lab />} />
                  <Route path="/proyectos" element={<Proyectos />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/habitaciones" element={<Habitaciones />} />
                  <Route path="/monedas" element={<Monedas />} />
                  <Route path="/cuentas" element={<Cuentas />} />
                  <Route path="/inquilinos" element={<Inquilinos />} />
                  <Route path="/contratos" element={<Contratos />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/dieta" element={<Dieta />} />
                  <Route path="/datacorporal" element={<DataCorporal />} />
                  <Route path="/deudores" element={<Deudores />} />
                  <Route path="/salud" element={<Salud />} />
                  <Route path="/tareas" element={<Tareas />} />
                  <Route path="/archivo" element={<Archivo />} />
                </Route>
              </Route>

              {/* Ruta 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </NavigationBarProvider>
      </ValuesVisibilityProvider>
    </ThemeProvider>
  );
}

export default App;
