import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar, BottomNavigation, PrivateRoute } from './navigation';
import { Login } from './pages/Login';
import { Propiedades } from './pages/Propiedades';
import { Layout } from './layouts/Layout';
import { Register } from './components/Register';
import Assets from './pages/Assets';
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
import { Configuracion } from './pages/Configuracion';
import { ErrorBoundary } from './components/common';
import theme from './context/ThemeContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import AuthCallback from './components/auth/AuthCallback';
import Tareas from './pages/Tareas';
import { ValuesVisibilityProvider } from './context/ValuesVisibilityContext';
import { Archivo } from './pages/Archivo';
import Tiempo from './pages/Tiempo';
import { NavigationBarProvider } from './context/NavigationBarContext';
import { useAuth } from './context/AuthContext';
import AuthError from './components/auth/AuthError';
import { RutinasProvider } from './components/rutinas/context/RutinasContext.jsx';
import { RutinasHistoryProvider } from './components/rutinas/context/RutinasHistoryContext';
import PropiedadDocumentos from './components/propiedades/PropiedadDocumentos';
import Inversiones from './pages/Inversiones';
import Autos from './pages/Autos';
import Preferencias from './pages/Preferencias';
import { MercadoPagoCallbackPage } from './pages/MercadoPagoCallbackPage';
import { menuItems } from './navigation/menuStructure';

// Función utilitaria para buscar path por id
function findPathById(id, items = menuItems) {
  for (const item of items) {
    if (item.id === id && item.path) return item.path;
    if (item.subItems) {
      const found = findPathById(id, item.subItems);
      if (found) return found;
    }
  }
  return null;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Usar findPathById para obtener los paths dinámicamente
  const rutinasPath = findPathById('rutinas');
  const autosPath = findPathById('autos');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <ValuesVisibilityProvider>
        <NavigationBarProvider>
          <RutinasHistoryProvider>
          <ErrorBoundary>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={user ? <Navigate to="/assets" replace /> : <Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/mercadopago/callback" element={<MercadoPagoCallbackPage />} />
              
              {/* Ruta raíz redirige a /assets */}
              <Route path="/" element={<Navigate to="/assets" replace />} />
              
              {/* Rutas protegidas */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {/* Ruta principal de Assets */}
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/assets/propiedades" element={<Propiedades />} />
                  
                  {/* Rutas anidadas para Assets/Finanzas */}
                  <Route path="/assets/finanzas" element={<Transacciones />} />
                  <Route path="/assets/finanzas/cuentas" element={<Cuentas />} />
                  <Route path="/assets/finanzas/monedas" element={<Monedas />} />
                  <Route path="/assets/finanzas/inversiones" element={<Inversiones />} />
                  <Route path="/assets/finanzas/deudores" element={<Deudores />} />
                  <Route path="/assets/finanzas/recurrente" element={<Recurrente />} />
                  
                  {/* Rutas anidadas para Assets/Propiedades */}
                  <Route path="/assets/propiedades/inquilinos" element={<Inquilinos />} />
                  <Route path="/assets/propiedades/contratos" element={<Contratos />} />
                  <Route path="/assets/propiedades/inventario" element={<Inventario />} />
                  <Route path="/assets/propiedades/autos" element={<Autos />} />
                  
                  {/* Rutas principales y anidadas para Salud */}
                  <Route path="/salud" element={<Salud />} />
                  {/* <Route path="/salud/rutinas" element={<Rutinas />} /> */}
                  <Route path="/salud/lab" element={<Lab />} />
                  <Route path="/salud/dieta" element={<Dieta />} />
                  <Route path="/salud/datacorporal" element={<DataCorporal />} />
                  
                  {/* Rutas principales y anidadas para Tiempo */}
                  <Route path="/tiempo" element={<Tiempo />} />
                  <Route path="/tiempo/proyectos" element={<Proyectos />} />
                  <Route path="/tiempo/tareas" element={<Tareas />} />
                  <Route path="/tiempo/archivo" element={<Archivo />} />
                  {/* Usar path dinámico para Rutinas y Autos */}
                  {rutinasPath && <Route path={rutinasPath} element={<Rutinas />} />}
                  {autosPath && <Route path={autosPath} element={<Autos />} />}
                  
                  {/* Rutas anidadas para Setup */}
                  <Route path="/configuracion" element={<Configuracion />} />
                  <Route path="/configuracion/perfil" element={<Perfil />} />
                  <Route path="/configuracion/preferencias" element={<Preferencias />} />
                  
                  {/* Ruta especial para documentos de propiedades */}
                  <Route path="/propiedades/documentos" element={<PropiedadDocumentos />} />
                </Route>
              </Route>

              {/* Ruta 404 */}
              <Route path="*" element={<Navigate to="/assets" replace />} />
            </Routes>
          </ErrorBoundary>
            </RutinasHistoryProvider>
        </NavigationBarProvider>
      </ValuesVisibilityProvider>
    </ThemeProvider>
  );
}

export default App;
