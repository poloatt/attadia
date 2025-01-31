import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { SnackbarProvider } from 'notistack'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import App from './App'
import theme from './theme'

// Configuración de React Router v7
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter {...router}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <AuthProvider>
            <SidebarProvider>
              <App />
            </SidebarProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 