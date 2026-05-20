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
import { RutinasProvider } from '@shared/context/RutinasContext';
import { HabitsProvider } from '@shared/context/HabitsContext';
import { useAuth } from '@shared/context/AuthContext';

// Importaciones específicas de Foco
import Rutinas from './pages/Rutinas';
import Tareas from './pages/Tareas';
import { Objetivos } from './pages/Objetivos';
import Archivo from './pages/Archivo';
import Foco from './pages/Foco';
import Perfil from '@shared/pages/Perfil';
import Configuracion from '@shared/pages/Configuracion';
import Preferencias from '@shared/pages/Preferencias';

// Componente wrapper para manejar el estado de autenticación
function AppContent() {
  const { user, loading } = useAuth();

  // Debug del estado de autenticación (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && !user && !loading) {
    console.log('🎯 FOCO AUTH STATE:', { authenticated: !!user, loading });
  }

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={user ? <Navigate to="/foco" replace /> : <Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/callback/*" element={<AuthCallback />} />
      <Route path="/auth/error" element={<AuthError />} />
      
      {/* Ruta raíz redirige a Foco */}
      <Route path="/" element={<Navigate to="/foco" replace />} />
      
      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          {/* Módulo principal - Foco */}
          <Route path="/foco" element={<Foco />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/objetivos" element={<Objetivos />} />
          <Route path="/proyectos" element={<Navigate to="/objetivos" replace />} />
          <Route path="/tiempo/proyectos" element={<Navigate to="/objetivos" replace />} />
          <Route path="/tiempo/objetivos" element={<Navigate to="/objetivos" replace />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/archivo" element={<Archivo />} />
          
          {/* Configuración */}
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/configuracion/perfil" element={<Perfil />} />
          <Route path="/configuracion/preferencias" element={<Preferencias />} />
        </Route>
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/foco" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <ValuesVisibilityProvider>
        <NavigationBarProvider>
          <SidebarProvider>
            <UISettingsProvider>
              <RutinasProvider>
                <HabitsProvider>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </HabitsProvider>
              </RutinasProvider>
            </UISettingsProvider>
          </SidebarProvider>
        </NavigationBarProvider>
      </ValuesVisibilityProvider>
    </ThemeProvider>
  );
}

export default App;
