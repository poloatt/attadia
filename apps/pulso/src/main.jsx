import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import '@shared/index.css'
import { AuthProvider } from '@shared/context/AuthContext'
import { ActionHistoryProvider } from '@shared/context/ActionHistoryContext'
import { ActionHistoryRoutesProvider } from '@shared/context/ActionHistoryRoutesContext.jsx'
import clienteAxios from '@shared/config/axios'

// Configure React Router future flags to suppress warnings
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
}

// Configuración específica para Pulso
const AppConfig = {
  name: 'Pulso',
  title: 'Pulso - Bienestar y Salud',
  theme: 'orange',
  primaryColor: '#ff9800'
}

// Inyectar configuración global
window.APP_CONFIG = AppConfig

// Definir mapa de rutas para Pulso (vacío por ahora, se puede ampliar)
const pulsoRoutesMap = {
  // Ejemplo si luego se habilita historial en Salud:
  // '/salud': {
  //   entity: 'medicion',
  //   apiService: {
  //     create: (data) => clienteAxios.post('/api/mediciones', data).then(res => res.data),
  //     update: (id, data) => clienteAxios.put(`/api/mediciones/${id}`, data).then(res => res.data),
  //     delete: (id) => clienteAxios.delete(`/api/mediciones/${id}`).then(res => res.data),
  //     getById: (id) => clienteAxios.get(`/api/mediciones/${id}`).then(res => res.data)
  //   }
  // },
}

// Reemplazar por montaje condicional de StrictMode
const Root = (
  <BrowserRouter {...routerConfig}>
    <AuthProvider>
      <ActionHistoryProvider>
        <ActionHistoryRoutesProvider routesMap={pulsoRoutesMap}>
          <App />
        </ActionHistoryRoutesProvider>
      </ActionHistoryProvider>
    </AuthProvider>
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? Root : <React.StrictMode>{Root}</React.StrictMode>,
)
