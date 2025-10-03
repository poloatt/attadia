import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import '@shared/index.css'
import { AuthProvider } from '@shared/context/AuthContext'

// Configure React Router future flags to suppress warnings
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
}

// Configuración específica para Atta
const AppConfig = {
  name: 'Atta',
  title: 'Atta - Property Management',
  theme: 'green',
  primaryColor: '#4caf50'
}

// Inyectar configuración global
window.APP_CONFIG = AppConfig

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter {...routerConfig}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
