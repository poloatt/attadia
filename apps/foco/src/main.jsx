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

// Configuración específica para Foco
const AppConfig = {
  name: 'Foco',
  title: 'Foco - Hábitos y Rutinas',
  theme: 'blue',
  primaryColor: '#1976d2'
}

// Inyectar configuración global
window.APP_CONFIG = AppConfig

// Definir mapa de rutas para Foco
const focoRoutesMap = {
  '/proyectos': {
    entity: 'proyecto',
    apiService: {
      create: (data) => clienteAxios.post('/api/proyectos', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/proyectos/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/proyectos/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/proyectos/${id}`).then(res => res.data)
    }
  },
  '/tareas': {
    entity: 'tarea',
    apiService: {
      create: (data) => clienteAxios.post('/api/tareas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/tareas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/tareas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/tareas/${id}`).then(res => res.data)
    }
  },
  '/archivo': {
    entity: 'tarea',
    apiService: {
      create: (data) => clienteAxios.post('/api/tareas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/tareas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/tareas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/tareas/${id}`).then(res => res.data)
    }
  },
  '/rutinas': {
    entity: 'rutina',
    apiService: {
      create: (data) => clienteAxios.post('/api/rutinas', data).then(res => res.data),
      update: (id, data) => clienteAxios.put(`/api/rutinas/${id}`, data).then(res => res.data),
      delete: (id) => clienteAxios.delete(`/api/rutinas/${id}`).then(res => res.data),
      getById: (id) => clienteAxios.get(`/api/rutinas/${id}`).then(res => res.data)
    }
  }
}

const Root = (
  <BrowserRouter {...routerConfig}>
    <AuthProvider>
      <ActionHistoryProvider>
        <ActionHistoryRoutesProvider routesMap={focoRoutesMap}>
          <App />
        </ActionHistoryRoutesProvider>
      </ActionHistoryProvider>
    </AuthProvider>
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? Root : <React.StrictMode>{Root}</React.StrictMode>,
)
