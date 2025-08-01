import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar, BottomNavigation, PrivateRoute } from './navigation';
import { Login } from './pages/Login';
import { Propiedades } from './pages/Propiedades';
import { Layout } from './layouts/Layout';
import { Register } from './pages';
import Finanzas from './pages/Finanzas';
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
import { ThemeProvider, CssBaseline } from './utils/materialImports';
import { Toaster } from 'react-hot-toast';
import AuthCallback from './components/auth/AuthCallback';
import Tareas from './pages/Tareas';
import { ValuesVisibilityProvider } from './context/ValuesVisibilityContext';
import { Archivo } from './pages/Archivo';

import { NavigationBarProvider } from './context/NavigationBarContext';
import { useAuth } from './context/AuthContext';
import AuthError from './components/auth/AuthError';
import { RutinasProvider } from './context/RutinasContext';
import PropiedadDocumentos from './components/propiedades/PropiedadDocumentos';
import Inversiones from './pages/Inversiones';
import Autos from './pages/Autos';
import Preferencias from './pages/Preferencias';
import { MercadoPagoCallbackPage } from './pages/MercadoPagoCallbackPage';
import { modulos } from './navigation/menuStructure';
import { SidebarProvider } from './context/SidebarContext';

// Función utilitaria para buscar path por id
function findPathById(id, items = modulos) {
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

  // Debug del estado de autenticación
  console.log('🏠 APP RENDER:', {
    user: user ? 'presente' : 'ausente',
    loading,
    userEmail: user?.email,
    isAuthenticated: !!user,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });

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
            <SidebarProvider>
              <ErrorBoundary>
                <Routes>
                  {/* Rutas públicas */}
                  <Route path="/login" element={user ? <Navigate to="/assets/finanzas" replace /> : <Login />} />
                  <Route path="/registro" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/callback/*" element={<AuthCallback />} />
                  <Route path="/auth/error" element={<AuthError />} />
                  <Route path="/mercadopago/callback" element={<MercadoPagoCallbackPage />} />
                  
                  {/* Ruta raíz redirige a finanzas */}
                  <Route path="/" element={<Navigate to="/assets/finanzas" replace />} />
                  
                  {/* Rutas de fallback para rutas antiguas */}
                  <Route path="/dashboard" element={<Navigate to="/assets/finanzas" replace />} />
                  <Route path="/dashboard/*" element={<Navigate to="/assets/finanzas" replace />} />
                  <Route path="/home" element={<Navigate to="/assets/finanzas" replace />} />
                  <Route path="/home/*" element={<Navigate to="/assets/finanzas" replace />} />
                  
                  {/* Rutas protegidas */}
                  <Route element={<PrivateRoute />}>
                    <Route element={<Layout />}>
                      {/* Módulo Assets - redirige a finanzas */}
                      <Route path="/assets" element={<Navigate to="/assets/finanzas" replace />} />
                      <Route path="/assets/finanzas" element={<Finanzas />} />
                      <Route path="/assets/propiedades" element={<Propiedades />} />
                      <Route path="/assets/finanzas/transacciones" element={<Transacciones />} />
                      <Route path="/assets/finanzas/cuentas" element={<Cuentas />} />
                      <Route path="/assets/finanzas/monedas" element={<Monedas />} />
                      <Route path="/assets/finanzas/inversiones" element={<Inversiones />} />
                      <Route path="/assets/finanzas/deudores" element={<Deudores />} />
                      <Route path="/assets/finanzas/recurrente" element={<Recurrente />} />
                      
                      {/* Rutas anidadas para Assets/Propiedades */}
                      <Route path="/assets/propiedades/inquilinos" element={<Inquilinos />} />
                      <Route path="/assets/propiedades/contratos" element={<Contratos />} />
                      <Route path="/assets/propiedades/habitaciones" element={<Habitaciones />} />
                      <Route path="/assets/propiedades/inventario" element={<Inventario />} />
                      <Route path="/assets/propiedades/autos" element={<Autos />} />
                      
                      {/* Módulo Salud - redirige a data corporal */}
                      <Route path="/salud" element={<Navigate to="/salud/datacorporal" replace />} />
                      <Route path="/salud/datacorporal" element={<DataCorporal />} />
                      <Route path="/salud/lab" element={<Lab />} />
                      <Route path="/salud/dieta" element={<Dieta />} />
                      
                      {/* Módulo Tiempo - redirige a rutinas */}
                      <Route path="/tiempo" element={<Navigate to="/tiempo/rutinas" replace />} />
                      <Route path="/tiempo/rutinas" element={<Rutinas />} />
                      <Route path="/tiempo/proyectos" element={<Proyectos />} />
                      <Route path="/tiempo/tareas" element={<Tareas />} />
                      <Route path="/tiempo/archivo" element={<Archivo />} />
                      
                      {/* Usar path dinámico para Autos */}
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
                  <Route path="*" element={<Navigate to="/assets/finanzas" replace />} />
                </Routes>
              </ErrorBoundary>
            </SidebarProvider>
        </NavigationBarProvider>
      </ValuesVisibilityProvider>
    </ThemeProvider>
  );
}

export default App;
