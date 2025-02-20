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
import ErrorBoundary from './components/ErrorBoundary';
import theme from './context/ThemeContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import GoogleCallback from './components/GoogleCallback';
import Tareas from './pages/Tareas';
import { ValuesVisibilityProvider } from './context/ValuesVisibilityContext';
import { Archivo } from './pages/Archivo';
import { NavigationBarProvider } from './context/NavigationBarContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <ValuesVisibilityProvider>
        <NavigationBarProvider>
          <ErrorBoundary>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/auth/callback" element={<GoogleCallback />} />
              
              {/* Rutas protegidas */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/propiedades" element={<Propiedades />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/transacciones" element={<Transacciones />} />
                  <Route path="/recurrente" element={<Recurrente />} />
                  <Route path="/rutinas" element={<Rutinas />} />
                  <Route path="/lab" element={<Lab />} />
                  <Route path="/proyectos" element={<Proyectos />} />
                  <Route path="/tareas" element={<Tareas />} />
                  <Route path="/habitaciones" element={<Habitaciones />} />
                  <Route path="/monedas" element={<Monedas />} />
                  <Route path="/cuentas" element={<Cuentas />} />
                  <Route path="/inquilinos" element={<Inquilinos />} />
                  <Route path="/contratos" element={<Contratos />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/dieta" element={<Dieta />} />
                  <Route path="/datacorporal" element={<DataCorporal />} />
                  <Route path="/archivo" element={<Archivo />} />
                </Route>
              </Route>

              {/* Redirigir a login si no hay ruta */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </NavigationBarProvider>
      </ValuesVisibilityProvider>
    </ThemeProvider>
  );
}

export default App;
