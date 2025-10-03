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
import { ErrorBoundary } from '@shared/components/common';
import theme from '@shared/context/ThemeContext';
import { ValuesVisibilityProvider } from '@shared/context/ValuesVisibilityContext';
import { NavigationBarProvider } from '@shared/context/NavigationBarContext';
import { SidebarProvider } from '@shared/context/SidebarContext';
import { UISettingsProvider } from '@shared/context/UISettingsContext';
import { useAuth } from '@shared/context/AuthContext';

// Importaciones específicas de Pulso
import DataCorporal from './pages/DataCorporal';
import Dieta from './pages/Dieta';
import Lab from './pages/Lab';
import Salud from './pages/Salud';
import Perfil from '@shared/pages/Perfil';
import Configuracion from '@shared/pages/Configuracion';
import Preferencias from '@shared/pages/Preferencias';

function App() {
  const { user, loading } = useAuth();

  // Debug del estado de autenticación (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && !user && !loading) {
    console.log('💓 PULSO AUTH STATE:', { authenticated: !!user, loading });
  }

  if (loading) {
    return <div>Cargando Pulso...</div>;
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
                <Route path="/login" element={user ? <Navigate to="/datacorporal" replace /> : <Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/callback/*" element={<AuthCallback />} />
                <Route path="/auth/error" element={<AuthError />} />
                
                {/* Ruta raíz redirige a data corporal */}
                <Route path="/" element={<Navigate to="/datacorporal" replace />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route element={<Layout />}>
                    {/* Módulo Salud */}
                    <Route path="/datacorporal" element={<DataCorporal />} />
                    <Route path="/dieta" element={<Dieta />} />
                    <Route path="/lab" element={<Lab />} />
                    <Route path="/salud" element={<Salud />} />
                    
                    {/* Configuración */}
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/configuracion/perfil" element={<Perfil />} />
                    <Route path="/configuracion/preferencias" element={<Preferencias />} />
                  </Route>
                </Route>

                {/* Ruta 404 */}
                <Route path="*" element={<Navigate to="/datacorporal" replace />} />
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
