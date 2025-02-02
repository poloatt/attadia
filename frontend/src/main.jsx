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
axios.defaults.baseURL = 'http://localhost:5000'
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