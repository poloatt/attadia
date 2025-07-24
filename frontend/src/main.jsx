import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import { UISettingsProvider } from './context/UISettingsContext'
import { ActionHistoryProvider } from './context/ActionHistoryContext'
import App from './App'
import axios from 'axios'
import './index.css'
import './styles/notistack-override.css'
import { ThemeProvider, CssBaseline } from '@mui/material';
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
axios.defaults.withCredentials = true

// Las rutas de la app se centralizan en menuStructure.js y se usan dinámicamente en App.jsx
// Si necesitas rutas dinámicas aquí, importa menuItems desde './navigation/menuStructure'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter {...router}>
        <AuthProvider>
          <UISettingsProvider>
            <ActionHistoryProvider>
              <SidebarProvider>
                <App />
              </SidebarProvider>
            </ActionHistoryProvider>
          </UISettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
) 
