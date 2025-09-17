import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import { UISettingsProvider } from './context/UISettingsContext'
import { ActionHistoryProvider } from './context/ActionHistoryContext'
import App from './App'
import axios from 'axios'
import './index.css'
import './styles/notistack-override.css'
import { ThemeProvider, CssBaseline } from './utils/materialImports';
import theme from './context/ThemeContext';

// Configuración de React Router v7
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Configurar axios
const getBaseUrl = () => {
  const mode = import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    if (mode === 'development') {
      return 'http://localhost:8080/api';
    } else if (mode === 'staging') {
      return 'https://api.staging.present.attadia.com/api';
    }
    return 'https://api.admin.attadia.com/api';
  }
  
  return `${apiUrl}/api`;
};

axios.defaults.baseURL = getBaseUrl();
axios.defaults.withCredentials = true;

// Mejoras específicas para móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  // Configuraciones específicas para móvil
  axios.defaults.timeout = 30000; // 30 segundos para móvil
  axios.defaults.headers.common['X-Device-Type'] = 'mobile';
  
  // Mejorar manejo de errores de red en móvil
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.log('Error de red en móvil, reintentando...');
        // Reintentar automáticamente en móvil
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(axios.request(error.config));
          }, 1000);
        });
      }
      return Promise.reject(error);
    }
  );
}

// Las rutas de la app se centralizan en menuStructure.js y se usan dinámicamente en App.jsx
// Si necesitas rutas dinámicas aquí, importa modulos desde './navigation/menuStructure'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter {...router}>
        <AuthProvider>
          <UISettingsProvider>
            <ActionHistoryProvider>
              <SidebarProvider>
                <App />
              </SidebarProvider>
            </ActionHistoryProvider>
          </UISettingsProvider>
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
) 