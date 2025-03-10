import React from 'react'
import ReactDOM from 'react-dom/client'
import { SnackbarProvider } from 'notistack'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import App from './App'
import axios from 'axios'
import './index.css'

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
      return 'http://localhost:5000/api';
    } else if (mode === 'staging') {
      return 'https://api.staging.present.attadia.com/api';
    }
    return 'https://api.present.attadia.com/api';
  }
  
  return `${apiUrl}/api`;
};

axios.defaults.baseURL = getBaseUrl();
axios.defaults.withCredentials = true

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter {...router}>
      <AuthProvider>
        <SnackbarProvider>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </SnackbarProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 