import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Importaciones compartidas
import { PrivateRoute } from '@shared/navigation';
import { Layout } from '@shared/layouts/Layout';
import { Login } from '@shared/pages/Login';
import { Register } from '@shared/pages/Register';
import AuthCallback from '@shared/components/auth/AuthCallback';
import AuthError from '@shared/components/auth/AuthError';
import { AppLoadingScreen, ErrorBoundary } from '@shared/components/common';
import theme from '@shared/context/ThemeContext';
import { ValuesVisibilityProvider } from '@shared/context/ValuesVisibilityContext';
import { NavigationBarProvider } from '@shared/context/NavigationBarContext';
import { SidebarProvider } from '@shared/context/SidebarContext';
import { UISettingsProvider } from '@shared/context/UISettingsContext';
import { useAuth } from '@shared/context/AuthContext';

// Importaciones específicas de Atta
import Finanzas from './pages/Finanzas';
import Propiedades from './pages/Propiedades';
import Transacciones from './pages/Transacciones';
import Cuentas from './pages/Cuentas';
import Monedas from './pages/Monedas';
import Inquilinos from './pages/Inquilinos';
import Contratos from './pages/Contratos';
import Inventario from './pages/Inventario';
import Deudores from './pages/Deudores';
import Recurrente from './pages/Recurrente';
import Inversiones from './pages/Inversiones';
import Autos from './pages/Autos';
import { MercadoPagoCallbackPage } from '@shared/pages/MercadoPagoCallbackPage';
import Perfil from '@shared/pages/Perfil';
import Configuracion from '@shared/pages/Configuracion';
import Preferencias from '@shared/pages/Preferencias';

function App() {
  const { user, loading } = useAuth();

  // Debug del estado de autenticación (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && !user && !loading) {
    console.log('🏠 ATTA AUTH STATE:', { authenticated: !!user, loading });
  }

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <ValuesVisibilityProvider>
        <NavigationBarProvider>
          <SidebarProvider>
            <UISettingsProvider>
              <ErrorBoundary>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={user ? <Navigate to="/finanzas" replace /> : <Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/callback/*" element={<AuthCallback />} />
                <Route path="/auth/error" element={<AuthError />} />
                <Route path="/mercadopago/callback" element={<MercadoPagoCallbackPage />} />
                
                {/* Ruta raíz redirige a finanzas */}
                <Route path="/" element={<Navigate to="/finanzas" replace />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route element={<Layout />}>
                    {/* Módulo Finanzas */}
                    <Route path="/finanzas" element={<Finanzas />} />
                    <Route path="/finanzas/transacciones" element={<Transacciones />} />
                    <Route path="/finanzas/cuentas" element={<Cuentas />} />
                    <Route path="/finanzas/monedas" element={<Monedas />} />
                    <Route path="/finanzas/inversiones" element={<Inversiones />} />
                    <Route path="/finanzas/deudores" element={<Deudores />} />
                    <Route path="/finanzas/recurrente" element={<Recurrente />} />
                    
                    {/* Módulo Propiedades */}
                    <Route path="/propiedades" element={<Propiedades />} />
                    <Route path="/propiedades/inquilinos" element={<Inquilinos />} />
                    <Route path="/propiedades/contratos" element={<Contratos />} />
                    <Route
                      path="/propiedades/habitaciones"
                      element={<Navigate to="/propiedades" replace />}
                    />
                    <Route path="/propiedades/inventario" element={<Inventario />} />
                    <Route path="/propiedades/inventario/en-propiedades" element={<Inventario />} />
                    <Route path="/propiedades/inventario/sin-ubicacion" element={<Inventario />} />
                    <Route path="/propiedades/autos" element={<Autos />} />
                    
                    {/* Configuración */}
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/configuracion/perfil" element={<Perfil />} />
                    <Route path="/configuracion/preferencias" element={<Preferencias />} />
                  </Route>
                </Route>

                {/* Ruta 404 */}
                <Route path="*" element={<Navigate to="/finanzas" replace />} />
              </Routes>
              </ErrorBoundary>
            </UISettingsProvider>
          </SidebarProvider>
        </NavigationBarProvider>
      </ValuesVisibilityProvider>
    </ThemeProvider>
  );
}

export default App;
